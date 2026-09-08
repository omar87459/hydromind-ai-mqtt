from .services.sensor_simulator import merge_with_real_data


latest_data = {}


def update_data(data: dict):
    global latest_data

    # دمج بيانات ESP32 مع المحاكاة للحساسات الناقصة
    latest_data = merge_with_real_data(data)



def get_data():
    return latest_data
