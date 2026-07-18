"""
Statistical (non-ML) anomaly detection over live energy metrics.

"Detect abnormal power consumption" and "predict equipment failure" are
implemented as heuristics — deviation from the fleet's expected baseline,
and excessive continuous device runtime — rather than a second trained
model, to keep scope proportionate. Mirrors the heuristic style already
used in app.services.iot_diagnostics.py for sensor health.
"""

from . import energy_registry
from .energy_optimizer import COST_PER_KWH

MAX_CONTINUOUS_RUNTIME_HOURS = 20  # a device running this long without a break flags for inspection
HIGH_COST_MULTIPLIER = 1.4  # projected daily cost this far above typical triggers an alert


def detect_abnormal_consumption(live: dict) -> list:
    typical_hourly_w = (energy_registry.typical_daily_kwh() * 1000) / 24
    alerts = []

    if live["power"] > typical_hourly_w * 1.5:
        pct_above = (live["power"] / typical_hourly_w - 1) * 100
        alerts.append(
            {
                "type": "abnormal_power",
                "message": f"Current power draw ({live['power']:.0f}W) is {pct_above:.0f}% above the typical baseline.",
                "severity": "critical" if live["power"] > typical_hourly_w * 2 else "warning",
                "confidence_score": 0.75,
            }
        )

    if live["power_factor"] < 0.8:
        alerts.append(
            {
                "type": "low_power_factor",
                "message": f"Power factor has dropped to {live['power_factor']}, indicating inefficient load — check for motor/pump wear.",
                "severity": "warning",
                "confidence_score": 0.7,
            }
        )

    if live["voltage"] < 210 or live["voltage"] > 230:
        alerts.append(
            {
                "type": "voltage_instability",
                "message": f"Voltage ({live['voltage']}V) is outside the stable 210-230V band.",
                "severity": "critical" if live["voltage"] < 200 or live["voltage"] > 240 else "warning",
                "confidence_score": 0.8,
            }
        )

    return alerts


def equipment_risk(devices: list) -> list:
    risks = []
    for d in devices:
        hours_on = d["running_time_seconds"] / 3600
        if hours_on > MAX_CONTINUOUS_RUNTIME_HOURS:
            risks.append(
                {
                    "device_id": d["id"],
                    "message": (
                        f"{d['id'].replace('_', ' ')} has been running continuously for {hours_on:.1f}h — "
                        f"extended runtime without a break increases mechanical wear risk."
                    ),
                    "severity": "warning",
                    "confidence_score": 0.65,
                }
            )
    return risks


def detect_disconnected_sensors() -> list:
    """Reuses the IoT sensor fleet's connection_status — a disconnected sensor
    also means the energy dashboard is flying blind on that reading."""
    from . import iot_registry

    alerts = []
    for sensor in iot_registry.get_sensors():
        if sensor["connection_status"] == "offline":
            alerts.append(
                {
                    "type": "sensor_disconnected",
                    "message": f"{sensor['sensor_type'].replace('_', ' ')} sensor has disconnected.",
                    "severity": "critical",
                    "confidence_score": 0.9,
                }
            )
    return alerts


def detect_high_cost(live: dict) -> list:
    typical_daily_cost = energy_registry.typical_daily_kwh() * COST_PER_KWH
    projected_daily_cost = (live["power"] * 24 / 1000) * COST_PER_KWH
    if projected_daily_cost > typical_daily_cost * HIGH_COST_MULTIPLIER:
        return [
            {
                "type": "high_energy_cost",
                "message": (
                    f"At the current draw, today's projected cost (${projected_daily_cost:.2f}) is "
                    f"well above the typical (${typical_daily_cost:.2f})."
                ),
                "severity": "warning",
                "confidence_score": 0.7,
            }
        ]
    return []
