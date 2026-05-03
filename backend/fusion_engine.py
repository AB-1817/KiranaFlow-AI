"""Fusion engine for KiranaFlow AI backend.

Migrated from kirana_proto. Assembles the final model feature vector using the
trained kirana_model.pkl and returns the full underwriting output including
revenue prediction, net income, loan recommendation, and CCC adjustment.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from logicengine import adjust_loan_based_on_ccc, calculate_ccc

logger = logging.getLogger("kiranaflow.fusion")

# ── Model loading ─────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PKL_PATH = BACKEND_DIR / "models" / "kirana_model.pkl"

_pkl_model: Optional[Any] = None


def load_pkl_model() -> Optional[Any]:
    """Load kirana_model.pkl once and cache the singleton."""
    global _pkl_model

    if _pkl_model is not None:
        return _pkl_model

    try:
        import joblib
    except ImportError:
        logger.warning("joblib not installed — pkl model unavailable")
        return None

    if not MODEL_PKL_PATH.exists():
        logger.warning(f"kirana_model.pkl not found at {MODEL_PKL_PATH}")
        return None

    try:
        _pkl_model = joblib.load(str(MODEL_PKL_PATH))
        logger.info(f"✅ kirana_model.pkl loaded from {MODEL_PKL_PATH}")
        return _pkl_model
    except Exception as e:
        logger.error(f"Failed to load kirana_model.pkl: {e}")
        return None


# ── Feature helpers ───────────────────────────────────────────────────────────

def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


CATEGORY_MARGINS = {
    "Staples-heavy": 0.055,
    "Balanced": 0.10,
    "FMCG-dominant": 0.15,
    "Specialist": 0.18,
}


def calculate_net_income(revenue: float, category_mix: str) -> float:
    """Derive net income from revenue using category-specific margin."""
    rate = CATEGORY_MARGINS.get(category_mix, 0.10)
    return float(revenue) * float(rate)


def _model_feature_names(model: Any) -> List[str]:
    """Return model's native feature names, or the legacy 14-feature fallback."""
    names = getattr(model, "feature_names_in_", None)
    if names is not None:
        return [str(x) for x in list(names)]
    # Legacy ordering used in the prototype (7 vision + 7 geo)
    return [
        "shelf_density",
        "sku_diversity",
        "inventory_val",
        "freshness_score",
        "brand_visibility",
        "shelf_layers",
        "promo_presence",
        "node_density",
        "competition_density",
        "poi_count",
        "demand_anchor_count",
        "population_density",
        "household_density",
        "income_proxy",
    ]


# ── Primary feature name aliases ──────────────────────────────────────────────
# The vision module uses different field names than the model's feature names.
# This mapping translates vision dict keys → model feature names.
_VISION_ALIASES = {
    "shelf_density_index": "shelf_density",
    "sku_diversity_proxy": "sku_diversity",
    "inventory_value_proxy": "inventory_val",
    "total_product_detections": "sku_diversity",  # secondary alias
}

_GEO_ALIASES = {
    "location_multiplier": "geo_multiplier",
}


def _build_feature_row(
    model: Any,
    vision_features: Dict[str, Any],
    geo_features: Dict[str, Any],
) -> Dict[str, float]:
    """Build the feature row dict expected by the model.

    Merges geo + vision dicts (vision wins on key conflict) and applies
    alias mapping so proto-style feature names line up correctly.
    """
    merged: Dict[str, Any] = {}

    # 1. Start from geo
    merged.update(geo_features or {})
    # Apply geo aliases
    for old_key, new_key in _GEO_ALIASES.items():
        if old_key in merged and new_key not in merged:
            merged[new_key] = merged[old_key]

    # 2. Overlay vision (takes priority)
    merged.update(vision_features or {})
    # Apply vision aliases
    for old_key, new_key in _VISION_ALIASES.items():
        if old_key in merged and new_key not in merged:
            merged[new_key] = merged[old_key]

    feature_names = _model_feature_names(model)
    return {name: _safe_float(merged.get(name), 0.0) for name in feature_names}


# ── Main underwriting assembler ───────────────────────────────────────────────

def assemble_underwriting_output(
    *,
    model: Any,
    category_mix: str = "Balanced",
    vision_features: Dict[str, Any],
    geo_features: Dict[str, Any],
    trust_score: float = 1.0,
    ccc_value: Optional[Any] = None,
    fraud_flag: Optional[str] = None,
    inventory_days: Optional[Any] = None,
    receivable_days: Optional[Any] = None,
    payable_days: Optional[Any] = None,
) -> Dict[str, Any]:
    """Assemble full underwriting result using the trained pkl model.

    Args:
        model: Loaded sklearn/xgboost model from kirana_model.pkl.
        category_mix: Store category (Staples-heavy / Balanced / FMCG-dominant / Specialist).
        vision_features: Output from vision.extract_vision_features().
        geo_features: Output from geoutils.build_geo_feature_bundle().
        trust_score: 0–1 multiplier from fraud engine.
        ccc_value: Pre-computed CCC (days). If None, computed from day inputs.
        fraud_flag: Optional override fraud flag string.
        inventory_days / receivable_days / payable_days: For CCC calculation.

    Returns:
        Full underwriting output dict with revenue, net_income, final_loan, etc.
    """
    feature_names = _model_feature_names(model)
    row = _build_feature_row(model, vision_features, geo_features)
    X = pd.DataFrame([row], columns=feature_names)
    final_input = X.to_numpy(dtype=float)

    # ── Model prediction ──────────────────────────────────────────────────────
    est_revenue = float(model.predict(final_input)[0])
    net_income = calculate_net_income(est_revenue, category_mix)

    max_emi = net_income * 0.40
    base_loan = float(max_emi * 12)

    # ── CCC adjustment ────────────────────────────────────────────────────────
    if ccc_value is None:
        ccc_value = calculate_ccc(inventory_days, receivable_days, payable_days)
    ccc_value_f = float(_safe_float(ccc_value, 0.0))

    pop_density = _safe_float(
        geo_features.get(
            "population_density",
            geo_features.get("pop_density", 1000.0),
        ),
        1000.0,
    )
    ccc_result = adjust_loan_based_on_ccc(ccc_value_f, base_loan, population_density=pop_density)
    ccc_adjusted_loan = float(ccc_result.get("adjusted_loan", base_loan))

    # ── Trust gate ────────────────────────────────────────────────────────────
    trust = float(max(0.0, min(1.0, _safe_float(trust_score, 1.0))))
    final_loan = float(ccc_adjusted_loan * trust)

    if fraud_flag is None and trust <= 0.0:
        fraud_flag = "CRITICAL_FRAUD_TRUST_SCORE_ZERO"

    return {
        "feature_names": feature_names,
        "feature_vector": row,
        "estimated_revenue": est_revenue,
        "net_income": net_income,
        "base_loan": base_loan,
        "ccc": ccc_value_f,
        "ccc_adjustment": ccc_result,
        "ccc_adjusted_loan": ccc_adjusted_loan,
        "trust_score": trust,
        "final_loan": final_loan,
        "adjusted_loan": final_loan,
        "ccc_tier": str(ccc_result.get("ccc_tier", "")),
        "fraud_flag": fraud_flag,
    }


# ── Fallback for when pkl model is unavailable ────────────────────────────────

def assemble_from_heuristics(
    vision_features: Dict[str, Any],
    geo_features: Dict[str, Any],
    category_mix: str = "Balanced",
    ccc_value: float = 0.0,
    trust_score: float = 1.0,
) -> Dict[str, Any]:
    """Rule-based fallback when kirana_model.pkl is unavailable.

    Uses the same logic as the original api.py local_demo_assessment()
    but extended with CCC adjustment and geo multiplier.
    """
    density = _safe_float(vision_features.get("shelf_density_index", 0.2))
    detections = _safe_float(vision_features.get("total_product_detections", 100))
    geo_mult = _safe_float(
        geo_features.get("location_multiplier", geo_features.get("geo_multiplier", 1.0)), 1.0
    )
    pop_density = _safe_float(geo_features.get("population_density", 1000.0), 1000.0)

    density_lift = 1.0 + density * 2.0
    est_revenue = int(detections * 1_200 * density_lift * geo_mult)
    est_revenue = max(50_000, min(est_revenue, 600_000))

    margin = CATEGORY_MARGINS.get(category_mix, 0.10)
    net_income = est_revenue * margin
    base_loan = net_income * 0.40 * 12

    ccc_result = adjust_loan_based_on_ccc(ccc_value, base_loan, population_density=pop_density)
    ccc_adjusted_loan = float(ccc_result.get("adjusted_loan", base_loan))
    trust = float(max(0.0, min(1.0, _safe_float(trust_score, 1.0))))
    final_loan = ccc_adjusted_loan * trust

    return {
        "feature_names": [],
        "feature_vector": {},
        "estimated_revenue": float(est_revenue),
        "net_income": float(net_income),
        "base_loan": float(base_loan),
        "ccc": ccc_value,
        "ccc_adjustment": ccc_result,
        "ccc_adjusted_loan": ccc_adjusted_loan,
        "trust_score": trust,
        "final_loan": final_loan,
        "adjusted_loan": final_loan,
        "ccc_tier": str(ccc_result.get("ccc_tier", "")),
        "fraud_flag": None,
        "heuristic_mode": True,
    }
