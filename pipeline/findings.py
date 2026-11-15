"""Two findings behind decision 57, made reproducible. Changes nothing that ships.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

Added after the results and after the method was frozen (15 Nov). It fits
nothing and adds no check and no verdict: it reads what harmonize.py and
export.py wrote and prints two tables that the documents quote.

1. The conversion constants follow the sun. For each area that fits its own
   constants, the rank correlation between the twelve daytime constants of
   the shipped model (meta.json, constants_by_month) and the height of the
   midday sun in that month at the area's latitude. If MODIS misses more
   against a hotter, brighter background, the constant falls as the sun
   climbs, in each hemisphere's own summer.
   Caution, printed with the result: each constant pools three calendar
   months, so neighbouring values are not independent and the p-value is too
   small; and season, crop and fire type change together, so this does not
   separate the causes.

2. Aqua against the record, by season. ln(sum of Aqua fire cells / sum of the
   harmonized record) before and after Aqua's orbit began to drift (2012-02
   to 2021-12; 2022-01 to 2026-10), for all months and for named seasons.
   Needs WORK/<area>_series.parquet; skipped if it is absent.

Run: python pipeline/findings.py     Output: WORK/findings.json
"""

import json
import math

import numpy as np
from scipy import stats

from config import APP_DATA, AREAS, REPO, WORK

MID_MONTH_DAY = (15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349)
PERIODS = (("2012 to 2021, stable orbit", "2012-02", "2021-12"), ("2022 to 2026, drifting orbit", "2022-01", "2026-10"))
SEASONS = {
    "punjab-haryana": {"rice-residue months, October and November": (10, 11),
                       "wheat-residue months, April to June": (4, 5, 6)},
    "cordoba": {"main fire season, June to December": (6, 7, 8, 9, 10, 11, 12),
                "January to May": (1, 2, 3, 4, 5)},
}


def midday_sun_height(latitude: float) -> np.ndarray:
    """Height of the sun above the horizon at local noon, in degrees, for the middle of each calendar month."""
    declination = np.array([23.44 * math.sin(2 * math.pi * (284 + d) / 365) for d in MID_MONTH_DAY])
    return 90.0 - np.abs(latitude - declination)


def constants_and_sun(area: str) -> dict | None:
    meta = json.loads((APP_DATA / area / "meta.json").read_text(encoding="utf-8"))
    if meta["calibration"]["area"] != area:            # borrowed constants say nothing about this area
        return None
    k = np.array(meta["constants_by_month"]["day"])
    _name, _west, south, _east, north, _country = AREAS[area]
    lat = (south + north) / 2
    rho, p = stats.spearmanr(k, midday_sun_height(lat))
    return {"model": meta["level_shipped"], "latitude": round(lat, 1),
            "constant_over_year_round": [round(float(x / meta["constants"]["day"]), 2) for x in k],
            "lowest_in_month": int(k.argmin()) + 1, "highest_in_month": int(k.argmax()) + 1,
            "rank_correlation_with_midday_sun_height": round(float(rho), 2), "p_not_independent": round(float(p), 4)}


def aqua_against_record(area: str, model: str) -> dict | None:
    f = WORK / f"{area}_series.parquet"
    if not f.exists():
        return None
    import pandas as pd
    s = pd.read_parquet(f).set_index("ym")
    month = s.index.str[5:7].astype(int)
    groups = {"all months": tuple(range(1, 13)), **SEASONS.get(area, {})}
    out = {}
    for name, months in groups.items():
        row = {}
        for label, lo, hi in PERIODS:
            m = (s.index >= lo) & (s.index <= hi) & np.isin(month, months)
            row[label] = {"ln_aqua_over_record": round(float(np.log(s.loc[m, "R"].sum() / s.loc[m, f"V_{model}_A"].sum())), 3),
                          "aqua_fire_cells": int(s.loc[m, "R"].sum())}
        out[name] = row
    return out


def main() -> None:
    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))["areas"]
    result = {"note": "Reads only. Nothing here is a check and nothing that ships depends on it.",
              "constants_and_sun": {}, "aqua_against_record": {}}
    print("Constants of the shipped model against the height of the midday sun")
    print("(each constant pools three months, so the p-values are too small; season, crop and fire type are confounded)")
    for area in AREAS:
        got = constants_and_sun(area)
        if got is None:
            continue
        result["constants_and_sun"][area] = got
        print(f"  {area} ({got['model']}, latitude {got['latitude']}): lowest in month {got['lowest_in_month']}, "
              f"highest in month {got['highest_in_month']}; rank correlation "
              f"{got['rank_correlation_with_midday_sun_height']:+.2f}")
    print("\nAqua against the harmonized record, ln(Aqua / record)")
    for area in SEASONS:
        got = aqua_against_record(area, shipping[area]["model"])
        if got is None:
            print(f"  {area}: WORK/{area}_series.parquet not found; run harmonize.py first")
            continue
        result["aqua_against_record"][area] = got
        for name, row in got.items():
            print(f"  {area}, {name}: " + "; ".join(f"{k} {v['ln_aqua_over_record']:+.3f} ({v['aqua_fire_cells']:,} Aqua cells)"
                                                   for k, v in row.items()))
    WORK.mkdir(parents=True, exist_ok=True)
    (WORK / "findings.json").write_text(json.dumps(result, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
