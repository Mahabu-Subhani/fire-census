"""Valid-observation counts from NASA's daily Aqua fire masks (MYD14A1).

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

FIRMS lists only fires. It cannot tell "no fire" from "not seen". MYD14A1 has a
daily FireMask for every 1 km pixel. Classes 3 (water), 5 (land), 7, 8 and 9
(fire) mean the pixel was seen clearly that day. Classes 0 to 2 (not
processed, e.g. outside the swath), 4 (cloud) and 6 (unknown) mean it was not.

For each 0.1 degree display cell and month we report `obs`: the average, over
the 1 km pixels inside the cell, of the number of days Aqua saw the pixel
clearly. A value near 0 means the month's count rests on almost no looks.

Stages:  python pipeline/obs.py download   (resumable; needs EARTHDATA_TOKEN in .env)
         python pipeline/obs.py process    (writes WORK/obs_<area>.parquet)
"""

import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from config import AREAS, DATA, DISPLAY_CELL_DEG, REPO, WORK

SHORT = "MYD14A1"
OUT = DATA / "modis" / SHORT
START, END = "2002-07-04", "2026-11-05"
R_EARTH = 6371007.181
T = 926.625433055833          # MODIS 1 km sinusoidal pixel size, metres
X0, Y0 = -20015109.354, 10007554.677
VALID = np.array([3, 5, 7, 8, 9])


def load_env() -> None:
    for line in (REPO / ".env").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def download() -> None:
    import earthaccess
    load_env()
    earthaccess.login(strategy="environment")
    OUT.mkdir(parents=True, exist_ok=True)
    seen = {}
    for name, west, south, east, north, _ in AREAS.values():
        for g in earthaccess.search_data(short_name=SHORT, version="061", bounding_box=(west, south, east, north),
                                         temporal=(START, END)):
            seen[g["umm"]["GranuleUR"]] = g
    todo = [g for ur, g in seen.items() if not any(OUT.glob(ur + "*.hdf"))]
    print(f"{len(seen)} granules in total, {len(todo)} to download", flush=True)
    for i in range(0, len(todo), 200):
        earthaccess.download(todo[i:i + 200], str(OUT), threads=8)
        print(f"downloaded {min(i + 200, len(todo))} of {len(todo)}", flush=True)


def tile_index(h: int, v: int, d: float):
    """For every pixel of a tile: lat, lon and the display-cell indices."""
    i, j = np.meshgrid(np.arange(1200), np.arange(1200), indexing="ij")
    x = X0 + (h * 1200 + j + 0.5) * T
    y = Y0 - (v * 1200 + i + 0.5) * T
    lat = np.degrees(y / R_EARTH)
    lon = np.degrees(x / (R_EARTH * np.cos(np.radians(lat))))
    return lat, lon, np.floor(lon / d).astype(int), np.floor(lat / d).astype(int)


def process() -> None:
    from pyhdf.SD import SD, SDC
    d = DISPLAY_CELL_DEG
    files = sorted(OUT.glob("*.hdf"))
    print(f"{len(files)} files", flush=True)
    cache, rows = {}, []
    for k, f in enumerate(files):
        parts = f.name.split(".")
        year, doy = int(parts[1][1:5]), int(parts[1][5:8])
        h, v = int(parts[2][1:3]), int(parts[2][4:6])
        if (h, v) not in cache:
            lat, lon, gx, gy = tile_index(h, v, d)
            masks = {}
            for area, (_, west, south, east, north, _) in AREAS.items():
                m = (lon >= west) & (lon < east) & (lat >= south) & (lat < north)
                if m.any():
                    masks[area] = (m, gx[m], gy[m])
            cache[(h, v)] = masks
        masks = cache[(h, v)]
        if not masks:
            continue
        try:
            fm = SD(str(f), SDC.READ).select("FireMask")[:]          # (days, 1200, 1200)
        except Exception as exc:                                    # a corrupt file is reported, not hidden
            print("unreadable:", f.name, exc, flush=True)
            continue
        if fm.ndim == 2:
            fm = fm[None]
        dates = pd.Timestamp(year, 1, 1) + pd.to_timedelta(np.arange(fm.shape[0]) + doy - 1, unit="D")
        for area, (m, cx, cy) in masks.items():
            valid = np.isin(fm[:, m], VALID)                         # (days, pixels)
            for t, day in enumerate(dates):
                df = pd.DataFrame({"cx": cx, "cy": cy, "v": valid[t]})
                g = df.groupby(["cx", "cy"])["v"].agg(["sum", "size"]).reset_index()
                g["ym"] = day.strftime("%Y-%m")
                g["area"] = area
                rows.append(g)
        if k % 200 == 0:
            print(f"processed {k} of {len(files)}", flush=True)
    allrows = pd.concat(rows, ignore_index=True)
    # Pixel-days: sum of clear looks and number of pixels per cell, per month.
    agg = allrows.groupby(["area", "cx", "cy", "ym"]).agg(clear=("sum", "sum"), pix=("size", "max"),
                                                          days=("size", "count")).reset_index()
    agg["obs"] = agg["clear"] / agg["pix"]             # mean clear-view days per 1 km pixel
    agg["lon"] = ((agg["cx"]) + 0.5) * d
    agg["lat"] = ((agg["cy"]) + 0.5) * d
    for area in AREAS:
        part = agg[agg["area"] == area][["lon", "lat", "ym", "obs", "days"]]
        part.to_parquet(WORK / f"obs_{area}.parquet", index=False)
        print(area, len(part), "cell-months; median clear-view days per pixel:",
              round(float(part["obs"].median()), 1))


if __name__ == "__main__":
    {"download": download, "process": process}[sys.argv[1]]()
