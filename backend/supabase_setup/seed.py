"""
One-off script to load backend/data/*.json into Supabase.

Run this once after creating your Supabase project and running schema.sql
(see backend/supabase_setup/schema.sql), and again any time you edit the
JSON files and want to push the changes to the cloud database.

Needs the SERVICE ROLE key (not the anon key) because schema.sql only
grants public SELECT — writes must bypass Row Level Security. Find it in
Supabase: Project Settings -> API -> service_role secret. Never commit
this key or expose it to the frontend.

Usage (from the backend/ directory, with the venv active):
    SUPABASE_URL=https://xxxx.supabase.co \
    SUPABASE_SERVICE_KEY=your-service-role-key \
    python -m supabase_setup.seed

Or create backend/supabase_setup/.env (gitignored) with:
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
"""

import json
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
ENV_FILE = Path(__file__).resolve().parent / ".env"

TABLES = {
    "crops": "crops.json",
    "methods": "methods.json",
    "knowledge_base": "knowledge_base.json",
}


def _load_dotenv_if_present():
    """Minimal .env loader so this script needs no extra dependency."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def main():
    _load_dotenv_if_present()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print(
            "Missing SUPABASE_URL / SUPABASE_SERVICE_KEY. Set them as environment "
            "variables or in backend/supabase_setup/.env — see this file's docstring."
        )
        sys.exit(1)

    from supabase import create_client

    client = create_client(url, key)

    for table, filename in TABLES.items():
        path = DATA_DIR / filename
        with open(path, "r", encoding="utf-8") as f:
            records = json.load(f)

        rows = [{"id": r["id"], "payload": r} for r in records]
        client.table(table).upsert(rows).execute()
        print(f"Seeded {len(rows)} rows into '{table}' from {filename}")

    print("\nDone. Set SUPABASE_URL and SUPABASE_KEY (the anon key is fine for "
          "read-only runtime access) on your backend deployment to switch it over.")


if __name__ == "__main__":
    main()
