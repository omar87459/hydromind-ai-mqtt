"""
Energy device registry.

In-memory simulated state for the farm's electrical system: live metrics
(voltage, current, power, cumulative energy, frequency, power factor,
system status) and per-device power draw for 7 devices. Ticked on each
read the same way app.services.iot_registry ticks sensors — no background
thread needed since the frontend polls on an interval anyway.

PROTOTYPE NOTE: this is a second, independent device-state store from the
Monitoring page's automation panel (frontend/src/utils/automation.js),
which is client-side-only React state with no backend today. If that panel
ever moves server-side, this registry's device control functions
(control_device / set_global_mode) are the natural place to unify around.

Real hardware integration: swap _tick_devices()'s simulated wattage for
readings from a real power meter (e.g. an ESP32 + current-transformer
sensor posting to a future POST /energy/devices/{id}/reading endpoint,
mirroring how app.services.iot_registry.record_live_reading already works
for the sensor fleet) without changing any of the GET endpoints below.
"""

import random
from datetime import datetime, timezone
from typing import Optional

DEVICES = {
    "main_pump": {"rated_power_w": 750, "duty_cycle": 0.8},
    "nutrient_pump": {"rated_power_w": 120, "duty_cycle": 0.15},
    "air_pump": {"rated_power_w": 60, "duty_cycle": 0.9},
    "led_lights": {"rated_power_w": 600, "duty_cycle": 0.7},
    "cooling_fan": {"rated_power_w": 150, "duty_cycle": 0.4},
    "water_chiller": {"rated_power_w": 900, "duty_cycle": 0.3},
    "optional_device": {"rated_power_w": 200, "duty_cycle": 0.2},
}

BASE_LOAD_W = 45  # controllers, gateway, standby electronics
STANDBY_DRAW_W = 2  # a device that's "off" still sips a little power


def typical_daily_kwh() -> float:
    """The fleet's expected daily kWh at each device's normal duty cycle — the
    shared baseline energy_history.py and energy_anomaly.py compare against."""
    total_w = BASE_LOAD_W
    for spec in DEVICES.values():
        total_w += spec["rated_power_w"] * spec["duty_cycle"]
    return (total_w * 24) / 1000

_state = {"mode": "auto", "devices": {}, "live": None, "last_tick": None}


def _now():
    return datetime.now(timezone.utc)


def _init_device(key: str, spec: dict) -> dict:
    return {
        "id": key,
        "rated_power_w": spec["rated_power_w"],
        "power_w": 0.0,
        "daily_energy_kwh": 0.0,
        "monthly_energy_kwh": round(random.uniform(20, 80), 1),  # plausible month-to-date baseline
        "running_time_seconds": 0,
        "is_on": random.random() < spec["duty_cycle"],
        "brightness_pct": 100 if key == "led_lights" else None,
        "mode": "auto",
    }


def _ensure_init():
    if not _state["devices"]:
        for key, spec in DEVICES.items():
            _state["devices"][key] = _init_device(key, spec)
    if _state["live"] is None:
        _state["live"] = {
            "voltage": 220.0,
            "current": 0.0,
            "power": 0.0,
            "energy_kwh": 0.0,
            "frequency": 50.0,
            "power_factor": 0.92,
            "system_status": "Normal",
        }
    if _state["last_tick"] is None:
        _state["last_tick"] = _now()


def _maybe_auto_toggle(rec: dict, spec: dict):
    if _state["mode"] != "auto" or rec["mode"] == "manual":
        return
    if random.random() < 0.08:
        rec["is_on"] = random.random() < spec["duty_cycle"]


def _tick(dt_hours: float):
    _ensure_init()
    total_power = BASE_LOAD_W

    for key, spec in DEVICES.items():
        rec = _state["devices"][key]
        _maybe_auto_toggle(rec, spec)

        if rec["is_on"]:
            brightness = (rec["brightness_pct"] or 100) / 100 if key == "led_lights" else 1.0
            rec["power_w"] = round(spec["rated_power_w"] * brightness * random.uniform(0.9, 1.05), 1)
            rec["running_time_seconds"] += dt_hours * 3600
        else:
            rec["power_w"] = STANDBY_DRAW_W

        rec["daily_energy_kwh"] = round(rec["daily_energy_kwh"] + (rec["power_w"] * dt_hours) / 1000, 4)
        rec["monthly_energy_kwh"] = round(rec["monthly_energy_kwh"] + (rec["power_w"] * dt_hours) / 1000, 3)
        total_power += rec["power_w"]

    live = _state["live"]
    live["voltage"] = round(220 + random.uniform(-3, 3), 1)
    live["frequency"] = round(50 + random.uniform(-0.15, 0.15), 2)

    active_inductive = sum(
        1 for k in ("main_pump", "air_pump", "cooling_fan", "water_chiller") if _state["devices"][k]["is_on"]
    )
    live["power_factor"] = round(max(0.7, 0.97 - active_inductive * 0.03 + random.uniform(-0.02, 0.02)), 2)
    live["power"] = round(total_power, 1)
    live["current"] = round(total_power / (live["voltage"] * live["power_factor"]), 2)
    live["energy_kwh"] = round(live["energy_kwh"] + (total_power * dt_hours) / 1000, 4)

    if live["power_factor"] < 0.75 or live["voltage"] < 210 or live["voltage"] > 230:
        live["system_status"] = "Critical"
    elif live["power_factor"] < 0.85:
        live["system_status"] = "Warning"
    else:
        live["system_status"] = "Normal"


def _tick_if_due():
    _ensure_init()
    now = _now()
    dt_hours = min((now - _state["last_tick"]).total_seconds() / 3600.0, 0.05)
    _state["last_tick"] = now
    _tick(dt_hours)


def get_live() -> dict:
    _tick_if_due()
    return dict(_state["live"])


def get_devices() -> list:
    _tick_if_due()
    return [dict(rec) for rec in _state["devices"].values()]


def get_device(device_id: str):
    _tick_if_due()
    rec = _state["devices"].get(device_id)
    return dict(rec) if rec else None


def get_mode() -> str:
    _ensure_init()
    return _state["mode"]


def set_global_mode(mode: str) -> str:
    if mode not in ("auto", "manual"):
        raise ValueError("mode must be 'auto' or 'manual'")
    _ensure_init()
    _state["mode"] = mode
    if mode == "auto":
        for rec in _state["devices"].values():
            rec["mode"] = "auto"
    return _state["mode"]


def control_device(device_id: str, is_on: Optional[bool] = None, brightness_pct: Optional[float] = None) -> Optional[dict]:
    _ensure_init()
    rec = _state["devices"].get(device_id)
    if rec is None:
        return None
    if is_on is not None:
        rec["is_on"] = is_on
        rec["mode"] = "manual"
    if brightness_pct is not None and device_id == "led_lights":
        rec["brightness_pct"] = max(0, min(100, brightness_pct))
        rec["mode"] = "manual"
    return dict(rec)
