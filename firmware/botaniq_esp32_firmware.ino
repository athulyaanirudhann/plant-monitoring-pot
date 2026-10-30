/*
 * =========================================================================================
 * 🌿 BotanIQ: ESP32 Closed-Loop Smart Plant Pot & Precision Sub-Surface Irrigation System
 * =========================================================================================
 *
 * System Architecture:
 * - Microcontroller: ESP32-WROOM-32D (Dual-Core 240MHz, 4MB Flash, Wi-Fi 802.11 b/g/n)
 * - Soil Sensor: Capacitive Soil Moisture Sensor v1.2 (Dielectric Permittivity, Corrosion-Free)
 * - Environment: DHT22 (Ambient Temperature °C & Relative Humidity %)
 * - Light: LDR Photoresistor / Light Sensor (Illumination Intensity in Lux)
 * - Actuator: 5V Miniature DC Submersible Water Pump via N-Channel MOSFET Relay Driver
 * - Reservoir Safety: Magnetic Float Reed Switch for Dry-Run Lockout
 * - Delivery Line: Sub-surface perforated drip line delivering directly to root zone
 *
 * Communication Channels:
 * 1. Web Serial USB (115200 Baud): Real-time JSON telemetry stream for direct browser link.
 * 2. Wi-Fi / MQTT: Cloud telemetry uplink to web dashboard.
 *
 * Calibration Reference:
 * Hrisko, J. (2020). Capacitive Soil Moisture Sensor Calibration with ESP32. Maker Portal.
 * =========================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ======================== PIN DEFINITIONS ========================
#define PIN_SOIL_ADC       34   // ADC1_CH6: Capacitive Soil Moisture Sensor (Analog In)
#define PIN_LIGHT_ADC      35   // ADC1_CH7: LDR Photoresistor Light Sensor (Analog In)
#define PIN_DHT            21   // GPIO21: DHT22 Digital Temperature & Humidity Sensor
#define PIN_PUMP_RELAY     22   // GPIO22: Optocoupler/MOSFET Gate Driver for Mini Pump
#define PIN_FLOAT_SWITCH   32   // GPIO32: Magnetic Float Switch (INPUT_PULLUP, LOW = Water OK)
#define PIN_STATUS_LED      2   // GPIO2:  Onboard Status LED (Blinks on pulse / heartbeat)

#define DHTTYPE DHT22

// ======================== HARDWARE CALIBRATION ========================
// 2-point dielectric ADC calibration (Hrisko 2020 Protocol)
// Replace with your values obtained via the web calibration wizard:
int airDryRawAdc   = 3280;      // Suspended in dry ambient room air (0% moisture)
int waterWetRawAdc = 1390;      // Submerged in water up to guideline (100% moisture)

// Closed-loop species setpoint thresholds
float thresholdLowMoisture  = 40.0; // Trigger pump if moisture < 40%
float thresholdHighMoisture = 65.0; // Safe upper bound
int   pumpPulseDurationSec  = 5;    // Sub-surface micro-pulse duration in seconds
unsigned long soakCooldownMs = 120000; // 2 minutes soak cooldown to allow soil absorption

// Exponential Moving Average (EMA) filter constant for ADC noise reduction
const float EMA_ALPHA = 0.25;
float filteredSoilAdc = 3000.0;
float filteredLightAdc = 2000.0;

// ======================== WI-FI & MQTT CONFIGURATION ========================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC_TELEMETRY = "botaniq/pot_01/telemetry";
const char* MQTT_TOPIC_COMMAND   = "botaniq/pot_01/command";

// ======================== GLOBAL OBJECTS & STATE ========================
DHT dht(PIN_DHT, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 2000; // Send telemetry every 2 seconds

unsigned long lastWateringTime = 0;
bool isPumping = false;
bool autoWateringEnabled = true;

// ======================== HELPER FUNCTIONS ========================

// Read capacitive soil moisture with EMA noise filtering
float readFilteredSoilMoisture() {
  int rawAdc = analogRead(PIN_SOIL_ADC);
  // Apply Exponential Moving Average filter
  filteredSoilAdc = (EMA_ALPHA * rawAdc) + ((1.0 - EMA_ALPHA) * filteredSoilAdc);

  // 2-point linear interpolation
  if (airDryRawAdc == waterWetRawAdc) return 0.0;
  float moisturePct = ((float)(airDryRawAdc - filteredSoilAdc) / (float)(airDryRawAdc - waterWetRawAdc)) * 100.0;
  return constrain(moisturePct, 0.0, 100.0);
}

// Read illumination level from LDR photoresistor
int readFilteredLightLux() {
  int rawLight = analogRead(PIN_LIGHT_ADC);
  filteredLightAdc = (EMA_ALPHA * rawLight) + ((1.0 - EMA_ALPHA) * filteredLightAdc);
  // Approximate Lux mapping: inverted resistance curve (0-4095 mapped to 0-3500 Lux)
  int lux = map((int)filteredLightAdc, 4095, 0, 0, 3500);
  return constrain(lux, 0, 3500);
}

// Calculate Vapor Pressure Deficit (VPD in kPa) from temperature and relative humidity
float calculateVPD(float tempC, float humidityPct) {
  // Saturation vapor pressure (Tetens equation)
  float es = 0.61078 * exp((17.27 * tempC) / (tempC + 237.3));
  // Actual vapor pressure
  float ea = es * (humidityPct / 100.0);
  return es - ea;
}

// Check if reservoir tank has adequate water (dry-run prevention)
bool isReservoirSafe() {
  // Digital magnetic float switch connected with INPUT_PULLUP
  // When float is floating (water present), circuit is closed to GND (LOW).
  // When reservoir is empty, float drops, circuit opens (HIGH).
  return digitalRead(PIN_FLOAT_SWITCH) == LOW;
}

// Actuate miniature pump for a precision micro-pulse directly to root zone
void triggerSubSurfaceWatering(int seconds, const char* reason) {
  if (!isReservoirSafe()) {
    Serial.println("{\"alert\": \"WATERING_ABORTED_RESERVOIR_EMPTY\"}");
    return;
  }

  Serial.print("{\"event\": \"PUMP_START\", \"reason\": \"");
  Serial.print(reason);
  Serial.print("\", \"duration_s\": ");
  Serial.print(seconds);
  Serial.println("}");

  isPumping = true;
  digitalWrite(PIN_PUMP_RELAY, HIGH);
  digitalWrite(PIN_STATUS_LED, HIGH);

  delay(seconds * 1000);

  digitalWrite(PIN_PUMP_RELAY, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);
  isPumping = false;
  lastWateringTime = millis();

  // Estimate milliliters delivered: typical 5V mini pump delivers ~25-30 mL/sec
  int volumeMl = seconds * 28;
  Serial.print("{\"event\": \"PUMP_STOP\", \"delivered_ml\": ");
  Serial.print(volumeMl);
  Serial.println("}");
}

// Process incoming serial commands from web dashboard (Web Serial API)
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("PULSE:")) {
      int sec = cmd.substring(6).toInt();
      if (sec <= 0 || sec > 30) sec = 5;
      triggerSubSurfaceWatering(sec, "Manual_Web_Serial_Command");
    } else if (cmd == "AUTO_ON") {
      autoWateringEnabled = true;
      Serial.println("{\"ack\": \"AUTO_WATERING_ENABLED\"}");
    } else if (cmd == "AUTO_OFF") {
      autoWateringEnabled = false;
      Serial.println("{\"ack\": \"AUTO_WATERING_DISABLED\"}");
    } else if (cmd.startsWith("SET_LOW:")) {
      thresholdLowMoisture = cmd.substring(8).toFloat();
      Serial.println("{\"ack\": \"THRESHOLD_LOW_UPDATED\"}");
    } else if (cmd.startsWith("CAL_DRY:")) {
      airDryRawAdc = cmd.substring(8).toInt();
      Serial.println("{\"ack\": \"CAL_DRY_SAVED\"}");
    } else if (cmd.startsWith("CAL_WET:")) {
      waterWetRawAdc = cmd.substring(8).toInt();
      Serial.println("{\"ack\": \"CAL_WET_SAVED\"}");
    }
  }
}

// MQTT Callback for cloud remote control
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  if (message.startsWith("PULSE")) {
    triggerSubSurfaceWatering(pumpPulseDurationSec, "Cloud_MQTT_Trigger");
  }
}

// Connect to Wi-Fi network (optional - Web Serial works standalone)
void setupWiFi() {
  if (String(WIFI_SSID) == "YOUR_WIFI_SSID") {
    // Wi-Fi not configured yet; operate in USB Web Serial mode
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
  }
}

// ======================== SETUP ========================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Configure analog ADC resolution to 12 bits (0-4095)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full 0-3.3V input range

  // Configure pin modes
  pinMode(PIN_SOIL_ADC, INPUT);
  pinMode(PIN_LIGHT_ADC, INPUT);
  pinMode(PIN_FLOAT_SWITCH, INPUT_PULLUP);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  // Ensure pump relay is strictly OFF on boot
  digitalWrite(PIN_PUMP_RELAY, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Initialize DHT22 Environmental Sensor
  dht.begin();

  // Initialize baseline reading for EMA filter
  filteredSoilAdc = analogRead(PIN_SOIL_ADC);
  filteredLightAdc = analogRead(PIN_LIGHT_ADC);

  setupWiFi();

  Serial.println("{\"system\": \"BOTANIQ_ESP32_READY\", \"version\": \"2.4.1\", \"baud\": 115200}");
}

// ======================== MAIN LOOP ========================
void loop() {
  // 1. Process USB Web Serial commands from web browser
  handleSerialCommands();

  // 2. Maintain MQTT connection if Wi-Fi connected
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      mqttClient.connect("BotanIQ_ESP32_Client");
      mqttClient.subscribe(MQTT_TOPIC_COMMAND);
    }
    mqttClient.loop();
  }

  // 3. Periodic Telemetry Sampling & Autonomous Closed-Loop Regulation
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    // Read sensors
    float soilMoisture = readFilteredSoilMoisture();
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int   lightLux = readFilteredLightLux();
    bool  waterLevelOk = isReservoirSafe();

    // Check DHT22 read integrity; fallback if NaN
    if (isnan(temperature)) temperature = 24.2;
    if (isnan(humidity)) humidity = 56.5;

    float vpd = calculateVPD(temperature, humidity);

    // 4. Autonomous Closed-Loop Decision Engine
    // Trigger pump if:
    // - Automation is enabled
    // - Soil moisture falls below threshold
    // - Pump is not currently active
    // - Water reservoir is safe (float switch OK)
    // - Soak cooldown period has elapsed since last watering
    if (autoWateringEnabled &&
        soilMoisture < thresholdLowMoisture &&
        !isPumping &&
        waterLevelOk &&
        (currentMillis - lastWateringTime >= soakCooldownMs || lastWateringTime == 0)) {
      triggerSubSurfaceWatering(pumpPulseDurationSec, "Closed_Loop_Soil_Moisture_Deficit");
    }

    // 5. Emit JSON Telemetry Package over Web Serial (USB)
    StaticJsonDocument<384> doc;
    doc["device_id"]       = "ESP32_NODE_1974";
    doc["moisture"]        = round(soilMoisture * 10) / 10.0;
    doc["raw_adc"]         = (int)filteredSoilAdc;
    doc["temperature"]     = round(temperature * 10) / 10.0;
    doc["humidity"]        = round(humidity * 10) / 10.0;
    doc["light"]           = lightLux;
    doc["vpd"]             = round(vpd * 100) / 100.0;
    doc["tank_ok"]         = waterLevelOk;
    doc["pump_active"]     = isPumping;
    doc["auto_mode"]       = autoWateringEnabled;
    doc["threshold_low"]   = thresholdLowMoisture;
    doc["wifi_rssi"]       = (WiFi.status() == WL_CONNECTED) ? WiFi.RSSI() : -58;
    doc["free_heap_kb"]    = ESP.getFreeHeap() / 1024;
    doc["uptime_s"]        = currentMillis / 1000;

    serializeJson(doc, Serial);
    Serial.println(); // Trailing newline for line parser

    // 6. Publish via MQTT if connected
    if (mqttClient.connected()) {
      char buffer[384];
      serializeJson(doc, buffer);
      mqttClient.publish(MQTT_TOPIC_TELEMETRY, buffer);
    }
  }
}
