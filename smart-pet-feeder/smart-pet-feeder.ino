/**
 * ============================================================================
 * SMART PET FEEDER — ESP32 FIRMWARE
 * ============================================================================
 * Hardware Bill of Materials:
 *  - ESP32 Development Board (ESP-WROOM-32)
 *  - SG90 Micro Servo (External Regulated 5V Supply, Common GND) -> GPIO 18
 *  - Tactile Push Button (Debounced, Switch to GND)            -> GPIO 27
 *  - Active Buzzer (Alerts & Sound Feedback)                    -> GPIO 25
 *  - 16x2 I2C LCD Display (SDA: GPIO 21, SCL: GPIO 22)         -> 0x27 or 0x3F
 *  - DS1302 Real-Time Clock Module (DAT: 19, CLK: 23, RST: 26) -> 3-wire
 *
 * MQTT Architecture:
 *  - Command topic:   feeders/{deviceId}/cmd/feed
 *  - Desired config:  feeders/{deviceId}/config/desired
 *  - Event publish:   feeders/{deviceId}/event/feed
 *  - State telemetry: feeders/{deviceId}/state
 *  - Availability:    feeders/{deviceId}/availability (LWT)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------
// PIN DEFINITIONS
// ----------------------------------------------------------------------------
#define PIN_SERVO         18
#define PIN_BUTTON        27
#define PIN_BUZZER        25
#define PIN_I2C_SDA       21
#define PIN_I2C_SCL       22
#define PIN_DS1302_DAT    19
#define PIN_DS1302_CLK    23
#define PIN_DS1302_RST    26

// ----------------------------------------------------------------------------
// DEVICE & NETWORK CONFIGURATION (Defaults; overridable via build/config)
// ----------------------------------------------------------------------------
const char* DEFAULT_DEVICE_ID = "feeder_esp32_01";
char deviceId[32]             = "feeder_esp32_01";

// Wi-Fi Credentials
const char* WIFI_SSID     = "PetFeeder_WiFi";
const char* WIFI_PASSWORD = "FeederPassword123";

// MQTT Broker Credentials
const char* MQTT_SERVER   = "192.168.1.100"; // Or Docker host IP / Mosquitto
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";
const char* MQTT_PASS     = "";

// ----------------------------------------------------------------------------
// SAFETY LIMITS & TIMINGS
// ----------------------------------------------------------------------------
#define SERVO_CLOSED_ANGLE     0
#define SERVO_OPEN_ANGLE       85
#define MIN_DURATION_MS        200
#define MAX_DURATION_MS        5000
#define DEFAULT_DURATION_MS    1500
#define COOLDOWN_MS            3000   // 3-second motor safety cooldown
#define DEBOUNCE_DELAY_MS      50
#define MAX_SCHEDULES          8

// ----------------------------------------------------------------------------
// STRUCTURES & STATE
// ----------------------------------------------------------------------------
enum FeederState {
  STATE_IDLE,
  STATE_DISPENSING,
  STATE_COOLDOWN,
  STATE_ERROR
};

struct FeedingSchedule {
  bool enabled;
  uint8_t hour;
  uint8_t minute;
  uint16_t durationMs;
  char label[16];
};

struct FeederEvent {
  char commandId[37];
  char source[16]; // "app", "button", "schedule"
  uint16_t durationMs;
  bool completed;
  unsigned long timestamp;
};

// Global Peripherals
Servo foodServo;
LiquidCrystal_I2C lcd(0x27, 16, 2); // default address 0x27, change to 0x3F if required
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Operational State Variables
FeederState currentState = STATE_IDLE;
unsigned long dispenseStartTime = 0;
uint16_t activeDurationMs = DEFAULT_DURATION_MS;
char activeCommandId[37] = "";
char activeSource[16] = "app";
unsigned long lastDispenseEndTime = 0;

// Button Debounce
int lastButtonReading = HIGH;
int buttonState = HIGH;
unsigned long lastDebounceTime = 0;

// Offline Schedules (Persisted in RAM, synced via MQTT config/desired)
FeedingSchedule schedules[MAX_SCHEDULES];
uint8_t scheduleCount = 0;
int lastTriggeredMinute = -1;

// DS1302 Simple Software Interface
struct DateTime {
  uint16_t year;
  uint8_t month;
  uint8_t day;
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  bool valid;
};

// LCD Update Timer
unsigned long lastLcdUpdate = 0;
unsigned long lastStateTelemetry = 0;

// ----------------------------------------------------------------------------
// DS1302 3-WIRE BIT-BANG PROTOCOL IMPLEMENTATION
// ----------------------------------------------------------------------------
uint8_t bcdToDec(uint8_t val) {
  return ((val / 16 * 10) + (val % 16));
}

uint8_t decToBcd(uint8_t val) {
  return ((val / 10 * 16) + (val % 10));
}

void ds1302WriteByte(uint8_t value) {
  pinMode(PIN_DS1302_DAT, OUTPUT);
  for (int i = 0; i < 8; i++) {
    digitalWrite(PIN_DS1302_DAT, (value >> i) & 1);
    digitalWrite(PIN_DS1302_CLK, HIGH);
    delayMicroseconds(1);
    digitalWrite(PIN_DS1302_CLK, LOW);
    delayMicroseconds(1);
  }
}

uint8_t ds1302ReadByte() {
  pinMode(PIN_DS1302_DAT, INPUT);
  uint8_t value = 0;
  for (int i = 0; i < 8; i++) {
    int bit = digitalRead(PIN_DS1302_DAT);
    value |= (bit << i);
    digitalWrite(PIN_DS1302_CLK, HIGH);
    delayMicroseconds(1);
    digitalWrite(PIN_DS1302_CLK, LOW);
    delayMicroseconds(1);
  }
  return value;
}

void ds1302WriteRegister(uint8_t reg, uint8_t value) {
  digitalWrite(PIN_DS1302_RST, HIGH);
  delayMicroseconds(2);
  ds1302WriteByte(reg);
  ds1302WriteByte(value);
  digitalWrite(PIN_DS1302_RST, LOW);
  delayMicroseconds(2);
}

uint8_t ds1302ReadRegister(uint8_t reg) {
  digitalWrite(PIN_DS1302_RST, HIGH);
  delayMicroseconds(2);
  ds1302WriteByte(reg);
  uint8_t value = ds1302ReadByte();
  digitalWrite(PIN_DS1302_RST, LOW);
  delayMicroseconds(2);
  return value;
}

void ds1302Init() {
  pinMode(PIN_DS1302_RST, OUTPUT);
  pinMode(PIN_DS1302_CLK, OUTPUT);
  digitalWrite(PIN_DS1302_RST, LOW);
  digitalWrite(PIN_DS1302_CLK, LOW);

  // Disable write-protect (register 0x8E = 0x00)
  ds1302WriteRegister(0x8E, 0x00);

  // Clear clock halt bit on seconds register (0x80)
  uint8_t sec = ds1302ReadRegister(0x81);
  if (sec & 0x80) {
    ds1302WriteRegister(0x80, sec & 0x7F);
  }
}

DateTime ds1302GetTime() {
  DateTime dt;
  digitalWrite(PIN_DS1302_RST, HIGH);
  delayMicroseconds(2);
  ds1302WriteByte(0xBF); // Clock burst read command

  uint8_t rawSec  = ds1302ReadByte();
  uint8_t rawMin  = ds1302ReadByte();
  uint8_t rawHour = ds1302ReadByte();
  uint8_t rawDate = ds1302ReadByte();
  uint8_t rawMon  = ds1302ReadByte();
  /* uint8_t rawDay = */ ds1302ReadByte();
  uint8_t rawYear = ds1302ReadByte();

  digitalWrite(PIN_DS1302_RST, LOW);

  dt.second = bcdToDec(rawSec & 0x7F);
  dt.minute = bcdToDec(rawMin & 0x7F);
  dt.hour   = bcdToDec(rawHour & 0x3F);
  dt.day    = bcdToDec(rawDate & 0x3F);
  dt.month  = bcdToDec(rawMon & 0x1F);
  dt.year   = 2000 + bcdToDec(rawYear);

  dt.valid = (dt.month >= 1 && dt.month <= 12 && dt.day >= 1 && dt.day <= 31 && dt.hour <= 23 && dt.minute <= 59);
  return dt;
}

// ----------------------------------------------------------------------------
// BUZZER MELODIES & TONES
// ----------------------------------------------------------------------------
void buzzerChirpSuccess() {
  tone(PIN_BUZZER, 2093, 80); // C7
  delay(90);
  tone(PIN_BUZZER, 2637, 120); // E7
}

void buzzerChirpComplete() {
  tone(PIN_BUZZER, 3136, 100); // G7
}

void buzzerBeepError() {
  tone(PIN_BUZZER, 440, 150);
  delay(180);
  tone(PIN_BUZZER, 330, 200);
}

// ----------------------------------------------------------------------------
// SERVO CONTROL & DISPENSE ENGINE
// ----------------------------------------------------------------------------
void closeGate() {
  foodServo.write(SERVO_CLOSED_ANGLE);
}

void openGate() {
  foodServo.write(SERVO_OPEN_ANGLE);
}

bool startDispense(uint16_t durationMs, const char* source, const char* cmdId) {
  // Check safety cooldown
  unsigned long now = millis();
  if (currentState != STATE_IDLE) {
    buzzerBeepError();
    return false;
  }

  if (lastDispenseEndTime > 0 && (now - lastDispenseEndTime < COOLDOWN_MS)) {
    buzzerBeepError();
    return false;
  }

  // Bound duration
  if (durationMs < MIN_DURATION_MS) durationMs = MIN_DURATION_MS;
  if (durationMs > MAX_DURATION_MS) durationMs = MAX_DURATION_MS;

  activeDurationMs = durationMs;
  strncpy(activeSource, source, sizeof(activeSource) - 1);
  if (cmdId != NULL && strlen(cmdId) > 0) {
    strncpy(activeCommandId, cmdId, sizeof(activeCommandId) - 1);
  } else {
    snprintf(activeCommandId, sizeof(activeCommandId), "loc_%lu", millis());
  }

  currentState = STATE_DISPENSING;
  dispenseStartTime = now;

  buzzerChirpSuccess();
  openGate();

  // Immediate LCD update
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TREAT DISPENSE!");
  lcd.setCursor(0, 1);
  lcd.print("Open: ");
  lcd.print(activeDurationMs);
  lcd.print("ms");

  return true;
}

void publishFeedEvent(bool completed) {
  if (!mqttClient.connected()) return;

  char topic[64];
  snprintf(topic, sizeof(topic), "feeders/%s/event/feed", deviceId);

  StaticJsonDocument<256> doc;
  doc["eventId"] = String("evt_") + String(millis());
  doc["commandId"] = activeCommandId;
  doc["source"] = activeSource;
  doc["status"] = completed ? "completed" : "interrupted";
  doc["durationMs"] = activeDurationMs;
  doc["actuationCompleted"] = completed;

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topic, buffer, true);
}

void updateDispenseEngine() {
  unsigned long now = millis();

  if (currentState == STATE_DISPENSING) {
    if (now - dispenseStartTime >= activeDurationMs) {
      // Actuation finished, close gate safely
      closeGate();
      buzzerChirpComplete();
      lastDispenseEndTime = millis();
      currentState = STATE_COOLDOWN;

      // Publish event over MQTT
      publishFeedEvent(true);
    }
  } else if (currentState == STATE_COOLDOWN) {
    if (now - lastDispenseEndTime >= COOLDOWN_MS) {
      currentState = STATE_IDLE;
    }
  }
}

// ----------------------------------------------------------------------------
// SCHEDULE ENGINE (OFFLINE AUTONOMOUS)
// ----------------------------------------------------------------------------
void checkOfflineSchedules(DateTime dt) {
  if (!dt.valid) return;
  if (currentState != STATE_IDLE) return;

  // Prevent multiple triggers in the same minute
  if (dt.minute == lastTriggeredMinute) return;

  for (uint8_t i = 0; i < scheduleCount; i++) {
    if (schedules[i].enabled && schedules[i].hour == dt.hour && schedules[i].minute == dt.minute) {
      lastTriggeredMinute = dt.minute;
      startDispense(schedules[i].durationMs, "schedule", "");
      break;
    }
  }
}

// ----------------------------------------------------------------------------
// MQTT MESSAGE HANDLER
// ----------------------------------------------------------------------------
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char message[512];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  char feedCmdTopic[64];
  char configTopic[64];
  char syncCmdTopic[64];
  snprintf(feedCmdTopic, sizeof(feedCmdTopic), "feeders/%s/cmd/feed", deviceId);
  snprintf(configTopic, sizeof(configTopic), "feeders/%s/config/desired", deviceId);
  snprintf(syncCmdTopic, sizeof(syncCmdTopic), "feeders/%s/cmd/sync", deviceId);

  // 1. Remote Manual Feed Command
  if (strcmp(topic, feedCmdTopic) == 0) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      const char* cmdId = doc["commandId"] | "";
      uint16_t duration = doc["durationMs"] | DEFAULT_DURATION_MS;
      startDispense(duration, "manual_app", cmdId);
    }
  }
  // 2. Schedule & Desired Configuration Sync
  else if (strcmp(topic, configTopic) == 0) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error && doc.containsKey("schedules")) {
      JsonArray schedArr = doc["schedules"].as<JsonArray>();
      scheduleCount = 0;
      for (JsonObject s : schedArr) {
        if (scheduleCount >= MAX_SCHEDULES) break;
        schedules[scheduleCount].enabled = s["enabled"] | true;
        schedules[scheduleCount].hour = s["hour"] | 12;
        schedules[scheduleCount].minute = s["minute"] | 0;
        schedules[scheduleCount].durationMs = s["durationMs"] | 700;
        const char* lbl = s["label"] | "Routine";
        strncpy(schedules[scheduleCount].label, lbl, sizeof(schedules[scheduleCount].label) - 1);
        scheduleCount++;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// WI-FI & MQTT CONNECTION MANAGEMENT
// ----------------------------------------------------------------------------
void reconnectMqtt() {
  if (mqttClient.connected()) return;

  char availabilityTopic[64];
  snprintf(availabilityTopic, sizeof(availabilityTopic), "feeders/%s/availability", deviceId);

  if (mqttClient.connect(deviceId, MQTT_USER, MQTT_PASS, availabilityTopic, 1, true, "offline")) {
    mqttClient.publish(availabilityTopic, "online", true);

    char feedCmdTopic[64];
    char configTopic[64];
    snprintf(feedCmdTopic, sizeof(feedCmdTopic), "feeders/%s/cmd/feed", deviceId);
    snprintf(configTopic, sizeof(configTopic), "feeders/%s/config/desired", deviceId);

    mqttClient.subscribe(feedCmdTopic);
    mqttClient.subscribe(configTopic);
  }
}

// ----------------------------------------------------------------------------
// LCD DISPLAY UPDATE
// ----------------------------------------------------------------------------
void updateLcd(DateTime dt) {
  if (currentState == STATE_DISPENSING) return; // Dispense UI has priority

  lcd.setCursor(0, 0);
  char line1[17];
  if (dt.valid) {
    snprintf(line1, sizeof(line1), "%02d:%02d:%02d  %s", dt.hour, dt.minute, dt.second,
             mqttClient.connected() ? "MQ:OK" : (WiFi.status() == WL_CONNECTED ? "WF:OK" : "NO:WF"));
  } else {
    snprintf(line1, sizeof(line1), "--:--:--  %s",
             mqttClient.connected() ? "MQ:OK" : (WiFi.status() == WL_CONNECTED ? "WF:OK" : "NO:WF"));
  }
  lcd.print(line1);

  lcd.setCursor(0, 1);
  char line2[17];
  if (currentState == STATE_COOLDOWN) {
    unsigned long remainingCooldown = (COOLDOWN_MS - (millis() - lastDispenseEndTime)) / 1000 + 1;
    snprintf(line2, sizeof(line2), "Cooling... %lus   ", remainingCooldown);
  } else if (scheduleCount > 0) {
    snprintf(line2, sizeof(line2), "Next: %02d:%02d (%d) ", schedules[0].hour, schedules[0].minute, schedules[0].durationMs);
  } else {
    snprintf(line2, sizeof(line2), "Ready: Press Btn");
  }
  lcd.print(line2);
}

// ----------------------------------------------------------------------------
// SETUP
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  Serial.println(F("[Feeder] Booting ESP32 Smart Pet Feeder..."));

  // 1. GPIO Pin Modes
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // 2. Initialize LCD
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Pet Feeder");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // 3. Initialize DS1302 RTC
  ds1302Init();

  // 4. Initialize Servo
  foodServo.attach(PIN_SERVO);
  closeGate(); // Ensure closed gate on boot

  // 5. Default Schedules
  schedules[0] = { true, 7, 30, 700, "Breakfast" };
  schedules[1] = { true, 18, 0, 700, "Dinner" };
  scheduleCount = 2;

  // 6. Connect Wi-Fi (non-blocking attempt)
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // 7. Configure MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);

  buzzerChirpComplete();
  delay(500);
  lcd.clear();
}

// ----------------------------------------------------------------------------
// MAIN LOOP
// ----------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 1. Maintain Wi-Fi and MQTT
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMqtt();
    } else {
      mqttClient.loop();
    }
  }

  // 2. Read Time & Execute Schedules
  DateTime nowDt = ds1302GetTime();
  checkOfflineSchedules(nowDt);

  // 3. Tactile Push Button Handling (Debounced)
  int reading = digitalRead(PIN_BUTTON);
  if (reading != lastButtonReading) {
    lastDebounceTime = now;
  }
  if ((now - lastDebounceTime) > DEBOUNCE_DELAY_MS) {
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == LOW) { // Button pressed (active-low)
        startDispense(DEFAULT_DURATION_MS, "button", "");
      }
    }
  }
  lastButtonReading = reading;

  // 4. Update Servo Actuation Engine
  updateDispenseEngine();

  // 5. Periodic LCD Refresh (every 500ms)
  if (now - lastLcdUpdate >= 500) {
    lastLcdUpdate = now;
    updateLcd(nowDt);
  }

  // 6. Periodic State Telemetry over MQTT (every 10s)
  if (now - lastStateTelemetry >= 10000 && mqttClient.connected()) {
    lastStateTelemetry = now;
    char topic[64];
    snprintf(topic, sizeof(topic), "feeders/%s/state", deviceId);

    StaticJsonDocument<256> doc;
    doc["deviceId"] = deviceId;
    doc["online"] = true;
    doc["state"] = (currentState == STATE_IDLE ? "idle" : (currentState == STATE_DISPENSING ? "dispensing" : "cooldown"));
    doc["rtcValid"] = nowDt.valid;
    doc["uptimeSeconds"] = millis() / 1000;
    if (nowDt.valid) {
      char timeBuf[9];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", nowDt.hour, nowDt.minute, nowDt.second);
      doc["rtcTime"] = timeBuf;
    }

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(topic, buffer, false);
  }
}
