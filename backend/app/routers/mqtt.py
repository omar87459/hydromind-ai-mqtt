from fastapi import APIRouter
from ..mqtt_data import get_data

router = APIRouter()


@router.get("/mqtt/data")
def mqtt_data():

    return get_data()
