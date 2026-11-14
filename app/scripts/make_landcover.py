# AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
"""What is burning: crops or wild land? Land cover of every fire cell in the
record, by month and year, for the app.

Land cover: ESA WorldCover 2021 (v200, 10 m, CC-BY-4.0), read through the
Microsoft Planetary Computer STAC API (a NASA Space Apps Global Offer; no
account needed), the same source as pipeline/landcover.py. That script samples
one year at cell centres for the project page; this one labels every fire
cell in every year, so the app can split the calendar.

Each 0.01 degree fire cell (about 1 km, the harmonization grid) gets its
dominant class: the most common class in the cell, read at about 100 m
(nearest neighbour, so every value is a real class code). Fires are counted once per satellite, date, half of the day and
cell, from the published hotspot files, split by harm_class:
`harmonized` (what MODIS would usually see) and `small` (the small-fire layer).

Writes app/public/data/<region>/landcover.json (contract in
docs/ARCHITECTURE.md). Run from the repo root:
    python -I app/scripts/make_landcover.py
Needs only numpy (the land cover comes from the Planetary Computer data API).
"""
import csv
import gzip
import io
import json
import math
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

DATA = Path(__file__).resolve().parents[1] / "public" / "data"
CELL = 0.01          # degrees, the harmonization grid (decision 6)
SUB = 10             # overview pixels per cell side: about 100 m
CLASSES = {10: "Tree cover", 20: "Shrubland", 30: "Grassland", 40: "Cropland", 50: "Built-up",
           60: "Bare or sparse", 70: "Snow and ice", 80: "Water", 90: "Herbaceous wetland",
           95: "Mangroves", 100: "Moss and lichen"}
# Four groups a fire manager reads at a glance. Order is the display order.
GROUPS = {"cropland": ("Cropland", [40]),
          "forest": ("Forest", [10, 95]),
          "grass_shrub": ("Grass and shrub", [20, 30, 90, 100]),
          "other": ("Other (built-up, bare, water, snow)", [50, 60, 70, 80])}
GROUP_OF = {c: g for g, (_n, cs) in GROUPS.items() for c in cs}


def count_fire_cells(region: Path):
    """Counter[(year, month, harm_class, cx, cy)] -> fire cells."""
    counts: Counter = Counter()
    for f in sorted((region / "hotspots").glob("*.csv.gz")):
        seen = set()
        with gzip.open(f) as raw:
            for r in csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8")):
                hc = r["harm_class"]
                if hc not in ("harmonized", "small"):
                    continue
                cx = math.floor(float(r["longitude"]) / CELL)
                cy = math.floor(float(r["latitude"]) / CELL)
                key = (r["satellite"], r["acq_date"], r["daynight"], cx, cy, hc)
                if key in seen:
                    continue
                seen.add(key)
                d = r["acq_date"]
                counts[(int(d[:4]), int(d[5:7]), hc, cx, cy)] += 1
    return counts


STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA_API = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox"


def _get(url: str, body: bytes | None = None) -> bytes:
    headers = {"Content-Type": "application/json", "User-Agent": "fire-census-make-landcover"}
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers), timeout=180) as r:
                return r.read()
        except Exception:  # noqa: BLE001 - network hiccup: wait and retry
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("unreachable")


def classify_cells(cells: set, bbox) -> dict:
    """(cx, cy) -> dominant WorldCover class, 0 where no data.

    Reads through the Planetary Computer data API, one 1 x 1 degree square at a
    time at 1000 x 1000 pixels (about 100 m), nearest neighbour, so every value
    is a real class code. Only squares that contain fire cells are read.
    """
    body = json.dumps({"collections": ["esa-worldcover"], "bbox": bbox, "limit": 100,
                       "query": {"esa_worldcover:product_version": {"eq": "2.0.0"}}}).encode()
    items = json.loads(_get(STAC, body))["features"]
    squares = defaultdict(list)
    for cx, cy in cells:
        squares[(cx // 100, cy // 100)].append((cx, cy))
    codes = np.array(sorted(CLASSES))
    out = {}
    for (lon, lat), mine in sorted(squares.items()):
        lon_c, lat_c = lon + 0.5, lat + 0.5
        item = next((i for i in items if i["bbox"][0] <= lon_c < i["bbox"][2] and i["bbox"][1] <= lat_c < i["bbox"][3]), None)
        if item is None:
            continue
        url = (f"{DATA_API}/{lon},{lat},{lon + 1},{lat + 1}/{100 * SUB}x{100 * SUB}.npy"
               f"?collection=esa-worldcover&item={item['id']}&assets=map&resampling=nearest")
        arr = np.load(io.BytesIO(_get(url)))
        a = np.where(arr[1] > 0, arr[0], 0)  # second band is the validity mask
        bad = set(np.unique(a).tolist()) - set(CLASSES) - {0}
        if bad:
            raise SystemExit(f"Unexpected class codes {bad} in {item['id']}")
        # Rows run north to south. Blocks of SUB x SUB pixels -> one cell.
        blocks = a.reshape(100, SUB, 100, SUB).transpose(0, 2, 1, 3).reshape(100, 100, SUB * SUB)
        tally = np.stack([(blocks == c).sum(axis=2) for c in codes], axis=2)
        dom = np.where(tally.max(axis=2) > 0, codes[tally.argmax(axis=2)], 0)
        for cx, cy in mine:
            out[(cx, cy)] = int(dom[(lat + 1) * 100 - 1 - cy, cx - lon * 100])
        print(f"  {item['id']} square {lon},{lat}: {len(mine)} cells", flush=True)
    return out


def main() -> None:
    regions = json.loads((DATA / "regions.json").read_text(encoding="utf-8"))
    only = set(sys.argv[1:])
    for reg in regions:
        rid = reg["id"]
        if only and rid not in only:
            continue
        region = DATA / rid
        if not (region / "hotspots").is_dir():
            continue
        print(rid, flush=True)
        counts = count_fire_cells(region)
        cells = {(k[3], k[4]) for k in counts}
        cls = classify_cells(cells, reg["bbox"])
        empty = lambda: {g: 0 for g in GROUPS}  # noqa: E731
        years = defaultdict(lambda: {"harmonized": empty(), "small": empty()})
        months = defaultdict(lambda: {"harmonized": empty(), "small": empty()})
        by_class = Counter()
        unlabelled = 0
        for (y, m, hc, cx, cy), n in counts.items():
            c = cls.get((cx, cy), 0)
            if c == 0:
                unlabelled += n
                continue
            g = GROUP_OF[c]
            years[y][hc][g] += n
            if f"{y}-{m:02d}" >= reg["harmonized_from"]:
                months[m][hc][g] += n
            if hc == "harmonized":
                by_class[CLASSES[c]] += n
        total = sum(by_class.values())
        doc = {
            "source": "ESA WorldCover 2021 v200 (10 m), via Microsoft Planetary Computer; CC-BY-4.0",
            "method": "Each 1 km fire cell (0.01 degree) takes its most common land cover, read at about 100 m. "
                      "Fire cells are counted once per satellite, date, half of the day and cell. "
                      "harmonized: fire cells MODIS would usually see; small: the small-fire layer (VIIRS, from 2012). "
                      "Land cover is the 2021 map for every year, so land that changed use earlier may be mislabelled.",
            "groups": [{"id": g, "name": n, "classes": [CLASSES[c] for c in cs]} for g, (n, cs) in GROUPS.items()],
            "years": [{"year": y, **years[y]} for y in sorted(years)],
            "months": [{"month": m, **months[m]} for m in sorted(months)],
            "harmonized_by_class": {k: v for k, v in by_class.most_common()},
            "share_by_class": {k: round(v / total, 4) for k, v in by_class.most_common()} if total else {},
            "unlabelled_fire_cells": unlabelled,
        }
        (region / "landcover.json").write_text(json.dumps(doc, separators=(",", ":")), encoding="utf-8")
        top = ", ".join(f"{k} {v:.1%}" for k, v in list(doc["share_by_class"].items())[:3])
        print(f"  {len(cells)} cells, {sum(counts.values())} fire cells, unlabelled {unlabelled}. {top}", flush=True)


if __name__ == "__main__":
    main()
