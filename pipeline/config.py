"""Shared settings for the pipeline.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.
"""

import os
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Raw and intermediate data live outside git. Set FIRE_DATA to point elsewhere.
DATA = Path(os.environ.get("FIRE_DATA", REPO / "data"))
RAW = DATA / "raw"
WORK = DATA / "work"

APP_DATA = REPO / "app" / "public" / "data"
FIGURES = REPO / "submission" / "figures"

# Areas: id -> (name, west, south, east, north, country folder key).
# Boxes are approximate and documented in docs/DECISIONS.md (decisions 13, 14, 26).
AREAS = {
    "cordoba": ("Córdoba province, Argentina", -65.8, -35.0, -61.7, -29.5, "argentina"),
    "punjab-haryana": ("Punjab and Haryana, India", 73.8, 27.6, 77.6, 32.6, "india"),
    "chilecito": ("Chilecito and Famatina, La Rioja, Argentina", -68.2, -29.8, -66.8, -28.4, "argentina"),
}

# FIRMS request id -> (country, sensor family, platform). From the request list.
REQUESTS = {
    "845406": ("india", "MODIS", None),          # platform comes from the satellite column
    "845407": ("india", "VIIRS", "NOAA-20"),
    "845408": ("india", "VIIRS", "NOAA-21"),
    "845409": ("india", "VIIRS", "S-NPP"),
    "845410": ("argentina", "MODIS", None),
    "845411": ("argentina", "VIIRS", "NOAA-20"),
    "845412": ("argentina", "VIIRS", "NOAA-21"),
    "845413": ("argentina", "VIIRS", "S-NPP"),
}

INTERNAL_CELL_DEG = 0.01   # decision 6
DISPLAY_CELL_DEG = 0.1     # decision 16
HARMONIZED_FROM = "2002-07"  # Aqua's first full month
MODIS_MIN_CONFIDENCE = 30  # decision 8
