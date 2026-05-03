"""App configuration for KiranaFlow AI backend.

Centralises all normalization caps, demand weights, and location tier thresholds
so every engine module reads from one place.
"""

from __future__ import annotations

# ── Geo normalization caps (tuned for 500m radius in Indian metros) ───────────
DEFAULT_MAX_NODE_DENSITY = 5000.0
DEFAULT_MAX_POI_COUNT = 2000.0
DEFAULT_MAX_DEMAND_POI_COUNT = 600.0
DEFAULT_MAX_COMPETITION_DENSITY = 250.0

# Census proxy caps
DEFAULT_MAX_POP_DENSITY = 30000.0
DEFAULT_MAX_HOUSEHOLD_DENSITY = 10000.0

# Google proxy caps
DEFAULT_MAX_REVIEWS = 5000.0

# ── Demand score weights ───────────────────────────────────────────────────────
# Positive weights increase demand; competition_penalty is negative.
DEMAND_WEIGHTS = {
    "road_network": 0.16,
    "commercial_activity": 0.12,
    "demand_anchor": 0.10,
    "population": 0.12,
    "household": 0.08,
    "income": 0.10,
    "rating": 0.07,
    "reviews": 0.07,
    "brand": 0.06,
    "competition_penalty": -0.12,
}

# ── Location tiers: (score_threshold, tier_label, geo_multiplier) ──────────────
# Evaluated top-to-bottom; first matching threshold wins.
LOCATION_TIERS = [
    (0.66, "high", 1.15),
    (0.32, "medium", 1.00),
    (0.00, "low", 0.90),
]
