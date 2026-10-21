/**
 * ============================================================================
 * SMART PET FEEDER — ESP32 FIRMWARE
 * ============================================================================
 * Hardware Bill of Materials:
 *  - ESP32 Development Board (ESP-WROOM-32)
 *  - SG90 Micro Servo (External Regulated 5V Supply, Common GND) -> GPIO 4
 *  - Tactile Push Button (Debounced, Switch to GND)            -> GPIO 27
 *  - Active Buzzer (Alerts & Sound Feedback)                    -> GPIO 25
 *  - 16x2 I2C LCD Display (SDA: GPIO 21, SCL: GPIO 22)         -> 0x27 or 0x3F
 *  - DS1302 Real-Time Clock Module (DAT: 19, CLK: 18, RST: 5)  -> 3-wire
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
#include <time.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------
// TIMEZONE & NTP CONFIGURATION (Cambodia / Indochina: UTC+7)
// ----------------------------------------------------------------------------
#define TIMEZONE_OFFSET_SEC   (7 * 3600)  // UTC+7 (Phnom Penh / Bangkok)
#define NTP_SERVER            "pool.ntp.org"

// ----------------------------------------------------------------------------
// PIN DEFINITIONS
// ----------------------------------------------------------------------------
#define PIN_SERVO         4   // SG90 Micro Servo PWM (GPIO 4; moved from GPIO 18 to avoid conflict with DS1302 CLK)
#define PIN_BUTTON        27  // Tactile Push Button (to GND, internal pullup)
#define PIN_BUZZER        25  // Active Buzzer
#define PIN_I2C_SDA       21  // 16x2 I2C LCD SDA
#define PIN_I2C_SCL       22  // 16x2 I2C LCD SCL
#define PIN_DS1302_DAT    19  // DS1302 RTC Data (DAT / IO)
#define PIN_DS1302_CLK    18  // DS1302 RTC Clock (CLK / SCLK)
#define PIN_DS1302_RST    5   // DS1302 RTC Reset / Chip Enable (RST / CE)

// ----------------------------------------------------------------------------
// DEVICE & NETWORK CONFIGURATION (Defaults; overridable via build/config)
// ----------------------------------------------------------------------------
const char* DEFAULT_DEVICE_ID = "feeder_esp32_01";
char deviceId[32]             = "feeder_esp32_01";

// Wi-Fi Credentials
// - FOR WOKWI SIMULATOR: MUST use SSID "Wokwi-GUEST", Password "" (Cloud simulator cannot see home Wi-Fi)
// - FOR PHYSICAL HARDWARE: Change to your Wi-Fi/Hotspot (e.g. "AlexKgm", "55alex55")
const char* WIFI_SSID     = "moly";
const char* WIFI_PASSWORD = "22224455";

// MQTT Broker Credentials
// - For Wokwi Simulator: Use free public cloud broker "broker.hivemq.com" (Port 1883)
// - For Physical Hardware: Change to your laptop IP "192.168.1.17" or AWS Public IP
const char* MQTT_SERVER   = "broker.hivemq.com";
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

// Timers
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
// DS1307 I2C RTC (Native in Wokwi simulator & standard I2C RTC breakout)
// ----------------------------------------------------------------------------
#define DS1307_I2C_ADDR 0x68
bool isDs1307Present = false;

void ds1307Init() {
  Wire.beginTransmission(DS1307_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    isDs1307Present = true;
    Serial.println(F("[RTC] Detected DS1307 on I2C (Address 0x68)"));

    // Check if oscillator is stopped (bit 7 of register 0x00 is CH bit)
    Wire.beginTransmission(DS1307_I2C_ADDR);
    Wire.write(0x00);
    Wire.endTransmission();
    Wire.requestFrom(DS1307_I2C_ADDR, 1);
    if (Wire.available()) {
      uint8_t sec = Wire.read();
      if (sec & 0x80) { // Clock is halted -> clear CH bit to start oscillator
        Wire.beginTransmission(DS1307_I2C_ADDR);
        Wire.write(0x00);
        Wire.write(sec & 0x7F);
        Wire.endTransmission();
      }
    }
  } else {
    isDs1307Present = false;
  }
}

DateTime ds1307GetTime() {
  DateTime dt;
  Wire.beginTransmission(DS1307_I2C_ADDR);
  Wire.write(0x00);
  if (Wire.endTransmission() != 0) {
    dt.valid = false;
    return dt;
  }

  if (Wire.requestFrom(DS1307_I2C_ADDR, 7) == 7) {
    uint8_t rawSec  = Wire.read() & 0x7F;
    uint8_t rawMin  = Wire.read() & 0x7F;
    uint8_t rawHour = Wire.read() & 0x3F;
    /* uint8_t rawDay = */ Wire.read();
    uint8_t rawDate = Wire.read() & 0x3F;
    uint8_t rawMon  = Wire.read() & 0x1F;
    uint8_t rawYear = Wire.read();

    dt.second = bcdToDec(rawSec);
    dt.minute = bcdToDec(rawMin);
    dt.hour   = bcdToDec(rawHour);
    dt.day    = bcdToDec(rawDate);
    dt.month  = bcdToDec(rawMon);
    dt.year   = 2000 + bcdToDec(rawYear);
    dt.valid  = (dt.month >= 1 && dt.month <= 12 && dt.day >= 1 && dt.day <= 31 && dt.hour <= 23 && dt.minute <= 59);
  } else {
    dt.valid = false;
  }
  return dt;
}

void ds1307SetTime(uint8_t hour, uint8_t min, uint8_t sec, uint8_t day, uint8_t month, uint16_t year) {
  Wire.beginTransmission(DS1307_I2C_ADDR);
  Wire.write(0x00);
  Wire.write(decToBcd(sec & 0x7F)); // CH = 0 (oscillator running)
  Wire.write(decToBcd(min));
  Wire.write(decToBcd(hour));
  Wire.write(1); // Day of week (1-7)
  Wire.write(decToBcd(day));
  Wire.write(decToBcd(month));
  Wire.write(decToBcd(year % 100));
  Wire.endTransmission();
}

bool ntpSynced = false;
void syncNtpTime() {
  if (WiFi.status() != WL_CONNECTED || ntpSynced) return;
  configTime(TIMEZONE_OFFSET_SEC, 0, NTP_SERVER);
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 1500)) {
    ntpSynced = true;
    Serial.printf("[NTP] Synced Cambodia Local Time (UTC+7): %02d:%02d:%02d\n",
                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    if (isDs1307Present) {
      ds1307SetTime(timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec,
                    timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);
    }
  }
}

bool demoScheduleArmed = false;
void armDemoSchedule(DateTime dt) {
  if (demoScheduleArmed || !dt.valid) return;
  demoScheduleArmed = true;

  uint8_t demoMin = (dt.minute + 1) % 60;
  uint8_t demoHour = (dt.minute == 59) ? (dt.hour + 1) % 24 : dt.hour;

  if (scheduleCount < MAX_SCHEDULES) {
    schedules[scheduleCount] = { true, demoHour, demoMin, 1500, "Demo Test" };
    scheduleCount++;
    Serial.printf("[Schedule] Armed Live Demo Schedule at %02d:%02d (dispenses in <60s)!\n", demoHour, demoMin);
  }
}

// ----------------------------------------------------------------------------
// UNIFIED DUAL-RTC INTERFACE (Auto-switches between DS1307 and DS1302)
// ----------------------------------------------------------------------------
void rtcInit() {
  // 1. Try I2C DS1307 (Wokwi simulator or I2C module)
  ds1307Init();

  // 2. Also initialize 3-wire DS1302 (Physical breadboard on GPIO 19, 18, 5)
  ds1302Init();

  if (isDs1307Present) {
    Serial.println(F("[RTC] Active RTC: DS1307 (I2C)"));
  } else {
    Serial.println(F("[RTC] Active RTC: DS1302 (3-Wire GPIO 19, 18, 5)"));
  }
}

DateTime rtcGetTime() {
  DateTime dt;
  if (isDs1307Present) {
    dt = ds1307GetTime();
  } else {
    dt = ds1302GetTime();
  }

  // 3. Fallback: If neither physical chip is found, simulate internal clock starting at 07:29:45
  if (!dt.valid) {
    unsigned long totalSec = (millis() / 1000) + (7 * 3600 + 29 * 60 + 45);
    dt.second = totalSec % 60;
    dt.minute = (totalSec / 60) % 60;
    dt.hour   = (totalSec / 3600) % 24;
    dt.day    = 15;
    dt.month  = 10;
    dt.year   = 2026;
    dt.valid  = true;
  }

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

int getNextScheduleIndex(DateTime dt) {
  if (scheduleCount == 0) return -1;
  int curTotalMin = dt.hour * 60 + dt.minute;
  int minDiff = 24 * 60 + 1;
  int bestIdx = 0;

  for (int i = 0; i < scheduleCount; i++) {
    if (!schedules[i].enabled) continue;
    int schedTotalMin = schedules[i].hour * 60 + schedules[i].minute;
    int diff = schedTotalMin - curTotalMin;
    if (diff <= 0) diff += 24 * 60; // Next occurrence is tomorrow
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ----------------------------------------------------------------------------
// LCD DISPLAY UPDATE
// ----------------------------------------------------------------------------
void updateLcd(DateTime dt) {
  if (currentState == STATE_DISPENSING) return; // Dispense UI has priority

  char line1[17];
  char rawLine1[17];
  if (dt.valid) {
    snprintf(rawLine1, sizeof(rawLine1), "%02d:%02d:%02d  %s", dt.hour, dt.minute, dt.second,
             mqttClient.connected() ? "MQ:OK" : (WiFi.status() == WL_CONNECTED ? "WF:OK" : "NO:WF"));
  } else {
    snprintf(rawLine1, sizeof(rawLine1), "--:--:--  %s",
             mqttClient.connected() ? "MQ:OK" : (WiFi.status() == WL_CONNECTED ? "WF:OK" : "NO:WF"));
  }
  snprintf(line1, sizeof(line1), "%-16s", rawLine1);
  lcd.setCursor(0, 0);
  lcd.print(line1);

  char line2[17];
  char rawLine2[17];
  if (currentState == STATE_COOLDOWN) {
    unsigned long remainingCooldown = (COOLDOWN_MS - (millis() - lastDispenseEndTime)) / 1000 + 1;
    snprintf(rawLine2, sizeof(rawLine2), "Cooling... %lus", remainingCooldown);
  } else if (scheduleCount > 0) {
    int nextIdx = getNextScheduleIndex(dt);
    snprintf(rawLine2, sizeof(rawLine2), "Next: %02d:%02d", schedules[nextIdx].hour, schedules[nextIdx].minute);
  } else {
    snprintf(rawLine2, sizeof(rawLine2), "Ready to Feed");
  }
  snprintf(line2, sizeof(line2), "%-16s", rawLine2);
  lcd.setCursor(0, 1);
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

  // 3. Initialize RTC (Auto-detects DS1307 on I2C or DS1302 on 3-Wire)
  rtcInit();

  // 4. Initialize Servo
  foodServo.attach(PIN_SERVO);
  closeGate(); // Ensure closed gate on boot

  // 5. Default Schedules
  schedules[0] = { true, 7, 30, 700, "Breakfast" };
  schedules[1] = { true, 18, 0, 700, "Dinner" };
  scheduleCount = 2;

  // 6. Connect Wi-Fi with animated status, timeout & detailed diagnostics
  Serial.println(F("\n=================================================="));
  Serial.printf("[WiFi] Connecting to SSID: '%s'...\n", WIFI_SSID);
  Serial.println(F("=================================================="));

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi:");
  lcd.setCursor(0, 1);
  lcd.print(WIFI_SSID);

  WiFi.disconnect(true); // Clear previous connection states
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();
  const unsigned long wifiTimeout = 15000; // 15 seconds connection timeout
  int dotCount = 0;

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < wifiTimeout)) {
    delay(500);
    Serial.print(F("."));
    dotCount++;
    lcd.setCursor(15, 1);
    lcd.print((dotCount % 2 == 0) ? "." : " ");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("✅ [WiFi] Connected successfully!"));
    Serial.print(F("[WiFi] IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.printf("[WiFi] Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(1500);
  } else {
    Serial.println(F("❌ [WiFi] Connection Failed or Timed Out!"));
    int status = WiFi.status();
    Serial.printf("[WiFi] Error Status Code: %d -> ", status);
    switch (status) {
      case WL_NO_SSID_AVAIL:   Serial.println(F("SSID NOT FOUND! Make sure the router/hotspot is powered on & 2.4GHz is enabled.")); break;
      case WL_CONNECT_FAILED:  Serial.println(F("AUTHENTICATION FAILED! Check Wi-Fi password.")); break;
      case WL_CONNECTION_LOST: Serial.println(F("CONNECTION LOST during handshake.")); break;
      case WL_DISCONNECTED:    Serial.println(F("DISCONNECTED! Check network signal.")); break;
      default:                 Serial.println(F("IDLE / UNKNOWN STATUS.")); break;
    }
    Serial.println(F("💡 Troubleshooting Wi-Fi:"));
    Serial.println(F("   1. ESP32 ONLY supports 2.4 GHz Wi-Fi (NOT 5 GHz)."));
    Serial.println(F("   2. If using iPhone hotspot, turn ON 'Maximize Compatibility'."));
    Serial.println(F("   3. If using Android hotspot, ensure AP Band is set to '2.4 GHz'."));
    Serial.println(F("   4. OFFLINE MODE: Feeder schedules & push button continue working via RTC!"));

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Running Offline");
    delay(2000);
  }

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

  // 1. Maintain Wi-Fi, NTP Local Time Sync, and MQTT
  static unsigned long lastWifiRetry = 0;
  if (WiFi.status() == WL_CONNECTED) {
    if (!ntpSynced) {
      syncNtpTime();
    }
    if (!mqttClient.connected()) {
      reconnectMqtt();
    } else {
      mqttClient.loop();
    }
  } else {
    // Attempt non-blocking Wi-Fi auto-reconnect every 25 seconds
    if (now - lastWifiRetry >= 25000) {
      lastWifiRetry = now;
      Serial.println(F("[WiFi] Background auto-reconnecting to Wi-Fi..."));
      WiFi.reconnect();
    }
  }

  // 2. Read Time & Execute Schedules
  DateTime nowDt = rtcGetTime();
  armDemoSchedule(nowDt);
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

    StaticJsonDocument<384> doc;
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

    char buffer[384];
    serializeJson(doc, buffer);
    mqttClient.publish(topic, buffer, false);
  }
}
