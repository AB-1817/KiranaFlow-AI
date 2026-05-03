"""Economic logic engine for KiranaFlow AI backend.

Migrated from kirana_proto with full logic preserved:
- Cash Conversion Cycle (CCC) calculation
- Population-aware CCC adjustment factors
- CCC-based loan adjustment with tiered multipliers
"""

from __future__ import annotations

from typing import Any, Dict


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


# ── Cash Conversion Cycle ─────────────────────────────────────────────────────

def calculate_ccc(
    inventory_days: Any,
    receivable_days: Any,
    payable_days: Any,
) -> float:
    """Compute Cash Conversion Cycle.

    Formula: CCC = Inventory Days + Receivable Days - Payable Days

    A negative CCC means the store collects cash before paying suppliers
    (excellent for Kirana: customers pay on delivery, suppliers give credit).
    """
    inventory = _safe_float(inventory_days, 0.0)
    receivable = _safe_float(receivable_days, 0.0)
    payable = _safe_float(payable_days, 0.0)
    return inventory + receivable - payable


def get_ccc_adjustment_factors(population_density: Any = 1000.0) -> Dict[str, Any]:
    """Get CCC adjustment parameters calibrated by population density.

    Urban areas have stricter standards and expect faster cash cycles.
    Rural areas are more lenient given cash constraints.

    Returns:
        Dict with tiered multipliers and CCC thresholds.
    """
    density = _safe_float(population_density, 1000.0)

    if density > 5000:   # Urban
        return {
            "tier": "urban",
            "excellent_ccc_threshold": -5.0,
            "excellent_multiplier": 1.35,
            "good_ccc_threshold": 5.0,
            "good_multiplier": 1.20,
            "acceptable_ccc_threshold": 12.0,
            "acceptable_multiplier": 1.00,
            "concerning_ccc_threshold": 20.0,
            "concerning_multiplier": 0.70,
            "poor_multiplier": 0.40,
        }
    elif density > 1000:  # Suburban
        return {
            "tier": "suburban",
            "excellent_ccc_threshold": -5.0,
            "excellent_multiplier": 1.25,
            "good_ccc_threshold": 8.0,
            "good_multiplier": 1.10,
            "acceptable_ccc_threshold": 15.0,
            "acceptable_multiplier": 1.00,
            "concerning_ccc_threshold": 25.0,
            "concerning_multiplier": 0.65,
            "poor_multiplier": 0.45,
        }
    else:  # Rural
        return {
            "tier": "rural",
            "excellent_ccc_threshold": -5.0,
            "excellent_multiplier": 1.20,
            "good_ccc_threshold": 10.0,
            "good_multiplier": 1.05,
            "acceptable_ccc_threshold": 18.0,
            "acceptable_multiplier": 1.00,
            "concerning_ccc_threshold": 30.0,
            "concerning_multiplier": 0.60,
            "poor_multiplier": 0.50,
        }


def adjust_loan_based_on_ccc(
    ccc: Any,
    base_loan: Any,
    population_density: Any = 1000.0,
) -> Dict[str, float]:
    """Adjust loan recommendation from CCC with population awareness.

    Args:
        ccc: Cash Conversion Cycle value (days).
        base_loan: Base eligible loan amount (₹).
        population_density: Location population density for tier classification.

    Returns:
        {
            "adjusted_loan": float,
            "adjustment_factor": float,
            "population_tier": str,
            "ccc_tier": str,
            "base_loan": float,
        }
    """
    ccc_value = _safe_float(ccc, 0.0)
    base = max(_safe_float(base_loan, 0.0), 0.0)
    pop_density = _safe_float(population_density, 1000.0)

    factors = get_ccc_adjustment_factors(pop_density)
    tier = factors.get("tier", "suburban")

    if ccc_value < factors["excellent_ccc_threshold"]:
        factor = factors["excellent_multiplier"]
        ccc_tier = "excellent_cash_flow"
    elif ccc_value < factors["good_ccc_threshold"]:
        factor = factors["good_multiplier"]
        ccc_tier = "good_cash_flow"
    elif ccc_value < factors["acceptable_ccc_threshold"]:
        factor = factors["acceptable_multiplier"]
        ccc_tier = "acceptable_cash_flow"
    elif ccc_value < factors["concerning_ccc_threshold"]:
        factor = factors["concerning_multiplier"]
        ccc_tier = "concerning_cash_flow"
    else:
        factor = factors["poor_multiplier"]
        ccc_tier = "poor_cash_flow"

    return {
        "adjusted_loan": base * factor,
        "adjustment_factor": factor,
        "population_tier": tier,
        "ccc_tier": ccc_tier,
        "base_loan": base,
    }


# ── Singleton compatibility shim ──────────────────────────────────────────────
class _CashflowEngine:
    """Thin wrapper so legacy api.py calls work without changes."""

    def calculate_cashflow_score(
        self,
        bank_data: Dict,
        vision_data: Dict,
        geo_data: Dict,
        fraud_data: Dict,
    ) -> float:
        """Simplified cashflow score (0–100) from available signals."""
        density = float(vision_data.get("shelf_density_index", 0.2))
        detections = float(vision_data.get("total_product_detections", 100))
        geo_mult = float(geo_data.get("location_multiplier", geo_data.get("geo_multiplier", 1.0)))
        fraud_score = float(fraud_data.get("fraud_score", 0.0))

        # Normalised proxy score
        raw = (density * 30) + min(detections / 10, 30) + ((geo_mult - 0.85) / 0.35 * 20)
        raw -= fraud_score * 20
        return round(min(max(raw, 0.0), 100.0), 2)

    def assess_risk_level(self, score: float) -> str:
        if score >= 70:
            return "low"
        elif score >= 40:
            return "medium"
        return "high"


cashflow_engine = _CashflowEngine()
