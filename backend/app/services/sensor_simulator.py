"""
Mock IoT sensor simulator.

Stands in for real sensor hardware in the prototype. Values are
generated mostly within the selected crop/stage's ideal ranges, with a
configurable chance of drifting outside them so the AI Monitoring
Dashboard and Decision Engine have realistic problems to detect.
"""

import random
from datetime import datetime, timezone
from typing import Optional

DEFAULT_RANGES = {
    "ph": (5.5, 6.5),
    "ec": (1.0, 2.0),
    "air_temp": (20, 26),
    "water_temp": (18, 22),
    "light_intensity": (200, 400),
    "humidity": (50, 70),
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _value_in_range(lo: float, hi: float, drift_chance: float) -> float:
    span = hi - lo if hi > lo else 1
    if random.random() < drift_chance:
        direction = random.choice([-1, 1])
        magnitude = random.uniform(0.1, 0.35) * span
        edge = lo if direction < 0 else hi
        return round(edge + direction * magnitude, 2)
    return round(random.uniform(lo, hi), 2)


def generate_reading(
  def merge_with_real_data(real_data: dict) -> dict:
    """
    Use real ESP32 values when available.
    Fill missing sensors with simulation values.
    """

    simulated = generate_reading()

    # القيم الحقيقية لها الأولوية
    simulated.update(real_data)

    # حساسات لم تصل بعد
    if "ec" not in real_data:
        simulated["ec"] = round(
            random.uniform(1.2, 2.0), 2
        )

    if "air_temp" not in real_data:
        simulated["air_temp"] = round(
            random.uniform(22, 27), 1
        )

    if "humidity" not in real_data:
        simulated["humidity"] = round(
            random.uniform(50, 70), 1
        )

    if "light_intensity" not in real_data:
        simulated["light_intensity"] = random.randint(
            300, 900
        )

    if "voltage" not in real_data:
        simulated["voltage"] = round(
            random.uniform(12.0, 13.0), 2
        )

    if "current" not in real_data:
        simulated["current"] = round(
            random.uniform(0.5, 2.5), 2
        )

    if "fan" not in real_data:
        simulated["fan"] = True

    if "nutrientPump" not in real_data:
        simulated["nutrientPump"] = False

    if "light" not in real_data:
        simulated["light"] = random.randint(
            50, 100
        )

    return simulated
