"""
Pump control registry.

In-memory state for the two relay-controlled pumps wired to the ESP32:
mainPump (GPIO23) and phPump (GPIO22). POST /iot/control publishes a
command over MQTT (see mqtt_client.publish_pump_command) and optimistically
records the commanded state here so the dashboard can reflect it
immediately; when the ESP32 echoes mainPump/phPump back on
hydromind/esp32/data, update_from_esp32() overwrites it with the real,
device-confirmed state (see mqtt_data.update_data).
"""

from datetime import datetime, timezone

PUMP_DEFS = {
    "mainPump": {"label": "Main Pump", "gpio": 23},
    "phPump": {"label": "pH Pump", "gpio": 22},
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


_state = {
    pump: {"pump": pump, "state": False, "source": "default", "last_update": _now()}
    for pump in PUMP_DEFS
}


def get_pumps() -> dict:
    return {pump: dict(rec) for pump, rec in _state.items()}


def set_command(pump: str, state: bool) -> dict:
    if pump not in PUMP_DEFS:
        raise ValueError(f"Unknown pump '{pump}'")
    rec = _state[pump]
    rec["state"] = state
    rec["source"] = "command"
    rec["last_update"] = _now()
    return dict(rec)


def update_from_esp32(data: dict) -> None:
    """Called on every real MQTT payload from hydromind/esp32/data that
    includes the ESP32's own mainPump/phPump status."""
    for pump in PUMP_DEFS:
        if pump not in data:
            continue
        value = data[pump]
        if isinstance(value, str):
            value = value.strip().lower() in ("1", "true", "on", "yes")
        rec = _state[pump]
        rec["state"] = bool(value)
        rec["source"] = "esp32"
        rec["last_update"] = _now()
