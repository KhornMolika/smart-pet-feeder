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
        EN / Reset ── 2 │ EN                 GND │ 29 ── Ground (GND.1)
                   ── 3 │ VP (GPIO36)     GPIO23 │ 28 ── DS1302 CLK
                   ── 4 │ VN (GPIO39)     GPIO22 │ 27 ── I2C LCD SCL
                   ── 5 │ GPIO34          GPIO1  │ 26 ── TX0 (USB Serial)
    HC-SR04 ECHO ──── 6 │ GPIO35          GPIO3  │ 25 ── RX0 (USB Serial)
    HC-SR04 TRIG ──── 7 │ GPIO32          GPIO21 │ 24 ── I2C LCD SDA
                   ── 8 │ GPIO33          GPIO19 │ 23 ── DS1302 DAT
   Active Buzzer ──── 9 │ GPIO25          GPIO18 │ 22 ── SG90 Servo PWM
      DS1302 RST ─── 10 │ GPIO26           GPIO5 │ 21 ── (Spare)
     Push Button ─── 11 │ GPIO27          GPIO17 │ 20 ── (Spare)
                   ── 12 │ GPIO14          GPIO16 │ 19 ── (Spare)
                   ── 13 │ GPIO12           GPIO4 │ 18 ── (Spare)
    Ground (GND) ─── 14 │ GND              GPIO0 │ 17 ── (Boot Pin - Leave Free)
                   ── 15 │ GPIO13           GPIO2 │ 16 ── (Boot Pin - Leave Free)
                        └────────────────────────┘
```

---

## 2. Complete Component-to-Pin Mapping Table

| Component | Component Pin | ESP32 Physical Pin | ESP32 GPIO | Wokwi Net Name | Electrical Level | Function |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SG90S Servo** | PWM (Orange/Yellow) | Pin 22 | `GPIO 18` | `esp:D18` | 3.3V PWM | Food dispenser gate actuator |
| **SG90S Servo** | V+ (Red) | Pin 30 | `VIN / 5V` | `esp:VIN` | 5V DC | Servo motor power |
| **SG90S Servo** | GND (Brown/Black) | Pin 29 | `GND` | `esp:GND.1` | Ground | Common ground |
| **16x2 I2C LCD** | SDA | Pin 24 | `GPIO 21` | `esp:D21` | 3.3V I²C | I²C Data communication |
| **16x2 I2C LCD** | SCL | Pin 27 | `GPIO 22` | `esp:D22` | 3.3V I²C | I²C Clock communication |
| **16x2 I2C LCD** | VCC | Pin 30 | `VIN / 5V` | `esp:VIN` | 5V DC | LCD logic & backlight |
| **16x2 I2C LCD** | GND | Pin 29 | `GND` | `esp:GND.1` | Ground | Common ground |
| **HC-SR04 Sensor** | TRIG | Pin 7 | `GPIO 32` | `esp:D32` | 3.3V Output | 10µs ultrasonic trigger pulse |
| **HC-SR04 Sensor** | ECHO | Pin 6 | `GPIO 35` | `esp:D35` | 3.3V Input | Echo pulse duration (depth) |
| **HC-SR04 Sensor** | VCC | Pin 30 | `VIN / 5V` | `esp:VIN` | 5V DC | Ultrasonic transducer power |
| **HC-SR04 Sensor** | GND | Pin 14 | `GND` | `esp:GND.2` | Ground | Common ground |
| **Push Button** | Signal Leg | Pin 11 | `GPIO 27` | `esp:D27` | Active LOW | Manual feed trigger (`INPUT_PULLUP`) |
| **Push Button** | Ground Leg | Pin 14 | `GND` | `esp:GND.2` | Ground | Switch to ground |
| **Active Buzzer** | Positive (+) | Pin 9 | `GPIO 25` | `esp:D25` | 3.3V Output | Audio tones & melody chimes |
| **Active Buzzer** | Negative (-) | Pin 14 | `GND` | `esp:GND.2` | Ground | Ground |
| **DS1302 RTC** | CLK / SCLK | Pin 28 | `GPIO 23` | `esp:D23` | 3.3V Output | Synchronous serial clock |
| **DS1302 RTC** | DAT / IO | Pin 23 | `GPIO 19` | `esp:D19` | 3.3V Bi-dir | Serial data input/output |
| **DS1302 RTC** | RST / CE | Pin 10 | `GPIO 26` | `esp:D26` | 3.3V Output | Chip enable / reset |
| **DS1302 RTC** | VCC | Pin 1 | `3V3` | `esp:3V3` | 3.3V DC | RTC module power |
| **DS1302 RTC** | GND | Pin 29 | `GND` | `esp:GND.1` | Ground | Common ground |

---

## 3. How to Import and Run in Wokwi

You have two easy ways to simulate this circuit:

### Method A: Direct File Import on Wokwi.com (Easiest)
1. Go to [wokwi.com](https://wokwi.com) and start a new **ESP32** project (or go to [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32)).
2. In the top editor tabs, click the **`diagram.json`** tab.
3. Open the file [`smart-pet-feeder/diagram.json`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/diagram.json) in this repository, copy all the JSON code, and paste it into the Wokwi `diagram.json` tab.
4. Paste the contents of [`smart-pet-feeder.ino`](file:///d:/ACLEDA/Y4-S1/IoT/smart-pet-feeder/smart-pet-feeder/smart-pet-feeder.ino) into the main `sketch.ino` tab.
5. In Wokwi's **Library Manager** (`libraries.txt`), add these standard libraries:
   ```text
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

## 4. Hardware Assembly Notes

* **Using the ESP32 30P DEVKIT V1 Power Board**:
  * Plug your ESP32 firmly into the power board shield.
  * The power board breaks out every GPIO pin alongside dedicated **5V** (red) and **GND** (black/blue) pin headers.
  * Connect the 5V and GND wires of the **Servo**, **LCD**, and **HC-SR04** directly to these power board rails.
* **HC-SR04 Echo Level Protection**:
  * The HC-SR04 Echo pin outputs 5V. While ESP32 GPIO 35 has internal protection, you can safely insert a **1kΩ resistor** in series between HC-SR04 ECHO and ESP32 GPIO 35.
