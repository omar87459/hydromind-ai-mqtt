"""
Pump control registry.

In-memory state for the relay/MOSFET-controlled actuators wired to the
ESP32. POST /iot/control publishes a command over MQTT (see
mqtt_client.publish_pump_command) and optimistically records the commanded
state here so the dashboard can reflect it immediately; when the ESP32
echoes a device's real state back on hydromind/esp32/data,
update_from_esp32() overwrites it with the real, device-confirmed state
(see mqtt_data.update_data).

nutrientPumpAB (GPIO26) is a SINGLE MOSFET driving Pump A and Pump B in
parallel - there is no independent A/B state, only one entry here.

ledGrowLight (GPIO18) is a MOSFET, PWM-dimmed - on/off works exactly like
every other pump above, but it additionally carries a "brightness" field
(0-100%, see set_brightness()/BRIGHTNESS_CAPABLE below) reported under the
ESP32's existing "light" telemetry key, not under "ledGrowLight" itself
(which only ever carries on/off state).
"""

from datetime import datetime, timezone

PUMP_DEFS = {
    "mainPump": {"label": "Main Pump", "gpio": 23},
    "phPump": {"label": "pH Pump", "gpio": 22},
    "phUpPump": {"label": "pH Up Pump", "gpio": 14},
    "phDownPump": {"label": "pH Down Pump", "gpio": 16},
    "nutrientPumpAB": {"label": "Nutrient Pump A+B", "gpio": 26},
    "ledGrowLight": {"label": "Grow Light", "gpio": 18},
}

# Pumps/devices that also accept a brightness command (0-100%), in
# addition to plain on/off. Only the grow light is PWM-dimmed today.
BRIGHTNESS_CAPABLE = {"ledGrowLight"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


_state = {
    pump: {"pump": pump, "state": False, "source": "default", "last_update": _now(), "brightness": None}
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


def set_brightness(pump: str, brightness: int) -> dict:
    if pump not in PUMP_DEFS:
        raise ValueError(f"Unknown pump '{pump}'")
    if pump not in BRIGHTNESS_CAPABLE:
        raise ValueError(f"'{pump}' does not support brightness control")

    brightness = max(0, min(100, int(brightness)))

    rec = _state[pump]
    rec["brightness"] = brightness
    rec["source"] = "command"
    rec["last_update"] = _now()
    return dict(rec)


def update_from_esp32(data: dict) -> None:
    """Called on every real MQTT payload from hydromind/esp32/data that
    includes the ESP32's own actuator status."""
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

    # Grow light brightness (0-100%) is reported under the ESP32's existing
    # "light" telemetry key (unchanged), not under "ledGrowLight" itself.
    if "light" in data and "ledGrowLight" in _state:
        _state["ledGrowLight"]["brightness"] = data["light"]
