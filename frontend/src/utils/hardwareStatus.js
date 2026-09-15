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
// order (pH, EC, Water Temp, Air Temp, Humidity, Water Level, Light) used
// on both the Overview snapshot and the Live Monitoring page.
export const REAL_SENSOR_TYPES = [
  "ph", // GPIO35
  "ec", // GPIO34
  "water_temp", // DS18B20
  "air_temp", // DHT22
  "humidity", // DHT22
  "water_level", // GPIO32 (temporary analog probe, ultrasonic upgrade planned)
  "light_intensity", // BH1750, I2C (shared bus with WCMCU-3221)
];

// Sensor types that must never be treated as real regardless of what the
// backend reports for them. Currently empty - every sensor type above is
// real, connected hardware.
export const NEVER_REAL_SENSOR_TYPES = [];

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

// General-purpose guard for AI-analysis responses: strips out any issue
// for a sensor type listed in NEVER_REAL_SENSOR_TYPES before deriving a
// status, so a fabricated input can't silently contaminate the AI
// verdict. Currently a no-op (NEVER_REAL_SENSOR_TYPES is empty) - kept in
// place as the mechanism to reuse if a future sensor's live value isn't
// actually wired into the /analyze payload yet.
export function excludeNeverRealIssues(issues) {
  return (issues || []).filter((issue) => !NEVER_REAL_SENSOR_TYPES.includes(issue.parameter));
}

export function overallStatusFromIssues(issues) {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "ideal";
}
