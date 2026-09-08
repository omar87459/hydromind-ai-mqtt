import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .mqtt_client import start_mqtt

from .routers import analyze, assistant, crops, energy, iot, methods, ml, rag, sensors


app = FastAPI(
    title="HydroMind AI API",
    description="Backend for the HydroMind AI smart hydroponic farm management platform.",
    version="0.1.0",
)


_cors_origins_env = os.environ.get("CORS_ORIGINS")

if _cors_origins_env:
    _allow_origins = [
        origin.strip()
        for origin in _cors_origins_env.split(",")
    ]
    _allow_credentials = True
else:
    _allow_origins = ["*"]
    _allow_credentials = False


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Start MQTT connection with EMQX when backend starts
@app.on_event("startup")
def startup_event():
    start_mqtt()


# Existing API routers
app.include_router(crops.router)
app.include_router(methods.router)
app.include_router(sensors.router)
app.include_router(analyze.router)
app.include_router(assistant.router)
app.include_router(ml.router)
app.include_router(rag.router)
app.include_router(iot.router)
app.include_router(energy.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": "HydroMind AI API"
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok"
    }
