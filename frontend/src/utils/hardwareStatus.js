// Single source of truth for which parts of the system are real, wired
// ESP32 hardware vs. still simulated because the part isn't installed yet.
// Drives the Connected / Simulation / Offline badges across the dashboard.
//
// Keep this in sync with the ESP32 firmware (hhh.ino) pin map whenever
// hardware changes — it's the only place the frontend hardcodes that list.

// Sensor types (matching the backend's SENSOR_DEFS / mqtt keys) that are
// real, connected hardware today.
export const REAL_SENSOR_TYPES = [
  "ec", // GPIO34
  "ph", // GPIO35
  "water_level", // GPIO32 (temporary analog probe, ultrasonic upgrade planned)
  "water_temp", // DS18B20
  "air_temp", // DHT22
  "humidity", // DHT22
];

// Note: "light_intensity" is deliberately left out of REAL_SENSOR_TYPES.
// The ESP32 firmware still fills that MQTT field with a placeholder value
// (no BH1750 installed), which would make the backend's iot_registry mark
// it data_source="esp32" — i.e. "real" — the moment any MQTT message
// arrives. The BH1750 entry in SIMULATED_DEVICES below reads the same raw
// mqtt field instead, but is always badged Simulation regardless.

// Devices with no dedicated sensor/monitoring hardware installed yet.
// Always shown, always badged Simulation, so the gap stays visible instead
// of disappearing from the dashboard.
export const SIMULATED_DEVICES = [
  { id: "led_lighting", nameKey: "hardware.simulated.ledLighting", mqttKey: "light", unit: "%" },
  { id: "nutrient_pump", nameKey: "hardware.simulated.nutrientPump", mqttKey: "nutrientPump" },
  { id: "ph_dosing_pump", nameKey: "hardware.simulated.phDosingPump" },
  { id: "cooling_fan", nameKey: "hardware.simulated.coolingFan", mqttKey: "fan" },
  { id: "bh1750", nameKey: "hardware.simulated.bh1750", mqttKey: "light_intensity", unit: " lux" },
  { id: "ultrasonic", nameKey: "hardware.simulated.ultrasonic" },
];

// A plausible EC reading range (mS/cm) for the connected probe/curve. Used
// only to flag "check calibration" — the firmware doesn't report a real
// calibration status over MQTT, so this is a sanity heuristic, not a
// device-confirmed state.
export const EC_PLAUSIBLE_RANGE = [0.05, 5];

// Per-sensor context note shown under the reading, for hardware that's
// real today but expected to change (e.g. a temporary sensor pending
// replacement).
export const REAL_SENSOR_NOTES = {
  water_level: "hardware.notes.waterLevelTemporary",
};
