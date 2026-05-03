"""Fraud detection engine for KiranaFlow AI backend.

Migrated from kirana_proto with full logic preserved:
- Population-aware inventory-vs-bill mismatch thresholds
- Perceptual image hash duplicate detection
- EXIF GPS location spoofing check (via metadata_auditor)
- OCR-based supplier bill truth layer (via ocr_processor)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("kiranaflow.fraudengine")

# ── imagehash is optional ─────────────────────────────────────────────────────
try:
    import imagehash
    from PIL import Image as _PilImage
    IMAGEHASH_AVAILABLE = True
except ImportError:
    imagehash = None  # type: ignore
    IMAGEHASH_AVAILABLE = False
    logger.warning("imagehash not installed — duplicate image detection disabled")

# Persist seen hashes next to this file so it survives server restarts
SEEN_HASHES_PATH = Path(__file__).resolve().parent / "seen_hashes.json"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _get_population_tier(population_density: Any) -> str:
    """Classify location by population density (persons/sq km)."""
    density = _safe_float(population_density, 0.0)
    if density > 5000:
        return "urban"
    elif density > 1000:
        return "suburban"
    return "rural"


# ── Public: fraud thresholds ──────────────────────────────────────────────────

def get_fraud_thresholds(population_density: Any = 1000.0) -> Dict[str, float]:
    """Return fraud detection thresholds calibrated by population density.

    Urban areas have stricter thresholds (more competitors, better data).
    Rural areas have looser thresholds (fewer reference points).
    """
    tier = _get_population_tier(population_density)
    thresholds = {
        "urban": {
            "mismatch_multiplier": 2.5,
            "high_confidence_threshold": 0.85,
            "medium_confidence_threshold": 0.60,
            "low_confidence_threshold": 0.30,
        },
        "suburban": {
            "mismatch_multiplier": 3.0,
            "high_confidence_threshold": 0.75,
            "medium_confidence_threshold": 0.50,
            "low_confidence_threshold": 0.25,
        },
        "rural": {
            "mismatch_multiplier": 4.0,
            "high_confidence_threshold": 0.65,
            "medium_confidence_threshold": 0.40,
            "low_confidence_threshold": 0.20,
        },
    }
    return thresholds.get(tier, thresholds["suburban"])


# ── Public: inventory-vs-bill mismatch ───────────────────────────────────────

def verify_stock_authenticity(
    detected_stock_value: Any,
    receipt_bill_value: Any,
    population_density: Any = 1000.0,
    node_density: Any = 500.0,
    competition_density: Any = 50.0,
) -> Dict[str, Any]:
    """Run inventory-vs-bill mismatch check with population-aware calibration.

    Args:
        detected_stock_value: Inventory value estimated from vision (₹).
        receipt_bill_value: Inventory/supplier bill value from OCR (₹).
        population_density: Location population density (persons/sq km).
        node_density: Road network density (foot traffic proxy).
        competition_density: Number of nearby competitor stores.

    Returns:
        Fraud assessment with fraud_flag, confidence_score, mismatch_ratio.
    """
    detected = max(_safe_float(detected_stock_value, 0.0), 0.0)
    receipt = max(_safe_float(receipt_bill_value, 0.0), 0.0)
    pop_density = _safe_float(population_density, 1000.0)
    node_dens = _safe_float(node_density, 500.0)
    comp_dens = _safe_float(competition_density, 50.0)

    tier = _get_population_tier(pop_density)
    thresholds = get_fraud_thresholds(pop_density)

    if receipt <= 0:
        return {
            "fraud_flag": "insufficient_receipt_data",
            "confidence_score": 0.5,
            "mismatch_ratio": None,
            "population_tier": tier,
            "applied_threshold": thresholds["mismatch_multiplier"],
            "reason": "no_receipt_data",
        }

    ratio = detected / receipt
    mismatch_multiplier = thresholds["mismatch_multiplier"]

    # Adjust threshold by local context
    if comp_dens > 100 and tier == "urban":
        mismatch_multiplier = max(mismatch_multiplier - 0.5, 2.0)
    elif comp_dens < 10 and tier == "rural":
        mismatch_multiplier = min(mismatch_multiplier + 0.5, 5.0)

    if detected > mismatch_multiplier * receipt:
        return {
            "fraud_flag": "inventory_staging_mismatch",
            "confidence_score": thresholds["high_confidence_threshold"],
            "mismatch_ratio": ratio,
            "population_tier": tier,
            "applied_threshold": mismatch_multiplier,
            "reason": f"ratio_{ratio:.2f}_exceeds_threshold_{mismatch_multiplier}",
        }
    elif detected > 2.0 * receipt:
        return {
            "fraud_flag": "inventory_anomaly_medium",
            "confidence_score": thresholds["medium_confidence_threshold"],
            "mismatch_ratio": ratio,
            "population_tier": tier,
            "applied_threshold": mismatch_multiplier,
            "reason": f"moderate_mismatch_{ratio:.2f}",
        }
    elif detected > receipt and node_dens > 1000:
        return {
            "fraud_flag": "inventory_restocking_cycle",
            "confidence_score": thresholds["low_confidence_threshold"],
            "mismatch_ratio": ratio,
            "population_tier": tier,
            "applied_threshold": mismatch_multiplier,
            "reason": "minor_excess_high_traffic",
        }

    return {
        "fraud_flag": None,
        "confidence_score": 1.0,
        "mismatch_ratio": ratio,
        "population_tier": tier,
        "applied_threshold": mismatch_multiplier,
        "reason": "passed_all_checks",
    }


# ── Public: duplicate image detection ────────────────────────────────────────

def generate_image_fingerprint(image_path: str) -> Optional[str]:
    """Generate a perceptual hash (pHash) for an image file.

    Returns None if imagehash is not installed.
    """
    if not IMAGEHASH_AVAILABLE:
        return None
    try:
        with _PilImage.open(image_path) as img:
            return str(imagehash.phash(img))
    except Exception as e:
        logger.warning(f"Image fingerprint failed for {image_path}: {e}")
        return None


def _hash_similarity(hash_a: str, hash_b: str) -> float:
    """Similarity score in [0,1] based on Hamming distance."""
    h_a = imagehash.hex_to_hash(str(hash_a))
    h_b = imagehash.hex_to_hash(str(hash_b))
    distance = h_a - h_b
    bit_length = h_a.hash.size
    return 1.0 - (distance / bit_length)


def check_for_duplicates(new_hash: str) -> Dict[str, Any]:
    """Compare a new pHash against persisted prior hashes.

    Similarity >= 90% triggers a duplicate fraud flag with confidence=0.1.
    The new hash is added to the persistent store on non-duplicate.
    """
    if not IMAGEHASH_AVAILABLE or not new_hash:
        return {
            "is_duplicate": False,
            "fraud_flag": None,
            "system_confidence": 1.0,
            "similarity": 0.0,
            "matched_hash": None,
        }

    existing_hashes: List[str] = []
    if SEEN_HASHES_PATH.exists():
        try:
            data = json.loads(SEEN_HASHES_PATH.read_text(encoding="utf-8"))
            if isinstance(data, list):
                existing_hashes = [str(item) for item in data]
        except Exception:
            existing_hashes = []

    best_similarity = 0.0
    best_match: Optional[str] = None
    for existing in existing_hashes:
        try:
            sim = _hash_similarity(new_hash, existing)
        except Exception:
            continue
        if sim > best_similarity:
            best_similarity = sim
            best_match = existing

    if best_match is not None and best_similarity >= 0.90:
        return {
            "is_duplicate": True,
            "fraud_flag": "duplicate_evidence_detected",
            "system_confidence": 0.1,
            "similarity": float(best_similarity),
            "matched_hash": best_match,
        }

    # Persist hash for future comparisons
    existing_hashes.append(str(new_hash))
    try:
        SEEN_HASHES_PATH.write_text(json.dumps(existing_hashes, indent=2), encoding="utf-8")
    except Exception:
        pass

    return {
        "is_duplicate": False,
        "fraud_flag": None,
        "system_confidence": 1.0,
        "similarity": float(best_similarity),
        "matched_hash": None,
    }


# ── Public: OCR truth layer ───────────────────────────────────────────────────

def run_truth_layer(vision_stock_value: float, supplier_bill_image_path: str) -> Dict[str, Any]:
    """OCR the supplier bill and cross-check with vision-derived stock value.

    Returns bill metadata and any truth flags detected.
    """
    try:
        from ocr_processor import process_supplier_bill
        bill_data = process_supplier_bill(supplier_bill_image_path)
    except Exception as e:
        logger.warning(f"OCR truth layer failed: {e}")
        return {
            "supplier_name": None,
            "bill_total_amount": None,
            "bill_document_date": None,
            "truth_flags": ["ocr_unavailable"],
            "ocr_text": None,
        }

    total_amount = bill_data.get("total_amount")
    flags: List[str] = []
    try:
        if total_amount is not None and float(total_amount) > 0:
            if float(vision_stock_value) >= 5.0 * float(total_amount):
                flags.append("potential_stock_staging")
    except Exception:
        pass

    return {
        "supplier_name": bill_data.get("supplier_name"),
        "bill_total_amount": total_amount,
        "bill_document_date": bill_data.get("document_date"),
        "truth_flags": flags,
        "ocr_text": bill_data.get("raw_text"),
    }


# ── Singleton compatibility shim (for api.py import) ─────────────────────────
class _FraudDetector:
    """Thin wrapper so api.py can call fraud_detector.detect_fraud(data)."""

    def detect_fraud(self, store_data: Dict[str, Any]) -> Dict[str, Any]:
        vision = store_data.get("vision_features", {})
        bank_parsed = bool(store_data.get("bank_parsed", True))
        bill_parsed = bool(store_data.get("bill_parsed", True))
        pop_density = float(store_data.get("population_density", 1000.0))

        detected_val = float(vision.get("inventory_value_proxy", 0))
        receipt_val = float(store_data.get("bill_total_amount", 0) or 0)

        stock_check = verify_stock_authenticity(
            detected_val,
            receipt_val,
            population_density=pop_density,
        )

        flags: List[str] = []
        is_suspicious = False

        if stock_check["fraud_flag"]:
            flags.append(stock_check["fraud_flag"])
            is_suspicious = True

        if not bank_parsed:
            flags.append("bank_statement_parsing_incomplete")
        if not bill_parsed:
            flags.append("supplier_bill_value_unverified")

        return {
            "fraud_score": 1.0 - stock_check["confidence_score"],
            "is_suspicious": is_suspicious,
            "flags": flags,
            "confidence": stock_check["confidence_score"],
        }


fraud_detector = _FraudDetector()
