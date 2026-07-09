"""
Data access layer.

Every function here is written as if it were a repository query, so
routers/services never touch storage directly. There are two backends:

  - Local JSON files (backend/data/*.json) — the default, zero-setup path
    used for local development.
  - Supabase (Postgres) — used automatically when SUPABASE_URL and
    SUPABASE_KEY are set in the environment (see supabase_client.py and
    backend/supabase_setup/schema.sql). Each table stores one JSONB "payload"
    column per row, shaped identically to the JSON files, so switching
    backends requires no changes anywhere else in the app.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from . import supabase_client

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_json(filename: str) -> list:
    path = DATA_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_supabase_table(table_name: str) -> list:
    client = supabase_client.get_client()
    result = client.table(table_name).select("payload").execute()
    return [row["payload"] for row in result.data]


@lru_cache
def get_crops() -> list:
    if supabase_client.is_configured():
        return _load_supabase_table("crops")
    return _load_json("crops.json")


@lru_cache
def get_methods() -> list:
    if supabase_client.is_configured():
        return _load_supabase_table("methods")
    return _load_json("methods.json")


@lru_cache
def get_knowledge_base() -> list:
    if supabase_client.is_configured():
        return _load_supabase_table("knowledge_base")
    return _load_json("knowledge_base.json")


def get_crop_by_id(crop_id: str) -> Optional[dict]:
    return next((c for c in get_crops() if c["id"] == crop_id), None)


def get_method_by_id(method_id: str) -> Optional[dict]:
    return next((m for m in get_methods() if m["id"] == method_id), None)


def get_crops_for_method(method_id: str) -> list:
    return [c for c in get_crops() if method_id in c.get("suitable_methods", [])]


def get_methods_for_crop(crop_id: str) -> list:
    crop = get_crop_by_id(crop_id)
    if not crop:
        return []
    method_ids = set(crop.get("suitable_methods", []))
    return [m for m in get_methods() if m["id"] in method_ids]
