import os

from fastapi import APIRouter, HTTPException

from .. import mqtt_client
from ..models import IoTModeRequest, IoTReadingRequest, PumpControlRequest
from ..services import iot_diagnostics, iot_registry, pump_registry


router = APIRouter(
    prefix="/iot",
    tags=["IoT Sensor Connectivity"]
)


@router.get("/sensors")
def get_sensors():
    """Live status for every simulated (or real, once connected) sensor device."""
    return {
        "mode": iot_registry.get_mode(),
        "sensors": iot_registry.get_sensors()
    }


@router.get("/network-status")
def get_network_status():
    """Live status for each layer of the sensors → ESP32 → gateway → cloud pipeline."""
    return {
        "mode": iot_registry.get_mode(),
        "nodes": iot_registry.get_network_status()
    }


@router.get("/diagnostics")
def get_diagnostics():
    """AI-generated diagnostics over current sensor health."""
    sensors = iot_registry.get_sensors()

    return {
        "issues": iot_diagnostics.diagnose(sensors)
    }


@router.get("/mode")
def get_mode():
    return {
        "mode": iot_registry.get_mode()
    }


@router.post("/mode")
def set_mode(payload: IoTModeRequest):
    try:
        mode = iot_registry.set_mode(payload.mode)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    return {
        "mode": mode
    }


@router.post("/sensors/{sensor_id}/reading")
def post_sensor_reading(
    sensor_id: str,
    payload: IoTReadingRequest
):
    record = iot_registry.record_live_reading(
        sensor_id,
        value=payload.value,
        unit=payload.unit,
        battery_level=payload.battery_level,
        signal_strength=payload.signal_strength,
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown sensor '{sensor_id}'"
        )

    return record


@router.get("/pumps")
def get_pumps():
    """
    Current pump states.

    Main Pump: GPIO23
    pH Pump: GPIO22
    """
    return {
        "pumps": pump_registry.get_pumps()
    }


@router.post("/control")

def post_control(
    payload: PumpControlRequest
):

def post_control(payload: PumpControlRequest):


    """
    Pump control with password protection.
    """

    correct_password = os.getenv(
        "PUMP_CONTROL_PASSWORD",
        "hydro100"
    )

    if payload.password != correct_password:
        raise HTTPException(
            status_code=403,
            detail="Wrong password"
        )


    try:
        record = pump_registry.set_command(
            payload.pump,
            payload.state
        )
<<<<<<< HEAD

=======
>>>>>>> 604251e (Add pump password protection)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )


    mqtt_client.publish_pump_command(
        payload.pump,
        payload.state
    )


    return record
