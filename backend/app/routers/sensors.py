from typing import Optional

from fastapi import APIRouter, HTTPException

from .. import data_store
from ..services import ai_decision_engine, iot_registry, sensor_simulator

router = APIRouter(tags=["Sensors"])


@router.get("/sensor-data")
def get_sensor_data(crop_id: Optional[str] = None, stage: str = "vegetative"):
    """
    Returns one live sensor reading. Parameters a real ESP32 has reported
    (via the MQTT pipeline or POST /iot/sensors/{id}/reading) use that live
    value; any parameter without a live reading yet is simulated against
    the selected crop/stage's ideal range, same as before. This mirrors the
    hybrid behavior already implemented for GET /iot/sensors.
    """
    crop = data_store.get_crop_by_id(crop_id) if crop_id else None
    if crop_id and not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")

    reading = sensor_simulator.generate_reading(crop, stage)
    live_values = iot_registry.get_live_values()
    reading.update(live_values)

    if crop:
        statuses = ai_decision_engine.evaluate_reading(crop, stage, reading)
        overall = ai_decision_engine.overall_status(statuses)
    else:
        statuses = []
        overall = "unknown"

    return {
        "timestamp": sensor_simulator.now_iso(),
        "crop_id": crop_id,
        "stage": stage if crop else None,
        "reading": reading,
        "statuses": statuses,
        "overall_status": overall,
        "mode": iot_registry.get_mode(),
        "live_params": sorted(live_values.keys()),
    }
