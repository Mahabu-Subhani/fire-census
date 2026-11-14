"""Check C6: ESA Fire_cci burned area as an independent, seam-free reference.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

ESA's Fire_cci v5.1 gridded burned area (0.25 degree, monthly, 2001 to 2020)
is built from MODIS 250 m reflectance with one algorithm throughout, so it has
no 2012 seam. If our harmonization works, the ratio of harmonized fire activity
to burned area should be about the same before and after 2012.

Pre-registered (docs/PREREGISTRATION.md, C6): annual harmonized activity divided
by annual burned area; ln of [median 2013 to 2019] over [median 2003 to 2011];
pass if the absolute value is at most 0.25. Gated for Córdoba only; reported,
not gated, for Punjab and Haryana, where Fire_cci misses small crop fires.

Reads only each area's rows from each file (netCDF byte-range requests), about
13 seconds per file. Run: python pipeline/firecci.py
"""

import json
from concurrent.futures import ProcessPoolExecutor   # netCDF-C is not thread-safe: use processes

import netCDF4
import numpy as np
import pandas as pd

from config import AREAS, REPO, WORK

URL = ("https://dap.ceda.ac.uk/neodc/esacci/fire/data/burned_area/MODIS/grid/v5.1/"
       "{y}/{y}{m:02d}01-ESACCI-L4_FIRE-BA-MODIS-fv5.1.nc#mode=bytes")
YEARS = range(2001, 2021)


def one_month(args):
    y, m = args
    for attempt in range(3):
        try:
            ds = netCDF4.Dataset(URL.format(y=y, m=m))
            lat, lon = ds["lat"][:], ds["lon"][:]
            out = {}
            for area, (_n, west, south, east, north, _c) in AREAS.items():
                yi = np.where((lat <= north) & (lat >= south))[0]
                xi = np.where((lon >= west) & (lon <= east))[0]
                block = ds["burned_area"][0, yi.min():yi.max() + 1, xi.min():xi.max() + 1]
                out[area] = float(np.ma.filled(block, 0).sum()) / 1e6      # km2
            ds.close()
            return {"ym": f"{y}-{m:02d}", **out}
        except Exception as exc:                                          # retried, then reported
            err = exc
    return {"ym": f"{y}-{m:02d}", "error": str(err)[:120]}


def main() -> None:
    cache = WORK / "firecci_monthly.parquet"
    if cache.exists():
        ba = pd.read_parquet(cache)
    else:
        months = [(y, m) for y in YEARS for m in range(1, 13)]
        with ProcessPoolExecutor(max_workers=8) as pool:
            rows = list(pool.map(one_month, months))
        ba = pd.DataFrame(rows)
        bad = ba[ba.get("error").notna()] if "error" in ba else ba.iloc[0:0]
        if len(bad):
            print("months that failed:", bad[["ym", "error"]].to_string())
        ba = ba[ba.get("error").isna()] if "error" in ba else ba
        ba.drop(columns=[c for c in ("error",) if c in ba]).to_parquet(cache, index=False)
    ba["year"] = ba["ym"].str[:4].astype(int)
    annual_ba = ba.groupby("year")[list(AREAS)].sum()

    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))["areas"]
    result = {}
    for area in AREAS:
        model = shipping[area]["model"]
        s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
        h = s["R"].astype(float).where(s.index < "2012-02", s[f"V_{model}_A"])
        yr = h.groupby(s.index.str[:4].astype(int)).sum()
        both = pd.concat([yr, annual_ba[area]], axis=1, keys=["H", "BA"]).dropna()
        both = both[both["BA"] > 0]
        ratio = both["H"] / both["BA"]
        early = ratio[(ratio.index >= 2003) & (ratio.index <= 2011)]
        late = ratio[(ratio.index >= 2013) & (ratio.index <= 2019)]
        raw = s["L0"].groupby(s.index.str[:4].astype(int)).sum() / annual_ba[area]
        raw_stat = float(np.log(raw.loc[2013:2019].median() / raw.loc[2003:2011].median()))
        # Diagnostic, not pre-registered: Aqua alone has no sensor change, so this is what the
        # statistic gives when there is no seam at all. Our record minus this = the seam's share.
        aqua = s["R"].groupby(s.index.str[:4].astype(int)).sum() / annual_ba[area]
        aqua_stat = float(np.log(aqua.loc[2013:2019].median() / aqua.loc[2003:2011].median()))
        stat = float(np.log(late.median() / early.median()))
        months = int(ba["ym"].nunique())
        result[area] = {
            "value": round(stat, 3), "verdict": "pass" if abs(stat) <= 0.25 else "fail",
            "gated": area == "cordoba",
            "raw_record_same_statistic": round(raw_stat, 3),
            "aqua_only_same_statistic": round(aqua_stat, 3),
            "seam_share": round(stat - aqua_stat, 3),
            "missing_months": sorted(set(f"{y}-{m:02d}" for y in YEARS for m in range(1, 13)) - set(ba["ym"])),
            "fire_cci_months": months,
            "annual_burned_km2": {int(k): round(float(v), 1) for k, v in annual_ba[area].items()},
            "note": ("ESA Fire_cci v5.1 burned area, 2001 to 2020; " + (
                "gated for this area" if area == "cordoba"
                else "reported, not gated: Fire_cci misses many small fires here" if area == "punjab-haryana"
                else "not pre-registered for this area; reported only")),
        }
        print(f"{area}: C6 {stat:+.3f} ({result[area]['verdict']}); Aqua alone {aqua_stat:+.3f}; raw record {raw_stat:+.3f}; "
              f"months {months}; median burned area {annual_ba[area].median():.0f} km2 a year")
    (WORK / "c6.json").write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
