# ESP32 30-Pin Physical Pinout & Wokwi Wiring Reference

This document provides the complete hardware pinout reference and Wokwi simulation mapping for the **Smart Pet Feeder** project based on the **ESP32 30-Pin DevKit V1**.

---

## 1. Physical 30-Pin Board Layout

Looking directly at the ESP32 board with the micro-USB connector pointing **DOWN**:

```text
                        ┌────────────────────────┐
                        │     [ MICRO-USB ]      │
                        │                        │
        3.3V Power ── 1 │ 3V3                VIN │ 30 ── 5V Power In (from USB / Power Board)
        EN / Reset ── 2 │ EN                 GND │ 29 ── Ground (GND.1 - Common GND)
                   ── 3 │ VP (GPIO36)     GPIO23 │ 28 ── (Spare / Available)
                   ── 4 │ VN (GPIO39)     GPIO22 │ 27 ── I2C Shared SCL (LCD & DS3231)
                   ── 5 │ GPIO34          GPIO1  │ 26 ── TX0 (USB Serial)
                   ── 6 │ GPIO35          GPIO3  │ 25 ── RX0 (USB Serial)
                   ── 7 │ GPIO32          GPIO21 │ 24 ── I2C Shared SDA (LCD & DS3231)
                   ── 8 │ GPIO33          GPIO19 │ 23 ── SG90 Servo PWM
    Active Buzzer ──── 9 │ GPIO25          GPIO18 │ 22 ── (Spare / Available)
                   ── 10│ GPIO26           GPIO5 │ 21 ── (Spare / Available)
      Push Button ─── 11 │ GPIO27          GPIO17 │ 20 ── (Spare / Available)
                   ── 12│ GPIO14          GPIO16 │ 19 ── (Spare / Available)
                   ── 13│ GPIO12           GPIO4 │ 18 ── (Spare / Available)
     Ground (GND) ─── 14 │ GND              GPIO0 │ 17 ── (Boot Pin - Leave Free)
                   ── 15│ GPIO13           GPIO2 │ 16 ── (Boot Pin - Leave Free)
                        └────────────────────────┘
```

---

## 2. Complete Component-to-Pin Mapping Table

| Component | Component Pin | ESP32 Physical Pin | ESP32 GPIO | Wokwi Net Name | Electrical Level | Function |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SG90S Servo** | PWM (Orange/Yellow) | Pin 23 | `GPIO 19` | `esp:D19` | 3.3V PWM | Food dispenser gate actuator (Opens to 180°) |
| **SG90S Servo** | V+ (Red) | Pin 30 | `VIN / 5V` | `esp:VIN` | 5V DC | Servo motor power (Regulated 5V, $\ge$ 1A) |
| **SG90S Servo** | GND (Brown/Black) | Pin 29 | `GND` | `esp:GND.1` | Ground | **Common ground** |
| **16x2 I2C LCD** | SDA | Pin 24 | `GPIO 21` | `esp:D21` | 3.3V I²C | Shared I²C Data bus (Address `0x27`) |
| **16x2 I2C LCD** | SCL | Pin 27 | `GPIO 22` | `esp:D22` | 3.3V I²C | Shared I²C Clock bus |
| **16x2 I2C LCD** | VCC | Pin 30 | `VIN / 5V` | `esp:VIN` | 5V DC | LCD logic & backlight (Needs 5V for crisp contrast) |
| **16x2 I2C LCD** | GND | Pin 29 | `GND` | `esp:GND.1` | Ground | **Common ground** |
| **DS3231 RTC** | SDA | Pin 24 | `GPIO 21` | `esp:D21` | 3.3V I²C | Shared I²C Data bus (Address `0x68`) |
| **DS3231 RTC** | SCL | Pin 27 | `GPIO 22` | `esp:D22` | 3.3V I²C | Shared I²C Clock bus |
| **DS3231 RTC** | VCC | Pin 1 or Pin 30 | `3V3` / `VIN`| `esp:3V3` / `esp:VIN` | 3.3V–5V DC | High-precision RTC power (3.3V recommended) |
| **DS3231 RTC** | GND | Pin 29 | `GND` | `esp:GND.1` | Ground | **Common ground** |
| **Push Button** | Signal Leg | Pin 11 | `GPIO 27` | `esp:D27` | Active LOW | Manual feed trigger (`INPUT_PULLUP`) |
| **Push Button** | Ground Leg | Pin 14 | `GND` | `esp:GND.2` | Ground | Switch to ground |
| **Active Buzzer** | Positive (+) | Pin 9 | `GPIO 25` | `esp:D25` | 3.3V Output | Audio tones & melody chimes |
| **Active Buzzer** | Negative (-) | Pin 14 | `GND` | `esp:GND.2` | Ground | **Common ground** |

> **Note on I²C Bus Sharing:** Both the **16x2 LCD** (address `0x27`) and the **DS3231 RTC** (address `0x68`) share the same I²C bus lines (GPIO 21 for SDA and GPIO 22 for SCL). No extra pins are needed for the RTC.

---

## 3. Ground (GND) & Power (VCC) Distribution Guide

### A. The Golden Rule of Ground: ALL COMPONENTS SHARE COMMON GROUND
In any circuit with multiple sensors, motors, and microcontrollers, **every single component must connect to the same Common Ground (GND)**:
- Ground acts as the 0V reference for all signals (PWM, I2C, Button, Buzzer).
- On the ESP32 board, Pin 14 (`GND.2`) and Pin 29 (`GND.1`) are internally connected.
- If using an external 5V power supply for the servo, the external supply's negative (-) wire **MUST be connected to the ESP32 GND**.

### B. Power (VCC) Rails: 5V vs 3.3V Rules

| Power Rail | Voltage | Components Sharing This Rail | Why / Electrical Reason |
| :--- | :--- | :--- | :--- |
| **5V Rail** (`VIN`) | 5.0V DC | • **SG90 Servo (V+)**<br>• **16x2 LCD (VCC)**<br>• **ESP32 DevKit (VIN)** | • **Servo:** Requires 4.8V–6V and draws up to 800mA surge current. ⚠️ **NEVER** power servo from ESP32 3.3V!<br>• **LCD:** Requires 5V for readable character contrast and backlight. |
| **3.3V Rail** (`3V3`) | 3.3V DC | • **DS3231 RTC (VCC)** (or 5V if module has built-in regulator) | • **DS3231:** Powering from 3.3V matches ESP32 GPIO logic level on the shared I²C lines without pulling lines above 3.3V. |
| **Direct GPIO** | 3.3V DC | • **Active Buzzer (+)** | • Driven directly from GPIO 25 via PWM / tone output. |
| **No VCC Needed** | N/A | • **Push Button** | • Uses ESP32 internal pull-up resistor (`INPUT_PULLUP`). One leg to GPIO 27, other leg to GND. |

---

## 4. How to Import and Run in Wokwi

You have two easy ways to simulate this circuit:

### Method A: Direct File Import on Wokwi.com (Easiest)
1. Go to [wokwi.com](https://wokwi.com) and start a new **ESP32** project (or go to [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32)).
2. In the top editor tabs, click the **`diagram.json`** tab.
3. Open the file [`smart-pet-feeder/diagram.json`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/diagram.json) in this repository, copy all the JSON code, and paste it into the Wokwi `diagram.json` tab.
4. Paste the contents of [`smart-pet-feeder.ino`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/smart-pet-feeder.ino) into the main `sketch.ino` tab.
5. In Wokwi's **Library Manager** (`libraries.txt`), add these standard libraries:
   ```text
   RTClib
   ESP32Servo
   LiquidCrystal I2C
   PubSubClient
   ArduinoJson
   ```
6. Click the green **Play (Start Simulation)** button!

### Method B: Using VS Code Wokwi Extension
1. Install the official **Wokwi Simulator** extension in VS Code.
2. Open the `smart-pet-feeder/` folder.
3. Press `F1` and select **Wokwi: Start Simulator**. The extension will automatically read [`diagram.json`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/diagram.json) and [`wokwi.toml`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/wokwi.toml).

---

## 5. Hardware Assembly Notes

* **Using the ESP32 30P DEVKIT V1 Power Board Shield**:
  * Plug your ESP32 firmly into the power board shield.
  * The power board breaks out every GPIO pin alongside dedicated **5V** (red) and **GND** (black/blue) pin headers.
  * Connect the 5V and GND wires of the **Servo** and **LCD** directly to these power board rails.
  * Connect the **SG90 Servo PWM** wire (orange/yellow) to **GPIO 19**.
  * Connect both the **16x2 LCD** and the **DS3231 RTC** to the shared I²C bus: **SDA** to **GPIO 21** and **SCL** to **GPIO 22**.
  * Connect the **DS3231 RTC** VCC to the **3.3V** rail and GND to the power board **GND** rail.
