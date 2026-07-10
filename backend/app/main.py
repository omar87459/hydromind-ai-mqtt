import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import analyze, assistant, crops, iot, methods, ml, rag, sensors

app = FastAPI(
    title="HydroMind AI API",
    description="Backend for the HydroMind AI smart hydroponic farm management platform.",
    version="0.1.0",
)

# Local dev: wide open (no CORS_ORIGINS set). Production (Render): set
# CORS_ORIGINS to a comma-separated list of allowed origins, e.g. the
# deployed Vercel URL — https://your-app.vercel.app
_cors_origins_env = os.environ.get("CORS_ORIGINS")
if _cors_origins_env:
    _allow_origins = [origin.strip() for origin in _cors_origins_env.split(",")]
    _allow_credentials = True
else:
    # A literal wildcard origin is incompatible with allow_credentials=True
    # per the CORS spec — this app doesn't use cookies/session auth, so
    # that's fine for the local-dev default.
    _allow_origins = ["*"]
    _allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crops.router)
app.include_router(methods.router)
app.include_router(sensors.router)
app.include_router(analyze.router)
app.include_router(assistant.router)
app.include_router(ml.router)
app.include_router(rag.router)
app.include_router(iot.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "HydroMind AI API"}
