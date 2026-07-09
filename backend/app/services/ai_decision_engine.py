"""
AI Decision Engine.

Rule-based logic that compares live sensor readings against a crop's
ideal ranges for its current growth stage, and produces actionable
recommendations. This stands in for a trained ML model in the
prototype — the function signatures here (evaluate_reading /
analyze_reading) are what a future model-backed implementation would
need to preserve so the API layer doesn't have to change.
"""

from typing import Optional

PARAMETER_META = {
    "ph": {"label": "pH", "unit": ""},
    "ec": {"label": "EC", "unit": "mS/cm"},
    "water_temp": {"label": "Water Temperature", "unit": "°C"},
    "air_temp": {"label": "Air Temperature", "unit": "°C"},
    "humidity": {"label": "Humidity", "unit": "%"},
    "light_intensity": {"label": "Light Intensity", "unit": "µmol/m²/s"},
}

# How far outside the ideal range counts as "warning" vs escalating to "critical"
WARNING_MARGIN_RATIO = 0.15


def _mid(lo: float, hi: float) -> float:
    return round((lo + hi) / 2, 2)


def _ph_high(lo, hi, unit, value):
    return (
        f"pH is above the ideal range ({value} vs {lo}-{hi}).",
        f"Activate the pH-down dosing pump gradually until it reaches {_mid(lo, hi)}.",
        "Activate pH-down dosing pump (short pulses, re-check after 10 minutes)",
    )


def _ph_low(lo, hi, unit, value):
    return (
        f"pH is below the ideal range ({value} vs {lo}-{hi}).",
        f"Activate the pH-up dosing pump gradually until it reaches {_mid(lo, hi)}.",
        "Activate pH-up dosing pump (short pulses, re-check after 10 minutes)",
    )


def _ec_high(lo, hi, unit, value):
    return (
        f"EC is above the ideal range ({value} vs {lo}-{hi} {unit}), indicating excess nutrient concentration.",
        f"Dilute the reservoir with fresh pH-balanced water until EC returns to approximately {_mid(lo, hi)} {unit}.",
        "Open freshwater dilution valve until EC returns to range",
    )


def _ec_low(lo, hi, unit, value):
    return (
        f"EC is below the ideal range ({value} vs {lo}-{hi} {unit}), indicating insufficient nutrients.",
        f"Dose concentrated nutrient solution (A+B) gradually until EC reaches approximately {_mid(lo, hi)} {unit}.",
        "Activate nutrient dosing pump (A+B) in small increments",
    )


def _water_temp_high(lo, hi, unit, value):
    return (
        f"Water temperature is above the ideal range ({value}{unit} vs {lo}-{hi}{unit}), risking low dissolved oxygen and root disease.",
        f"Activate water cooling until it drops to approximately {_mid(lo, hi)}{unit}.",
        "Activate reservoir chiller / increase aeration",
    )


def _water_temp_low(lo, hi, unit, value):
    return (
        f"Water temperature is below the ideal range ({value}{unit} vs {lo}-{hi}{unit}), slowing nutrient uptake.",
        f"Activate the reservoir heater until it rises to approximately {_mid(lo, hi)}{unit}.",
        "Activate reservoir heater",
    )


def _air_temp_high(lo, hi, unit, value):
    return (
        f"Air temperature is above the ideal range ({value}{unit} vs {lo}-{hi}{unit}).",
        "Activate cooling fans and increase ventilation.",
        "Turn on cooling fan / exhaust ventilation",
    )


def _air_temp_low(lo, hi, unit, value):
    return (
        f"Air temperature is below the ideal range ({value}{unit} vs {lo}-{hi}{unit}).",
        "Reduce ventilation and consider supplemental heating.",
        "Reduce ventilation / activate heater",
    )


def _humidity_high(lo, hi, unit, value):
    return (
        f"Humidity is above the ideal range ({value}{unit} vs {lo}-{hi}{unit}), increasing disease risk.",
        "Increase ventilation to lower moisture levels.",
        "Turn on exhaust fan / dehumidifier",
    )


def _humidity_low(lo, hi, unit, value):
    return (
        f"Humidity is below the ideal range ({value}{unit} vs {lo}-{hi}{unit}), increasing plant water stress.",
        "Activate misting or reduce ventilation.",
        "Activate misting system",
    )


def _light_intensity_high(lo, hi, unit, value):
    return (
        f"Light intensity is above the ideal range ({value} vs {lo}-{hi} {unit}), risking leaf bleaching or heat stress.",
        "Raise light fixtures or dim output.",
        "Dim grow lights / raise light height",
    )


def _light_intensity_low(lo, hi, unit, value):
    return (
        f"Light intensity is below the ideal range ({value} vs {lo}-{hi} {unit}), which will slow photosynthesis and growth.",
        "Increase grow light output or duration.",
        "Increase grow light intensity",
    )


RECOMMENDATION_HANDLERS = {
    "ph_high": _ph_high,
    "ph_low": _ph_low,
    "ec_high": _ec_high,
    "ec_low": _ec_low,
    "water_temp_high": _water_temp_high,
    "water_temp_low": _water_temp_low,
    "air_temp_high": _air_temp_high,
    "air_temp_low": _air_temp_low,
    "humidity_high": _humidity_high,
    "humidity_low": _humidity_low,
    "light_intensity_high": _light_intensity_high,
    "light_intensity_low": _light_intensity_low,
}


def evaluate_parameter_status(value: float, lo: float, hi: float) -> str:
    """Classify a single value against an ideal range as ideal/warning/critical."""
    if lo <= value <= hi:
        return "ideal"
    span = max(hi - lo, 0.0001)
    margin = span * WARNING_MARGIN_RATIO
    if lo - margin <= value <= hi + margin:
        return "warning"
    return "critical"


def _confidence_score(value: float, lo: float, hi: float, status: str) -> float:
    """Heuristic confidence: the further outside range, the more confident there IS a problem."""
    if status == "ideal":
        return 0.5
    span = max(hi - lo, 0.0001)
    distance = min(abs(value - lo), abs(value - hi))
    ratio = min(distance / span, 1.5)
    base = 0.7 if status == "warning" else 0.9
    return round(min(base + ratio * 0.15, 0.99), 2)


def _stage_ranges(crop: dict, stage: str) -> dict:
    stages = crop.get("stages", {})
    stage_data = stages.get(stage) or next(iter(stages.values()))
    return {
        "ph": (stage_data["ph"]["min"], stage_data["ph"]["max"]),
        "ec": (stage_data["ec"]["min"], stage_data["ec"]["max"]),
        "water_temp": (stage_data["water_temp"]["min"], stage_data["water_temp"]["max"]),
        "air_temp": (stage_data["air_temp"]["min"], stage_data["air_temp"]["max"]),
        "light_intensity": (
            stage_data["light_intensity"]["min"],
            stage_data["light_intensity"]["max"],
        ),
        "humidity": (crop["humidity_range"]["min"], crop["humidity_range"]["max"]),
    }


def evaluate_reading(crop: dict, stage: str, reading: dict) -> list:
    """Per-parameter status list against ideal ranges — powers the live dashboard."""
    ranges = _stage_ranges(crop, stage)
    statuses = []
    for param, (lo, hi) in ranges.items():
        value = reading.get(param)
        if value is None:
            continue
        status = evaluate_parameter_status(value, lo, hi)
        meta = PARAMETER_META.get(param, {"label": param, "unit": ""})
        statuses.append(
            {
                "parameter": param,
                "label": meta["label"],
                "value": value,
                "unit": meta["unit"],
                "ideal_min": lo,
                "ideal_max": hi,
                "status": status,
            }
        )
    return statuses


def analyze_reading(crop: dict, stage: str, reading: dict) -> list:
    """Full AI decision engine: statuses -> concrete issues with recommendations."""
    ranges = _stage_ranges(crop, stage)
    issues = []
    for param, (lo, hi) in ranges.items():
        value = reading.get(param)
        if value is None:
            continue
        status = evaluate_parameter_status(value, lo, hi)
        if status == "ideal":
            continue
        direction = "high" if value > hi else "low"
        handler = RECOMMENDATION_HANDLERS.get(f"{param}_{direction}")
        if not handler:
            continue
        meta = PARAMETER_META.get(param, {"label": param, "unit": ""})
        problem_text, action_text, auto_action = handler(lo, hi, meta["unit"], value)
        confidence = _confidence_score(value, lo, hi, status)
        issues.append(
            {
                "parameter": param,
                "problem_detected": problem_text,
                "severity": status,
                "recommended_action": action_text,
                "automatic_action_suggestion": auto_action,
                "confidence_score": confidence,
            }
        )
    issues.sort(key=lambda i: (i["severity"] != "critical", -i["confidence_score"]))
    return issues


def overall_status(statuses: list) -> str:
    severities = [s["status"] for s in statuses]
    if "critical" in severities:
        return "critical"
    if "warning" in severities:
        return "warning"
    return "ideal"
