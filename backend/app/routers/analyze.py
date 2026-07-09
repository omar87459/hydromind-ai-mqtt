from fastapi import APIRouter, HTTPException

from .. import data_store
from ..models import AnalyzeRequest
from ..services import ai_decision_engine, sensor_simulator

router = APIRouter(tags=["AI Decision Engine"])


@router.post("/analyze")
def analyze(payload: AnalyzeRequest):
    """
    Runs the AI Decision Engine against a sensor reading for a given
    crop and growth stage. If no reading is supplied, a fresh mock
    reading is generated so the endpoint can be demoed standalone.
    """
    crop = data_store.get_crop_by_id(payload.crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{payload.crop_id}' not found")

    if payload.stage not in crop.get("stages", {}):
        raise HTTPException(
            status_code=400,
            detail=f"Stage '{payload.stage}' not valid for crop '{payload.crop_id}'. "
            f"Valid stages: {list(crop.get('stages', {}).keys())}",
        )

    reading = payload.reading.model_dump() if payload.reading else sensor_simulator.generate_reading(
        crop, payload.stage
    )

    issues = ai_decision_engine.analyze_reading(crop, payload.stage, reading)
    statuses = ai_decision_engine.evaluate_reading(crop, payload.stage, reading)
    overall = ai_decision_engine.overall_status(statuses)

    return {
        "crop_id": crop["id"],
        "crop_name": crop["name"],
        "stage": payload.stage,
        "timestamp": sensor_simulator.now_iso(),
        "reading": reading,
        "issues": issues,
        "overall_status": overall,
    }
