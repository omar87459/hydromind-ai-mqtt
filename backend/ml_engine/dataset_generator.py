"""
Synthetic hydroponic sensor dataset generator.

PROTOTYPE NOTE: there is no real farm sensor history available yet, so this
script bootstraps a training set by sampling plausible sensor readings across
every crop / hydroponic method / growth stage combination and labeling each
row using the same rule-based logic already powering the AI Decision Engine
(app.services.ai_decision_engine). The RandomForest models trained on this
data (see train.py) therefore start out approximating that rule engine, but
learn it as a statistical pattern over raw sensor values rather than doing
explicit per-crop range lookups at inference time.

Once real farm sensor logs (with confirmed outcomes) are available, this
generator can be swapped out for a loader that reads historical data, and
train.py can be re-run unchanged against the new CSV.

Run from the backend/ directory:
    python -m ml_engine.dataset_generator
"""

import random
import sys
from pathlib import Path

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import data_store  # noqa: E402
from app.services import ai_decision_engine  # noqa: E402

OUTPUT_PATH = Path(__file__).resolve().parent / "data" / "synthetic_dataset.csv"
SAMPLES_PER_PAIR = 500
SEVERITY_WEIGHTS = {"ideal": 0.4, "warning": 0.3, "critical": 0.3}

random.seed(42)


def _stage_ranges(crop: dict, stage: str) -> dict:
    s = crop["stages"][stage]
    return {
        "ph": (s["ph"]["min"], s["ph"]["max"]),
        "ec": (s["ec"]["min"], s["ec"]["max"]),
        "water_temp": (s["water_temp"]["min"], s["water_temp"]["max"]),
        "air_temp": (s["air_temp"]["min"], s["air_temp"]["max"]),
        "light_intensity": (s["light_intensity"]["min"], s["light_intensity"]["max"]),
        "humidity": (crop["humidity_range"]["min"], crop["humidity_range"]["max"]),
    }


def _generate_targeted_reading(crop: dict, stage: str, target_level: str) -> dict:
    """
    Generates a reading aimed at a specific severity bucket so the resulting
    dataset has balanced Ideal / Warning / Critical classes. This mirrors
    ai_decision_engine's own warning-margin logic (values just past the
    ideal range are "Warning"; further out is "Critical") but generates
    directly toward each bucket instead of relying on chance, since random
    drift alone produces very few "Warning" examples (most drift either
    lands inside the range or overshoots straight to "Critical").
    """
    ranges = _stage_ranges(crop, stage)
    reading = {}

    if target_level == "ideal":
        perturb_params = []
    elif target_level == "warning":
        perturb_params = random.sample(list(ranges.keys()), random.choice([1, 1, 2]))
    else:
        perturb_params = random.sample(list(ranges.keys()), random.choice([1, 2, 3]))

    for param, (lo, hi) in ranges.items():
        span = hi - lo if hi > lo else 1
        if param in perturb_params:
            if target_level == "warning":
                magnitude = random.uniform(0.02, 0.14) * span
            else:
                magnitude = random.uniform(0.18, 0.55) * span
            direction = random.choice([-1, 1])
            edge = lo if direction < 0 else hi
            value = edge + direction * magnitude
        else:
            value = random.uniform(lo, hi)
        reading[param] = round(value, 2)

    reading["water_level"] = round(
        random.uniform(5, 100) if target_level == "critical" else random.uniform(30, 100), 1
    )
    return reading


def _sample_stage_and_day(crop: dict):
    stage_keys = list(crop["stages"].keys())
    stage = random.choice(stage_keys)
    cycle_days = random.randint(crop["growth_cycle_days"]["min"], crop["growth_cycle_days"]["max"])
    stage_index = stage_keys.index(stage)
    quarter = cycle_days / len(stage_keys)
    day_lo = max(1, round(stage_index * quarter))
    day_hi = max(day_lo + 1, round((stage_index + 1) * quarter))
    days_after_planting = random.randint(day_lo, day_hi)
    return stage, days_after_planting


def _risk_score_for(overall_status: str, issues: list) -> float:
    if overall_status == "ideal":
        base = random.uniform(0, 15)
    elif overall_status == "warning":
        base = random.uniform(15, 55)
    else:
        base = random.uniform(55, 95)

    if issues:
        base += min(len(issues) * 3, 10)
        top_confidence = max(i["confidence_score"] for i in issues)
        base += (top_confidence - 0.5) * 10

    noise = random.gauss(0, 3)
    return round(max(0.0, min(100.0, base + noise)), 1)


def _recommended_action_for(issues: list) -> str:
    if not issues:
        return "No action needed — maintain current settings."
    return issues[0]["recommended_action"]


def _generate_row(crop: dict, method_id: str) -> dict:
    stage, days_after_planting = _sample_stage_and_day(crop)
    target_level = random.choices(
        list(SEVERITY_WEIGHTS.keys()), weights=list(SEVERITY_WEIGHTS.values())
    )[0]
    reading = _generate_targeted_reading(crop, stage, target_level)

    statuses = ai_decision_engine.evaluate_reading(crop, stage, reading)
    overall_status = ai_decision_engine.overall_status(statuses)
    issues = ai_decision_engine.analyze_reading(crop, stage, reading)

    return {
        "crop_type": crop["id"],
        "hydroponic_method": method_id,
        "growth_stage": stage,
        "ph": reading["ph"],
        "ec": reading["ec"],
        "water_temperature": reading["water_temp"],
        "air_temperature": reading["air_temp"],
        "humidity": reading["humidity"],
        "water_level": reading["water_level"],
        "light_intensity": reading["light_intensity"],
        "light_hours": crop["stages"][stage]["light_hours"],
        "days_after_planting": days_after_planting,
        "health_status": overall_status.capitalize(),
        "risk_score": _risk_score_for(overall_status, issues),
        "recommended_action": _recommended_action_for(issues),
    }


def generate_dataset() -> pd.DataFrame:
    crops = data_store.get_crops()
    rows = []
    for crop in crops:
        for method_id in crop["suitable_methods"]:
            for _ in range(SAMPLES_PER_PAIR):
                rows.append(_generate_row(crop, method_id))
    return pd.DataFrame(rows)


def main():
    df = generate_dataset()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"Generated {len(df)} synthetic samples -> {OUTPUT_PATH}")
    print("\nHealth status distribution:")
    print(df["health_status"].value_counts())
    print("\nRisk score summary:")
    print(df["risk_score"].describe())


if __name__ == "__main__":
    main()
