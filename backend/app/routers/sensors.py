from typing import Optional

from fastapi import APIRouter, HTTPException

from .. import data_store
from ..services import ai_decision_engine, sensor_simulator

router = APIRouter(tags=["Sensors"])


@router.get("/sensor-data")
def get_sensor_data(crop_id: Optional[str] = None, stage: str = "vegetative"):
    """
    Returns one simulated live sensor reading. If crop_id is supplied,
    each parameter is also evaluated against that crop's ideal range
    for the given growth stage (ideal / warning / critical).
    """
    crop = data_store.get_crop_by_id(crop_id) if crop_id else None
    if crop_id and not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")

    reading = sensor_simulator.generate_reading(crop, stage)

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
    }
