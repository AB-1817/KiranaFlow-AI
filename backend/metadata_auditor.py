"""EXIF metadata auditor for KiranaFlow AI backend.

Migrated from kirana_proto. Extracts GPS coordinates and timestamps from
image EXIF data and compares them against user-declared coordinates to
detect location spoofing attempts.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS

logger = logging.getLogger("kiranaflow.metadata_auditor")


# ── EXIF helpers ──────────────────────────────────────────────────────────────

def _to_float(rational_value: Any) -> float:
    """Convert EXIF rational/tuple values to float safely."""
    if hasattr(rational_value, "numerator") and hasattr(rational_value, "denominator"):
        return float(rational_value.numerator) / float(rational_value.denominator)
    if isinstance(rational_value, tuple) and len(rational_value) == 2 and rational_value[1] != 0:
        return float(rational_value[0]) / float(rational_value[1])
    return float(rational_value)


def _dms_to_decimal(dms: Any, ref: str) -> float:
    """Convert DMS EXIF GPS tuple to decimal degrees."""
    degrees = _to_float(dms[0])
    minutes = _to_float(dms[1])
    seconds = _to_float(dms[2])
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def _extract_exif(image_path: str) -> Dict[str, Any]:
    """Extract all EXIF tags from an image file."""
    try:
        with Image.open(image_path) as image:
            raw_exif = image.getexif()
        if not raw_exif:
            return {}
        return {TAGS.get(tag_id, tag_id): value for tag_id, value in raw_exif.items()}
    except Exception as e:
        logger.debug(f"EXIF extraction failed for {image_path}: {e}")
        return {}


def _extract_gps_coords(exif_data: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    """Return (lat, lon) decimal degrees from EXIF GPSInfo, or None."""
    gps_raw = exif_data.get("GPSInfo")
    if not gps_raw:
        return None

    gps_data = {GPSTAGS.get(k, k): v for k, v in gps_raw.items()}

    required = ("GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef")
    if not all(f in gps_data for f in required):
        return None

    try:
        lat = _dms_to_decimal(gps_data["GPSLatitude"], gps_data["GPSLatitudeRef"])
        lon = _dms_to_decimal(gps_data["GPSLongitude"], gps_data["GPSLongitudeRef"])
        return lat, lon
    except Exception:
        return None


def _extract_timestamp(exif_data: Dict[str, Any]) -> Optional[str]:
    """Return image capture timestamp in ISO format, or None."""
    timestamp = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
    if not timestamp:
        return None
    try:
        parsed = datetime.strptime(str(timestamp), "%Y:%m:%d %H:%M:%S")
        return parsed.isoformat(sep=" ")
    except ValueError:
        return str(timestamp)


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Haversine distance in meters between two GPS points."""
    R = 6_371_000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Public API ────────────────────────────────────────────────────────────────

def verify_location(
    image_path: str,
    declared_lat: float,
    declared_lon: float,
) -> Dict[str, Any]:
    """Compare image EXIF GPS against user-declared coordinates.

    Fraud logic:
    - Distance > 500m  → location_spoofing_attempt (confidence 0.2)
    - No EXIF GPS      → metadata_stripped_suspicious (soft warning)

    Returns:
        {
            "timestamp": str | None,
            "image_lat": float | None,
            "image_lon": float | None,
            "distance_meters": float | None,
            "flags": list[str],
            "confidence": float,  # 1.0 = clear, 0.2 = spoofing detected
        }
    """
    exif_data = _extract_exif(image_path)
    image_coords = _extract_gps_coords(exif_data)
    timestamp = _extract_timestamp(exif_data)

    result: Dict[str, Any] = {
        "timestamp": timestamp,
        "image_lat": None,
        "image_lon": None,
        "distance_meters": None,
        "flags": [],
        "confidence": 1.0,
    }

    if image_coords is None:
        result["flags"].append("metadata_stripped_suspicious")
        return result

    image_lat, image_lon = image_coords
    distance = _haversine_distance_meters(image_lat, image_lon, declared_lat, declared_lon)

    result["image_lat"] = image_lat
    result["image_lon"] = image_lon
    result["distance_meters"] = distance

    if distance > 500:
        result["flags"].append("location_spoofing_attempt")
        result["confidence"] = 0.2

    return result


def audit_image_batch(
    image_paths: List[str],
    declared_lat: Optional[float],
    declared_lon: Optional[float],
) -> Dict[str, Any]:
    """Run location verification across all uploaded store images.

    If no coordinates declared, returns a soft warning only.

    Returns:
        {
            "results": list[dict],     # per-image verify_location output
            "overall_confidence": float,
            "flags": list[str],        # consolidated unique flags
        }
    """
    if declared_lat is None or declared_lon is None:
        return {
            "results": [],
            "overall_confidence": 0.9,
            "flags": ["no_gps_provided"],
        }

    results = []
    all_flags: List[str] = []
    min_confidence = 1.0

    for path in image_paths:
        try:
            r = verify_location(path, declared_lat, declared_lon)
        except Exception as e:
            logger.warning(f"audit_image_batch error on {path}: {e}")
            r = {
                "timestamp": None,
                "image_lat": None,
                "image_lon": None,
                "distance_meters": None,
                "flags": ["exif_read_failed"],
                "confidence": 0.9,
            }
        results.append(r)
        all_flags.extend(r.get("flags", []))
        min_confidence = min(min_confidence, r.get("confidence", 1.0))

    return {
        "results": results,
        "overall_confidence": min_confidence,
        "flags": list(set(all_flags)),
    }
