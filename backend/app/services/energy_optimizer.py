"""
AI Energy Optimization engine.

Rule-based recommendations over the live energy_registry state — same
shape (problem/recommendation/confidence) as ai_decision_engine.py and
iot_diagnostics.py. Cross-references the real crop/stage data in
data_store.py so the growth-stage-aware suggestion reflects an actual
target light-hours value rather than a fabricated one.

PROTOTYPE NOTE: expected_saving_pct and estimated_cost_saving are
illustrative heuristics (see COST_PER_KWH and the per-rule constants
below), not measured savings — there's no historical baseline to compare
against yet. Once real consumption history exists, these can be replaced
with before/after comparisons.
"""

from .. import data_store
from . import energy_registry

COST_PER_KWH = 0.12  # USD, prototype constant — swap for a real utility tariff later
ASSUMED_BASELINE_LIGHT_HOURS = 18  # what we compare a stage's target against


def _daily_cost(power_w: float, hours: float) -> float:
    kwh = (power_w * hours) / 1000
    return round(kwh * COST_PER_KWH, 2)


def generate_recommendations(crop_id: str = None, stage: str = None) -> list:
    devices = {d["id"]: d for d in energy_registry.get_devices()}
    recs = []

    lights = devices.get("led_lights")
    if lights and lights["is_on"] and crop_id:
        crop = data_store.get_crop_by_id(crop_id)
        if crop and stage in crop.get("stages", {}):
            target_hours = crop["stages"][stage]["light_hours"]
            if target_hours < ASSUMED_BASELINE_LIGHT_HOURS:
                saved_hours = ASSUMED_BASELINE_LIGHT_HOURS - target_hours
                recs.append(
                    {
                        "id": "reduce_lighting",
                        "title": "Reduce lighting duration",
                        "recommendation": (
                            f"{crop['name']} in the {stage.replace('_', ' ')} stage only needs "
                            f"{target_hours}h of light/day — running lights {saved_hours}h longer "
                            f"than the target wastes energy without benefiting growth."
                        ),
                        "expected_saving_pct": round(min(35, (saved_hours / ASSUMED_BASELINE_LIGHT_HOURS) * 100), 1),
                        "estimated_cost_saving_per_day": _daily_cost(lights["power_w"], saved_hours),
                        "confidence_score": 0.82,
                    }
                )

    high_draw_on = [d for d in devices.values() if d["is_on"] and d["power_w"] > 300]
    if len(high_draw_on) >= 2:
        total_overlap_w = sum(d["power_w"] for d in high_draw_on)
        recs.append(
            {
                "id": "stagger_pumps",
                "title": "Delay pump operation / optimize schedule",
                "recommendation": (
                    f"{len(high_draw_on)} high-draw devices are running simultaneously "
                    f"({', '.join(d['id'] for d in high_draw_on)}), pushing peak demand higher "
                    f"than necessary. Staggering their schedules reduces peak load."
                ),
                "expected_saving_pct": 12.0,
                "estimated_cost_saving_per_day": _daily_cost(total_overlap_w * 0.15, 4),
                "confidence_score": 0.7,
            }
        )

    optional = devices.get("optional_device")
    if optional and optional["is_on"]:
        recs.append(
            {
                "id": "turn_off_unused",
                "title": "Turn off unused devices",
                "recommendation": (
                    "The optional device slot is drawing power but isn't required for current "
                    "operation — turn it off when not actively in use."
                ),
                "expected_saving_pct": 4.0,
                "estimated_cost_saving_per_day": _daily_cost(optional["power_w"], 24),
                "confidence_score": 0.6,
            }
        )

    off_devices = [d for d in devices.values() if not d["is_on"]]
    standby_total_w = sum(d["power_w"] for d in off_devices)
    if len(off_devices) >= 3 and standby_total_w > 5:
        recs.append(
            {
                "id": "reduce_standby",
                "title": "Reduce standby consumption",
                "recommendation": (
                    f"{len(off_devices)} devices are drawing {standby_total_w:.1f}W combined in "
                    f"standby. A smart power strip that fully cuts power to idle devices "
                    f"eliminates this phantom load."
                ),
                "expected_saving_pct": 2.0,
                "estimated_cost_saving_per_day": _daily_cost(standby_total_w, 24),
                "confidence_score": 0.65,
            }
        )

    recs.sort(key=lambda r: -r["expected_saving_pct"])
    return recs
