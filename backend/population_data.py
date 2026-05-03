"""Population dataset adapter for KiranaFlow AI backend.

`geo_utils.py` expects a `PopulationDatasetManager` with a
`.query_population(...)` API. This implementation returns None (no dataset match)
which keeps geo features working via city-profile + OSM signals.

Future: load official Census / SHRUG / Kaggle datasets here and return
structured rows when a lat/lon match is found.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


class PopulationDatasetManager:
    """Stub adapter — extend to load real government datasets."""

    def __init__(self) -> None:
        # projection_factors holds city-level multipliers for latest projections.
        self.projection_factors: Dict[str, float] = {}

    def load_csv(self, path: str, source_name: str = "csv_census") -> int:
        """Load a Census/Kaggle CSV. Returns number of rows loaded (stub: 0)."""
        return 0

    def load_excel(self, path: str, source_name: str = "excel_census") -> int:
        """Load an Excel Census table. Returns rows loaded (stub: 0)."""
        return 0

    def load_projection_factors(self, factors: Dict[str, float]) -> None:
        """Store city-level population projection multipliers."""
        self.projection_factors.update(factors)

    def is_ready(self) -> bool:
        """Return True when a dataset has been loaded."""
        return False

    def query_population(
        self,
        *,
        lat: float,
        lon: float,
        city_name: Optional[str] = None,
        address_text: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return a population row dict if a match is found, else None.

        Returning None means 'no government dataset match' — geo_utils
        will fall back to city profile + OSM signals automatically.
        """
        return None
