"""OCR processor for KiranaFlow AI backend.

Migrated from kirana_proto. Runs Tesseract OCR on supplier bill images to
extract total amount, supplier name, and document date for the fraud truth layer.

Requires: pytesseract + Tesseract-OCR installed on the host.
Windows path: C:\\Program Files\\Tesseract-OCR\\tesseract.exe
"""

from __future__ import annotations

import logging
import os
import re
from datetime import date
from typing import Dict, Optional

logger = logging.getLogger("kiranaflow.ocr")

# ── pytesseract is optional ───────────────────────────────────────────────────
try:
    import pytesseract
    from PIL import Image as _PilImage

    # Point to Tesseract binary on Windows if running locally
    _win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(_win_path):
        pytesseract.pytesseract.tesseract_cmd = _win_path

    OCR_AVAILABLE = True
except ImportError:
    pytesseract = None  # type: ignore
    OCR_AVAILABLE = False
    logger.warning("pytesseract not installed — OCR extraction disabled")


# ── Regex patterns ────────────────────────────────────────────────────────────
TOTAL_KEYWORDS = ("total", "net amount", "grand total")
AMOUNT_REGEX = re.compile(r"(?:rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", re.IGNORECASE)
DATE_REGEXES = (
    re.compile(r"\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b"),  # YYYY-MM-DD
    re.compile(r"\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2})\b"),  # DD-MM-YYYY
)


# ── Text normalization ────────────────────────────────────────────────────────

def _normalize_text(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text).strip()


def _extract_amount_from_line(line: str) -> Optional[float]:
    matches = AMOUNT_REGEX.findall(line)
    if not matches:
        return None
    cleaned = matches[-1].replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


# ── Public extraction functions ───────────────────────────────────────────────

def extract_total_amount(ocr_text: str) -> Optional[float]:
    """Extract payable amount from OCR text.

    Prioritises lines with keywords like 'total', 'grand total'.
    Falls back to maximum visible amount.
    """
    lines = [_normalize_text(line) for line in ocr_text.splitlines() if line.strip()]

    for line in lines:
        if any(kw in line.lower() for kw in TOTAL_KEYWORDS):
            value = _extract_amount_from_line(line)
            if value is not None:
                return value

    # Fallback: max amount in document
    amounts = [_extract_amount_from_line(l) for l in lines]
    valid = [a for a in amounts if a is not None]
    return max(valid) if valid else None


def extract_document_date(ocr_text: str) -> Optional[str]:
    """Best-effort date extraction from OCR text.

    Returns ISO date string (YYYY-MM-DD) or None.
    """
    lines = [_normalize_text(line) for line in (ocr_text or "").splitlines() if line.strip()]
    candidate_lines = [l for l in lines if "date" in l.lower()] + lines[:20]

    for line in candidate_lines:
        for rx in DATE_REGEXES:
            m = rx.search(line)
            if not m:
                continue
            groups = m.groups()
            try:
                if len(groups[0]) == 4:
                    yyyy, mm, dd = int(groups[0]), int(groups[1]), int(groups[2])
                else:
                    dd, mm, yyyy = int(groups[0]), int(groups[1]), int(groups[2])
                return date(yyyy, mm, dd).isoformat()
            except Exception:
                continue
    return None


def extract_supplier_name(ocr_text: str) -> Optional[str]:
    """Extract supplier/vendor name from top of document heuristically."""
    lines = [_normalize_text(line) for line in (ocr_text or "").splitlines() if line.strip()]
    if not lines:
        return None

    blocked = ("invoice", "bill", "date", "gst", "phone", "mobile", "total", "amount", "receipt")

    for line in lines[:8]:
        if any(term in line.lower() for term in blocked):
            continue
        if len(line) < 3:
            continue
        return line

    return lines[0] if lines else None


# ── Main public function ──────────────────────────────────────────────────────

def process_supplier_bill(image_path: str) -> Dict[str, object]:
    """Run OCR on a supplier bill image and return extracted fields.

    Returns:
        {
            "supplier_name": str | None,
            "total_amount": float | None,
            "document_date": str | None,   # ISO date
            "raw_text": str | None,
        }
    """
    if not OCR_AVAILABLE:
        logger.warning("OCR unavailable — returning empty bill data")
        return {
            "supplier_name": None,
            "total_amount": None,
            "document_date": None,
            "raw_text": None,
        }

    try:
        image = _PilImage.open(image_path)
        ocr_text = pytesseract.image_to_string(image)
    except Exception as e:
        logger.warning(f"Tesseract OCR failed on {image_path}: {e}")
        return {
            "supplier_name": None,
            "total_amount": None,
            "document_date": None,
            "raw_text": None,
        }

    return {
        "supplier_name": extract_supplier_name(ocr_text),
        "total_amount": extract_total_amount(ocr_text),
        "document_date": extract_document_date(ocr_text),
        "raw_text": ocr_text,
    }


def process_payment_receipt(image_path: str) -> Dict[str, object]:
    """Run OCR on payment receipt and extract payment date."""
    if not OCR_AVAILABLE:
        return {"payment_date": None, "raw_text": None}
    try:
        image = _PilImage.open(image_path)
        ocr_text = pytesseract.image_to_string(image)
        return {"payment_date": extract_document_date(ocr_text), "raw_text": ocr_text}
    except Exception as e:
        logger.warning(f"Receipt OCR failed: {e}")
        return {"payment_date": None, "raw_text": None}
