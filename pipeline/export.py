"""Export the app's data files in the contract shape (docs/ARCHITECTURE.md).

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Which model fills `harm` for each area is read from pipeline/shipping.json, so
that the choice is a recorded decision and not something buried in code.

Units. `harm` is in Aqua-equivalent fire cells: the number of 0.01 degree
cell-overpasses Aqua MODIS reported (before February 2012) or would be expected
to report (after). `small` is the part of the VIIRS fire cells that the
detection curve says MODIS would miss. Before July 2002 only Terra flew:
`harm` then holds Terra fire cells and `terra_only` is true.

Run: python pipeline/export.py
"""

import json
import subprocess
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from config import APP_DATA, AREAS, DISPLAY_CELL_DEG, HARMONIZED_FROM, REPO, WORK
from harmonize import VIIRS_OPS

VIIRS_START = "2012-02"
CHECKS = [
    ("C0", "The raw record shows the 2012 jump", "greater than 0.5"),
    ("C1", "No seam at 2012", "absolute value at most 0.10"),
    ("C1b", "No change point at 2012 (Pettitt)", "no change point with p < 0.05 between Jul 2011 and Dec 2012"),
    ("C2", "No seam at placebo dates (2016, 2008)", "absolute value at most 0.10 at both"),
    ("C3", "Held-out years 2018 to 2019", "median absolute log ratio at most 0.15"),
    ("C3r", "Held-out years, two-year total (revised after results)", "absolute log ratio at most 0.10"),
    ("C4", "NOAA-20 alone reproduces the record", "slope 0.90 to 1.10 and correlation at least 0.90"),
    ("C5", "Curve midpoint is physically plausible", "within a factor of 2 of published limits"),
    ("C6", "Burned-area relationship is stable", "absolute log ratio at most 0.25"),
    ("C7", "Punjab peak moves later after 2009", "at least +5 days, p < 0.05"),
    ("C8", "Curve is stable under resampling", "90% range at most 50% of the midpoint"),
]
MODEL_NAMES = {"S0": "Detection curve", "L2": "Hard floor", "L1r": "Constant ratio (fallback)"}


def verdict_of(ok: bool) -> str:
    return "pass" if ok else "fail"


def git_commit() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=REPO,
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        return ""


def display(df: pd.DataFrame) -> pd.DataFrame:
    d = DISPLAY_CELL_DEG
    df = df.copy()
    df["lon"] = ((df["cx"] // 10) + 0.5) * d     # cx counts 0.01 degree steps
    df["lat"] = ((df["cy"] // 10) + 0.5) * d
    return df


def keep_dates(df: pd.DataFrame, date_filter) -> pd.DataFrame:
    if date_filter is None:
        return df
    return df[date_filter(pd.to_datetime(df["acq_date"])).to_numpy()]


def build_cube(area: str, model: str, variant: str, rel_sd: float, date_filter=None) -> pd.DataFrame:
    key = ["lon", "lat", "ym"]
    cells = display(keep_dates(pd.read_parquet(WORK / f"{area}_cells.parquet"), date_filter))
    raw = keep_dates(pd.read_parquet(WORK / f"{area}.parquet", columns=["cx", "cy", "acq_date", "sensor"]),
                     date_filter)
    raw["ym"] = pd.to_datetime(raw["acq_date"]).dt.strftime("%Y-%m")
    raw = display(raw)
    cube = pd.DataFrame({
        "raw_modis": raw[raw["sensor"] == "MODIS"].groupby(key).size(),
        "raw_viirs": raw[raw["sensor"] == "VIIRS"].groupby(key).size(),
        "aqua": cells[cells["satellite"] == "Aqua"].groupby(key).size(),
        "terra": cells[cells["satellite"] == "Terra"].groupby(key).size(),
    })

    w = display(keep_dates(pd.read_parquet(WORK / f"{area}_weights.parquet"), date_filter))
    col = f"{model}_{variant}"
    w["w"], w["w2"], w["sm"] = w[col], w[col] ** 2, 1.0 - w[f"p_{variant}"]
    per = w.groupby(key + ["satellite"])[["w", "w2", "sm"]].sum().reset_index()
    lo = per["satellite"].map(lambda s: VIIRS_OPS[s][0])
    hi = per["satellite"].map(lambda s: VIIRS_OPS[s][1])
    per = per[(per["ym"] >= lo) & (per["ym"] <= hi)]
    n_ops = per["ym"].map(lambda m: sum(a <= m <= b for a, b in VIIRS_OPS.values()))
    per["w"], per["sm"], per["w2"] = per["w"] / n_ops, per["sm"] / n_ops, per["w2"] / n_ops ** 2
    v = per.groupby(key)[["w", "w2", "sm"]].sum()

    cube = cube.join(v, how="outer").fillna(0.0).reset_index()
    late = cube["ym"] >= VIIRS_START
    early = cube["ym"] < HARMONIZED_FROM
    cube["harm"] = np.where(late, cube["w"], np.where(early, cube["terra"], cube["aqua"]))
    sd = np.where(late, np.sqrt(cube["w2"] + (rel_sd * cube["w"]) ** 2), 0.0)
    cube["harm_lo"] = np.clip(cube["harm"] - 1.645 * sd, 0, None)
    cube["harm_hi"] = cube["harm"] + 1.645 * sd
    cube["small"] = np.where(late, cube["sm"], 0.0)
    cube["terra_only"] = early
    keep = (cube[["raw_modis", "raw_viirs", "harm", "small"]].sum(axis=1) > 0)
    return cube[keep].sort_values(["ym", "lat", "lon"])


def main() -> None:
    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    checks = json.loads((WORK / "checks.json").read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    regions = []
    for area_id, (name, west, south, east, north, _country) in AREAS.items():
        choice = shipping["areas"][area_id]
        model, variant = choice["model"], choice["variant"]
        donor = curves["transfer"].get(area_id, area_id)
        fits = curves["areas"][donor]
        fd, fn = fits[f"{variant}_D"], fits[f"{variant}_N"]
        cube = build_cube(area_id, model, variant, fd["rel_sd_k"])

        # Freshness and month-to-date (contract fields added 14 Nov, docs/APP_VISION.md).
        dates = pd.read_parquet(WORK / f"{area_id}.parquet", columns=["acq_date", "is_nrt"])
        dates["acq_date"] = pd.to_datetime(dates["acq_date"])
        through = dates["acq_date"].max()
        nrt_from = dates.loc[dates["is_nrt"], "acq_date"].min().strftime("%Y-%m")
        mon, day = through.month, through.day
        part = build_cube(area_id, model, variant, fd["rel_sd_k"],
                          date_filter=lambda d: (d.dt.month == mon) & (d.dt.day <= day))
        cube = cube.merge(part[["lon", "lat", "ym", "harm"]].rename(columns={"harm": "mtd"}),
                          on=["lon", "lat", "ym"], how="left")
        in_month = cube["ym"].str[5:7] == f"{mon:02d}"
        cube.loc[in_month & cube["mtd"].isna(), "mtd"] = 0.0
        cube.loc[~in_month, "mtd"] = np.nan

        # Optional `obs`: mean clear-view days per 1 km pixel, from Aqua's daily fire masks (obs.py).
        obs_file = WORK / f"obs_{area_id}.parquet"
        if obs_file.exists():
            obs = pd.read_parquet(obs_file)[["lon", "lat", "ym", "obs"]]
            obs["lon"], obs["lat"] = obs["lon"].round(3), obs["lat"].round(3)
            cube["lon"], cube["lat"] = cube["lon"].round(3), cube["lat"].round(3)
            cube = cube.merge(obs, on=["lon", "lat", "ym"], how="left")
        else:
            cube["obs"] = np.nan

        rows = [{"lon": round(float(r.lon), 3), "lat": round(float(r.lat), 3), "ym": r.ym,
                 "raw_modis": int(r.raw_modis), "raw_viirs": int(r.raw_viirs),
                 "harm": round(float(r.harm), 2), "harm_lo": round(float(r.harm_lo), 2),
                 "harm_hi": round(float(r.harm_hi), 2), "small": round(float(r.small), 2),
                 "terra_only": bool(r.terra_only),
                 "mtd": None if pd.isna(r.mtd) else round(float(r.mtd), 2),
                 "obs": None if pd.isna(r.obs) else int(round(float(r.obs)))} for r in cube.itertuples()]
        out = APP_DATA / area_id
        out.mkdir(parents=True, exist_ok=True)
        (out / "cube.json").write_text(json.dumps(rows, separators=(",", ":")), encoding="utf-8")

        res = checks[area_id]["variants"][variant]
        mine = res["checks"][model]
        check_rows = []
        for cid, cname, threshold in CHECKS:
            got = dict(mine.get(cid, {}))
            if cid == "C7" and "C7" in res:
                got = {"value": res["C7"]["value"], "verdict": res["C7"]["verdict"]}
            if cid == "C5" and (WORK / "evidence.json").exists():
                c5 = json.loads((WORK / "evidence.json").read_text(encoding="utf-8"))["c5"].get(donor)
                if c5:
                    dd, nn = c5["D"], c5["N"]
                    got = {"value": f"day {dd['our_midpoint_MW']} MW vs published {dd['published_nadir_MW']} "
                                    f"(x{dd['ratio_to_nadir']}); night {nn['our_midpoint_MW']} MW vs "
                                    f"{nn['published_nadir_MW']} (x{nn['ratio_to_nadir']})",
                           "verdict": verdict_of(dd["pass_factor_2"] and nn["pass_factor_2"]),
                           "note": "published nadir limits from Sofiev and Kouznetsov (2026), GMD 19, 10123. "
                                   f"At the mean Aqua pixel size over this area the published day limit is "
                                   f"{dd['published_at_mean_pixel_MW']} MW"}
            if cid == "C6":
                got = {"value": None, "verdict": "not run",
                       "note": "ESA Fire_cci burned area not processed in the time available"}
            if cid == "C8" and model != "S0":
                got = dict(res["checks"]["S0"].get("C8", {}))
                got["note"] = "applies to the detection curve, which is used for the small-fire layer"
            note = got.get("note", "")
            if not got:
                note = {"C5": "published limits not yet verified against their source",
                        "C6": "burned-area data not yet obtained",
                        "C7": "defined for Punjab and Haryana only"}.get(cid, "")
            if donor != area_id:
                note = (note + " " if note else "") + f"curve and constants borrowed from {donor}; too few fires here to calibrate"
            check_rows.append({"id": cid, "name": cname, "value": got.get("value"), "threshold": threshold,
                               "verdict": got.get("verdict", "not run"), "note": note.strip()})

        centres = curves["centres"]
        meta = {
            "level_shipped": model,
            "level_name": MODEL_NAMES[model],
            "shipping_reason": choice["reason"],
            "unit": "Aqua-equivalent fire cells",
            "unit_note": ("One fire cell is a 1 km square (0.01 degree) with fire in one satellite pass. "
                          "Before February 2012: what Aqua MODIS reported. From February 2012: what Aqua "
                          "would have reported, computed from VIIRS with the detection curve."),
            "unit_raw": "FIRMS hotspot detections (MODIS + VIIRS), not harmonized",
            "calibration": {"variant": variant, "months": curves["calibration"][variant],
                            "reference_pair": "Aqua MODIS and S-NPP VIIRS", "area": donor},
            "floor_mw": {"day": round(fd["f50"], 2), "night": round(fn["f50"], 2)},
            "constants": {"day": round(fd[{"S0": "k_curve", "L2": "k_floor", "L1r": "k_ratio"}[model]], 4),
                          "night": round(fn[{"S0": "k_curve", "L2": "k_floor", "L1r": "k_ratio"}[model]], 4)},
            "ladder": res["ladder"],
            "checks": check_rows,
            "all_models": {m: {c: v["verdict"] for c, v in res["checks"][m].items()}
                           for m in ("S0", "L2", "L1r")},
            "curve": {dn_key: [{"frp": round(c, 3), "p": round(p, 4), "p_lo": round(a, 4), "p_hi": round(b, 4)}
                               for c, p, a, b in zip(centres, f["p_norm"], f["p_lo"], f["p_hi"])]
                      for dn_key, f in (("day", fd), ("night", fn))},
            "curve_stats": {"day": {k: fd[k] for k in ("n_snpp_cells", "n_aqua_cells", "match_rate",
                                                       "control_rate", "plateau", "f50", "f50_lo", "f50_hi")},
                            "night": {k: fn[k] for k in ("n_snpp_cells", "n_aqua_cells", "match_rate",
                                                         "control_rate", "plateau", "f50", "f50_lo", "f50_hi")}},
            "data_version": "0.2.0",
            "code_commit": git_commit(),
            "generated_at": now,
            "data_through": through.strftime("%Y-%m-%d"),
            "nrt_from": nrt_from,
            "sources": ["MODIS Collection 6.1 (Terra, Aqua), NASA FIRMS archive",
                        "VIIRS 375 m Collection 2 (S-NPP, NOAA-20, NOAA-21), NASA FIRMS archive"],
        }
        (out / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        regions.append({"id": area_id, "name": name, "bbox": [west, south, east, north],
                        "cell_deg": DISPLAY_CELL_DEG, "first_month": cube["ym"].min(),
                        "last_month": cube["ym"].max(), "harmonized_from": HARMONIZED_FROM})
        size = (out / "cube.json").stat().st_size / 1e6
        print(f"{area_id}: model {model} variant {variant}, {len(rows):,} rows, cube.json {size:.2f} MB")
    (APP_DATA / "regions.json").write_text(json.dumps(regions, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
