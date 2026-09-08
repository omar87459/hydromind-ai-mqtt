latest_data = {}


def update_data(data):
    global latest_data
    latest_data = data


def get_data():
    return latest_data
