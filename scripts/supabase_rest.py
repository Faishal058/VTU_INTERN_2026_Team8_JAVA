"""
Lightweight REST client for Supabase PostgREST API using standard urllib.
Designed for use in headless scripts where full SDKs might be overkill.
"""

from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path
from typing import Iterable

# Path to the .env file in the root directory
ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"


def load_env() -> None:
    """Manual parser for .env files to load configuration into os.environ."""
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        # Only set if not already present to respect environment overrides
        os.environ.setdefault(key.strip(), value.strip())


def get_supabase_config() -> tuple[str, str]:
    """Retrieves URL and Key from environment, checking both standard and Next.js public keys."""
    load_env()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("Supabase configuration (URL or Key) not found in environment.")
    return url.rstrip("/"), key


def postgrest_upsert(table: str, rows: list[dict], on_conflict: str | None = None) -> None:
    """
    Performs a PostgREST UPSERT (Insert or Update on conflict).
    Matches based on the 'on_conflict' column names.
    """
    if not rows:
        return
    url, key = get_supabase_config()
    endpoint = f"{url}/rest/v1/{table}"
    
    if on_conflict:
        endpoint = f"{endpoint}?on_conflict={on_conflict}"
        
    body = json.dumps(rows).encode("utf-8")
    
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        # We read to ensure the connection is handled correctly even if we don't use the result
        response.read()


def postgrest_insert(table: str, rows: Iterable[dict]) -> None:
    """Simple POST insert to a given table."""
    payload = list(rows)
    if not payload:
        return
    url, key = get_supabase_config()
    endpoint = f"{url}/rest/v1/{table}"
    
    body = json.dumps(payload).encode("utf-8")
    
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        response.read()

