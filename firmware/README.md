# ⚡ BotanIQ ESP32 Hardware Integration & Firmware Guide

This directory contains the production-ready firmware and hardware documentation for the **BotanIQ Closed-Loop Smart Plant Pot & Sub-Surface Irrigation System**.

---

## 📌 Microcontroller Pinout & Wiring Specification

| Component | Model / Spec | ESP32 GPIO Pin | Signal Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Soil Moisture Sensor** | Capacitive v1.2 | `GPIO 34` (ADC1_CH6) | Analog Input (0–3.3V) | Corrosion-resistant dielectric permittivity probe. |
| **Ambient Temp & RH** | DHT22 (AM2302) | `GPIO 21` | Digital Bidirectional | Calibrated temperature (°C) & relative humidity (%). |
| **Ambient Light Sensor** | 5mm LDR Photoresistor | `GPIO 35` (ADC1_CH7) | Analog Input (0–3.3V) | Microclimatic illumination intensity (Lux). |
| **Submersible Water Pump** | 5V Mini DC Pump | `GPIO 22` | Digital Output (PWM/High) | Controlled via optocoupler-isolated MOSFET relay module. |
| **Reservoir Water Float** | Magnetic Reed Float Switch | `GPIO 32` | Digital In (`INPUT_PULLUP`)| Low water dry-run pump safety lockout. |
| **Status Heartbeat LED** | Onboard LED | `GPIO 2` | Digital Output | Pulses during actuation and serial telemetry transmit. |

---

## 🔌 Circuit Connection Diagram

```
                       +-------------------------+
                       |    ESP32-WROOM-32D      |
                       |                         |
  +------------------->| GPIO34 (ADC1_CH6)       |
  | Capacitive Soil    |                         |
  | Sensor (AOUT)      | GPIO35 (ADC1_CH7) <-----+ LDR Voltage Divider (10kΩ)
  |                    |                         |
  +------------------->| GPIO21 (DHT Data) <-----+ DHT22 (10kΩ pullup to 3.3V)
  |                    |                         |
  |                    | GPIO22 (Pump Out) ------> MOSFET Gate (IRFZ44N / Relay Module)
  |                    |                         |        |
  |                    | GPIO32 (Float In) <-----+        +---> 5V Mini Pump (Sub-surface)
  |                    |                         | Magnetic Float Switch (to GND)
  |                    | GND                 GND |
  |                    | 3V3                 VIN (5V)
  |                    +-------------------------+
  |                             |             |
  +-- 3.3V Power Line ----------+             +-- 5V USB / Power Supply Line
```

---

## 📦 Low-Cost Bill of Materials (BOM)

| Item | Component | Specification | Estimated Cost |
| :---: | :--- | :--- | :---: |
| 1 | Microcontroller | ESP32-WROOM-32D NodeMCU (30-pin) | ~$4.50 |
| 2 | Soil Moisture Probe | Corrosion-Resistant Capacitive Sensor v1.2 | ~$1.20 |
| 3 | Environmental Sensor | DHT22 (AM2302) High Precision | ~$2.80 |
| 4 | Light Sensor | 5mm LDR + 10kΩ Resistor | ~$0.30 |
| 5 | Water Pump | 5V DC Submersible Mini Pump + Tube | ~$2.20 |
| 6 | Pump Driver | 5V 1-Channel Relay or MOSFET Module | ~$1.10 |
| 7 | Safety Float Switch | Vertical Mini PP Liquid Float Switch | ~$1.40 |
| 8 | Pot & Tubing | Sub-surface perforated silicone drip ring | ~$2.50 |
| **Total** | **Complete Smart Pot Hardware** | **All Sensors + Actuation** | **~$16.00** |

---

## 🚀 How to Flash the ESP32

### 1. Arduino IDE Setup
1. Download and install [Arduino IDE](https://www.arduino.cc/en/software) (version 2.x recommended).
2. Go to **File -> Preferences**, and paste this URL into **Additional Board Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools -> Board -> Boards Manager**, search for `esp32`, and install **esp32 by Espressif Systems**.

### 2. Install Required Libraries
Open **Tools -> Manage Libraries** and install:
- **`DHT sensor library`** by Adafruit
- **`Adafruit Unified Sensor`** by Adafruit
- **`ArduinoJson`** by Benoit Blanchon (v6 or v7)
- **`PubSubClient`** by Nick O'Leary

### 3. Uploading Firmware
1. Open [`botaniq_esp32_firmware.ino`](./botaniq_esp32_firmware.ino).
2. Connect your ESP32 to your PC via a micro-USB cable.
3. Select:
   - **Board**: `ESP32 Dev Module`
   - **Upload Speed**: `115200`
   - **Port**: Select the COM port corresponding to your ESP32 (e.g., `COM3`, `COM4`).
4. Click **Upload** (Arrow icon). *(If the console displays `Connecting......`, press and hold the `BOOT` button on the ESP32 until the flashing begins).*

---

## 🌐 Connecting Live to the Web Dashboard

1. Once flashed, leave the ESP32 plugged into your computer via USB.
2. In the web dashboard, navigate to **ESP32 Device / Hardware**.
3. Click **"Connect Real ESP32 via USB (Web Serial)"**.
4. Select your ESP32 COM port and click **Connect**.
5. Real-time soil moisture, temperature, humidity, and light readings will stream directly into the web dashboard!
