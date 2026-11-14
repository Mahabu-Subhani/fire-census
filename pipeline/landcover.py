"""What land burns in each area: ESA WorldCover at our fire cells.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

ESA WorldCover 2021 (10 m, v200), read through the Microsoft Planetary
Computer STAC API (a NASA Space Apps Global Offer; no account needed). For a
random sample of Suomi NPP VIIRS fire cells from the whole VIIRS era (2012 to
2025) in each area, we read the land cover class at the cell centre and report
the share by class, split into the part of the activity MODIS would see
(detection curve weight) and the part only VIIRS sees (the small-fire layer).
Shares also vary by year; the range across years is reported for the top
classes. (A first version used 2021 only, which was not typical for
Karnataka.)

Run after harmonize.py: python pipeline/landcover.py   Output: WORK/landcover.json
"""

import json

import numpy as np
import pandas as pd
import planetary_computer
import rasterio
from pystac_client import Client

from config import AREAS, INTERNAL_CELL_DEG, WORK

CLASSES = {10: "Tree cover", 20: "Shrubland", 30: "Grassland", 40: "Cropland", 50: "Built-up",
           60: "Bare or sparse", 70: "Snow and ice", 80: "Water", 90: "Herbaceous wetland",
           95: "Mangroves", 100: "Moss and lichen"}
SAMPLE = 6000
RNG = np.random.default_rng(20261114)


def main() -> None:
    cat = Client.open("https://planetarycomputer.microsoft.com/api/stac/v1",
                      modifier=planetary_computer.sign_inplace)
    out = {}
    for area, (name, west, south, east, north, _c) in AREAS.items():
        w = pd.read_parquet(WORK / f"{area}_weights.parquet", columns=["cx", "cy", "satellite", "ym", "p_A"])
        w = w[(w["satellite"] == "S-NPP") & (w["ym"].str[:4] >= "2012") & (w["ym"].str[:4] <= "2025")]
        if len(w) > SAMPLE:
            w = w.sample(SAMPLE, random_state=1)
        w["lon"] = (w["cx"] + 0.5) * INTERNAL_CELL_DEG
        w["lat"] = (w["cy"] + 0.5) * INTERNAL_CELL_DEG
        items = list(cat.search(collections=["esa-worldcover"], bbox=[west, south, east, north],
                                query={"esa_worldcover:product_version": {"eq": "2.0.0"}}).items())
        w["cls"] = 0
        for it in items:
            x0, y0, x1, y1 = it.bbox
            m = (w["lon"] >= x0) & (w["lon"] < x1) & (w["lat"] >= y0) & (w["lat"] < y1)
            if not m.any():
                continue
            with rasterio.open(it.assets["map"].href) as src:
                vals = [v[0] for v in src.sample(list(zip(w.loc[m, "lon"], w.loc[m, "lat"])))]
            w.loc[m, "cls"] = vals
        w = w[w["cls"] > 0]
        w["seen"] = w["p_A"]
        w["small"] = 1 - w["p_A"]
        g = w.groupby("cls")[["seen", "small"]].sum()
        g["cells"] = w.groupby("cls").size()
        shares = {}
        for cls, r in g.sort_values("cells", ascending=False).iterrows():
            shares[CLASSES.get(int(cls), str(cls))] = {
                "share_of_fire_cells": round(float(r["cells"] / g["cells"].sum()), 3),
                "share_of_modis_visible": round(float(r["seen"] / g["seen"].sum()), 3),
                "share_of_small_fire_layer": round(float(r["small"] / g["small"].sum()), 3)}
        w["year"] = w["ym"].str[:4]
        per_year = (w.groupby(["year", "cls"]).size() / w.groupby("year").size()).unstack(fill_value=0)
        year_range = {CLASSES.get(int(c), str(c)): [round(float(per_year[c].min()), 3), round(float(per_year[c].max()), 3)]
                      for c in g.sort_values("cells", ascending=False).index[:3]}
        out[area] = {"name": name, "sampled_fire_cells": int(len(w)), "years": "2012-2025 (Suomi NPP)",
                     "range_across_years": year_range,
                     "worldcover_tiles": len(items), "classes": shares}
        top = list(shares.items())[:3]
        print(area, len(w), "cells; range across years:", year_range, ";", "; ".join(f"{k} {v['share_of_fire_cells']:.0%} "
                                              f"(visible {v['share_of_modis_visible']:.0%}, small {v['share_of_small_fire_layer']:.0%})"
                                              for k, v in top))
    (WORK / "landcover.json").write_text(json.dumps(out, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
