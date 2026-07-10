"""
IoT sensor fleet registry.

In-memory state for the 7 simulated sensor devices and the 6 farm-network
nodes shown on the Sensor Connectivity and Farm Network pages. This is the
integration seam for real hardware: a real ESP32 posting to
POST /iot/sensors/{sensor_id}/reading calls record_live_reading() below,
which updates the exact same records that get_sensors() reads — so the
frontend and the GET endpoints never need to change when real devices
replace the simulation.

PROTOTYPE NOTE: state lives in a process-local dict, which is fine for a
single-instance demo deployment but would need a shared store (e.g. Redis)
behind a real multi-instance deployment.
"""

import random
from datetime import datetime, timezone

SENSOR_DEFS = {
    "ph": {"range": (5.5, 6.5), "unit": ""},
    "ec": {"range": (1.0, 2.0), "unit": " mS/cm"},
    "water_temp": {"range": (18, 22), "unit": "°C"},
    "air_temp": {"range": (20, 26), "unit": "°C"},
    "humidity": {"range": (50, 70), "unit": "%"},
    "water_level": {"range": (55, 100), "unit": "%"},
    "light_intensity": {"range": (200, 400), "unit": " µmol/m²/s"},
}

NETWORK_NODES = ["sensor_network", "esp32", "gateway", "internet", "cloud", "dashboard"]

_state = {"mode": "simulation", "sensors": {}, "network": {}}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _init_sensor(sensor_type: str) -> dict:
    lo, hi = SENSOR_DEFS[sensor_type]["range"]
    return {
        "id": f"{sensor_type}-01",
        "sensor_type": sensor_type,
        "reading": round(random.uniform(lo, hi), 2),
        "unit": SENSOR_DEFS[sensor_type]["unit"],
        "expected_range": {"min": lo, "max": hi},
        "last_update": _now(),
        "connection_status": "connected",
        "battery_level": round(random.uniform(80, 100)),
        "signal_strength": round(random.uniform(80, 100)),
        "health_status": "excellent",
        "data_source": "simulation",
    }


def _ensure_init():
    if not _state["sensors"]:
        for sensor_type in SENSOR_DEFS:
            _state["sensors"][sensor_type] = _init_sensor(sensor_type)
    if not _state["network"]:
        for node_id in NETWORK_NODES:
            _state["network"][node_id] = {"id": node_id, "status": "online", "last_update": _now()}


def _derive_connection_status(signal: float) -> str:
    if signal >= 70:
        return "connected"
    if signal >= 30:
        return "weak_signal"
    return "offline"


def _derive_health(battery: float, signal: float, connection_status: str) -> str:
    if connection_status == "offline":
        return "fault_detected"
    if battery < 15 or signal < 40:
        return "needs_maintenance"
    if battery < 40 or signal < 60:
        return "good"
    return "excellent"


def _tick_sensors():
    for sensor_type, rec in _state["sensors"].items():
        if rec["data_source"] == "live":
            continue  # never overwrite a real device's data with simulated drift

        lo, hi = SENSOR_DEFS[sensor_type]["range"]
        span = hi - lo
        drift = random.uniform(-0.06, 0.06) * span
        if random.random() < 0.05:
            drift += random.choice([-1, 1]) * random.uniform(0.15, 0.4) * span
        rec["reading"] = round(rec["reading"] + drift, 2)

        battery_delta = -random.uniform(0, 0.4)
        if random.random() < 0.02:
            battery_delta = random.uniform(5, 15)  # simulated battery swap
        rec["battery_level"] = round(max(0, min(100, rec["battery_level"] + battery_delta)))

        if random.random() < 0.08:
            rec["signal_strength"] = max(0, rec["signal_strength"] - random.uniform(20, 50))
        else:
            rec["signal_strength"] = min(100, rec["signal_strength"] + random.uniform(0, 5))
        rec["signal_strength"] = round(rec["signal_strength"])

        rec["connection_status"] = _derive_connection_status(rec["signal_strength"])
        rec["health_status"] = _derive_health(rec["battery_level"], rec["signal_strength"], rec["connection_status"])
        rec["last_update"] = _now()


def _tick_network():
    for rec in _state["network"].values():
        rec["status"] = random.choice(["weak", "online"]) if random.random() < 0.05 else "online"
        rec["last_update"] = _now()


def get_mode() -> str:
    _ensure_init()
    return _state["mode"]


def set_mode(mode: str) -> str:
    if mode not in ("simulation", "live"):
        raise ValueError("mode must be 'simulation' or 'live'")
    _ensure_init()
    _state["mode"] = mode
    if mode == "simulation":
        # Switching back to simulation means "simulate everything fresh" —
        # clear any data_source="live" flag left over from a previous real
        # POST, otherwise that sensor would stay frozen forever even though
        # the rest of the fleet resumes ticking.
        for rec in _state["sensors"].values():
            rec["data_source"] = "simulation"
    return _state["mode"]


def get_sensors() -> list:
    _ensure_init()
    if _state["mode"] == "simulation":
        _tick_sensors()
    else:
        # Live mode is honest: a sensor that has never received a real POST
        # shows as offline rather than continuing to display fabricated data.
        for rec in _state["sensors"].values():
            if rec["data_source"] != "live":
                rec["connection_status"] = "offline"
                rec["health_status"] = "fault_detected"
    return list(_state["sensors"].values())


def get_network_status() -> list:
    _ensure_init()
    if _state["mode"] == "simulation":
        _tick_network()
    return list(_state["network"].values())


def record_live_reading(
    sensor_type: str,
    value: float,
    unit: str = None,
    battery_level: float = None,
    signal_strength: float = None,
) -> dict:
    """Called by POST /iot/sensors/{sensor_id}/reading — the real-ESP32 integration point."""
    _ensure_init()
    if sensor_type not in _state["sensors"]:
        return None
    rec = _state["sensors"][sensor_type]
    rec["reading"] = value
    if unit is not None:
        rec["unit"] = unit
    if battery_level is not None:
        rec["battery_level"] = battery_level
    if signal_strength is not None:
        rec["signal_strength"] = signal_strength
        rec["connection_status"] = _derive_connection_status(signal_strength)
    else:
        rec["connection_status"] = "connected"
    rec["health_status"] = _derive_health(
        rec["battery_level"], rec.get("signal_strength", 100), rec["connection_status"]
    )
    rec["last_update"] = _now()
    rec["data_source"] = "live"
    return rec
