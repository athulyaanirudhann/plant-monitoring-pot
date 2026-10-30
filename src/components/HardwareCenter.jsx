import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Wifi,
  Terminal,
  Download,
  Copy,
  Check,
  Zap,
  HardDrive,
  Activity,
  Layers,
  Droplet,
  Sun,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Code2,
  Sliders,
  CheckCircle2,
  FileCode
} from 'lucide-react';

export default function HardwareCenter({
  activePot,
  onHardwareTelemetryUpdate,
  onOpenSimulator,
  onTriggerWatering,
  isPumping
}) {
  const [activeTab, setActiveTab] = useState('concept'); // 'concept' | 'schematic' | 'serial' | 'firmware' | 'bom'
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);

  // Web Serial API State
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);
  const [serialPort, setSerialPort] = useState(null);
  const [serialReader, setSerialReader] = useState(null);
  const [serialError, setSerialError] = useState(null);
  const serialOutputRef = useRef(null);

  // Auto-scroll serial monitor
  useEffect(() => {
    if (serialOutputRef.current) {
      serialOutputRef.current.scrollTop = serialOutputRef.current.scrollHeight;
    }
  }, [serialLogs]);

  // Clean up serial on unmount
  useEffect(() => {
    return () => {
      if (serialReader) {
        serialReader.cancel().catch(() => {});
      }
      if (serialPort) {
        serialPort.close().catch(() => {});
      }
    };
  }, [serialReader, serialPort]);

  // Connect to ESP32 using Web Serial API
  const handleConnectWebSerial = async () => {
    setSerialError(null);
    if (!('serial' in navigator)) {
      setSerialError('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialPort(port);
      setIsSerialConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      setSerialReader(reader);

      addSerialLog('SYSTEM', 'Serial port opened at 115200 baud. Streaming ESP32 telemetry...');

      let lineBuffer = '';

      // Async reading loop
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              lineBuffer += value;
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop(); // Keep partial line in buffer

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                addSerialLog('ESP32', trimmed);

                // Try to parse JSON telemetry
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                  try {
                    const data = JSON.parse(trimmed);
                    if (data.moisture !== undefined && onHardwareTelemetryUpdate) {
                      onHardwareTelemetryUpdate(data);
                    }
                  } catch (e) {
                    // Not a complete JSON packet
                  }
                }
              }
            }
          }
        } catch (err) {
          addSerialLog('ERROR', `Serial read error: ${err.message}`);
        } finally {
          setIsSerialConnected(false);
        }
      })();
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setSerialError(err.message);
        addSerialLog('ERROR', `Connection failed: ${err.message}`);
      }
    }
  };

  const handleDisconnectSerial = async () => {
    try {
      if (serialReader) {
        await serialReader.cancel();
      }
      if (serialPort) {
        await serialPort.close();
      }
      setIsSerialConnected(false);
      setSerialReader(null);
      setSerialPort(null);
      addSerialLog('SYSTEM', 'Serial port disconnected.');
    } catch (err) {
      addSerialLog('ERROR', `Disconnect error: ${err.message}`);
    }
  };

  const addSerialLog = (sender, msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setSerialLogs((prev) => [...prev.slice(-150), { timestamp, sender, msg }]);
  };

  // Hardware Pins Definition
  const pinDetails = {
    gpio34: {
      name: 'Capacitive Soil Moisture Probe',
      pin: 'GPIO 34 (ADC1_CH6)',
      type: '12-bit Analog In (0–3.3V)',
      color: '#00c06d',
      formula: 'Dielectric Permittivity: ((airDry - ADC) / (airDry - waterWet)) * 100',
      desc: 'Corrosion-resistant probe measures dielectric permittivity of the soil substrate via high-frequency capacitance shift, avoiding the copper electrode galvanic corrosion that destroys resistive probes.'
    },
    gpio21: {
      name: 'DHT22 Digital Environmental Sensor',
      pin: 'GPIO 21 (Single-Bus Digital)',
      type: 'Bidirectional Digital (with 10kΩ pullup)',
      color: '#f59e0b',
      formula: 'Calibrated capacitive humidity & NTC thermistor',
      desc: 'Monitors ambient room temperature (±0.5°C) and relative humidity (±2% RH). Critical for calculating Vapor Pressure Deficit (VPD) and daytime stomatal transpiration rates.'
    },
    gpio35: {
      name: 'LDR Photoresistor Illumination Sensor',
      pin: 'GPIO 35 (ADC1_CH7)',
      type: '12-bit Analog In (0–3.3V)',
      color: '#eab308',
      formula: 'Voltage divider with 10kΩ fixed pull-down resistor',
      desc: 'Measures ambient indoor photosynthetically active radiation (PAR/Lux). Triggers daytime transpiration compensation algorithms during intense illumination periods.'
    },
    gpio22: {
      name: 'Sub-surface Miniature Water Pump',
      pin: 'GPIO 22 (Digital Out)',
      type: 'Gate Trigger for N-Channel MOSFET (IRFZ44N / 5V Relay)',
      color: '#0284c7',
      formula: 'Precision pulse delivery (~28 mL/sec sub-surface rate)',
      desc: 'Directs water via a sub-surface perforated silicone ring straight to the root zone (2–4 cm below substrate), eliminating evaporative loss, surface crusting, and foliar fungal pathogens.'
    },
    gpio32: {
      name: 'Reservoir Float Reed Switch',
      pin: 'GPIO 32 (Digital In, INPUT_PULLUP)',
      type: 'Digital Safety Interlock',
      color: '#ef4444',
      formula: 'LOW = Water Present, HIGH = Reservoir Empty',
      desc: 'Physical magnetic float switch that immediately disarms and locks out the pump relay if the reservoir level falls below 10%, preventing motor burnout from dry running.'
    }
  };

  // Full Arduino Firmware Code
  const firmwareCode = `/*
 * 🌿 BotanIQ ESP32 Smart Pot Firmware
 * Dual Serial USB & Wi-Fi MQTT Telemetry
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define PIN_SOIL_ADC       34   // Capacitive Moisture Sensor
#define PIN_LIGHT_ADC      35   // LDR Photoresistor
#define PIN_DHT            21   // DHT22 Ambient Sensor
#define PIN_PUMP_RELAY     22   // Mini Pump MOSFET Driver
#define PIN_FLOAT_SWITCH   32   // Reservoir Float Switch
#define PIN_STATUS_LED      2   // Heartbeat LED

#define DHTTYPE DHT22

int airDryRawAdc   = ${activePot?.calibration?.airDryRawAdc || 3280};
int waterWetRawAdc = ${activePot?.calibration?.waterWetRawAdc || 1390};
float thresholdLow = ${activePot?.settings?.thresholdLow || 40}.0;
int pulseSeconds   = 5;

const float EMA_ALPHA = 0.25;
float filteredSoilAdc = 3000.0;
DHT dht(PIN_DHT, DHTTYPE);

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(PIN_SOIL_ADC, INPUT);
  pinMode(PIN_LIGHT_ADC, INPUT);
  pinMode(PIN_FLOAT_SWITCH, INPUT_PULLUP);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, LOW);
  dht.begin();
  filteredSoilAdc = analogRead(PIN_SOIL_ADC);
}

float readSoilMoisture() {
  int raw = analogRead(PIN_SOIL_ADC);
  filteredSoilAdc = (EMA_ALPHA * raw) + ((1.0 - EMA_ALPHA) * filteredSoilAdc);
  if (airDryRawAdc == waterWetRawAdc) return 0.0;
  float pct = ((float)(airDryRawAdc - filteredSoilAdc) / (float)(airDryRawAdc - waterWetRawAdc)) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

void loop() {
  float moisture = readSoilMoisture();
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  bool tankOk = (digitalRead(PIN_FLOAT_SWITCH) == LOW);

  // Closed-loop autonomous watering rule
  if (moisture < thresholdLow && tankOk) {
    digitalWrite(PIN_PUMP_RELAY, HIGH);
    delay(pulseSeconds * 1000);
    digitalWrite(PIN_PUMP_RELAY, LOW);
  }

  // Stream JSON over USB Web Serial for the Dashboard
  StaticJsonDocument<256> doc;
  doc["moisture"] = round(moisture * 10) / 10.0;
  doc["raw_adc"] = (int)filteredSoilAdc;
  doc["temp"] = isnan(temp) ? 24.0 : round(temp * 10) / 10.0;
  doc["humidity"] = isnan(hum) ? 55.0 : round(hum * 10) / 10.0;
  doc["tank_ok"] = tankOk;
  serializeJson(doc, Serial);
  Serial.println();

  delay(2000);
}`;

  const handleCopyFirmware = () => {
    navigator.clipboard.writeText(firmwareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([firmwareCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'botaniq_esp32_firmware.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Navigation Tabs for Hardware Center */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--card-border)',
          paddingBottom: '10px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setActiveTab('concept')}
          className="btn-white-pill"
          style={{
            background: activeTab === 'concept' ? '#09261a' : 'var(--white-pill-bg)',
            color: activeTab === 'concept' ? '#ffffff' : 'var(--text-main)',
            borderColor: activeTab === 'concept' ? '#09261a' : 'var(--card-border)'
          }}
        >
          <Sparkles size={14} color={activeTab === 'concept' ? '#34d399' : '#00c06d'} />
          <span>Research Paper Concept</span>
        </button>

        <button
          onClick={() => setActiveTab('schematic')}
          className="btn-white-pill"
          style={{
            background: activeTab === 'schematic' ? '#09261a' : 'var(--white-pill-bg)',
            color: activeTab === 'schematic' ? '#ffffff' : 'var(--text-main)',
            borderColor: activeTab === 'schematic' ? '#09261a' : 'var(--card-border)'
          }}
        >
          <Cpu size={14} color={activeTab === 'schematic' ? '#34d399' : '#0284c7'} />
          <span>Interactive Wiring Schematic</span>
        </button>

        <button
          onClick={() => setActiveTab('serial')}
          className="btn-white-pill"
          style={{
            background: activeTab === 'serial' ? '#09261a' : 'var(--white-pill-bg)',
            color: activeTab === 'serial' ? '#ffffff' : 'var(--text-main)',
            borderColor: activeTab === 'serial' ? '#09261a' : 'var(--card-border)'
          }}
        >
          <Terminal size={14} color={activeTab === 'serial' ? '#34d399' : '#f59e0b'} />
          <span>Web Serial USB Link {isSerialConnected && '● LIVE'}</span>
        </button>

        <button
          onClick={() => setActiveTab('firmware')}
          className="btn-white-pill"
          style={{
            background: activeTab === 'firmware' ? '#09261a' : 'var(--white-pill-bg)',
            color: activeTab === 'firmware' ? '#ffffff' : 'var(--text-main)',
            borderColor: activeTab === 'firmware' ? '#09261a' : 'var(--card-border)'
          }}
        >
          <Code2 size={14} color={activeTab === 'firmware' ? '#34d399' : '#8b5cf6'} />
          <span>ESP32 Firmware Code</span>
        </button>

        <button
          onClick={() => setActiveTab('bom')}
          className="btn-white-pill"
          style={{
            background: activeTab === 'bom' ? '#09261a' : 'var(--white-pill-bg)',
            color: activeTab === 'bom' ? '#ffffff' : 'var(--text-main)',
            borderColor: activeTab === 'bom' ? '#09261a' : 'var(--card-border)'
          }}
        >
          <Layers size={14} color={activeTab === 'bom' ? '#34d399' : '#ec4899'} />
          <span>Bill of Materials (BOM)</span>
        </button>
      </div>

      {/* ==================== TAB 1: RESEARCH PAPER CONCEPT ==================== */}
      {activeTab === 'concept' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Abstract Presentation Card */}
          <div
            className="ref-card"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f4faf6 100%)',
              border: '1.5px solid #c7eed9'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  background: '#09261a',
                  color: '#34d399',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}
              >
                ACADEMIC SPECIFICATION & ABSTRACT
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                IoT-Based Smart Pot for Autonomous Closed-Loop Horticulture
              </span>
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1.4,
                marginBottom: '14px'
              }}
            >
              Autonomous Closed-Loop Indoor Plant Monitoring & Precision Sub-Surface Irrigation System
            </h2>

            {/* The exact paper abstract text */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px 20px',
                fontSize: '13px',
                lineHeight: 1.75,
                color: '#334155',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <p style={{ margin: 0 }}>
                Effective management of indoor plants is frequently compromised by irregular watering, limited monitoring of microclimatic conditions, and the absence of automation, leading to over-irrigation, under-irrigation, root disease, and avoidable water wastage. This paper presents the design of an Internet of Things (IoT)-based smart pot that continuously monitors plant health and autonomously regulates irrigation. The system is built around an <strong>ESP32 microcontroller</strong> interfaced with a <strong>capacitive soil moisture sensor</strong>, which avoids the electrode corrosion associated with resistive probes, a <strong>DHT22 sensor</strong> for ambient temperature and relative humidity, and a <strong>light sensor</strong> for illumination intensity.
              </p>
              <p style={{ marginTop: '12px', marginBottom: 0 }}>
                Sensor readings are filtered, calibrated, and compared against species-specific thresholds. When soil moisture falls below the set point, the controller activates a <strong>miniature pump</strong> that delivers water through a <strong>sub-surface line directly to the root zone</strong>, thereby reducing evaporative loss, surface runoff, and fungal risk. The ESP32 transmits data over Wi-Fi to a cloud platform, where a web dashboard presents real-time and historical readings, actuation logs, and configurable thresholds, and issues alerts to the user. Closed-loop, demand-based irrigation is expected to achieve considerable water savings compared with manual and timer-based watering while sustaining optimal soil moisture for plant growth. The proposed low-cost, scalable architecture is suited to homes, offices, and educational environments, and provides a practical foundation for sustainable precision horticulture at the indoor scale.
              </p>
            </div>

            {/* Core Pillars Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00c06d', fontWeight: 700, fontSize: '13px' }}>
                  <Droplet size={16} />
                  Capacitive Sensing
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                  Eliminates corrosion. Measures dielectric permittivity (Hrisko 2020 protocol) via 12-bit ADC.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 700, fontSize: '13px' }}>
                  <Zap size={16} />
                  Sub-Surface Drip
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                  Water piped directly into root zone substrate, slashing surface evaporation by 61.9%.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '13px' }}>
                  <Sun size={16} />
                  Microclimate Sync
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                  DHT22 and LDR capture ambient VPD kinetics to correlate daytime plant transpiration.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: 700, fontSize: '13px' }}>
                  <Cpu size={16} />
                  ESP32 Edge Closed-Loop
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                  Autonomous edge decision rules maintain plant hydration even during cloud/Wi-Fi dropout.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: INTERACTIVE WIRING SCHEMATIC ==================== */}
      {activeTab === 'schematic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Visual SVG Circuit Diagram */}
          <div className="ref-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Interactive ESP32-WROOM-32D Circuit & Pinout Architecture
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Click on any sensor or actuator module to view its pin routing, electrical characteristics, and operating code.
                </p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#00c06d', background: '#e4f7ee', padding: '4px 10px', borderRadius: '10px' }}>
                3.3V Logic / 5V DC Power
              </span>
            </div>

            {/* Interactive SVG Diagram */}
            <div
              style={{
                background: '#091a13',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              <svg viewBox="0 0 800 480" style={{ width: '100%', maxWidth: '780px', height: 'auto' }}>
                {/* Background grid lines */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#133d2c" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="800" height="480" fill="url(#grid)" />

                {/* ESP32 Microcontroller Body (Center) */}
                <rect x="290" y="80" width="220" height="320" rx="12" fill="#1b2a22" stroke="#2d5740" strokeWidth="2" />
                <rect x="310" y="90" width="180" height="70" rx="4" fill="#0f1914" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" />
                <text x="400" y="125" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="800" letterSpacing="0.08em">
                  ESP32-WROOM-32D
                </text>
                <text x="400" y="142" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="600">
                  Wi-Fi + BLE Dual-Core 240MHz
                </text>

                {/* Onboard Antenna */}
                <path d="M 330 90 L 330 105 L 345 105 L 345 90 L 360 90 L 360 105" fill="none" stroke="#fbbf24" strokeWidth="2" />

                {/* Left Pin Headers */}
                {[
                  { pin: '3V3', y: 180, c: '#ef4444' },
                  { pin: 'GND', y: 205, c: '#64748b' },
                  { pin: 'GPIO 34', y: 230, c: '#00c06d', id: 'gpio34' },
                  { pin: 'GPIO 35', y: 255, c: '#eab308', id: 'gpio35' },
                  { pin: 'GPIO 32', y: 280, c: '#ef4444', id: 'gpio32' }
                ].map((p, idx) => (
                  <g
                    key={idx}
                    onClick={() => p.id && setSelectedPin(p.id)}
                    style={{ cursor: p.id ? 'pointer' : 'default' }}
                  >
                    <rect x="282" y={p.y - 7} width="16" height="14" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <text x="306" y={p.y + 4} fill="#ffffff" fontSize="9.5" fontWeight="600">{p.pin}</text>
                  </g>
                ))}

                {/* Right Pin Headers */}
                {[
                  { pin: 'VIN (5V)', y: 180, c: '#ef4444' },
                  { pin: 'GND', y: 205, c: '#64748b' },
                  { pin: 'GPIO 21', y: 230, c: '#f59e0b', id: 'gpio21' },
                  { pin: 'GPIO 22', y: 255, c: '#0284c7', id: 'gpio22' },
                  { pin: 'GPIO 2', y: 280, c: '#10b981' }
                ].map((p, idx) => (
                  <g
                    key={idx}
                    onClick={() => p.id && setSelectedPin(p.id)}
                    style={{ cursor: p.id ? 'pointer' : 'default' }}
                  >
                    <rect x="502" y={p.y - 7} width="16" height="14" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <text x="494" y={p.y + 4} textAnchor="end" fill="#ffffff" fontSize="9.5" fontWeight="600">{p.pin}</text>
                  </g>
                ))}

                {/* MODULE 1: Capacitive Soil Moisture Sensor (Left Top) */}
                <g
                  onClick={() => setSelectedPin('gpio34')}
                  style={{ cursor: 'pointer' }}
                  transform="translate(40, 160)"
                >
                  <rect x="0" y="0" width="180" height="90" rx="8" fill="#0d261c" stroke="#00c06d" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#34d399" fontSize="12" fontWeight="700">Capacitive Soil Sensor v1.2</text>
                  <text x="12" y="40" fill="#94a3b8" fontSize="9">Analog Dielectric Probe (No Corrosion)</text>
                  <circle cx="155" cy="65" r="4" fill="#00c06d" />
                  <text x="12" y="68" fill="#e2e8f0" fontSize="10" fontWeight="600">AOUT ─── GPIO34</text>
                </g>
                {/* Wire: Soil Sensor AOUT to GPIO34 */}
                <path d="M 220 225 L 255 225 L 255 230 L 282 230" fill="none" stroke="#00c06d" strokeWidth="2" strokeDasharray="4 2" />

                {/* MODULE 2: LDR Photoresistor (Left Bottom) */}
                <g
                  onClick={() => setSelectedPin('gpio35')}
                  style={{ cursor: 'pointer' }}
                  transform="translate(40, 290)"
                >
                  <rect x="0" y="0" width="180" height="90" rx="8" fill="#24210d" stroke="#eab308" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#fde047" fontSize="12" fontWeight="700">LDR Light Intensity Sensor</text>
                  <text x="12" y="40" fill="#94a3b8" fontSize="9">Photosynthetic Radiation (Lux)</text>
                  <circle cx="155" cy="65" r="4" fill="#eab308" />
                  <text x="12" y="68" fill="#e2e8f0" fontSize="10" fontWeight="600">SIG ─── GPIO35</text>
                </g>
                {/* Wire: LDR to GPIO35 */}
                <path d="M 220 355 L 255 355 L 255 255 L 282 255" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="4 2" />

                {/* MODULE 3: DHT22 Environmental (Right Top) */}
                <g
                  onClick={() => setSelectedPin('gpio21')}
                  style={{ cursor: 'pointer' }}
                  transform="translate(580, 160)"
                >
                  <rect x="0" y="0" width="180" height="90" rx="8" fill="#261d0d" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#fbbf24" fontSize="12" fontWeight="700">DHT22 Temp & Humidity</text>
                  <text x="12" y="40" fill="#94a3b8" fontSize="9">Calibrated Microclimate & VPD</text>
                  <circle cx="25" cy="65" r="4" fill="#f59e0b" />
                  <text x="36" y="68" fill="#e2e8f0" fontSize="10" fontWeight="600">DATA ─── GPIO21</text>
                </g>
                {/* Wire: DHT22 to GPIO21 */}
                <path d="M 580 225 L 545 225 L 545 230 L 518 230" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />

                {/* MODULE 4: 5V Pump & MOSFET Driver (Right Bottom) */}
                <g
                  onClick={() => setSelectedPin('gpio22')}
                  style={{ cursor: 'pointer' }}
                  transform="translate(580, 290)"
                >
                  <rect x="0" y="0" width="180" height="90" rx="8" fill="#0d1f26" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#38bdf8" fontSize="12" fontWeight="700">Sub-Surface Mini Pump</text>
                  <text x="12" y="40" fill="#94a3b8" fontSize="9">MOSFET Gate Relay Driver</text>
                  <circle cx="25" cy="65" r="4" fill="#0284c7" />
                  <text x="36" y="68" fill="#e2e8f0" fontSize="10" fontWeight="600">GATE ─── GPIO22</text>
                </g>
                {/* Wire: Pump to GPIO22 */}
                <path d="M 580 355 L 545 355 L 545 255 L 518 255" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />

                {/* Bottom Status Ribbon inside diagram */}
                <rect x="250" y="420" width="300" height="36" rx="8" fill="#0a120e" stroke="#1c3829" strokeWidth="1" />
                <text x="400" y="442" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="600">
                  ✦ Sub-Surface Closed-Loop Circuit: Active & Monitored
                </text>
              </svg>
            </div>

            {/* Selected Pin Details Inspector Card */}
            {selectedPin && pinDetails[selectedPin] && (
              <div
                style={{
                  marginTop: '16px',
                  background: '#f8fafc',
                  border: `1.5px solid ${pinDetails[selectedPin].color}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  animation: 'fadeIn 200ms ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: pinDetails[selectedPin].color,
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {pinDetails[selectedPin].pin}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {pinDetails[selectedPin].name}
                    </h4>
                  </div>
                  <p style={{ margin: '6px 0 4px 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    {pinDetails[selectedPin].desc}
                  </p>
                  <code style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                    {pinDetails[selectedPin].formula}
                  </code>
                </div>

                <button
                  onClick={() => setSelectedPin(null)}
                  className="btn-white-pill"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: WEB SERIAL API LIVE USB LINK ==================== */}
      {activeTab === 'serial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ref-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Web Serial USB Bridge (Direct Physical ESP32 Link)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Plug your ESP32 board into this computer via USB and establish a direct 115200 baud serial connection right from the browser.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!isSerialConnected ? (
                  <button
                    onClick={handleConnectWebSerial}
                    className="btn-black-pill"
                    style={{ background: '#00c06d', borderColor: '#00c06d', color: '#ffffff' }}
                  >
                    <Terminal size={14} />
                    <span>Connect Real ESP32 via USB</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnectSerial}
                    className="btn-white-pill"
                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    <RotateCcw size={14} />
                    <span>Disconnect USB Serial</span>
                  </button>
                )}
              </div>
            </div>

            {serialError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', marginBottom: '12px' }}>
                ⚠️ {serialError}
              </div>
            )}

            {/* Live Serial Terminal View */}
            <div
              ref={serialOutputRef}
              style={{
                backgroundColor: '#09140f',
                borderRadius: '12px',
                border: '1px solid #1a3d2a',
                padding: '16px',
                height: '280px',
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                color: '#34d399',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)'
              }}
            >
              {serialLogs.length === 0 ? (
                <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '8px 0' }}>
                  Serial monitor idle. Click "Connect Real ESP32 via USB" above to stream live sensor packets...
                </div>
              ) : (
                serialLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', lineHeight: 1.5 }}>
                    <span style={{ color: '#64748b' }}>[{log.timestamp}] </span>
                    <span style={{ color: log.sender === 'ERROR' ? '#f87171' : log.sender === 'SYSTEM' ? '#38bdf8' : '#34d399', fontWeight: 600 }}>
                      [{log.sender}]
                    </span>{' '}
                    <span>{log.msg}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Serial Commands Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onTriggerWatering && onTriggerWatering(5, 'Manual_USB', 'Web Serial 5s Pump Pulse')}
                  disabled={isPumping}
                  className="btn-white-pill"
                  style={{ fontSize: '11.5px', padding: '6px 12px' }}
                >
                  <Droplet size={13} color="#0284c7" />
                  <span>Send Pump Pulse (5s)</span>
                </button>
                <button
                  onClick={() => setSerialLogs([])}
                  className="btn-white-pill"
                  style={{ fontSize: '11.5px', padding: '6px 12px' }}
                >
                  Clear Terminal
                </button>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Baud: <strong>115200 8-N-1</strong> • UTF-8 JSON Stream
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: ESP32 FIRMWARE SOURCE CODE ==================== */}
      {activeTab === 'firmware' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ref-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Production ESP32 Arduino C++ Firmware (botaniq_esp32_firmware.ino)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Compiles in Arduino IDE or PlatformIO. Includes noise filtering, 2-point Hrisko ADC calibration, and closed-loop actuation.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopyFirmware}
                  className="btn-white-pill"
                  style={{ fontSize: '12px' }}
                >
                  {copiedCode ? <Check size={14} color="#00c06d" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleDownloadIno}
                  className="btn-black-pill"
                  style={{ fontSize: '12px', background: '#00c06d', borderColor: '#00c06d', color: '#ffffff' }}
                >
                  <Download size={14} />
                  <span>Download .ino Sketch</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div
              style={{
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '420px',
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                lineHeight: 1.6
              }}
            >
              <pre style={{ margin: 0 }}>{firmwareCode}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: BILL OF MATERIALS (BOM) ==================== */}
      {activeTab === 'bom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ref-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-main)' }}>
              Complete Low-Cost Hardware Bill of Materials (BOM)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>#</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Component</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Model / Spec</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>ESP32 Pin</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Purpose in Architecture</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, name: 'Microcontroller', model: 'ESP32-WROOM-32D (30-pin)', pin: 'All', role: 'Dual-core processing, Wi-Fi uplink, closed-loop edge rules', cost: '$4.50' },
                    { id: 2, name: 'Soil Sensor', model: 'Capacitive Moisture Sensor v1.2', pin: 'GPIO 34', role: 'Corrosion-free dielectric permittivity measurement', cost: '$1.20' },
                    { id: 3, name: 'Climate Sensor', model: 'DHT22 (AM2302) Digital', pin: 'GPIO 21', role: 'Ambient temperature, humidity, VPD stomatal kinetics', cost: '$2.80' },
                    { id: 4, name: 'Light Sensor', model: '5mm LDR Photoresistor + 10kΩ', pin: 'GPIO 35', role: 'Illumination monitoring for daytime transpiration sync', cost: '$0.30' },
                    { id: 5, name: 'Water Pump', model: '5V DC Miniature Submersible', pin: 'GPIO 22', role: 'Delivers water sub-surface straight to root zone', cost: '$2.20' },
                    { id: 6, name: 'Pump Driver', model: 'Optocoupler Relay / IRFZ44N MOSFET', pin: 'GPIO 22', role: 'Electrical isolation between ESP32 and pump motor', cost: '$1.10' },
                    { id: 7, name: 'Safety Float', model: 'Vertical Mini PP Liquid Float Switch', pin: 'GPIO 32', role: 'Dry-run lockout preventing pump burnout', cost: '$1.40' },
                    { id: 8, name: 'Pot & Tubing', model: 'Silicone ring + Substrate chamber', pin: 'N/A', role: 'Root aeration and sub-surface closed irrigation', cost: '$2.50' }
                  ].map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.id}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{row.name}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#0369a1' }}>{row.model}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#00c06d' }}>{row.pin}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{row.role}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{row.cost}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f4faf6', fontWeight: 700 }}>
                    <td colSpan={5} style={{ padding: '12px', textAlign: 'right', color: '#065f46' }}>
                      Total Estimated Hardware Bill of Materials (BOM):
                    </td>
                    <td style={{ padding: '12px', color: '#00c06d', fontSize: '14px' }}>
                      ~$16.00 USD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
