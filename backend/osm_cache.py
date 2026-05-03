"""Tiny local disk cache for OSM/geo lookups.

Stores JSON blobs under backend/.osm_cache/ to reduce repeated
Overpass/OSMnx API calls. Cache failures are always silent so they
never interrupt the underwriting pipeline.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

# Cache lives next to this file (backend/.osm_cache/)
_CACHE_DIR = Path(__file__).resolve().parent / ".osm_cache"


def _key(kind: str, lat: float, lon: float, radius_m: int) -> str:
    return f"{kind}_{lat:.5f}_{lon:.5f}_{int(radius_m)}.json"


def read_osm_cache(kind: str, lat: float, lon: float, radius_m: int) -> Dict[str, Any]:
    """Return cached payload or empty dict on miss / error."""
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path = _CACHE_DIR / _key(kind, float(lat), float(lon), int(radius_m))
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_osm_cache(kind: str, lat: float, lon: float, radius_m: int, payload: Dict[str, Any]) -> None:
    """Persist payload to disk. Errors are silently swallowed."""
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path = _CACHE_DIR / _key(kind, float(lat), float(lon), int(radius_m))
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except Exception:
        return
