"""
Rule-based safety layer.

This runs AFTER the ML model produces a prediction and can override it.
The idea: no matter how confident a statistical model is, a sensor reading
outside these absolute physiological safety limits is dangerous for the
plant (or indicates a sensor/equipment fault) and must always be flagged
Critical — a ML misclassification here is not an acceptable failure mode
for an automated dosing/control system.

These bounds are intentionally wider than any single crop's ideal range
(see backend/data/crops.json) — they are the outer "this is not survivable"
limits, not the "this is not optimal" limits the AI Decision Engine already
enforces per crop/stage.
"""

SAFETY_LIMITS = {
    "ph": (3.0, 9.0),
    "ec": (0.0, 5.0),
    "water_temperature": (5.0, 40.0),
    "air_temperature": (5.0, 45.0),
    "humidity": (10.0, 100.0),
    "water_level": (5.0, 100.0),
    "light_intensity": (0.0, 1200.0),
}

LABEL_TO_UNIT = {
    "ph": "",
    "ec": " mS/cm",
    "water_temperature": "°C",
    "air_temperature": "°C",
    "humidity": "%",
    "water_level": "%",
    "light_intensity": " µmol/m²/s",
}


def check_safety_violations(features: dict) -> list:
    """Returns a list of human-readable safety violations, empty if none."""
    violations = []
    for param, (lo, hi) in SAFETY_LIMITS.items():
        value = features.get(param)
        if value is None:
            continue
        if value < lo or value > hi:
            unit = LABEL_TO_UNIT.get(param, "")
            violations.append(
                f"{param.replace('_', ' ')} = {value}{unit} is outside the absolute safe range "
                f"({lo}-{hi}{unit})"
            )
    return violations


def apply_safety_override(features: dict, health_status: str, risk_score: float):
    """
    Returns (health_status, risk_score, is_override, violations).
    If any hard safety limit is violated, forces Critical + a high risk score
    regardless of what the ML model predicted.
    """
    violations = check_safety_violations(features)
    if not violations:
        return health_status, risk_score, False, []
    return "Critical", max(risk_score, 90.0), True, violations
