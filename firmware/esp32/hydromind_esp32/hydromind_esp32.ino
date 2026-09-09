/*
 * HydroMind AI — ESP32 firmware
 *
 * Board: ESP32 DevKit V1
 *
 * - Publishes sensor readings to  hydromind/esp32/data  (unchanged: this is
 *   the exact topic/payload shape backend/app/mqtt_client.py already
 *   consumes — see merge_with_real_data() in
 *   backend/app/services/sensor_simulator.py for the keys it understands).
 * - Subscribes to  hydromind/esp32/control  for pump ON/OFF commands sent
 *   by the backend's POST /iot/control endpoint, e.g.:
 *     {"pump": "mainPump", "state": true}
 *     {"pump": "phPump",   "state": false}
 * - Drives two relays:
 *     mainPump -> GPIO23 (Relay 1)
 *     phPump   -> GPIO22 (Relay 2)
 * - Every sensor publish also reports current pump state (mainPump,
 *   phPump) so the dashboard reflects real relay status, not just the
 *   last command sent.
 *
 * Libraries (Arduino Library Manager):
 *   - PubSubClient   (Nick O'Leary)
 *   - ArduinoJson    (Benoit Blanchon)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------------------
// Wi-Fi
// ---------------------------------------------------------------------
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------------------------------------------------------------------
// MQTT (EMQX Cloud) — must match backend/app/mqtt_client.py
// ---------------------------------------------------------------------
const char *MQTT_HOST = "q1a7afa2.ala.asia-southeast1.emqxsl.com";
const int MQTT_PORT = 8883;
const char *MQTT_USERNAME = "esp32";
const char *MQTT_PASSWORD = "omar";
const char *MQTT_CLIENT_ID = "hydromind-esp32";

const char *TOPIC_DATA = "hydromind/esp32/data";
const char *TOPIC_CONTROL = "hydromind/esp32/control";

// ---------------------------------------------------------------------
// Relay pins
// ---------------------------------------------------------------------
const int MAIN_PUMP_PIN = 23; // Relay 1 — Main Pump
const int PH_PUMP_PIN = 22;   // Relay 2 — pH Pump

// Most cheap 2-channel relay boards are active-LOW (LOW = energized).
// Flip this if yours is active-HIGH.
const bool RELAY_ACTIVE_LOW = true;

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
bool mainPumpState = false;
bool phPumpState = false;

const unsigned long PUBLISH_INTERVAL_MS = 5000;
unsigned long lastPublish = 0;

WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

// ---------------------------------------------------------------------
// Wi-Fi
// ---------------------------------------------------------------------
void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.printf("WiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());
}

// ---------------------------------------------------------------------
// Relay control
// ---------------------------------------------------------------------
void applyRelay(int pin, bool state) {
  bool level = RELAY_ACTIVE_LOW ? !state : state;
  digitalWrite(pin, level ? HIGH : LOW);
}

void setPump(const String &pump, bool state) {
  if (pump == "mainPump") {
    mainPumpState = state;
    applyRelay(MAIN_PUMP_PIN, state);
    Serial.printf("mainPump -> %s\n", state ? "ON" : "OFF");
  } else if (pump == "phPump") {
    phPumpState = state;
    applyRelay(PH_PUMP_PIN, state);
    Serial.printf("phPump -> %s\n", state ? "ON" : "OFF");
  } else {
    Serial.printf("Unknown pump in command: %s\n", pump.c_str());
    return;
  }

  // Echo the new state right away instead of waiting for the next
  // periodic sensor publish, so the dashboard updates immediately.
  publishPumpStatus();
}

// ---------------------------------------------------------------------
// TODO: replace these with real sensor drivers.
// Kept as placeholders so the JSON payload shape matches what
// backend/app/services/sensor_simulator.py already expects.
// ---------------------------------------------------------------------
float readPH() { return 6.0; }               // pH probe
float readEC() { return 1.5; }                // EC probe
float readWaterTemp() { return 20.0; }        // DS18B20
float readAirTemp() { return 24.0; }          // DHT22
float readHumidity() { return 60.0; }         // DHT22
float readWaterLevel() { return 80.0; }       // Ultrasonic / float sensor
float readLightIntensity() { return 350.0; }  // BH1750
float readVoltage() { return 12.5; }          // INA226
float readCurrent() { return 1.2; }           // INA226

void publishSensorData() {
  StaticJsonDocument<384> doc;

  doc["ph"] = readPH();
  doc["ec"] = readEC();
  doc["water_temp"] = readWaterTemp();
  doc["air_temp"] = readAirTemp();
  doc["humidity"] = readHumidity();
  doc["water_level"] = readWaterLevel();
  doc["light_intensity"] = readLightIntensity();
  doc["voltage"] = readVoltage();
  doc["current"] = readCurrent();

  // Current pump status, reported alongside every sensor reading.
  doc["mainPump"] = mainPumpState;
  doc["phPump"] = phPumpState;

  char payload[384];
  size_t len = serializeJson(doc, payload);

  mqttClient.publish(TOPIC_DATA, payload, len);
  Serial.print("Published sensor data: ");
  Serial.println(payload);
}

void publishPumpStatus() {
  StaticJsonDocument<128> doc;
  doc["mainPump"] = mainPumpState;
  doc["phPump"] = phPumpState;

  char payload[128];
  size_t len = serializeJson(doc, payload);

  mqttClient.publish(TOPIC_DATA, payload, len);
  Serial.print("Published pump status: ");
  Serial.println(payload);
}

// ---------------------------------------------------------------------
// MQTT command listener — hydromind/esp32/control
// ---------------------------------------------------------------------
void mqttCallback(char *topic, byte *payload, unsigned int length) {
  Serial.printf("Message on %s: ", topic);
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  if (String(topic) != TOPIC_CONTROL) {
    return;
  }

  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.printf("Control JSON parse error: %s\n", err.c_str());
    return;
  }

  const char *pump = doc["pump"];
  if (!pump || !doc.containsKey("state")) {
    Serial.println("Control command missing 'pump' or 'state'");
    return;
  }

  bool state = doc["state"];
  setPump(String(pump), state);
}

// ---------------------------------------------------------------------
// MQTT connect / reconnect
// ---------------------------------------------------------------------
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println("Connecting to MQTT (EMQX)...");

    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("MQTT connected");
      mqttClient.subscribe(TOPIC_CONTROL);
      Serial.printf("Subscribed to %s\n", TOPIC_CONTROL);
    } else {
      Serial.printf("MQTT connect failed, rc=%d — retrying in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

// ---------------------------------------------------------------------
// Setup / loop
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(MAIN_PUMP_PIN, OUTPUT);
  pinMode(PH_PUMP_PIN, OUTPUT);
  applyRelay(MAIN_PUMP_PIN, false);
  applyRelay(PH_PUMP_PIN, false);

  connectWiFi();

  // NOTE: setInsecure() skips TLS certificate verification, matching the
  // prototype-grade TLS setup on the backend (mqtt_client.py uses
  // PROTOCOL_TLS_CLIENT without pinning EMQX's CA either). For production,
  // load EMQX Cloud's CA certificate with wifiClient.setCACert(...) instead.
  wifiClient.setInsecure();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;
    publishSensorData();
  }
}
