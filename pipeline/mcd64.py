"""Check C6m: NASA MCD64A1 burned area as a second independent reference.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Added after the results; not pre-registered. It repeats check C6 with NASA's
own MODIS burned-area product (MCD64A1 Collection 6.1, 500 m, monthly,
November 2000 onwards) instead of ESA Fire_cci, read through the Microsoft
Planetary Computer, a NASA Space Apps Global Offer. Like Fire_cci it is made
by one algorithm throughout, so it has no 2012 seam.

Same statistic as C6: annual harmonized activity divided by annual burned
area; ln of [median 2013 to 2019] over [median 2003 to 2011]; limit 0.25.
Also reported for 2013 to 2025 (MCD64A1 runs past Fire_cci's 2020 end), and
for Aqua alone, which has no sensor change.

Run: python pipeline/mcd64.py    Output: WORK/mcd64_monthly.parquet, WORK/c6m.json
"""

import json
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd

from config import AREAS, REPO, WORK, area_outline

PIXEL_KM2 = (463.312716528 / 1000) ** 2
_CACHE: dict = {}


def area_mask(area, src, window):
    """Pixels of this window whose centre is inside the area (box or exact outline)."""
    key = (area, src.name.split("?")[0], window.col_off, window.row_off, window.width, window.height)
    if key in _CACHE:
        return _CACHE[key]
    from pyproj import Transformer
    from shapely import contains_xy
    from shapely.geometry import box, shape
    t = src.window_transform(window)
    rows, cols = np.mgrid[0:int(window.height), 0:int(window.width)]
    x = t.c + (cols + 0.5) * t.a
    y = t.f + (rows + 0.5) * t.e
    lon, lat = Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True).transform(x, y)
    rec = area_outline(area)
    _n, w, s, e, n, _c = AREAS[area]
    geom = shape(rec["geometry"]) if rec else box(w, s, e, n)
    _CACHE[key] = contains_xy(geom, lon, lat)
    return _CACHE[key]


def one_item(args):
    href, ym, area = args
    import rasterio
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds
    _n, w, s, e, n, _c = AREAS[area]
    for attempt in range(3):
        try:
            with rasterio.open(href) as src:
                b = transform_bounds("EPSG:4326", src.crs, w, s, e, n, densify_pts=21)
                win = from_bounds(*b, transform=src.transform).round_offsets().round_lengths()
                full = rasterio.windows.Window(0, 0, src.width, src.height)
                if not rasterio.windows.intersect(win, full):
                    # The catalogue search returns tiles touching the box; this one has no pixel in it.
                    return {"href": href.split("?")[0], "ym": ym, "area": area, "km2": 0.0}
                win = win.intersection(full)
                data = src.read(1, window=win)
                mask = area_mask(area, src, win)
                burned = int(((data > 0) & mask).sum())
            return {"href": href.split("?")[0], "ym": ym, "area": area, "km2": burned * PIXEL_KM2}
        except Exception as exc:
            err = str(exc)[:120]
    return {"href": href.split("?")[0], "ym": ym, "area": area, "error": err}


def items_for(area):
    import planetary_computer
    from pystac_client import Client
    cat = Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=planetary_computer.sign_inplace)
    _n, w, s, e, n, _c = AREAS[area]
    out = []
    for lo, hi in (("2000-11-01", "2009-12-31"), ("2010-01-01", "2018-12-31"), ("2019-01-01", "2026-11-13")):
        for it in cat.search(collections=["modis-64A1-061"], bbox=[w, s, e, n], datetime=f"{lo}/{hi}").items():
            dt = it.datetime or pd.Timestamp(it.properties["start_datetime"])
            out.append((it.assets["Burn_Date"].href, pd.Timestamp(dt).strftime("%Y-%m"), area))
    return out


def statistic(ratio, early, late):
    return float(np.log(ratio.loc[late[0]:late[1]].median() / ratio.loc[early[0]:early[1]].median()))


def main() -> None:
    # The cache keeps the tile-months already read (one row per tile, month and area). A tile-month
    # missing from it is read again on every run; until 15 Nov failed ones were dropped for good, so
    # a year could be summed over fewer tiles than exist without any warning.
    cache = WORK / "mcd64_monthly.parquet"
    df = pd.read_parquet(cache) if cache.exists() else pd.DataFrame(columns=["href", "ym", "area", "km2"])
    jobs = [j for area in AREAS for j in items_for(area)]
    done = set(zip(df.get("href", pd.Series(dtype=str)), df["area"]))
    todo = [j for j in jobs if (j[0].split("?")[0], j[2]) not in done]
    print(len(jobs), "tile-months in the catalogue,", len(todo), "to read", flush=True)
    if todo:
        with ProcessPoolExecutor(max_workers=8) as pool:
            rows = pd.DataFrame(list(pool.map(one_item, todo, chunksize=8)))
        if "error" in rows:
            bad = rows[rows["error"].notna()]
            if len(bad):
                print(len(bad), "tile-months failed (read again on the next run)", bad.head(3).to_dict("records"))
            rows = rows[rows["error"].isna()].drop(columns="error")
        df = pd.concat([df, rows], ignore_index=True)
        df.to_parquet(cache, index=False)
    missing = len(jobs) - len(set(zip(df["href"], df["area"])) & {(j[0].split("?")[0], j[2]) for j in jobs})
    if missing:
        print(f"WARNING: {missing} tile-months still unread; values below use fewer tiles than exist")
    df = df.astype({"km2": float})
    monthly = df.groupby(["area", "ym"])["km2"].sum().unstack(0)     # tiles of one month summed
    annual = monthly.groupby(monthly.index.str[:4].astype(int)).sum()
    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))["areas"]
    result = {}
    for area in AREAS:
        s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
        yr_idx = s.index.str[:4].astype(int)
        h = s["R"].astype(float).where(s.index < "2012-02", s[f"V_{shipping[area]['model']}_A"]).groupby(yr_idx).sum()
        aqua = s["R"].groupby(yr_idx).sum()
        raw = s["L0"].groupby(yr_idx).sum()
        ba = annual[area].replace(0, np.nan)
        stat = statistic(h / ba, (2003, 2011), (2013, 2019))
        result[area] = {
            "value": round(stat, 3), "verdict": "pass" if abs(stat) <= 0.25 else "fail",
            "value_2013_2025": round(statistic(h / ba, (2003, 2011), (2013, 2025)), 3),
            "aqua_only_same_statistic": round(statistic(aqua / ba, (2003, 2011), (2013, 2019)), 3),
            "raw_record_same_statistic": round(statistic(raw / ba, (2003, 2011), (2013, 2019)), 3),
            "months_read": int(monthly[area].notna().sum()),
            "median_annual_burned_km2": round(float(ba.loc[2003:2025].median()), 1),
            "note": "NASA MCD64A1 C6.1 via Microsoft Planetary Computer; added after results, not pre-registered",
        }
        r = result[area]
        print(f"{area}: C6m {r['value']:+.3f} ({r['verdict']}); 2013-2025 {r['value_2013_2025']:+.3f}; "
              f"Aqua alone {r['aqua_only_same_statistic']:+.3f}; raw {r['raw_record_same_statistic']:+.3f}; "
              f"months {r['months_read']}; median burned {r['median_annual_burned_km2']} km2/yr")
    (WORK / "c6m.json").write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
