from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from ..models import EnergyDeviceControlRequest, EnergyModeRequest
from ..services import energy_anomaly, energy_history, energy_optimizer, energy_registry, energy_reports
from ml_engine import energy_predict

router = APIRouter(prefix="/energy", tags=["Energy Dashboard"])

REPORT_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@router.get("/live")
def get_live():
    """Real-time electrical metrics: voltage, current, power, energy, frequency, power factor, status."""
    return energy_registry.get_live()


@router.get("/devices")
def get_devices():
    return {"mode": energy_registry.get_mode(), "devices": energy_registry.get_devices()}


@router.get("/mode")
def get_mode():
    return {"mode": energy_registry.get_mode()}


@router.post("/mode")
def set_mode(payload: EnergyModeRequest):
    try:
        mode = energy_registry.set_global_mode(payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"mode": mode}


@router.post("/devices/{device_id}/control")
def control_device(device_id: str, payload: EnergyDeviceControlRequest):
    """Turn a device on/off, or (for led_lights) set brightness — switches that device to manual mode."""
    record = energy_registry.control_device(device_id, is_on=payload.is_on, brightness_pct=payload.brightness_pct)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Unknown device '{device_id}'")
    return record


@router.get("/recommendations")
def get_recommendations(crop_id: Optional[str] = None, stage: Optional[str] = None):
    return {"recommendations": energy_optimizer.generate_recommendations(crop_id=crop_id, stage=stage)}


@router.get("/summary")
def get_summary():
    return energy_history.get_summary()


@router.get("/history")
def get_history(
    granularity: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    start: str = Query(...),
    end: str = Query(...),
):
    try:
        return {"granularity": granularity, "series": energy_history.get_series(granularity, start, end)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/history/devices")
def get_history_devices(start: str = Query(...), end: str = Query(...)):
    try:
        return {"comparison": energy_history.get_device_comparison(start, end)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/history/peak-hours")
def get_history_peak_hours(date: str = Query(...)):
    try:
        return {"date": date, "hours": energy_history.get_peak_hours(date)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/predictions")
def get_predictions(growth_stage: str = "vegetative"):
    """
    Bundles the ML next-day/next-week forecast with the statistical
    anomaly and equipment-risk checks — one call covers the full
    'AI Prediction' section.
    """
    now = datetime.now()
    devices = energy_registry.get_devices()
    active_fraction = sum(1 for d in devices if d["is_on"]) / max(len(devices), 1)
    outdoor_temp = 38.0 if now.month in (5, 6, 7, 8, 9) else 22.0

    features = {
        "day_of_week": now.weekday(),
        "month": now.month,
        "growth_stage": growth_stage,
        "active_devices_fraction": round(active_fraction, 3),
        "outdoor_temp_proxy": outdoor_temp,
    }

    try:
        next_day = energy_predict.predict_next_day(features)
        next_week = energy_predict.predict_next_week(features)
    except energy_predict.EnergyModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    live = energy_registry.get_live()
    return {
        "next_day": next_day,
        "next_week": next_week,
        "anomalies": energy_anomaly.detect_abnormal_consumption(live),
        "equipment_risks": energy_anomaly.equipment_risk(devices),
        "features_used": features,
    }


@router.get("/model-info")
def get_model_info():
    try:
        return energy_predict.get_metadata()
    except energy_predict.EnergyModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/alerts")
def get_alerts():
    """Smart Alerts — unusual power, long pump runtime, low power factor, unstable voltage,
    disconnected sensors, and high projected energy cost, merged into one feed."""
    live = energy_registry.get_live()
    devices = energy_registry.get_devices()

    alerts = (
        energy_anomaly.detect_abnormal_consumption(live)
        + energy_anomaly.detect_high_cost(live)
        + energy_anomaly.detect_disconnected_sensors()
    )
    equipment_risks = energy_anomaly.equipment_risk(devices)

    alerts.sort(key=lambda a: (a["severity"] != "critical", -a["confidence_score"]))
    return {"alerts": alerts, "equipment_risks": equipment_risks}


@router.get("/reports/{report_type}")
def get_report(report_type: str, format: str = Query("pdf", pattern="^(pdf|xlsx)$")):
    if report_type not in energy_reports.REPORT_TITLES:
        raise HTTPException(status_code=404, detail=f"Unknown report type '{report_type}'")

    if format == "pdf":
        content = energy_reports.build_pdf(report_type)
        filename = f"hydromind-{report_type}-report.pdf"
    else:
        content = energy_reports.build_xlsx(report_type)
        filename = f"hydromind-{report_type}-report.xlsx"

    return Response(
        content=content,
        media_type=REPORT_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
