"""Geo intelligence utilities for KiranaFlow AI backend.

Migrated from kirana_proto with full logic preserved:
- OSMnx-based node density, POI count, competition density (with caching)
- Census-style city profiles for 25+ Indian cities
- Google Maps quality signals (optional, requires API key)
- Weighted demand score computation
- Location tier + multiplier mapping
- build_geo_feature_bundle() — single entry point for api.py
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from app_config import (
    DEFAULT_MAX_COMPETITION_DENSITY,
    DEFAULT_MAX_DEMAND_POI_COUNT,
    DEFAULT_MAX_HOUSEHOLD_DENSITY,
    DEFAULT_MAX_NODE_DENSITY,
    DEFAULT_MAX_POI_COUNT,
    DEFAULT_MAX_POP_DENSITY,
    DEFAULT_MAX_REVIEWS,
    DEMAND_WEIGHTS,
    LOCATION_TIERS,
)
from osm_cache import read_osm_cache, write_osm_cache
from population_data import PopulationDatasetManager

logger = logging.getLogger("kiranaflow.geoutils")

# We import osmnx lazily to prevent slow module initialization from 
# timing out the Render server port scan.
OSMNX_AVAILABLE = True
ox = None

try:
    import requests as _requests
    REQUESTS_AVAILABLE = True
except Exception:
    _requests = None  # type: ignore[assignment]
    REQUESTS_AVAILABLE = False

# ── City census profiles ──────────────────────────────────────────────────────
_CITY_CENSUS_PROFILE = {
    "mumbai":        {"population_density": 20694.0, "household_density": 7800.0, "income_proxy": 0.95},
    "delhi":         {"population_density": 11320.0, "household_density": 4300.0, "income_proxy": 0.90},
    "bangalore":     {"population_density": 11900.0, "household_density": 4500.0, "income_proxy": 0.90},
    "hyderabad":     {"population_density": 10300.0, "household_density": 3900.0, "income_proxy": 0.86},
    "chennai":       {"population_density":  9400.0, "household_density": 3600.0, "income_proxy": 0.84},
    "kolkata":       {"population_density": 24200.0, "household_density": 6900.0, "income_proxy": 0.82},
    "ahmedabad":     {"population_density": 12400.0, "household_density": 3800.0, "income_proxy": 0.80},
    "pune":          {"population_density":  6031.0, "household_density": 3200.0, "income_proxy": 0.78},
    "surat":         {"population_density": 13900.0, "household_density": 4200.0, "income_proxy": 0.80},
    "jaipur":        {"population_density":  7100.0, "household_density": 3000.0, "income_proxy": 0.75},
    "lucknow":       {"population_density":  8200.0, "household_density": 3200.0, "income_proxy": 0.74},
    "kanpur":        {"population_density": 10300.0, "household_density": 3600.0, "income_proxy": 0.73},
    "indore":        {"population_density":  7600.0, "household_density": 2900.0, "income_proxy": 0.76},
    "nagpur":        {"population_density":  4700.0, "household_density": 2400.0, "income_proxy": 0.66},
    "thane":         {"population_density": 12000.0, "household_density": 3900.0, "income_proxy": 0.83},
    "nashik":        {"population_density":  5700.0, "household_density": 2500.0, "income_proxy": 0.70},
    "bhopal":        {"population_density":  4100.0, "household_density": 2200.0, "income_proxy": 0.68},
    "patna":         {"population_density": 18200.0, "household_density": 5000.0, "income_proxy": 0.67},
    "coimbatore":    {"population_density":  7800.0, "household_density": 2800.0, "income_proxy": 0.77},
    "visakhapatnam": {"population_density":  6200.0, "household_density": 2500.0, "income_proxy": 0.74},
    "madurai":       {"population_density":  9200.0, "household_density": 3000.0, "income_proxy": 0.72},
    "ludhiana":      {"population_density":  6100.0, "household_density": 2300.0, "income_proxy": 0.73},
    "agra":          {"population_density": 10200.0, "household_density": 3300.0, "income_proxy": 0.70},
    "varanasi":      {"population_density": 11100.0, "household_density": 3500.0, "income_proxy": 0.69},
    "ghaziabad":     {"population_density": 14800.0, "household_density": 4200.0, "income_proxy": 0.81},
    "noida":         {"population_density":  7800.0, "household_density": 2900.0, "income_proxy": 0.85},
    "gurgaon":       {"population_density":  6200.0, "household_density": 2400.0, "income_proxy": 0.86},
    "faridabad":     {"population_density":  9800.0, "household_density": 3200.0, "income_proxy": 0.76},
    "village":       {"population_density":   400.0, "household_density":  180.0, "income_proxy": 0.35},
}

_CITY_ALIASES = {
    "new delhi": "delhi",
    "ncr": "delhi",
    "bengaluru": "bangalore",
    "bangaluru": "bangalore",
    "bombay": "mumbai",
    "calcutta": "kolkata",
    "gurugram": "gurgaon",
    "vizag": "visakhapatnam",
    "banaras": "varanasi",
    "navi mumbai": "mumbai",
}

_POP_DATASET_MANAGER = PopulationDatasetManager()


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _set_osmnx_timeouts(seconds: int = 12) -> None:
    if ox is None or not hasattr(ox, "settings"):
        return
    try:
        if hasattr(ox.settings, "requests_timeout"):
            ox.settings.requests_timeout = int(max(seconds, 5))
        if hasattr(ox.settings, "timeout"):
            ox.settings.timeout = int(max(seconds, 5))
        if hasattr(ox.settings, "overpass_rate_limit"):
            ox.settings.overpass_rate_limit = False
    except Exception:
        pass


def _has_meaningful_osm_signals(payload: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(payload, dict):
        return False
    numeric_keys = ("node_density", "poi_count", "demand_anchor_count", "competition_density")
    return any(_safe_float(payload.get(key), 0.0) > 0 for key in numeric_keys)


def _populate_osm_fallback_signals(
    osm_geo: Dict[str, Any],
    *,
    population_density: float,
    radius_m: int,
) -> Dict[str, Any]:
    """Fill proxy OSM signals when live source returns empty."""
    if _has_meaningful_osm_signals(osm_geo):
        return osm_geo
    density = max(_safe_float(population_density, 0.0), 200.0)
    scale = max(min(_safe_float(radius_m, 500.0) / 500.0, 3.0), 0.4)
    osm_geo["node_density"] = min((density / 20.0) * scale, DEFAULT_MAX_NODE_DENSITY * 0.70)
    osm_geo["poi_count"] = min((density / 150.0) * scale, DEFAULT_MAX_POI_COUNT * 0.70)
    osm_geo["demand_anchor_count"] = min((density / 300.0) * scale, DEFAULT_MAX_DEMAND_POI_COUNT * 0.55)
    osm_geo["competition_density"] = min((density / 850.0) * scale, DEFAULT_MAX_COMPETITION_DENSITY * 0.45)
    osm_geo["osm_synthetic_fallback"] = True
    return osm_geo


# ── Normalisation ─────────────────────────────────────────────────────────────

def normalize(value: Any, max_value: Any) -> float:
    n = max(_safe_float(value, 0.0), 0.0)
    m = _safe_float(max_value, 0.0)
    if m <= 0:
        return 0.0
    return min(n / m, 1.0)


def normalize_sqrt(value: Any, max_value: Any) -> float:
    return math.sqrt(normalize(value, max_value))


# ── Census profile helpers ────────────────────────────────────────────────────

def get_census_profile(city_name: Optional[str]) -> Dict[str, float]:
    if not city_name:
        return dict(_CITY_CENSUS_PROFILE["village"])
    key = str(city_name).strip().lower()
    key = _CITY_ALIASES.get(key, key)
    return dict(_CITY_CENSUS_PROFILE.get(key, _CITY_CENSUS_PROFILE["village"]))


def get_supported_city_profiles() -> list:
    cities = [name for name in _CITY_CENSUS_PROFILE if name != "village"]
    return sorted(city.title() for city in cities) + ["Village"]


def get_population_density(city_name: Optional[str]) -> float:
    return get_census_profile(city_name).get("population_density", 0.0)


def get_household_density(city_name: Optional[str]) -> float:
    return get_census_profile(city_name).get("household_density", 0.0)


def get_income_proxy(city_name: Optional[str]) -> float:
    return get_census_profile(city_name).get("income_proxy", 0.0)


# ── OSM data fetching ─────────────────────────────────────────────────────────

def get_geo_data(
    lat: Any,
    lon: Any,
    radius_m: int = 500,
    include_graph: bool = False,
) -> Dict[str, float]:
    """Fetch live OSM signals around a point. Returns zeros on failure."""
    global ox, OSMNX_AVAILABLE

    if OSMNX_AVAILABLE and ox is None:
        try:
            import osmnx as ox
        except ImportError:
            ox = None
            OSMNX_AVAILABLE = False
            logger.warning("osmnx not installed — geo running in census-profile-only mode")

    latitude = _safe_float(lat, 0.0)
    longitude = _safe_float(lon, 0.0)
    radius = int(max(min(_safe_float(radius_m, 500), 1200), 50))

    if not OSMNX_AVAILABLE or ox is None:
        return {
            "node_density": 0.0,
            "poi_count": 0.0,
            "demand_anchor_count": 0.0,
            "competition_density": 0.0,
            "osm_cache_hit": False,
        }
    _set_osmnx_timeouts(12)

    cached = read_osm_cache("geo", latitude, longitude, radius)
    if _has_meaningful_osm_signals(cached):
        cached["osm_cache_hit"] = True
        return cached

    node_density = poi_count = demand_anchor_count = competition_density = 0.0

    if include_graph:
        try:
            graph = ox.graph_from_point((latitude, longitude), dist=radius, network_type="walk")
            node_density = float(len(graph.nodes))
        except Exception:
            node_density = 0.0

    try:
        tags = {
            "shop": True,
            "amenity": True,
            "office": True,
            "building": ["apartments", "residential", "commercial", "retail"],
            "public_transport": True,
        }
        pois = ox.features_from_point((latitude, longitude), tags=tags, dist=radius)
        poi_count = float(len(pois))

        anchor_amenities = {"school", "college", "university", "hospital", "clinic", "bank", "atm", "bus_station"}
        competitor_shops = {"convenience", "supermarket", "grocery", "general", "department_store"}

        if "amenity" in pois.columns:
            demand_anchor_count += float(pois["amenity"].isin(anchor_amenities).sum())
        if "office" in pois.columns:
            demand_anchor_count += float(pois["office"].notna().sum())
        if "public_transport" in pois.columns:
            demand_anchor_count += float(pois["public_transport"].notna().sum())
        if "building" in pois.columns:
            demand_anchor_count += float(pois["building"].isin(["apartments", "residential", "commercial"]).sum())
        if "shop" in pois.columns:
            competition_density = float(pois["shop"].isin(competitor_shops).sum())
    except Exception:
        pass

    if not include_graph and node_density <= 0:
        node_density = max((poi_count * 4.0) + (demand_anchor_count * 6.0), 0.0)

    result = {
        "node_density": max(node_density, 0.0),
        "poi_count": max(poi_count, 0.0),
        "demand_anchor_count": max(demand_anchor_count, 0.0),
        "competition_density": max(competition_density, 0.0),
        "osm_cache_hit": False,
    }
    if _has_meaningful_osm_signals(result):
        write_osm_cache("geo", latitude, longitude, radius, result)
    return result


def get_google_place_signals(
    lat: Any,
    lon: Any,
    api_key: Optional[str] = None,
    radius_m: int = 500,
) -> Dict[str, float]:
    """Fetch Google Maps quality signals. Returns zeros if no key/network."""
    if not api_key or not REQUESTS_AVAILABLE:
        return {"avg_rating": 0.0, "reviews_count": 0.0, "brand_presence": 0.0}

    latitude = _safe_float(lat, 0.0)
    longitude = _safe_float(lon, 0.0)
    radius = max(int(_safe_float(radius_m, 500)), 1)

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{latitude},{longitude}",
        "radius": radius,
        "type": "grocery_or_supermarket",
        "key": api_key,
    }
    try:
        resp = _requests.get(url, params=params, timeout=8)
        resp.raise_for_status()
        places = resp.json().get("results", [])
    except Exception:
        return {"avg_rating": 0.0, "reviews_count": 0.0, "brand_presence": 0.0}

    if not places:
        return {"avg_rating": 0.0, "reviews_count": 0.0, "brand_presence": 0.0}

    total_rating = total_reviews = branded = rating_count = 0.0
    brand_kw = ("mart", "supermarket", "store", "retail", "express", "bazaar", "reliance", "dmart", "more", "big")

    for p in places:
        if not isinstance(p, dict):
            continue
        r = p.get("rating")
        if r is not None:
            total_rating += _safe_float(r)
            rating_count += 1
        total_reviews += max(_safe_float(p.get("user_ratings_total")), 0.0)
        if any(kw in str(p.get("name", "")).lower() for kw in brand_kw):
            branded += 1

    return {
        "avg_rating": total_rating / rating_count if rating_count else 0.0,
        "reviews_count": max(total_reviews, 0.0),
        "brand_presence": min(branded / len(places), 1.0) if places else 0.0,
    }


# ── Demand score ──────────────────────────────────────────────────────────────

def compute_demand_score(
    node_density: Any,
    poi_count: Any,
    population_density: Any,
    competition_density: Any = 0.0,
    demand_anchor_count: Any = 0.0,
    avg_rating: Any = 0.0,
    reviews_count: Any = 0.0,
    brand_presence: Any = 0.0,
    household_density: Any = 0.0,
    income_proxy: Any = 0.0,
    max_node_density: float = DEFAULT_MAX_NODE_DENSITY,
    max_poi_count: float = DEFAULT_MAX_POI_COUNT,
    max_demand_poi_count: float = DEFAULT_MAX_DEMAND_POI_COUNT,
    max_competition_density: float = DEFAULT_MAX_COMPETITION_DENSITY,
    max_population_density: float = DEFAULT_MAX_POP_DENSITY,
    max_household_density: float = DEFAULT_MAX_HOUSEHOLD_DENSITY,
    max_reviews_count: float = DEFAULT_MAX_REVIEWS,
) -> float:
    """Compute weighted normalised demand score in [0, 1]."""
    score = (
        DEMAND_WEIGHTS["road_network"]         * normalize_sqrt(node_density, max_node_density)
        + DEMAND_WEIGHTS["commercial_activity"]  * normalize_sqrt(poi_count, max_poi_count)
        + DEMAND_WEIGHTS["demand_anchor"]        * normalize_sqrt(demand_anchor_count, max_demand_poi_count)
        + DEMAND_WEIGHTS["population"]           * normalize_sqrt(population_density, max_population_density)
        + DEMAND_WEIGHTS["household"]            * normalize_sqrt(household_density, max_household_density)
        + DEMAND_WEIGHTS["income"]               * normalize(income_proxy, 1.0)
        + DEMAND_WEIGHTS["rating"]               * normalize(avg_rating, 5.0)
        + DEMAND_WEIGHTS["reviews"]              * normalize(reviews_count, max_reviews_count)
        + DEMAND_WEIGHTS["brand"]                * normalize(brand_presence, 1.0)
        + DEMAND_WEIGHTS["competition_penalty"]  * normalize(competition_density, max_competition_density)
    )
    return min(max(score, 0.0), 1.0)


def get_location_tier(demand_score: Any) -> Tuple[str, float]:
    """Map demand score to (tier_label, geo_multiplier)."""
    score = min(max(_safe_float(demand_score, 0.0), 0.0), 1.0)
    for threshold, tier, multiplier in LOCATION_TIERS:
        if score >= threshold:
            return tier, multiplier
    return "low", 0.90


# ── Main entry point ──────────────────────────────────────────────────────────

def build_geo_feature_bundle(
    lat: Any,
    lon: Any,
    city_name: Optional[str] = None,
    google_api_key: Optional[str] = None,
    radius_m: int = 500,
    use_live_osm: bool = True,
    fast_live_mode: bool = True,
) -> Dict[str, Any]:
    """Build a complete geo feature payload ready for fusion_engine.

    Orchestrates:
    - OSM baseline (node_density, poi_count, competition_density) with caching
    - Census proxies (population_density, household_density, income_proxy)
    - Optional Google quality signals (avg_rating, reviews_count, brand_presence)
    - Demand score → location tier / multiplier

    Args:
        lat: Latitude of the store.
        lon: Longitude of the store.
        city_name: City label for census profile lookup.
        google_api_key: Optional Google Places API key.
        radius_m: Search radius in meters.
        use_live_osm: Set False to skip network calls (census profile only).
        fast_live_mode: Use cached or lightweight live fetch only.

    Returns:
        Dict with all geo signals + location_tier + location_multiplier.
    """
    lat_f = _safe_float(lat, 0.0)
    lon_f = _safe_float(lon, 0.0)

    # ── OSM signals ───────────────────────────────────────────────────────────
    if use_live_osm and OSMNX_AVAILABLE:
        live_radius = int(min(radius_m, 700) if fast_live_mode else min(radius_m, 1000))
        cached = read_osm_cache("geo", lat_f, lon_f, live_radius)
        if fast_live_mode and _has_meaningful_osm_signals(cached):
            cached["osm_cache_hit"] = True
            osm_geo = cached
            osm_mode = "cache"
        else:
            osm_geo = get_geo_data(lat=lat, lon=lon, radius_m=live_radius, include_graph=False)
            osm_mode = "fresh" if _has_meaningful_osm_signals(osm_geo) else "fallback"
    else:
        osm_geo = {"node_density": 0.0, "poi_count": 0.0, "demand_anchor_count": 0.0, "competition_density": 0.0}
        osm_mode = "disabled"

    # ── Census profile ────────────────────────────────────────────────────────
    census = get_census_profile(city_name)
    population_density = _safe_float(census.get("population_density"), 400.0)

    # Fill synthetic OSM fallback if empty
    osm_geo = _populate_osm_fallback_signals(
        osm_geo,
        population_density=population_density,
        radius_m=int(_safe_float(radius_m, 500.0)),
    )

    # ── Google signals (optional) ─────────────────────────────────────────────
    google = get_google_place_signals(lat=lat, lon=lon, api_key=google_api_key, radius_m=radius_m)

    # ── Demand score + tier ───────────────────────────────────────────────────
    demand_score = compute_demand_score(
        node_density=osm_geo.get("node_density", 0.0),
        poi_count=osm_geo.get("poi_count", 0.0),
        population_density=population_density,
        competition_density=osm_geo.get("competition_density", 0.0),
        demand_anchor_count=osm_geo.get("demand_anchor_count", 0.0),
        avg_rating=google.get("avg_rating", 0.0),
        reviews_count=google.get("reviews_count", 0.0),
        brand_presence=google.get("brand_presence", 0.0),
        household_density=census.get("household_density", 0.0),
        income_proxy=census.get("income_proxy", 0.0),
    )
    location_tier, location_multiplier = get_location_tier(demand_score)

    signal_scores = {
        "road_network_score":        normalize_sqrt(osm_geo.get("node_density", 0.0), DEFAULT_MAX_NODE_DENSITY),
        "commercial_activity_score": normalize_sqrt(osm_geo.get("poi_count", 0.0), DEFAULT_MAX_POI_COUNT),
        "demand_anchor_score":       normalize_sqrt(osm_geo.get("demand_anchor_count", 0.0), DEFAULT_MAX_DEMAND_POI_COUNT),
        "population_score":          normalize_sqrt(population_density, DEFAULT_MAX_POP_DENSITY),
        "household_score":           normalize_sqrt(census.get("household_density", 0.0), DEFAULT_MAX_HOUSEHOLD_DENSITY),
        "income_score":              normalize(census.get("income_proxy", 0.0), 1.0),
        "competition_penalty_score": normalize(osm_geo.get("competition_density", 0.0), DEFAULT_MAX_COMPETITION_DENSITY),
    }

    return {
        # Location coordinates
        "lat": lat_f,
        "lon": lon_f,
        "city_name": city_name,
        "analysis_radius_m": _safe_float(radius_m, 500.0),

        # OSM signals
        "node_density":        _safe_float(osm_geo.get("node_density"), 0.0),
        "poi_count":           _safe_float(osm_geo.get("poi_count"), 0.0),
        "demand_anchor_count": _safe_float(osm_geo.get("demand_anchor_count"), 0.0),
        "competition_density": _safe_float(osm_geo.get("competition_density"), 0.0),
        "osm_mode_used":       osm_mode,

        # Population / census
        "population_density":  population_density,
        "household_density":   _safe_float(census.get("household_density"), 0.0),
        "income_proxy":        _safe_float(census.get("income_proxy"), 0.0),

        # Google
        "avg_rating":          _safe_float(google.get("avg_rating"), 0.0),
        "reviews_count":       _safe_float(google.get("reviews_count"), 0.0),
        "brand_presence":      _safe_float(google.get("brand_presence"), 0.0),

        # Demand + tier
        "demand_score":         demand_score,
        "location_tier":        location_tier,
        "location_multiplier":  location_multiplier,
        "geo_multiplier":       location_multiplier,  # api.py alias

        # Explainability
        "signal_scores":   signal_scores,
        "census_profile":  census,
        "google_signals":  google,
        "osm_signals":     osm_geo,
    }


# ── Singleton shim for api.py backward compat ─────────────────────────────────
class _GeoIntelligence:
    def get_location_score(self, lat: float, lon: float) -> Dict[str, Any]:
        bundle = build_geo_feature_bundle(lat=lat, lon=lon, use_live_osm=True, fast_live_mode=True)
        return {
            "location_score": bundle.get("demand_score", 0.5),
            "area_type": "urban" if bundle.get("population_density", 0) > 5000 else "suburban",
            "location_tier": bundle.get("location_tier", "medium"),
            "location_multiplier": bundle.get("location_multiplier", 1.0),
        }


geo_intelligence = _GeoIntelligence()
