from .services import iot_registry
from .services.sensor_simulator import merge_with_real_data


latest_data = {}


def update_data(data: dict):
    global latest_data

    # دمج بيانات ESP32 مع المحاكاة للحساسات الناقصة
    latest_data = merge_with_real_data(data)

    # Feed the raw ESP32 reading into the sensor registry that GET
    # /iot/sensors actually serves, so real values take priority there too
    # and the endpoint switches out of pure simulation mode.
    iot_registry.record_esp32_data(data)



def get_data():
    return latest_data
