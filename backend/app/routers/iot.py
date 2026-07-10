from fastapi import APIRouter, HTTPException

from ..models import IoTModeRequest, IoTReadingRequest
from ..services import iot_diagnostics, iot_registry

router = APIRouter(prefix="/iot", tags=["IoT Sensor Connectivity"])


@router.get("/sensors")
def get_sensors():
    """Live status for every simulated (or real, once connected) sensor device."""
    return {"mode": iot_registry.get_mode(), "sensors": iot_registry.get_sensors()}


@router.get("/network-status")
def get_network_status():
    """Live status for each layer of the sensors → ESP32 → gateway → cloud pipeline."""
    return {"mode": iot_registry.get_mode(), "nodes": iot_registry.get_network_status()}


@router.get("/diagnostics")
def get_diagnostics():
    """AI-generated diagnostics over current sensor health (battery, signal, staleness, drift)."""
    sensors = iot_registry.get_sensors()
    return {"issues": iot_diagnostics.diagnose(sensors)}


@router.get("/mode")
def get_mode():
    return {"mode": iot_registry.get_mode()}


@router.post("/mode")
def set_mode(payload: IoTModeRequest):
    try:
        mode = iot_registry.set_mode(payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"mode": mode}


@router.post("/sensors/{sensor_id}/reading")
def post_sensor_reading(sensor_id: str, payload: IoTReadingRequest):
    """
    The real-hardware integration point: a real ESP32 (or any REST-capable
    device) posts its reading here. This updates the exact same registry
    record that GET /iot/sensors reads, so the frontend needs zero changes
    when a simulated sensor is replaced by a real one. sensor_id is the
    sensor type (ph, ec, water_temp, air_temp, humidity, water_level,
    light_intensity) — matching the keys in iot_registry.SENSOR_DEFS.
    """
    record = iot_registry.record_live_reading(
        sensor_id,
        value=payload.value,
        unit=payload.unit,
        battery_level=payload.battery_level,
        signal_strength=payload.signal_strength,
    )
    if record is None:
        raise HTTPException(status_code=404, detail=f"Unknown sensor '{sensor_id}'")
    return record
