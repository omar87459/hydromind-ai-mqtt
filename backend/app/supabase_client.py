"""
Lazy Supabase client factory.

If SUPABASE_URL and SUPABASE_KEY are set in the environment, data_store.py
reads/writes Supabase (Postgres) instead of the local JSON files in
backend/data/. If they're unset — the default for local development — this
returns None and data_store.py falls back to the JSON files untouched.

This keeps local `uvicorn app.main:app --reload` working with zero setup,
while making cloud deployment (Render backend + Supabase database) a matter
of setting two environment variables rather than changing code.
"""

import os
from functools import lru_cache
from typing import Optional


@lru_cache
def get_client() -> Optional["Client"]:  # noqa: F821
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        return None

    from supabase import create_client

    return create_client(url, key)


def is_configured() -> bool:
    return get_client() is not None
