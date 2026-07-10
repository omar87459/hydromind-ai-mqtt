"""
AI Sensor Diagnostics.

Rule-based health checks over the live sensor registry
(app.services.iot_registry) — same style as ai_decision_engine.py, but for
hardware/connectivity health (battery, signal, staleness, calibration
drift) rather than crop-target ranges.
"""

from datetime import datetime, timezone

STALE_SECONDS = 30

SENSOR_LABELS = {
    "ph": "pH",
    "ec": "EC",
    "water_temp": "Water temperature",
    "air_temp": "Air temperature",
    "humidity": "Humidity",
    "water_level": "Water level",
    "light_intensity": "Light",
}


def _seconds_since(iso_ts: str) -> float:
    try:
        ts = datetime.fromisoformat(iso_ts)
    except ValueError:
        return 0.0
    return (datetime.now(timezone.utc) - ts).total_seconds()


def diagnose(sensors: list) -> list:
    issues = []
    for sensor in sensors:
        sensor_type = sensor["sensor_type"]
        label = SENSOR_LABELS.get(sensor_type, sensor_type)
        battery = sensor["battery_level"]
        signal = sensor["signal_strength"]
        elapsed = _seconds_since(sensor["last_update"])

        if sensor["connection_status"] == "offline" or elapsed > STALE_SECONDS:
            issues.append(
                {
                    "sensor_id": sensor["id"],
                    "sensor_type": sensor_type,
                    "problem": f"{label} sensor has not updated for {int(elapsed)} seconds.",
                    "severity": "critical",
                    "recommendation": "Check power and wireless connectivity for this sensor — it may need a reset or replacement.",
                    "confidence_score": 0.95,
                }
            )
            continue

        if battery < 15:
            issues.append(
                {
                    "sensor_id": sensor["id"],
                    "sensor_type": sensor_type,
                    "problem": f"{label} sensor battery is critically low ({battery:.0f}%).",
                    "severity": "critical",
                    "recommendation": "Replace or recharge the sensor battery as soon as possible.",
                    "confidence_score": 0.9,
                }
            )
        elif battery < 35:
            issues.append(
                {
                    "sensor_id": sensor["id"],
                    "sensor_type": sensor_type,
                    "problem": f"{label} sensor battery is running low ({battery:.0f}%).",
                    "severity": "warning",
                    "recommendation": "Schedule a battery replacement during the next maintenance visit.",
                    "confidence_score": 0.75,
                }
            )

        if signal < 40:
            issues.append(
                {
                    "sensor_id": sensor["id"],
                    "sensor_type": sensor_type,
                    "problem": f"{label} sensor signal is unstable ({signal:.0f}% strength).",
                    "severity": "warning",
                    "recommendation": "Move the gateway closer or check for wireless interference near this sensor.",
                    "confidence_score": 0.7,
                }
            )

        lo, hi = sensor["expected_range"]["min"], sensor["expected_range"]["max"]
        if sensor["reading"] < lo * 0.7 or sensor["reading"] > hi * 1.3:
            issues.append(
                {
                    "sensor_id": sensor["id"],
                    "sensor_type": sensor_type,
                    "problem": f"The {label.lower()} sensor appears to be drifting from expected values.",
                    "severity": "warning",
                    "recommendation": "Sensor calibration recommended — check against a reference reading.",
                    "confidence_score": 0.65,
                }
            )

    issues.sort(key=lambda i: (i["severity"] != "critical", -i["confidence_score"]))
    return issues
