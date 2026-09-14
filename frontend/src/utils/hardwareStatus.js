// Single source of truth for which parts of the system are real, wired
// ESP32/WCMCU hardware vs. not installed yet. Drives the Connected / Not
// Connected badges across the dashboard.
//
// Keep this in sync with the ESP32 firmware (hhh.ino) pin map whenever
// hardware changes — it's the only place the frontend hardcodes that list.
//
// There is no "simulation" concept here on purpose: hardware that isn't
// installed yet must show "-" / Not Connected, never a fabricated value.

// Sensor types (matching the backend's SENSOR_DEFS / mqtt keys) that are
// real, connected hardware today. Order matches the required display
// order (pH, EC, Water Temp, Air Temp, Humidity, Water Level) used on
// both the Overview snapshot and the Live Monitoring page.
export const REAL_SENSOR_TYPES = [
  "ph", // GPIO35
  "ec", // GPIO34
  "water_temp", // DS18B20
  "air_temp", // DHT22
  "humidity", // DHT22
  "water_level", // GPIO32 (temporary analog probe, ultrasonic upgrade planned)
];

// Note: "light_intensity" is deliberately left out of REAL_SENSOR_TYPES.
// The ESP32 firmware still fills that MQTT field with a placeholder value
// (no BH1750 installed), which makes the backend's iot_registry mark it
// data_source="esp32" — i.e. "real" — the moment any MQTT message arrives.
// It must always render as Not Connected regardless of what the backend
// reports, since there is no real light sensor.
export const NEVER_REAL_SENSOR_TYPES = ["light_intensity"];

// Real, controllable pumps — the only two devices with an actual backend
// relay endpoint (POST /iot/control). Shared between the Automation page
// and Energy Dashboard's Smart Control section so both stay in sync.
export const REAL_CONTROLLABLE_PUMPS = [
  { key: "mainPump", nameKey: "devices.mainPump" },
  { key: "phPump", nameKey: "devices.refillPump" }, // API key unchanged; relay was physically repurposed
];

// Devices named in the product spec that have no backend/hardware support
// at all yet — no control endpoint, no power/energy reading, nothing.
// Always rendered as "Not Connected — waiting for hardware", never a
// value or a working control. `contexts` says which UI sections a device
// applies to: "control" (Automation page / Smart Control), "power" (Power
// Dashboard), "consumption" (Device Energy Consumption).
export const NOT_YET_CONNECTED_DEVICES = [
  { id: "phUpPump", nameKey: "devices.phUpPump", contexts: ["control", "power", "consumption"] },
  { id: "phDownPump", nameKey: "devices.phDownPump", contexts: ["control", "power", "consumption"] },
  { id: "nutrientPumpA", nameKey: "devices.nutrientPumpA", contexts: ["control", "power", "consumption"] },
  { id: "nutrientPumpB", nameKey: "devices.nutrientPumpB", contexts: ["control", "power", "consumption"] },
  { id: "ledGrowLight", nameKey: "devices.ledGrowLight", contexts: ["control", "power", "consumption"], brightness: true },
  { id: "esp32Controller", nameKey: "devices.esp32Controller", contexts: ["power", "consumption"] },
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

// A real sensor reading is only trustworthy when the backend has actually
// received it from the ESP32 (data_source "esp32") — never when it's
// still the registry's simulated default.
export function isSensorLive(sensorRecord) {
  return sensorRecord?.data_source === "esp32";
}

// How long a real reading counts as "current" before a status/badge
// should stop calling it Connected. Named + exported so every page that
// derives a connectivity signal from timestamp recency agrees.
export const STALE_THRESHOLD_MS = 30000;

export function isRecentlyUpdated(isoTimestamp, thresholdMs = STALE_THRESHOLD_MS) {
  if (!isoTimestamp) return false;
  return Date.now() - new Date(isoTimestamp).getTime() < thresholdMs;
}

// POST /analyze's SensorReading payload requires a light_intensity value
// even though there's no real light sensor — the backend evaluates every
// field it's given, so a placeholder light value would otherwise let a
// fabricated reading silently produce a fake "light critical" issue and
// contaminate the AI's overall status. These two helpers strip any
// light_intensity issue out of the response and recompute the status from
// what's left, so the AI verdict is only ever driven by real sensor data.
export function excludeNeverRealIssues(issues) {
  return (issues || []).filter((issue) => !NEVER_REAL_SENSOR_TYPES.includes(issue.parameter));
}

export function overallStatusFromIssues(issues) {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "ideal";
}
