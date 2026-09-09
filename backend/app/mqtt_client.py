import os
import json
import ssl
import threading
import paho.mqtt.client as mqtt

from .mqtt_data import update_data


# EMQX settings

MQTT_HOST = os.getenv(
    "MQTT_HOST",
    "q1a7afa2.ala.asia-southeast1.emqxsl.com"
)


MQTT_PORT = int(
    os.getenv(
        "MQTT_PORT",
        8883
    )
)


MQTT_USERNAME = os.getenv(
    "MQTT_USERNAME",
    "esp32"
)


MQTT_PASSWORD = os.getenv(
    "MQTT_PASSWORD",
    "omar"
)



# ESP32 topic

MQTT_TOPIC = "hydromind/esp32/data"



client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="hydromind-backend"
)



def on_connect(
    client,
    userdata,
    flags,
    reason_code,
    properties
):

    if reason_code == 0:

        print(
            "MQTT Connected to EMQX"
        )


        client.subscribe(
            MQTT_TOPIC
        )


        print(
            f"Subscribed to topic: {MQTT_TOPIC}"
        )


    else:

        print(
            "MQTT connection failed:",
            reason_code
        )




def on_message(
    client,
    userdata,
    msg
):

    try:

        # Raw message from ESP32

        payload = msg.payload.decode(
            "utf-8"
        )


        print(
            "RAW MQTT:"
        )

        print(
            payload
        )



        # Convert JSON

        data = json.loads(
            payload
        )


        print(
            "JSON DATA:"
        )

        print(
            data
        )



        # Send to data store

        update_data(
            data
        )


    except json.JSONDecodeError as e:

        print(
            "JSON decode error:",
            e
        )


    except Exception as e:

        print(
            "MQTT message error:",
            e
        )




def start_mqtt():

    client.username_pw_set(
        MQTT_USERNAME,
        MQTT_PASSWORD
    )


    # TLS for EMQX Cloud

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
