import os
import json
import ssl
import threading
import paho.mqtt.client as mqtt

from .mqtt_data import update_data


# ==========================
# EMQX SETTINGS
# ==========================

MQTT_HOST = os.getenv(
    "MQTT_HOST",
    "q1a7afa2.a1a.asia-southeast1.emqxsl.com"
)

MQTT_PORT = int(
    os.getenv("MQTT_PORT", 8883)
)

MQTT_USERNAME = os.getenv(
    "MQTT_USERNAME",
    "esp32"
)

MQTT_PASSWORD = os.getenv(
    "MQTT_PASSWORD",
    "omar"
)


# ==========================
# TOPIC
# ==========================

MQTT_TOPIC = "hydromind/esp32/data"


# ==========================
# CLIENT
# ==========================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="hydromind-backend"
)


# ==========================
# CONNECT
# ==========================

def on_connect(client, userdata, flags, reason_code, properties):

    if reason_code == 0:

        print("MQTT Connected to EMQX")

        client.subscribe(MQTT_TOPIC)

        print(
            "Subscribed:",
            MQTT_TOPIC
        )

    else:

        print(
            "MQTT connection failed:",
            reason_code
        )



# ==========================
# RECEIVE DATA
# ==========================

def on_message(client, userdata, msg):

    try:

        payload = msg.payload.decode()

        data = json.loads(payload)


        print("ESP32 DATA:")
        print(data)


        # حفظ آخر قراءة
        update_data(data)


    except Exception as e:

        print(
            "MQTT message error:",
            e
        )



# ==========================
# START MQTT
# ==========================

def start_mqtt():

    client.username_pw_set(
        MQTT_USERNAME,
        MQTT_PASSWORD
    )


    client.tls_set(
        tls_version=ssl.PROTOCOL_TLS_CLIENT
    )


    client.on_connect = on_connect

    client.on_message = on_message


    try:

        client.connect(
            MQTT_HOST,
            MQTT_PORT,
            60
        )


        thread = threading.Thread(
            target=client.loop_forever,
            daemon=True
        )

        thread.start()


        print(
            "MQTT service started"
        )


    except Exception as e:

        print(
            "MQTT startup error:",
            e
        )
