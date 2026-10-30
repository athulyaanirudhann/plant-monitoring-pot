import React, { useState } from 'react';
import { Terminal, Sliders, Droplet, AlertTriangle, ShieldAlert, Sun, Moon, Cpu, RefreshCw, Copy, Check, Code } from 'lucide-react';

export default function HardwareSimulator({
  isOpen,
  onClose,
  pot,
  onSimulateMoistureChange,
  onSimulateTankChange,
  onTriggerFault,
  onRefillTank
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('controls'); // 'controls' | 'payload' | 'firmware'
  const [copied, setCopied] = useState(false);

  // Sample live MQTT payload
  const sampleMqttPayload = JSON.stringify(
    {
      device_id: pot.device.deviceId,
      timestamp: new Date().toISOString(),
      firmware_ver: pot.device.firmwareVersion,
      telemetry: {
        soil_moisture_pct: pot.telemetry.moisture,
        raw_adc: pot.telemetry.rawAdc,
        ambient_temp_c: pot.telemetry.temperature,
        relative_humidity_pct: pot.telemetry.humidity,
        light_intensity_lux: pot.telemetry.light,
        vpd_kpa: pot.telemetry.vpd,
        reservoir_level_pct: pot.telemetry.tankLevelPercent
      },
      actuator_state: {
        pump_relay_active: false,
        auto_mode: pot.settings.autoWateringEnabled,
        threshold_low: pot.settings.thresholdLow,
        threshold_high: pot.settings.thresholdHigh
      },
      diagnostics: {
        wifi_rssi_dbm: pot.device.wifiRssi,
        free_heap_bytes: pot.device.freeHeapKb * 1024,
        uptime_seconds: pot.device.uptimeSeconds
      }
    },
    null,
    2
  );

  const sampleArduinoCode = `/*
 * BotanIQ Smart Pot ESP32 Firmware
 * Hardware: ESP32-WROOM-32D, Capacitive Moisture Probe (GPIO34),
 * DHT22 (GPIO4), LDR (GPIO35), 5V Relay/MOSFET Pump Driver (GPIO18)
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define PIN_SOIL_ADC 34
#define PIN_PUMP_RELAY 18
#define PIN_DHT 4
#define DHTTYPE DHT22

DHT dht(PIN_DHT, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Calibration values stored in NVS Flash
int airDryAdc = ${pot.calibration.airDryRawAdc};
int waterWetAdc = ${pot.calibration.waterWetRawAdc};
float thresholdLow = ${pot.settings.thresholdLow}.0;
int burstSec = ${pot.settings.burstDurationSec};

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, LOW); // Normally OFF
  dht.begin();
  // Connect WiFi and MQTT...
}

float readCalibratedMoisture() {
  int raw = analogRead(PIN_SOIL_ADC);
  float pct = ((float)(airDryAdc - raw) / (airDryAdc - waterWetAdc)) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

void loop() {
  float moisture = readCalibratedMoisture();
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Closed-loop autonomous watering rule
  if (moisture < thresholdLow) {
    Serial.println("Soil moisture low -> Actuating sub-surface pump");
    digitalWrite(PIN_PUMP_RELAY, HIGH);
    delay(burstSec * 1000);
    digitalWrite(PIN_PUMP_RELAY, LOW);
  }
  delay(15000); // 15s sampling interval
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="card-title">
              <Terminal size={16} color="hsl(var(--primary))" />
              Hardware Bridge & Demonstration Simulator
            </h3>
            <p className="card-subtitle">
              Inspect live MQTT telemetry payloads, test hardware faults, and copy ESP32 firmware
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="nav-tabs" style={{ marginBottom: '16px', height: '36px' }}>
          <button
            onClick={() => setActiveTab('controls')}
            className={`nav-tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            style={{ fontSize: '12px' }}
          >
            <Sliders size={13} />
            Simulator Triggers
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`nav-tab-btn ${activeTab === 'payload' ? 'active' : ''}`}
            style={{ fontSize: '12px' }}
          >
            <Terminal size={13} />
            MQTT JSON Schema
          </button>
          <button
            onClick={() => setActiveTab('firmware')}
            className={`nav-tab-btn ${activeTab === 'firmware' ? 'active' : ''}`}
            style={{ fontSize: '12px' }}
          >
            <Code size={13} />
            ESP32 Arduino Code
          </button>
        </div>

        {/* TAB 1: Simulator Quick Triggers */}
        {activeTab === 'controls' && (
          <div>
            <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)', marginBottom: '16px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                Quick Test Scenarios (IoT Specification Test Suite):
              </span>
              <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px', marginBottom: '10px' }}>
                Verify UI state changes instantly across nominal, drought, critical, and sensor failure modes.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => onTriggerFault('SCENARIO_NORMAL')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '11.5px', color: '#10b981' }}
                >
                  <span>🌿</span>
                  <span><strong>Normal:</strong> 65% soil, 27°C, 450 lux (Pump OFF)</span>
                </button>

                <button
                  onClick={() => onTriggerFault('SCENARIO_DRY')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '11.5px', color: '#f59e0b' }}
                >
                  <span>💧</span>
                  <span><strong>Dry:</strong> 31% soil, triggers pump ON</span>
                </button>

                <button
                  onClick={() => onTriggerFault('SCENARIO_CRITICAL')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '11.5px', color: '#ef4444' }}
                >
                  <span>⚠️</span>
                  <span><strong>Critical:</strong> 18% soil, Critical Alert</span>
                </button>

                <button
                  onClick={() => onTriggerFault('SCENARIO_SENSOR_FAIL')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '11.5px', color: '#dc2626' }}
                >
                  <span>🚫</span>
                  <span><strong>Failure:</strong> Soil --, Sensor Offline</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {/* Trigger 1: Force Soil Dry */}
              <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>
                  Simulate Dry Soil
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
                  Drops moisture below threshold to trigger autonomous pump.
                </p>
                <button
                  onClick={() => onSimulateMoistureChange(-15)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  <Droplet size={13} />
                  Drop Moisture (-15%)
                </button>
              </div>

              {/* Trigger 2: Refill / Drain Tank */}
              <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4', marginBottom: '4px' }}>
                  Reservoir Tank Simulator
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
                  Test dry-run pump safety lockout or refill tank.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onSimulateTankChange(0)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, color: '#ef4444' }}
                  >
                    Empty Tank
                  </button>
                  <button
                    onClick={onRefillTank}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    Refill
                  </button>
                </div>
              </div>

              {/* Trigger 3: Fault Out-of-Range */}
              <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
                  Simulate Sensor Fault
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
                  Simulates disconnected capacitive probe (ADC = 4095).
                </p>
                <button
                  onClick={() => onTriggerFault('SENSOR_DISCONNECTED')}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', color: '#ef4444' }}
                >
                  <ShieldAlert size={13} />
                  Trigger Fault
                </button>
              </div>

              {/* Trigger 4: Simulate High Heatwave */}
              <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#eab308', marginBottom: '4px' }}>
                  Simulate Midday Sun
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
                  Increases ambient light and temperature (high VPD).
                </p>
                <button
                  onClick={() => onTriggerFault('HEATWAVE')}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  <Sun size={13} />
                  Peak Sun (32°C)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MQTT JSON Payload */}
        {activeTab === 'payload' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                Topic: <code>botaniq/{pot.device.deviceId}/telemetry</code>
              </span>
              <span className="badge badge-emerald">JSON Schema</span>
            </div>
            <pre
              style={{
                background: 'hsl(var(--muted) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                padding: '14px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                color: '#10b981',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {sampleMqttPayload}
            </pre>
          </div>
        )}

        {/* TAB 3: ESP32 Arduino C++ Firmware Code */}
        {activeTab === 'firmware' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                Ready to flash to ESP32 with Arduino IDE / PlatformIO
              </span>
              <button onClick={handleCopyCode} className="btn btn-outline btn-sm">
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy C++'}
              </button>
            </div>
            <pre
              style={{
                background: 'hsl(var(--muted) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                padding: '14px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                color: '#06b6d4',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {sampleArduinoCode}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn btn-default">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
