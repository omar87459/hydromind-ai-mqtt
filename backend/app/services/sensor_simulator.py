"""
Mock IoT sensor simulator.

Stands in for real sensor hardware in the prototype. Values are
generated mostly within the selected crop/stage's ideal ranges, with a
configurable chance of drifting outside them so the AI Monitoring
Dashboard and Decision Engine have realistic problems to detect.

When ESP32 hardware is connected:
- Real sensor values override simulation values.
- Missing sensors are filled automatically with simulated values.
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



def _value_in_range(
    lo: float,
    hi: float,
    drift_chance: float
) -> float:

    span = hi - lo if hi > lo else 1

    if random.random() < drift_chance:

        direction = random.choice([-1, 1])

        magnitude = random.uniform(
            0.1,
            0.35
        ) * span

        edge = lo if direction < 0 else hi

        return round(
            edge + direction * magnitude,
            2
        )

    return round(
        random.uniform(lo, hi),
        2
    )



def generate_reading(
    crop: Optional[dict] = None,
    stage: Optional[str] = None,
    drift_chance: float = 0.25
) -> dict:


    if crop and stage and stage in crop.get("stages", {}):

        s = crop["stages"][stage]

        ranges = {

            "ph": (
                s["ph"]["min"],
                s["ph"]["max"]
            ),

            "ec": (
                s["ec"]["min"],
                s["ec"]["max"]
            ),

            "air_temp": (
                s["air_temp"]["min"],
                s["air_temp"]["max"]
            ),

            "water_temp": (
                s["water_temp"]["min"],
                s["water_temp"]["max"]
            ),

            "light_intensity": (
                s["light_intensity"]["min"],
                s["light_intensity"]["max"]
            ),

            "humidity": (
                crop["humidity_range"]["min"],
                crop["humidity_range"]["max"]
            ),
        }

    else:

        ranges = DEFAULT_RANGES



    return {

        "ph": _value_in_range(
            *ranges["ph"],
            drift_chance
        ),

        "ec": _value_in_range(
            *ranges["ec"],
            drift_chance
        ),

        "water_temp": _value_in_range(
            *ranges["water_temp"],
            drift_chance
        ),

        "air_temp": _value_in_range(
            *ranges["air_temp"],
            drift_chance
        ),

        "humidity": _value_in_range(
            *ranges["humidity"],
            drift_chance
        ),

        "water_level": round(
            random.uniform(55, 100),
            1
        ),

        "light_intensity": _value_in_range(
            *ranges["light_intensity"],
            drift_chance
        ),
    }



def merge_with_real_data(
    real_data: dict
) -> dict:

    """
    Merge ESP32 real readings with simulated missing sensors.
    Real values always have priority.
    """


    simulated = generate_reading()


    # ESP32 values override simulation
    simulated.update(real_data)



    # EC sensor (not installed yet)
    if "ec" not in real_data:

        simulated["ec"] = round(
            random.uniform(1.2, 2.0),
            2
        )



    # Air temperature sensor
    if "air_temp" not in real_data:

        simulated["air_temp"] = round(
            random.uniform(22, 27),
            1
        )



    # Humidity sensor
    if "humidity" not in real_data:

        simulated["humidity"] = round(
            random.uniform(50, 70),
            1
        )



    # BH1750 light sensor
    if "light_intensity" not in real_data:

        simulated["light_intensity"] = random.randint(
            300,
            900
        )



    # INA226 power monitor
    if "voltage" not in real_data:

        simulated["voltage"] = round(
            random.uniform(12.0, 13.0),
            2
        )


    if "current" not in real_data:

        simulated["current"] = round(
            random.uniform(0.5, 3.0),
            2
        )



    # Actuators simulation
    if "fan" not in real_data:

        simulated["fan"] = True


    if "nutrientPump" not in real_data:

        simulated["nutrientPump"] = False


    if "light" not in real_data:

        simulated["light"] = random.randint(
            50,
            100
        )



    return simulated
