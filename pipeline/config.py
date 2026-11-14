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
    "cordoba": ("Córdoba and neighbouring areas, Argentina", -65.8, -35.0, -61.7, -29.5, "argentina"),
    "punjab-haryana": ("Punjab and Haryana, India", 73.8, 27.6, 77.6, 32.6, "india"),
    "chilecito": ("Chilecito and Famatina, La Rioja, Argentina", -68.2, -29.8, -66.8, -28.4, "argentina"),
    # Added 14 Nov after the start (decision 36): forests of south Karnataka and the Nilgiri edge
    # (Bandipur, Nagarhole, BR Hills, MM Hills). Not pre-registered; checks run the same way.
    "karnataka-south": ("Bandipur, Nagarhole and BR Hills, Karnataka, India", 75.8, 11.4, 77.8, 13.0, "india"),
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


def folder_info(name: str) -> tuple[str, str]:
    """(country, sensor family) for a raw folder.

    Archive folders end in a FIRMS request id (DL_FIRE_M-C61_845406).
    Folders written by refresh.py are named NRTAPI_<country>_<family>_<source>.
    """
    if name.startswith("NRTAPI_"):
        _, country, family, _source = name.split("_", 3)
        return country, family
    country, family, _ = REQUESTS[name.split("_")[-1]]
    return country, family


# Areas clipped to an exact outline (pipeline/areas/<area>.json, made by make_areas.py).
# Their box above is only used for the first, coarse cut.
def area_outline(area: str):
    """The outline record for an area, or None if the area is its box."""
    import json
    f = REPO / "pipeline" / "areas" / f"{area}.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None


def area_cells(area: str):
    """DataFrame of internal-grid cells (cx, cy) whose centre is inside the area's outline, or None."""
    rec = area_outline(area)
    if rec is None:
        return None
    import numpy as np
    import pandas as pd
    from shapely import contains_xy
    from shapely.geometry import shape
    geom = shape(rec["geometry"])
    w, s, e, n = rec["bbox"]
    cx = np.arange(int(np.floor(w / INTERNAL_CELL_DEG)), int(np.floor(e / INTERNAL_CELL_DEG)) + 1)
    cy = np.arange(int(np.floor(s / INTERNAL_CELL_DEG)), int(np.floor(n / INTERNAL_CELL_DEG)) + 1)
    gx, gy = np.meshgrid(cx, cy)
    gx, gy = gx.ravel(), gy.ravel()
    inside = contains_xy(geom, (gx + 0.5) * INTERNAL_CELL_DEG, (gy + 0.5) * INTERNAL_CELL_DEG)
    return pd.DataFrame({"cx": gx[inside].astype("int32"), "cy": gy[inside].astype("int32")})
