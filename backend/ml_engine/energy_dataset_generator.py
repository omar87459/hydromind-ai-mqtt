"""
Synthetic energy-consumption dataset generator.

Bootstraps a training set for the next-day kWh forecast model the same way
dataset_generator.py bootstraps the crop health/risk models: each row is a
synthetic "day" with plausible features, labeled by a formula built from
the real device wattages in app.services.energy_registry.DEVICES and the
real per-stage light_hours in backend/data/crops.json — so the model
learns genuine structure (weekday vs weekend, growth stage, season) rather
than pure noise.

Run from the backend/ directory:
    python -m ml_engine.energy_dataset_generator
"""

import random
import sys
from pathlib import Path

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import data_store  # noqa: E402
from app.services import energy_registry  # noqa: E402

OUTPUT_PATH = Path(__file__).resolve().parent / "data" / "energy_dataset.csv"
NUM_SAMPLES = 4000
SUMMER_MONTHS = (5, 6, 7, 8, 9)

random.seed(7)


def _base_device_kwh(active_fraction: float) -> float:
    total_w = energy_registry.BASE_LOAD_W
    for spec in energy_registry.DEVICES.values():
        total_w += spec["rated_power_w"] * spec["duty_cycle"] * active_fraction
    return (total_w * 24) / 1000


def _generate_row(crops: list) -> dict:
    day_of_week = random.randint(0, 6)
    month = random.randint(1, 12)
    crop = random.choice(crops)
    stage = random.choice(list(crop["stages"].keys()))
    stage_data = crop["stages"][stage]

    outdoor_temp = random.uniform(28, 45) if month in SUMMER_MONTHS else random.uniform(15, 28)
    active_fraction = random.uniform(0.75, 1.15)
    weekday_factor = 0.88 if day_of_week >= 5 else 1.0

    base_kwh = _base_device_kwh(active_fraction) * weekday_factor

    led_spec = energy_registry.DEVICES["led_lights"]
    led_share_kwh = (led_spec["rated_power_w"] * led_spec["duty_cycle"] * 24) / 1000
    lighting_scale = stage_data["light_hours"] / 18
    lighting_adjustment = led_share_kwh * (lighting_scale - 1)

    cooling_load_kwh = max(0.0, outdoor_temp - 30) * 0.35

    noise = random.gauss(0, base_kwh * 0.05)
    total_kwh = max(5.0, base_kwh + lighting_adjustment + cooling_load_kwh + noise)

    return {
        "day_of_week": day_of_week,
        "month": month,
        "growth_stage": stage,
        "active_devices_fraction": round(active_fraction, 3),
        "outdoor_temp_proxy": round(outdoor_temp, 1),
        "total_kwh": round(total_kwh, 2),
    }


def generate_dataset() -> pd.DataFrame:
    crops = data_store.get_crops()
    rows = [_generate_row(crops) for _ in range(NUM_SAMPLES)]
    return pd.DataFrame(rows)


def main():
    df = generate_dataset()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Generated {len(df)} synthetic energy samples -> {OUTPUT_PATH}")
    print(df["total_kwh"].describe())


if __name__ == "__main__":
    main()
