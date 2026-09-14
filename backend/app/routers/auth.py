"""
Login for the dashboard's Viewer/Admin roles.

Same trust model as the existing PUMP_CONTROL_PASSWORD check in iot.py:
plain credentials compared against environment variables, no hashing, no
session store. The token returned here is not verified by any other
endpoint - it exists so the frontend has something to persist across a
page reload, not as a real authorization guard. The one action in this
app with real consequences (flipping a relay) stays independently
protected by POST /iot/control's own password check, unchanged.

Env vars (all optional, fall back to obvious placeholder defaults for
local/demo use - set real values in production):
  ADMIN_USERNAME / ADMIN_PASSWORD
  VIEWER_USERNAME / VIEWER_PASSWORD
"""

import os
import secrets

from fastapi import APIRouter, HTTPException

from ..models import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "hydro100")
    viewer_username = os.getenv("VIEWER_USERNAME", "viewer")
    viewer_password = os.getenv("VIEWER_PASSWORD", "hydro100")

    if payload.username == admin_username and payload.password == admin_password:
        role = "admin"
    elif payload.username == viewer_username and payload.password == viewer_password:
        role = "viewer"
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return LoginResponse(
        role=role,
        username=payload.username,
        token=secrets.token_urlsafe(24),
    )
