"""Leave-one-year-out test of the harmonization (added after results, not pre-registered).

AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending).

Why. Check C1 ("no seam at 2012") fits its constant on 2012 to 2017 and tests
on 2012 to 2015, so it is partly in-sample. Here every number is out of sample:

  1. Leave one year out. For each year Y from 2012 to 2021 the curve and the
     constants are fitted on the other years, and year Y's S-NPP record is
     compared with what Aqua actually reported: ln(H_Y / R_Y). Aqua's orbit
     drifts from 2022, so the pool stops at 2021.
  2. The 2012 seam, out of window. Fitted on February 2015 to December 2021
     only, tested on February 2012 to January 2015 (the after-window of C1).
     Before 2012 the record is Aqua itself, so this log ratio is C1's statistic.
  Since 15 Nov each model is fitted as it ships: one constant per calendar month
  for daytime cells, from the train months only (decision 57).
  3. Month scatter. The root-mean-square of the out-of-sample monthly
     ln(H / R), over months with at least 30 Aqua fire cells. The app uses it
     for the range on "Nth highest of N".

Reads WORK/<area>_cells.parquet only; writes WORK/loyo.json. Run after harmonize.py:
    python pipeline/loyo.py            then    python pipeline/loyo.py --patch-meta
`--patch-meta` writes the result into app/public/data/<area>/meta.json without
rebuilding the cubes.
"""

import json
import sys

import duckdb
import numpy as np
import pandas as pd

from config import APP_DATA, AREAS, WORK
from harmonize import TRANSFER, calendar_month, fit_curve, match_table, month_bin_counts, seasonal_constants

POOL = ("2012-02", "2021-12")
SEAM_TEST = ("2012-02", "2015-01")
MIN_CELLS = 30
LIMIT = 0.10
MODELS = {"S0": "detection curve", "L2": "hard floor", "L1r": "conversion ratio"}
CHECK = ("C1x", "No seam at 2012, out of sample (added after results)", "absolute log ratio at most 0.10")


def area_counts(con: duckdb.DuckDBPyConnection, area: str) -> dict:
    """Per day/night class: S-NPP counts by [month, bin], Aqua matches, chance matches, Aqua cells."""
    src = (WORK / f"{area}_cells.parquet").as_posix()
    con.execute(f"create or replace table cells as select * from '{src}'")
    match = match_table(con)
    aqua = con.execute("select ym, dn, count(*) n from cells where satellite = 'Aqua' group by 1, 2").df()
    months = sorted(m for m in set(match["ym"]) | set(aqua["ym"]) if POOL[0] <= m <= POOL[1])
    out = {"months": np.array(months), "cal_month": calendar_month(months)}
    for dn in ("D", "N"):
        sub = match[(match["dn"] == dn) & match["ym"].isin(months)]
        n, h, c = month_bin_counts(sub, months)
        aq = aqua[aqua["dn"] == dn].set_index("ym")["n"].reindex(months).fillna(0).to_numpy(float)
        # Month index and strength of every S-NPP fire cell, for the hard floor's exact threshold.
        each = (pd.Categorical(sub["ym"], categories=months).codes, sub["frp_sum"].to_numpy())
        out[dn] = (n, h, c, aq, each)
    return out


def predict(data: dict, train: np.ndarray, test: np.ndarray) -> dict:
    """Monthly H for the test months under each model, fitted on the train months; and Aqua's R."""
    h = {m: np.zeros(int(test.sum())) for m in MODELS}
    r = np.zeros(int(test.sum()))
    for dn in ("D", "N"):
        n, hit, ctrl, aq, (month_of, frp) = data[dn]
        r += aq[test]
        if n[train].sum() == 0:
            continue
        _, p, _, f50 = fit_curve(n[train], hit[train], ctrl[train])
        # Cells per month under each model. The hard floor counts each cell on its own strength,
        # exactly as harmonize.py applies it (not by whole strength bins).
        above = np.bincount(month_of[frp >= f50], minlength=len(aq)).astype(float)
        per_month = {"S0": n @ p, "L2": above, "L1r": n.sum(axis=1)}
        calm = data["cal_month"]
        for m, cells in per_month.items():
            k = aq[train].sum() / max(cells[train].sum(), 1e-9)
            if dn == "D":      # one constant per calendar month, fitted on the train months only (decision 57)
                k_m = seasonal_constants(aq[train], cells[train], calm[train], k)
                h[m] += k_m[calm[test] - 1] * cells[test]
            else:
                h[m] += k * cells[test]
    return {"h": h, "r": r}


def log_ratio(h: float, r: float):
    return float(np.log(h / r)) if h > 0 and r > 0 else None


def run_area(con: duckdb.DuckDBPyConnection, area: str) -> dict:
    data = area_counts(con, area)
    months = data["months"]
    years = sorted({m[:4] for m in months})
    res = {m: {"years": {}, "monthly": []} for m in MODELS}
    for y in years:
        test = np.array([m.startswith(y) for m in months])
        got = predict(data, ~test, test)
        ok = got["r"] >= MIN_CELLS
        for m in MODELS:
            res[m]["years"][y] = log_ratio(got["h"][m].sum(), got["r"].sum())
            with np.errstate(divide="ignore"):
                lr = np.log(got["h"][m][ok] / got["r"][ok])
            res[m]["monthly"] += [float(v) for v in lr if np.isfinite(v)]
    seam_test = (months >= SEAM_TEST[0]) & (months <= SEAM_TEST[1])
    seam = predict(data, ~seam_test, seam_test)
    out = {}
    for m in MODELS:
        vals = np.array([v for v in res[m]["years"].values() if v is not None])
        mon = np.array(res[m]["monthly"])
        s = log_ratio(seam["h"][m].sum(), seam["r"].sum())
        out[m] = {
            "years": {y: (None if v is None else round(v, 3)) for y, v in res[m]["years"].items()},
            "mean": round(float(vals.mean()), 3),
            "sd": round(float(vals.std(ddof=1)), 3),
            "max_abs": round(float(np.abs(vals).max()), 3),
            "n_within_limit": int((np.abs(vals) <= LIMIT).sum()),
            "n_years": int(len(vals)),
            "seam_2012": None if s is None else round(s, 3),
            "seam_verdict": "not run" if s is None else ("pass" if abs(s) <= LIMIT else "fail"),
            "month_log_sd": round(float(np.sqrt(np.mean(mon ** 2))), 3) if len(mon) >= 12 else None,
            "n_months": int(len(mon)),
        }
    return out


def check_row(area: str, model: str, loyo: dict):
    """The row added to meta.json's checks."""
    donor = TRANSFER.get(area, area)
    got = loyo.get(donor, {}).get(model)
    if not got:
        return None
    value = None if got["seam_2012"] is None else f"{got['seam_2012']:+.3f}"
    # A borrowing area was not tested: its row must not show the donor's value as if it were its own
    # (until 15 Nov Chilecito showed Córdoba's +0.087 beside "not run").
    borrowed = donor != area
    donor_name = AREAS[donor][0].rsplit(",", 1)[0]
    loyo_text = (f"leaving one year out at a time (2012 to 2021): {got['n_within_limit']} of {got['n_years']} "
                 f"years within 0.10, mean {got['mean']:+.3f}, largest {got['max_abs']:.3f}")
    note = ("Not pre-registered. Fitted on Feb 2015 to Dec 2021 only, tested on Feb 2012 to Jan 2015. " +
            (f"Not tested in this area, which has too few fires to fit its own model; it uses the model of "
             f"{donor_name}, whose own result is {value} ({loyo_text})." if borrowed else
             loyo_text[0].upper() + loyo_text[1:] + "."))
    return {
        "id": CHECK[0], "name": CHECK[1], "threshold": CHECK[2],
        "value": None if borrowed else value,
        "verdict": "not run" if borrowed else got["seam_verdict"],
        "note": note,
    }


def patch_meta() -> None:
    loyo = json.loads((WORK / "loyo.json").read_text(encoding="utf-8"))["areas"]
    for area in AREAS:
        path = APP_DATA / area / "meta.json"
        if not path.exists():
            continue
        meta = json.loads(path.read_text(encoding="utf-8"))
        model = meta["level_shipped"]
        row = check_row(area, model, loyo)
        if row is None:
            continue
        rows = [c for c in meta["checks"] if c["id"] != CHECK[0]]
        at = next((i + 1 for i, c in enumerate(rows) if c["id"] == "C1b"), len(rows))
        rows.insert(at, row)
        meta["checks"] = rows
        # A borrowing area has too few months to measure its own scatter, and the donor's would make its
        # rank range look tighter than it is (Chilecito showed Córdoba's 0.244 until 15 Nov): no range.
        meta["month_log_sd"] = None if area in TRANSFER else loyo[area][model]["month_log_sd"]
        path.write_text(json.dumps(meta, indent=2), encoding="utf-8")   # same format as export.py
        print(f"{area}: {model} C1x {row['value']} {row['verdict']}; month_log_sd {meta['month_log_sd']}")


def main() -> None:
    if "--patch-meta" in sys.argv:
        patch_meta()
        return
    con = duckdb.connect()
    areas = {a: run_area(con, a) for a in AREAS if a not in TRANSFER}
    payload = {"pool": POOL, "seam_test": SEAM_TEST, "limit": LIMIT, "min_cells": MIN_CELLS, "areas": areas}
    (WORK / "loyo.json").write_text(json.dumps(payload, indent=1), encoding="utf-8")
    for area, models in areas.items():
        for m, g in models.items():
            ys = " ".join(f"{y[2:]}:{v:+.2f}" if v is not None else f"{y[2:]}:--" for y, v in g["years"].items())
            print(f"{area} {m} ({MODELS[m]}): seam 2012 {g['seam_2012']} {g['seam_verdict']} | "
                  f"LOYO mean {g['mean']:+.3f} sd {g['sd']:.3f} max {g['max_abs']:.3f}, "
                  f"{g['n_within_limit']}/{g['n_years']} within {LIMIT} | month sd {g['month_log_sd']} "
                  f"(n={g['n_months']}) | {ys}")


if __name__ == "__main__":
    main()
