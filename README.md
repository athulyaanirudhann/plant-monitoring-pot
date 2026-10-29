# 🌿 BotanIQ: Smart Plant Pot & Closed-Loop Irrigation IoT Platform

[![React](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32--WROOM--32D-e7352c.svg?style=flat&logo=espressif)](https://www.espressif.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An intelligent, closed-loop smart plant monitoring pot and precision sub-surface irrigation IoT dashboard. Built with **React 19**, **Vite**, and **custom Vanilla CSS** featuring an edge-to-edge UI, live telemetry streaming, multi-pot fleet management, hardware calibration wizards, and pump actuation logging.

---

## ✨ Features

- **📊 Real-Time Telemetry Dashboard**: Live capacitive soil moisture (%), ambient temperature (°C), illumination (Lux), and relative humidity (%) with mini sparkline bar charts and live status indicators.
- **📈 Historical Telemetry Analytics**: Interactive SVG trend charts with selectable time windows (`1h`, `6h`, `24h`, `7d`), Vapor Pressure Deficit (VPD) calculations, and CSV telemetry exports.
- **🪴 Multi-Pot Fleet Management**: Unified control for multiple connected plant nodes (*Fiddle Leaf Fig*, *Monstera Deliciosa*, *Snake Plant*) with species-specific botanical moisture thresholds and 1-click active node switching.
- **💧 Closed-Loop Sub-Surface Actuation**: Autonomous edge microcontroller logic delivering micro-pulses directly to the root zone, cutting surface evaporation and achieving **61.9% water savings** compared to conventional spray methods.
- **📜 Detailed Watering Logs**: Comprehensive timestamped actuation audit trail recording pulse duration, water volume delivered (mL), trigger reasons (Auto/Manual), and CSV log download.
- **⚡ ESP32 Edge Diagnostics**: Microcontroller health monitor tracking WiFi RSSI signal strength, free heap RAM (218 KB / 320 KB), and NVS flash memory partition status.
- **🔬 2-Point ADC Sensor Calibration**: In-browser calibration laboratory implementing the scientific **Hrisko (2020) dielectric permittivity protocol** (dry air reference vs. water submerged reference) with dynamic moisture curve testing and hardware flash commit.
- **🧪 Fault-Injection Simulator**: Test dry soil conditions, empty reservoir lockouts, and hardware disconnects without physical wiring.

---

## 🛠️ Microcontroller Hardware Mapping

The platform is designed around the **ESP32-WROOM-32D** microcontroller:

| Pin | Type | Function | Description |
| :--- | :--- | :--- | :--- |
| **`GPIO 34`** | Analog Input (ADC1_CH6) | Capacitive Moisture Sensor v1.2 | 12-bit analog input (0–4095) measuring dielectric soil permittivity. |
| **`GPIO 22`** | Digital Output | 5V Submersible Pump MOSFET/Relay | Optocoupler-isolated gate driver for precision pulse delivery. |
| **`GPIO 21`** | Digital Bidirectional | DHT22 Environmental Sensor | Calibrated ambient air temperature (°C) and relative humidity (%). |
| **`GPIO 32`** | Digital Input (Internal Pullup) | Magnetic Float Switch | Reservoir water level detection for automatic dry-run pump safety lockout. |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/athulyaanirudhann/plant-monitoring-pot.git
   cd plant-monitoring-pot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🧭 Application Structure

```
plant/
├── src/
│   ├── components/
│   │   ├── ActuationLogs.jsx       # Timestamped pump event records & CSV export
│   │   ├── AlertsCenter.jsx        # Critical diagnostic notifications banner
│   │   ├── CalibrationModal.jsx    # Hrisko 2-point ADC calibration wizard
│   │   ├── DeviceStatusCard.jsx    # ESP32 hardware telemetry & signal health
│   │   ├── HardwareSimulator.jsx   # Fault-injection and soil moisture simulator
│   │   ├── HistoryChart.jsx        # SVG telemetry history graphs & range controls
│   │   ├── MetricCards.jsx         # Telemetry stat cards
│   │   ├── PotIllustration.jsx     # Physical cross-section pot schematic
│   │   ├── ThresholdSettings.jsx   # Closed-loop moisture boundary configuration
│   │   └── WaterSavingsModal.jsx   # Comparative water conservation audit
│   ├── data/
│   │   ├── initialState.js         # Default multi-pot telemetry & logs data
│   │   └── plantPresets.js         # Botanical species presets & moisture ranges
│   ├── App.jsx                     # Root application container & dedicated views
│   ├── index.css                   # Custom design system tokens & animations
│   └── main.jsx                    # Application bootstrap entrypoint
├── index.html                      # HTML5 entrypoint with Google Fonts
└── package.json                    # Project dependencies and build scripts
```

---

## 📜 Scientific Citation

The capacitive sensor calibration logic implemented in this project utilizes the 2-point normalization method:
> **Hrisko, J. (2020)**. *Capacitive Soil Moisture Sensor Calibration with ESP32*. Maker Portal.

---

## 📄 License

This project is licensed under the MIT License.
