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
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <time.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <RTClib.h>

// ----------------------------------------------------------------------------
// TIMEZONE & NTP CONFIGURATION (Cambodia / Indochina: UTC+7)
// ----------------------------------------------------------------------------
#define TIMEZONE_OFFSET_SEC   (7 * 3600)  // UTC+7 (Phnom Penh / Bangkok)
#define NTP_SERVER            "pool.ntp.org"

// ----------------------------------------------------------------------------
// PIN DEFINITIONS
// ----------------------------------------------------------------------------
#define PIN_SERVO         19   // SG90 Micro Servo PWM
#define PIN_BUTTON        27  // Tactile Push Button (to GND, internal pullup)
#define PIN_BUZZER        25  // Active Buzzer
#define PIN_I2C_SDA       21  // 16x2 I2C LCD SDA
#define PIN_I2C_SCL       22  // LCD and DS3231 share the I2C bus

// ----------------------------------------------------------------------------
// DEVICE & NETWORK CONFIGURATION (Defaults; overridable via build/config)
// ----------------------------------------------------------------------------
const char* DEFAULT_DEVICE_ID = "feeder_esp32_01";
char deviceId[32]             = "feeder_esp32_01";

// Wi-Fi Credentials (Fallback Defaults; saved custom credentials in NVS take priority)
// - FOR WOKWI SIMULATOR: SSID "Wokwi-GUEST", Password ""
// - FOR PHYSICAL HARDWARE: User can configure via Captive Portal "ChinChem-Setup-XXXX" at 192.168.4.1
const char* WIFI_SSID     = "";
const char* WIFI_PASSWORD = "";

// Runtime Wi-Fi buffers (populated from flash NVS or fallback)
char wifiSsid[64]         = "";
char wifiPassword[64]     = "";

// MQTT Broker Credentials
// - For Wokwi Simulator: Use free public cloud broker "broker.hivemq.com" (Port 1883)
// - For Physical Hardware: Change to your laptop IP "192.168.1.17" or AWS Public IP
const char* MQTT_SERVER   = "chinchem.molika.app";
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";
const char* MQTT_PASS     = "";

// ----------------------------------------------------------------------------
// CAPTIVE PORTAL & NON-VOLATILE STORAGE (NVS)
// ----------------------------------------------------------------------------
Preferences preferences;
WebServer webServer(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;

bool isProvisioningMode = false;
unsigned long provisioningStartTime = 0;

// Long-press detection for Tactile Push Button (5s hold -> Wi-Fi Reset & Setup Mode)
unsigned long buttonPressStartTime = 0;
bool buttonLongPressHandled = false;

// ----------------------------------------------------------------------------
// SAFETY LIMITS & TIMINGS
// ----------------------------------------------------------------------------
#define SERVO_CLOSED_ANGLE     0      // Gate fully shut
#define SERVO_OPEN_ANGLE       90     // Gate open 90° for full gravity drop without stalling
#define MIN_DURATION_MS        200
#define MAX_DURATION_MS        180000
#define DEFAULT_DURATION_MS    15000  // 15s standard portion, matches webapp presets (15s / 30s / 45s)
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
int lastTriggeredHour = -1;
int lastTriggeredMinute = -1;
uint16_t configuredDefaultDurationMs = DEFAULT_DURATION_MS;

// Date/time container used by the feeder logic. The DS3231 library uses its own
// DateTime class internally; this struct keeps the existing schedule/LCD code simple.
struct FeederDateTime {
  uint16_t year;
  uint8_t month;
  uint8_t day;
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  bool valid;
};

// DS3231 RTC (I2C, address 0x68)
RTC_DS3231 rtc;
bool rtcAvailable = false;

// Timers
unsigned long lastLcdUpdate = 0;
unsigned long lastStateTelemetry = 0;

bool ntpSynced = false;
void syncNtpTime() {
  if (WiFi.status() != WL_CONNECTED || ntpSynced || !rtcAvailable) return;

  configTime(TIMEZONE_OFFSET_SEC, 0, NTP_SERVER);
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 5000)) {
    // Update the DS3231 from internet time. It will keep time when Wi-Fi is offline.
    rtc.adjust(DateTime(timeinfo.tm_year + 1900,
                        timeinfo.tm_mon + 1,
                        timeinfo.tm_mday,
                        timeinfo.tm_hour,
                        timeinfo.tm_min,
                        timeinfo.tm_sec));
    ntpSynced = true;
    Serial.printf("[NTP] Synced Cambodia time (UTC+7): %02d:%02d:%02d\n",
                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  } else {
    Serial.println(F("[NTP] Time sync not available yet; DS3231 continues running."));
  }
}

// ----------------------------------------------------------------------------
// I2C BUS RECOVERY (Clears hung SDA/SCL lines from prior resets)
// ----------------------------------------------------------------------------
void recoverI2CBus() {
  pinMode(PIN_I2C_SDA, INPUT_PULLUP);
  pinMode(PIN_I2C_SCL, OUTPUT);
  for (int i = 0; i < 16; i++) {
    digitalWrite(PIN_I2C_SCL, LOW);
    delayMicroseconds(5);
    digitalWrite(PIN_I2C_SCL, HIGH);
    delayMicroseconds(5);
  }
  // Generate STOP condition
  pinMode(PIN_I2C_SDA, OUTPUT);
  digitalWrite(PIN_I2C_SDA, LOW);
  delayMicroseconds(5);
  digitalWrite(PIN_I2C_SCL, HIGH);
  delayMicroseconds(5);
  digitalWrite(PIN_I2C_SDA, HIGH);
  delayMicroseconds(5);
}

// ----------------------------------------------------------------------------
// DS3231 RTC INTERFACE
// ----------------------------------------------------------------------------
void rtcInit() {
  Serial.println(F("[RTC] Probing DS3231 on I2C address 0x68..."));
  Serial.flush();

  if (!rtc.begin(&Wire)) {
    rtcAvailable = false;
    Serial.println(F("[RTC] ⚠️ DS3231 not responding at 0x68. Continuing with internal time/NTP."));
    Serial.flush();
    return;
  }

  rtcAvailable = true;
  Serial.println(F("[RTC] ✅ DS3231 detected on I2C address 0x68."));
  Serial.flush();

  // Test reading RTC status safely
  bool lost = false;
  lost = rtc.lostPower();

  if (lost) {
    Serial.println(F("[RTC] ⚠️ Battery low or time uninitialized. Setting fallback time..."));
    Serial.flush();
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  } else {
    DateTime now = rtc.now();
    Serial.printf("[RTC] ✅ Hardware clock running: %04d-%02d-%02d %02d:%02d:%02d\n",
                  now.year(), now.month(), now.day(), now.hour(), now.minute(), now.second());
    Serial.flush();
  }
}

FeederDateTime rtcGetTime() {
  FeederDateTime dt = {};
  if (!rtcAvailable) return dt;

  DateTime rtcNow = rtc.now();
  dt.year = rtcNow.year();
  dt.month = rtcNow.month();
  dt.day = rtcNow.day();
  dt.hour = rtcNow.hour();
  dt.minute = rtcNow.minute();
  dt.second = rtcNow.second();
  dt.valid = rtcNow.isValid() && dt.month >= 1 && dt.month <= 12 &&
             dt.day >= 1 && dt.day <= 31 && dt.hour <= 23 && dt.minute <= 59;
  return dt;
}

// ----------------------------------------------------------------------------
// BUZZER MELODIES & TONES (Active Buzzer Safe: No LEDC Timer Conflicts!)
// ----------------------------------------------------------------------------
void buzzerChirpSuccess() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(80);
  digitalWrite(PIN_BUZZER, LOW);
  delay(60);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
}

void buzzerChirpComplete() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
}

void buzzerBeepError() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(150);
  digitalWrite(PIN_BUZZER, LOW);
  delay(100);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(200);
  digitalWrite(PIN_BUZZER, LOW);
}

// ----------------------------------------------------------------------------
// SERVO CONTROL & DISPENSE ENGINE
// ----------------------------------------------------------------------------
void openGate() {
  Serial.printf("[Servo] Opening dispenser gate to %d°...\n", SERVO_OPEN_ANGLE);
  foodServo.write(SERVO_OPEN_ANGLE);
}

void closeGate() {
  Serial.printf("[Servo] Closing dispenser gate to %d°...\n", SERVO_CLOSED_ANGLE);
  foodServo.write(SERVO_CLOSED_ANGLE);
}

bool startDispense(uint16_t durationMs, const char* source, const char* cmdId) {
  // Check safety cooldown
  unsigned long now = millis();
  if (currentState != STATE_IDLE) {
    Serial.printf("[Feeder] ⚠️ Cannot dispense: machine busy in state %d\n", currentState);
    buzzerBeepError();
    return false;
  }

  if (lastDispenseEndTime > 0 && (now - lastDispenseEndTime < COOLDOWN_MS)) {
    Serial.println(F("[Feeder] ⚠️ Cannot dispense: within 3s motor cooldown"));
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

  Serial.printf("\n==================================================\n");
  Serial.printf("[Feeder] 🍽️ DISPENSE STARTED!\n");
  Serial.printf("  Source:   %s\n", activeSource);
  Serial.printf("  Duration: %d ms (%us)\n", activeDurationMs, activeDurationMs / 1000);
  Serial.printf("  CmdId:    %s\n", activeCommandId);
  Serial.printf("==================================================\n");

  buzzerChirpSuccess();
  openGate();

  return true;
}

void publishFeedEvent(bool completed) {
  if (!mqttClient.connected()) {
    Serial.println(F("[MQTT] ⚠️ Cannot publish feed event: MQTT not connected"));
    return;
  }

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
  Serial.printf("[MQTT] 📤 Publishing feed event to %s\n", topic);
  Serial.printf("       Payload: %s\n", buffer);
  bool pubOk = mqttClient.publish(topic, buffer, true);
  Serial.printf("[MQTT] Event publish result: %s\n", pubOk ? "SUCCESS ✅" : "FAILED ❌");
}

void stopDispense(const char* reason = "manual_stop") {
  if (currentState != STATE_DISPENSING) {
    Serial.printf("[Feeder] ⚠️ Stop requested, but feeder is not dispensing (state: %d)\n", currentState);
    return;
  }

  Serial.println(F("\n=================================================="));
  Serial.printf("[Feeder] 🛑 DISPENSE STOPPED! Gate closing immediately...\n");
  Serial.printf("  Reason:   %s\n", reason);
  Serial.printf("  Elapsed:  %lu ms of %u ms\n", millis() - dispenseStartTime, activeDurationMs);
  Serial.printf("==================================================\n");

  closeGate();
  buzzerChirpComplete();
  lastDispenseEndTime = millis();
  currentState = STATE_COOLDOWN;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FEEDING STOPPED!");
  lcd.setCursor(0, 1);
  lcd.print("Gate Closed.");

  publishFeedEvent(false);
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

      Serial.println(F("[Feeder] ✅ Dispense completed! Gate closed."));
      // Publish event over MQTT so backend records it in database & notifies Telegram
      publishFeedEvent(true);
    }
  } else if (currentState == STATE_COOLDOWN) {
    if (now - lastDispenseEndTime >= COOLDOWN_MS) {
      currentState = STATE_IDLE;
      Serial.println(F("[Feeder] Ready for next feeding operation."));
    }
  }
}

// ----------------------------------------------------------------------------
// SCHEDULE ENGINE (OFFLINE AUTONOMOUS)
// ----------------------------------------------------------------------------
void checkOfflineSchedules(FeederDateTime dt) {
  if (!dt.valid) return;
  if (currentState != STATE_IDLE) return;

  // Prevent multiple triggers in the same minute of the same hour
  if (dt.hour == lastTriggeredHour && dt.minute == lastTriggeredMinute) return;

  for (uint8_t i = 0; i < scheduleCount; i++) {
    if (schedules[i].enabled && schedules[i].hour == dt.hour && schedules[i].minute == dt.minute) {
      lastTriggeredHour = dt.hour;
      lastTriggeredMinute = dt.minute;
      Serial.printf("[Schedule] ⏰ Alarm triggered: %02d:%02d (%s, %u ms)\n",
                    dt.hour, dt.minute, schedules[i].label, schedules[i].durationMs);
      startDispense(schedules[i].durationMs, "schedule", "");
      break;
    }
  }
}

// ----------------------------------------------------------------------------
// MQTT MESSAGE HANDLER
// ----------------------------------------------------------------------------
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char message[1024];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("\n==================================================\n");
  Serial.printf("[MQTT IN] 📩 Topic: %s\n", topic);
  Serial.printf("[MQTT IN] Payload: %s\n", message);
  Serial.printf("==================================================\n");

  char feedCmdTopic[64];
  char stopCmdTopic[64];
  char configTopic[64];
  char syncCmdTopic[64];
  snprintf(feedCmdTopic, sizeof(feedCmdTopic), "feeders/%s/cmd/feed", deviceId);
  snprintf(stopCmdTopic, sizeof(stopCmdTopic), "feeders/%s/cmd/stop", deviceId);
  snprintf(configTopic, sizeof(configTopic), "feeders/%s/config/desired", deviceId);
  snprintf(syncCmdTopic, sizeof(syncCmdTopic), "feeders/%s/cmd/sync", deviceId);

  // 1. Remote Stop Command (Check exact topic OR wildcard suffix)
  if (strcmp(topic, stopCmdTopic) == 0 || strstr(topic, "/cmd/stop") != NULL) {
    Serial.println(F("[MQTT IN] 🛑 Received STOP command from cloud"));
    stopDispense("app_stop");
    return;
  }

  // 2. Remote Manual Feed Command (Check exact topic OR wildcard suffix)
  if (strcmp(topic, feedCmdTopic) == 0 || strstr(topic, "/cmd/feed") != NULL) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      const char* action = doc["action"] | "";
      if (strcmp(action, "stop") == 0) {
        Serial.println(F("[MQTT IN] 🛑 Received STOP action in feed cmd"));
        stopDispense("app_stop");
        return;
      }
      const char* cmdId = doc["commandId"] | "";
      uint16_t duration = doc["durationMs"] | configuredDefaultDurationMs;
      Serial.printf("[MQTT IN] ✅ Feed command parsed: %d ms, cmdId: '%s'\n", duration, cmdId);
      startDispense(duration, "manual_app", cmdId);
    } else {
      Serial.printf("[MQTT IN] ❌ JSON Deserialization error: %s\n", error.c_str());
    }
  }
  // 3. Schedule & Desired Configuration Sync (Check exact topic OR wildcard suffix)
  else if (strcmp(topic, configTopic) == 0 || strstr(topic, "/config/desired") != NULL) {
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      if (doc.containsKey("defaultDurationMs")) {
        configuredDefaultDurationMs = doc["defaultDurationMs"] | DEFAULT_DURATION_MS;
        Serial.printf("[MQTT IN] ⚙️ Configured default dispense duration: %u ms\n", configuredDefaultDurationMs);
      }
      if (doc.containsKey("schedules")) {
        JsonArray schedArr = doc["schedules"].as<JsonArray>();
        scheduleCount = 0;
        for (JsonObject s : schedArr) {
          if (scheduleCount >= MAX_SCHEDULES) break;
          schedules[scheduleCount].enabled = s["enabled"] | true;
          schedules[scheduleCount].hour = s["hour"] | 12;
          schedules[scheduleCount].minute = s["minute"] | 0;
          schedules[scheduleCount].durationMs = s["durationMs"] | configuredDefaultDurationMs;
          const char* lbl = s["label"] | "Routine";
          strncpy(schedules[scheduleCount].label, lbl, sizeof(schedules[scheduleCount].label) - 1);
          schedules[scheduleCount].label[sizeof(schedules[scheduleCount].label) - 1] = '\0';
          scheduleCount++;
        }
        Serial.printf("[MQTT IN] ✅ Synced %d feeding schedule(s) from cloud!\n", scheduleCount);
        for (int i = 0; i < scheduleCount; i++) {
          Serial.printf("   - Alarm #%d: %02d:%02d (%u ms, %s)\n",
                        i + 1, schedules[i].hour, schedules[i].minute, schedules[i].durationMs, schedules[i].label);
        }
      }
    } else {
      Serial.printf("[MQTT IN] ❌ Schedule JSON Deserialization error: %s\n", error.c_str());
    }
  }
}

// ----------------------------------------------------------------------------
// WI-FI & MQTT CONNECTION MANAGEMENT
// ----------------------------------------------------------------------------
void reconnectMqtt() {
  if (mqttClient.connected()) return;

  static unsigned long lastMqttAttempt = 0;
  if (millis() - lastMqttAttempt < 5000) return; // Non-blocking: try at most once every 5 seconds
  lastMqttAttempt = millis();

  char availabilityTopic[64];
  snprintf(availabilityTopic, sizeof(availabilityTopic), "feeders/%s/availability", deviceId);

  Serial.printf("[MQTT] Connecting to %s:%d (Client ID: '%s')...\n", MQTT_SERVER, MQTT_PORT, deviceId);
  Serial.flush();

  if (mqttClient.connect(deviceId, MQTT_USER, MQTT_PASS, availabilityTopic, 1, true, "offline")) {
    Serial.println(F("✅ [MQTT] Connected to MQTT Broker successfully!"));
    mqttClient.publish(availabilityTopic, "online", true);

    char feedCmdTopic[64];
    char stopCmdTopic[64];
    char configTopic[64];
    snprintf(feedCmdTopic, sizeof(feedCmdTopic), "feeders/%s/cmd/feed", deviceId);
    snprintf(stopCmdTopic, sizeof(stopCmdTopic), "feeders/%s/cmd/stop", deviceId);
    snprintf(configTopic, sizeof(configTopic), "feeders/%s/config/desired", deviceId);

    mqttClient.subscribe(feedCmdTopic, 1);
    mqttClient.subscribe(stopCmdTopic, 1);
    mqttClient.subscribe(configTopic, 1);

    // Universal wildcard subscriptions: ensures commands from any TMA device variant are received!
    mqttClient.subscribe("feeders/+/cmd/feed", 1);
    mqttClient.subscribe("feeders/+/cmd/stop", 1);
    mqttClient.subscribe("feeders/+/config/desired", 1);

    Serial.printf("[MQTT] Subscribed to:\n  -> %s\n  -> %s\n  -> %s\n  -> feeders/+/cmd/feed\n  -> feeders/+/config/desired\n",
                  feedCmdTopic, stopCmdTopic, configTopic);
  } else {
    Serial.printf("[MQTT] ❌ Connect failed, rc=%d (Will retry in 5s)\n", mqttClient.state());
  }
}

int getNextScheduleIndex(FeederDateTime dt) {
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
// LCD DISPLAY UPDATE (Real-Time Live Dynamic Countdown!)
// ----------------------------------------------------------------------------
void updateLcd(FeederDateTime dt) {
  unsigned long now = millis();

  // 1. Live Dynamic Dispense UI (Counts down in real-time!)
  if (currentState == STATE_DISPENSING) {
    unsigned long elapsed = now - dispenseStartTime;
    unsigned long remainingSec = (activeDurationMs > elapsed) ? (activeDurationMs - elapsed + 999) / 1000 : 0;

    char line1[17];
    char line2[17];
    snprintf(line1, sizeof(line1), "DISPENSING FOOD!");
    snprintf(line2, sizeof(line2), "Remaining: %2lus", remainingSec);

    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
    return;
  }

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
// CAPTIVE PORTAL HTML TEMPLATES & HANDLERS
// ----------------------------------------------------------------------------
const char PORTAL_HEAD[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ChinChem Feeder — Wi-Fi Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body {
      background: linear-gradient(135deg, #FFF2E6 0%, #EAF3EC 50%, #BCDBF0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      color: #143503;
    }
    .card {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(20, 53, 3, 0.12);
      border-radius: 28px;
      padding: 28px 22px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(20, 53, 3, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .header { text-align: center; margin-bottom: 20px; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #4B633E;
      background: #EAF3EC;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(20, 53, 3, 0.1);
      margin-bottom: 8px;
    }
    .title { font-size: 22px; font-weight: 900; color: #143503; margin-bottom: 4px; }
    .subtitle { font-size: 12.5px; color: #55704a; line-height: 1.4; }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 11.5px; font-weight: 700; color: #143503; margin-bottom: 5px; }
    .input-wrapper { position: relative; }
    input, select {
      width: 100%;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1.5px solid rgba(20, 53, 3, 0.15);
      background: #FFFFFF;
      font-size: 14px;
      color: #143503;
      outline: none;
      transition: all 0.2s;
    }
    input:focus, select:focus {
      border-color: #143503;
      box-shadow: 0 0 0 3px rgba(20, 53, 3, 0.12);
    }
    .toggle-pass {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #55704a;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 16px;
      border: none;
      background: #143503;
      color: #FFF2E6;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(20, 53, 3, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }
    .btn:hover { background: #1b4704; }
    .btn:active { transform: scale(0.98); }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #7a8b75;
      margin-top: 16px;
      line-height: 1.45;
    }
    .spinner {
      display: none;
      margin: 14px auto 0;
      text-align: center;
      font-size: 12.5px;
      font-weight: 600;
      color: #143503;
    }
    .pulse-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      margin-right: 6px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">ចិញ្ចឹម • SMART PET FEEDER</span>
      <h1 class="title">Connect to Wi-Fi</h1>
      <p class="subtitle">Choose your home or hotspot 2.4GHz Wi-Fi to bring your pet feeder online.</p>
    </div>
    <form action="/save" method="POST" id="wifiForm" onsubmit="handleSubmit(event)">
      <div class="form-group">
        <label for="ssidInput">Wi-Fi Network Name (SSID)</label>
        <select id="ssidSelect" onchange="var inp=document.getElementById('ssidInput'); if(this.value=='__CUSTOM__'){inp.value=''; inp.focus();} else {inp.value=this.value;}">
          <option value="" disabled selected>-- Select Detected Network --</option>
)rawliteral";

const char PORTAL_TAIL[] PROGMEM = R"rawliteral(          <option value="__CUSTOM__">➕ Enter Other Wi-Fi...</option>
        </select>
        <input type="text" name="ssid" id="ssidInput" placeholder="Wi-Fi SSID (e.g. MyPhoneHotspot)" style="margin-top:8px;" required>
      </div>
      <div class="form-group">
        <label for="passwordInput">Wi-Fi Password</label>
        <div class="input-wrapper">
          <input type="password" name="password" id="passwordInput" placeholder="Wi-Fi Password">
          <button type="button" class="toggle-pass" onclick="togglePass()">👁️</button>
        </div>
      </div>
      <div class="form-group">
        <label for="deviceIdInput">Feeder Device ID</label>
        <input type="text" name="deviceId" id="deviceIdInput" value=")rawliteral";

const char PORTAL_FOOTER[] PROGMEM = R"rawliteral(">
      </div>
      <button type="submit" class="btn" id="submitBtn">
        <span>Save & Connect Feeder</span>
        <span>🚀</span>
      </button>
      <div class="spinner" id="spinner">
        <span class="pulse-dot"></span>
        Connecting... Check feeder LCD display!
      </div>
    </form>
    <div class="footer-note">
      ⚠️ ESP32 connects to <strong>2.4 GHz</strong> Wi-Fi networks only.<br>
      Hold the physical button for 5 seconds to reset Wi-Fi anytime.
    </div>
  </div>
    function togglePass() {
      var p = document.getElementById('passwordInput');
      p.type = p.type === 'password' ? 'text' : 'password';
    }
    function handleSubmit(e) {
      var input = document.getElementById('ssidInput');
      if (!input.value.trim()) {
        alert('Please enter or select a Wi-Fi network!');
        e.preventDefault();
        return;
      }
      document.getElementById('submitBtn').style.opacity = '0.6';
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('spinner').style.display = 'block';
    }
  </script>
</body>
</html>)rawliteral";

const char SUCCESS_HTML[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credentials Saved</title>
  <style>
    body {
      background: #EAF3EC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      color: #143503;
    }
    .card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      max-width: 380px;
      box-shadow: 0 10px 25px rgba(20,53,3,0.1);
    }
    h2 { margin: 12px 0 8px; font-size: 20px; font-weight: 800; }
    p { font-size: 13px; color: #4B633E; line-height: 1.5; }
    .icon { font-size: 48px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <h2>Wi-Fi Saved!</h2>
    <p>Your ChinChem Feeder is saving credentials and restarting now.<br><br>The LCD display will show your new connection status in a few seconds.<br><br>You can now reconnect your phone to your regular Wi-Fi!</p>
  </div>
</body>
</html>)rawliteral";

void handleRoot() {
  int n = WiFi.scanComplete();
  if (n < 0) {
    n = WiFi.scanNetworks(false, false);
  }

  String options = "";
  if (n <= 0) {
    options += "          <option value=\"\" disabled>No networks detected in range</option>\n";
  } else {
    for (int i = 0; i < n && i < 15; ++i) {
      String foundSsid = WiFi.SSID(i);
      if (foundSsid.length() == 0) continue;
      int rssi = WiFi.RSSI(i);
      int quality = constrain(2 * (rssi + 100), 0, 100);
      options += "          <option value=\"" + foundSsid + "\">" + foundSsid + " (" + String(quality) + "% signal)</option>\n";
    }
  }

  String page = FPSTR(PORTAL_HEAD);
  page += options;
  page += FPSTR(PORTAL_TAIL);
  page += deviceId;
  page += FPSTR(PORTAL_FOOTER);

  webServer.send(200, "text/html", page);
}

void handleSave() {
  String newSsid = webServer.arg("ssid");
  String newPass = webServer.arg("password");
  String newDevId = webServer.arg("deviceId");

  newSsid.trim();
  newPass.trim();
  newDevId.trim();

  if (newSsid.length() == 0) {
    webServer.send(400, "text/plain", "SSID cannot be empty!");
    return;
  }

  Serial.println(F("\n[Portal] 💾 Saving new Wi-Fi credentials to NVS flash..."));
  Serial.printf("[Portal]   SSID:      %s\n", newSsid.c_str());
  Serial.printf("[Portal]   Device ID: %s\n", newDevId.length() > 0 ? newDevId.c_str() : deviceId);

  preferences.begin("feeder-cfg", false);
  preferences.putString("ssid", newSsid);
  preferences.putString("pass", newPass);
  if (newDevId.length() > 0) {
    preferences.putString("devId", newDevId);
  }
  preferences.end();

  webServer.send(200, "text/html", FPSTR(SUCCESS_HTML));

  buzzerChirpSuccess();
  delay(1500);

  Serial.println(F("[Portal] Restarting ESP32 to connect to new Wi-Fi..."));
  ESP.restart();
}

void handleCaptiveRedirect() {
  Serial.printf("[Portal] 🔀 Captive probe redirected (%s) -> http://192.168.4.1/\n", webServer.uri().c_str());
  webServer.sendHeader("Location", "http://192.168.4.1/", true);
  webServer.send(302, "text/plain", "");
  webServer.client().stop();
}

void handleNotFound() {
  String host = webServer.hostHeader();
  if (host.length() > 0 && host.indexOf("192.168.4.1") < 0) {
    handleCaptiveRedirect();
    return;
  }
  handleRoot();
}

void startCaptivePortal() {
  isProvisioningMode = true;
  provisioningStartTime = millis();

  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_AP_STA);

  char apSsid[32];
  snprintf(apSsid, sizeof(apSsid), "ChinChem-Setup-%s", deviceId);

  IPAddress apIP(192, 168, 4, 1);
  IPAddress netMsk(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(apSsid);

  Serial.println(F("\n=================================================="));
  Serial.printf("[Portal] 🚀 Captive Portal Setup Hotspot Activated!\n");
  Serial.printf("[Portal]   Access Point: %s\n", apSsid);
  Serial.printf("[Portal]   Setup URL:    http://192.168.4.1/\n");
  Serial.println(F("=================================================="));

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Setup Mode (AP):");
  lcd.setCursor(0, 1);
  lcd.print("192.168.4.1");

  WiFi.scanNetworks(true);

  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", apIP);

  webServer.on("/", HTTP_GET, handleRoot);
  webServer.on("/save", HTTP_POST, handleSave);
  webServer.on("/generate_204", HTTP_GET, handleCaptiveRedirect);
  webServer.on("/gen_204", HTTP_GET, handleCaptiveRedirect);
  webServer.on("/hotspot-detect.html", HTTP_GET, handleCaptiveRedirect);
  webServer.on("/connecttest.txt", HTTP_GET, handleCaptiveRedirect);
  webServer.on("/ncsi.txt", HTTP_GET, handleCaptiveRedirect);
  webServer.onNotFound(handleNotFound);

  webServer.begin();
  buzzerChirpSuccess();
}

bool attemptWiFiConnection(const char* ssid, const char* pass, unsigned long timeoutMs = 14000) {
  if (strlen(ssid) == 0) return false;

  Serial.println(F("\n=================================================="));
  Serial.printf("[WiFi] Connecting to SSID: '%s'...\n", ssid);
  Serial.println(F("=================================================="));
  Serial.flush();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi:");
  lcd.setCursor(0, 1);
  lcd.print(ssid);

  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(ssid, pass);

  unsigned long startAttemptTime = millis();
  int dotCount = 0;

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < timeoutMs)) {
    delay(500);
    Serial.print(F("."));
    dotCount++;
    lcd.setCursor(15, 1);
    lcd.print((dotCount % 2 == 0) ? "." : " ");
  }
  Serial.println();

  return (WiFi.status() == WL_CONNECTED);
}

// ----------------------------------------------------------------------------
// SETUP
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100); // Allow UART clock to stabilize
  Serial.println(F("\n[Feeder] Booting ESP32 Smart Pet Feeder..."));
  Serial.flush();

  // 1. GPIO Pin Modes
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // 2. Clear I2C Bus & Initialize LCD Display
  Serial.println(F("[I2C] Clearing bus lines & initializing Wire..."));
  Serial.flush();
  recoverI2CBus();
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setTimeOut(100); // 100ms hardware timeout prevents CPU hang forever!

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Pet Feeder");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  Serial.println(F("[LCD] 16x2 Display initialized."));
  Serial.flush();

  // 3. Initialize DS3231 RTC on I2C
  rtcInit();

  // 4. Initialize Servo with Dedicated Timer 0
  Serial.println(F("[Servo] Configuring 50Hz PWM timer & attaching to GPIO 19..."));
  Serial.flush();
  ESP32PWM::allocateTimer(0);
  foodServo.setPeriodHertz(50);
  foodServo.attach(PIN_SERVO, 500, 2400);
  foodServo.write(SERVO_CLOSED_ANGLE);
  delay(400); // Allow physical arm to settle at closed position (0°)
  Serial.println(F("[Servo] Gate calibrated closed (0°). Ready for operation."));
  Serial.flush();

  // 5. Feeding Schedules: Initialized with 0 schedules until configured via app
  scheduleCount = 0;
  Serial.println(F("[Schedule] Feeder starts with 0 schedules (awaiting config from app)."));
  Serial.flush();

  // 6. Connect Wi-Fi (Saved credentials in NVS, fallback, or Captive Portal)
  preferences.begin("feeder-cfg", false);
  String savedSsid = preferences.getString("ssid", "");
  String savedPass = preferences.getString("pass", "");
  String savedDevId = preferences.getString("devId", "");
  preferences.end();

  if (savedDevId.length() > 0) {
    strncpy(deviceId, savedDevId.c_str(), sizeof(deviceId) - 1);
  } else {
    strncpy(deviceId, DEFAULT_DEVICE_ID, sizeof(deviceId) - 1);
  }

  bool connected = false;

  if (savedSsid.length() > 0) {
    strncpy(wifiSsid, savedSsid.c_str(), sizeof(wifiSsid) - 1);
    strncpy(wifiPassword, savedPass.c_str(), sizeof(wifiPassword) - 1);
    Serial.printf("[Config] 💾 Found saved Wi-Fi in NVS: '%s'\n", wifiSsid);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Connecting WiFi:");
    lcd.setCursor(0, 1);
    lcd.print(wifiSsid);

    connected = attemptWiFiConnection(wifiSsid, wifiPassword, 14000);
    if (!connected) {
      Serial.printf("❌ [WiFi] Connection to '%s' failed!\n", wifiSsid);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("WiFi Failed!");
      lcd.setCursor(0, 1);
      lcd.print("Check 2.4G/Pass");
      buzzerBeepError();
      delay(3000); // 3 seconds display so user clearly sees the failure
    }
  }

  // If saved Wi-Fi didn't connect (or doesn't exist), try fallback if defined
  if (!connected && strlen(WIFI_SSID) > 0 && strcmp(WIFI_SSID, wifiSsid) != 0) {
    Serial.printf("[Config] Trying fallback factory Wi-Fi: '%s'...\n", WIFI_SSID);
    connected = attemptWiFiConnection(WIFI_SSID, WIFI_PASSWORD, 10000);
    if (connected) {
      strncpy(wifiSsid, WIFI_SSID, sizeof(wifiSsid) - 1);
      strncpy(wifiPassword, WIFI_PASSWORD, sizeof(wifiPassword) - 1);
    }
  }

  if (connected) {
    Serial.println(F("✅ [WiFi] Connected successfully!"));
    Serial.print(F("[WiFi] IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[WiFi] Factory MAC Address: "));
    Serial.println(WiFi.macAddress());
    Serial.printf("[WiFi] Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(1500);

    // 7. Configure MQTT
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(onMqttMessage);

    buzzerChirpComplete();
    delay(500);
    lcd.clear();
  } else {
    Serial.println(F("❌ [WiFi] Connection Failed. Launching Captive Portal Setup Hotspot..."));
    startCaptivePortal();
  }
}

// ----------------------------------------------------------------------------
// MAIN LOOP
// ----------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 0. Handle Captive Portal in Provisioning Mode
  if (isProvisioningMode) {
    dnsServer.processNextRequest();
    webServer.handleClient();

    // In provisioning mode, keep LCD refreshed with AP details
    static unsigned long lastApLcdUpdate = 0;
    if (now - lastApLcdUpdate >= 1000) {
      lastApLcdUpdate = now;
      char apName[17];
      snprintf(apName, sizeof(apName), "Setup: %s", deviceId);
      lcd.setCursor(0, 0);
      lcd.print(apName);
      lcd.setCursor(0, 1);
      lcd.print("IP: 192.168.4.1 ");
    }

    // Check offline RTC & Schedules
    FeederDateTime nowDt = rtcGetTime();
    checkOfflineSchedules(nowDt);
    updateDispenseEngine();

    // Push button short click during setup mode allows testing dispense
    int reading = digitalRead(PIN_BUTTON);
    if (reading != lastButtonReading) {
      lastDebounceTime = now;
    }
    if ((now - lastDebounceTime) > DEBOUNCE_DELAY_MS) {
      if (reading != buttonState) {
        buttonState = reading;
        if (buttonState == LOW) {
          if (currentState == STATE_DISPENSING) {
            stopDispense("button_stop");
          } else {
            startDispense(configuredDefaultDurationMs, "button", "");
          }
        }
      }
    }
    lastButtonReading = reading;
    return; // Don't run MQTT client while waiting for Wi-Fi provisioning
  }

  // 1. Maintain Wi-Fi, NTP Local Time Sync, and MQTT
  static unsigned long lastWifiRetry = 0;
  static uint8_t wifiRetryCount = 0;
  if (WiFi.status() == WL_CONNECTED) {
    if (wifiRetryCount > 0) {
      Serial.println(F("✅ [WiFi] Reconnected successfully!"));
      Serial.printf("[WiFi] IP Address: %s | RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
      wifiRetryCount = 0;
    }
    if (!ntpSynced) {
      syncNtpTime();
    }
    if (!mqttClient.connected()) {
      reconnectMqtt();
    } else {
      mqttClient.loop();
    }
  } else {
    // Attempt non-blocking Wi-Fi auto-reconnect every 20 seconds
    if (now - lastWifiRetry >= 20000) {
      lastWifiRetry = now;
      wifiRetryCount++;
      int status = WiFi.status();
      const char* targetSsid = strlen(wifiSsid) > 0 ? wifiSsid : WIFI_SSID;
      const char* targetPass = strlen(wifiPassword) > 0 ? wifiPassword : WIFI_PASSWORD;

      Serial.printf("[WiFi] Background reconnect attempt #%d (status code: %d) to '%s'...\n", wifiRetryCount, status, targetSsid);

      // Periodically scan nearby networks to verify if hotspot SSID is visible in the air
      if (wifiRetryCount % 3 == 0) {
        Serial.printf("[WiFi] 🔍 Scanning nearby 2.4GHz Wi-Fi networks for '%s'...\n", targetSsid);
        int n = WiFi.scanNetworks(false, false);
        bool found = false;
        if (n <= 0) {
          Serial.println(F("[WiFi] ⚠️ No 2.4GHz Wi-Fi networks detected in range. Check hotspot power/antenna."));
        } else {
          Serial.printf("[WiFi] Detected %d network(s) in air:\n", n);
          for (int i = 0; i < n && i < 6; ++i) {
            String foundSsid = WiFi.SSID(i);
            Serial.printf("   - '%s' (%d dBm)\n", foundSsid.c_str(), WiFi.RSSI(i));
            if (foundSsid.equalsIgnoreCase(targetSsid)) {
              found = true;
            }
          }
          if (!found) {
            Serial.printf("[WiFi] ⚠️ SSID '%s' not visible. Ensure phone hotspot is ON & set to 2.4GHz.\n", targetSsid);
          }
        }
      }

      WiFi.begin(targetSsid, targetPass);
    }
  }

  // 2. Read Time & Execute Schedules
  FeederDateTime nowDt = rtcGetTime();
  checkOfflineSchedules(nowDt);

  // 3. Tactile Push Button Handling (Debounced with Long-Press Wi-Fi Reset)
  int reading = digitalRead(PIN_BUTTON);
  if (reading != lastButtonReading) {
    lastDebounceTime = now;
  }
  if ((now - lastDebounceTime) > DEBOUNCE_DELAY_MS) {
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == LOW) {
        // Button just pressed down
        buttonPressStartTime = now;
        buttonLongPressHandled = false;
      } else {
        // Button released
        if (!buttonLongPressHandled) {
          unsigned long pressDuration = now - buttonPressStartTime;
          if (pressDuration < 5000) {
            if (currentState == STATE_DISPENSING) {
              // Emergency Stop: Clicking button while dispensing immediately closes gate!
              stopDispense("button_stop");
            } else {
              startDispense(configuredDefaultDurationMs, "button", "");
            }
          }
        }
      }
    }
  }
  lastButtonReading = reading;

  // Check for Long Press (5 seconds) to reset Wi-Fi & re-enter Captive Portal
  if (buttonState == LOW && !buttonLongPressHandled) {
    if (now - buttonPressStartTime >= 5000) {
      buttonLongPressHandled = true;
      Serial.println(F("\n[Button] ⚠️ 5-second hold detected! Resetting Wi-Fi & launching Setup Hotspot..."));

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Resetting Wi-Fi!");
      lcd.setCursor(0, 1);
      lcd.print("Launching AP...");

      buzzerBeepError();

      preferences.begin("feeder-cfg", false);
      preferences.remove("ssid");
      preferences.remove("pass");
      preferences.end();

      delay(1500);
      ESP.restart();
    }
  }

  // 4. Update Servo Actuation Engine
  updateDispenseEngine();

  // 5. Periodic LCD Refresh (every 250ms during dispense, 500ms when idle)
  unsigned long lcdInterval = (currentState == STATE_DISPENSING) ? 250 : 500;
  if (now - lastLcdUpdate >= lcdInterval) {
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
