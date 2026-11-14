"""Run the pre-registered checks (docs/PREREGISTRATION.md) on every model.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Thresholds are copied from the pre-registration and must not be changed here.
Reading of the definitions (recorded in pipeline/NOTES.md):
  R  = Aqua fire cells per month (the series H equals before the VIIRS era).
  H  = R up to January 2012, then the model's VIIRS-based value.
  Step statistic at 2012: 36 months from Feb 2012 over the 36 months of 2009-2011.

Since 15 Nov (decision 57) the models use one constant per calendar month. The same checks are
also run on the year-round-constant versions (checks_year_round), so both sets of verdicts are kept.

Run: python pipeline/validate.py     Output: WORK/checks.json
"""

import json

import numpy as np
import pandas as pd
from scipy import stats

from config import AREAS, WORK
from harmonize import VIIRS_OPS

MODELS = ["S0", "L2", "L1r", "cells"]       # cells = level L1 (no weighting, no constant)
VARIANTS = ["A", "B"]
MIN_CELLS = 30
VIIRS_START = "2012-02"


def load(area: str) -> pd.DataFrame:
    return pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")


def viirs_col(model: str, variant: str) -> str:
    return "V_cells" if model == "cells" else f"V_{model}_{variant}"


def h_series(ser: pd.DataFrame, model: str, variant: str) -> pd.Series:
    h = ser["R"].astype(float).copy()
    late = ser.index >= VIIRS_START
    h[late] = ser.loc[late, viirs_col(model, variant)]
    return h


def window(s: pd.Series, lo: str, hi: str) -> float:
    return float(s[(s.index >= lo) & (s.index <= hi)].mean())


def step(s: pd.Series, before: tuple, after: tuple) -> float:
    return float(np.log(window(s, *after) / window(s, *before)))


W2012 = (("2009-01", "2011-12"), ("2012-02", "2015-01"))
W2016 = (("2013-01", "2015-12"), ("2016-01", "2018-12"))
W2008 = (("2005-01", "2007-12"), ("2008-01", "2010-12"))


def pettitt(x: np.ndarray):
    n = len(x)
    r = stats.rankdata(x)
    u = np.array([2 * r[: t + 1].sum() - (t + 1) * (n + 1) for t in range(n - 1)])
    k = np.abs(u).max()
    return int(np.abs(u).argmax()), float(min(1.0, 2 * np.exp(-6 * k ** 2 / (n ** 3 + n ** 2))))


def pettitt_can_reject(n: int, alpha: float = 0.05) -> bool:
    """Whether a series of n values can give p < alpha at all (the cleanest possible step, in the middle)."""
    if n < 2:
        return False
    k_max = (n // 2) * (n - n // 2)
    return bool(2 * np.exp(-6 * k_max ** 2 / (n ** 3 + n ** 2)) < alpha)


def verdict(ok: bool) -> str:
    return "pass" if ok else "fail"


def run_model(ser: pd.DataFrame, model: str, variant: str, fits: dict) -> dict:
    h, r = h_series(ser, model, variant), ser["R"].astype(float)
    out = {}

    c0 = step(ser["L0"].astype(float), *W2012) - step(r, *W2012)
    out["C0"] = {"value": round(c0, 3), "verdict": verdict(c0 > 0.5)}

    c1 = step(h, *W2012) - step(r, *W2012)
    out["C1"] = {"value": round(c1, 3), "verdict": verdict(abs(c1) <= 0.10)}

    m = (ser.index >= "2005-01") & (ser.index <= "2019-12") & (r >= MIN_CELLS)
    ratio = (h[m] / r[m])
    if pettitt_can_reject(int(m.sum())):
        t, p = pettitt(ratio.to_numpy())
        at = ratio.index[t]
        bad = p < 0.05 and "2011-07" <= at <= "2012-12"
        out["C1b"] = {"value": f"p={p:.3f} at {at}", "verdict": verdict(not bad),
                      "note": f"{int(m.sum())} months with at least {MIN_CELLS} Aqua fire cells"}
    else:                      # too few months for the test to reach p < 0.05: a pass would say nothing
        out["C1b"] = {"value": None, "verdict": "not run",
                      "note": f"only {int(m.sum())} months with at least {MIN_CELLS} Aqua fire cells: "
                              "too few for the test to find a change point at p < 0.05"}

    c2a = step(h, *W2016) - step(r, *W2016)
    c2b = step(h, *W2008) - step(r, *W2008)
    out["C2"] = {"value": f"2016: {c2a:+.3f}; 2008: {c2b:+.3f}",
                 "verdict": verdict(abs(c2a) <= 0.10 and abs(c2b) <= 0.10),
                 "note": ("Only the 2016 placebo tests anything: 2008 is zero by construction, because before "
                          "2012 the harmonized record is the Aqua reference itself.")}

    m3 = (ser.index >= "2018-01") & (ser.index <= "2019-12") & (r >= MIN_CELLS) & (h > 0)
    if m3.sum() >= 6:
        c3 = float(np.median(np.abs(np.log(h[m3] / r[m3]))))
        out["C3"] = {"value": round(c3, 3), "verdict": verdict(c3 <= 0.15),
                     "note": f"{int(m3.sum())} of 24 months have at least {MIN_CELLS} Aqua fire cells"}
    else:
        out["C3"] = {"value": None, "verdict": "not run",
                     "note": f"only {int(m3.sum())} months with at least {MIN_CELLS} Aqua fire cells"}

    # C3x: C3's statistic and limit on 2020 to 2021, two years no result had been looked at for when
    # the constants per calendar month were adopted (decision 57). Added after results.
    m3x = (ser.index >= "2020-01") & (ser.index <= "2021-12") & (r >= MIN_CELLS) & (h > 0)
    if m3x.sum() >= 6:
        c3x = float(np.median(np.abs(np.log(h[m3x] / r[m3x]))))
        out["C3x"] = {"value": round(c3x, 3), "verdict": verdict(c3x <= 0.15),
                      "note": "added after results (PREREGISTRATION.md note of 15 Nov): C3's statistic and limit "
                              f"on two later years; {int(m3x.sum())} of 24 months have at least {MIN_CELLS} "
                              "Aqua fire cells"}
    else:
        out["C3x"] = {"value": None, "verdict": "not run",
                      "note": f"added after results; only {int(m3x.sum())} months with at least {MIN_CELLS} "
                              "Aqua fire cells"}

    m3r = (ser.index >= "2018-01") & (ser.index <= "2019-12") & (r >= MIN_CELLS)
    if m3r.sum() >= 6:
        c3r = float(np.log(h[m3r].sum() / r[m3r].sum()))
        out["C3r"] = {"value": round(c3r, 3), "verdict": verdict(abs(c3r) <= 0.10),
                      "note": "revised held-out check, added after results (PREREGISTRATION.md note of 14 Nov); "
                              f"reported beside C3, never instead of it; {int(m3r.sum())} months"}
    else:
        out["C3r"] = {"value": None, "verdict": "not run",
                      "note": f"only {int(m3r.sum())} months with at least {MIN_CELLS} Aqua fire cells"}

    base = "cells" if model == "cells" else f"{model}_{variant}"
    a, b = f"{base}__S-NPP", f"{base}__NOAA-20"
    if a in ser and b in ser:
        m4 = (ser.index >= "2018-04") & (ser.index <= "2026-10") & ser[a].notna() & ser[b].notna()
        x, y = ser.loc[m4, a].to_numpy(), ser.loc[m4, b].to_numpy()
        slope = float((x * y).sum() / (x * x).sum())
        rho = float(stats.spearmanr(x, y)[0])
        out["C4"] = {"value": f"slope {slope:.3f}, correlation {rho:.3f}",
                     "verdict": verdict(0.90 <= slope <= 1.10 and rho >= 0.90),
                     "note": f"{int(m4.sum())} months"}

    if model == "S0":
        f, fn = fits[f"{variant}_D"], fits[f"{variant}_N"]
        width = (f["f50_hi"] - f["f50_lo"]) / f["f50"]
        night_width = (fn["f50_hi"] - fn["f50_lo"]) / fn["f50"]
        night_share = fn["n_aqua_cells"] / max(fn["n_aqua_cells"] + f["n_aqua_cells"], 1)
        out["C8"] = {"value": f"midpoint {f['f50']:.1f} MW, 90% range {f['f50_lo']:.1f} to {f['f50_hi']:.1f} "
                              f"(width {100 * width:.0f}% of midpoint)",
                     "verdict": verdict(width <= 0.50),
                     "note": f"daytime curve. The night curve, read the same way, would be over the limit "
                             f"({100 * night_width:.0f}%); night fires are {100 * night_share:.1f}% of the "
                             f"reference fire cells in the fitting years"}
    return out


def annual_view(ser: pd.DataFrame) -> pd.DataFrame:
    """The same table with each model's year-round-constant version (S0y, L2y, L1ry) under the model's name.

    Lets run_model() measure the versions that shipped until 15 Nov with exactly the same code.
    """
    out = ser.copy()
    for c in ser.columns:
        for m in ("S0", "L2", "L1r"):
            if c.startswith(f"V_{m}y_") or c.startswith(f"{m}y_"):
                out[c.replace(f"{m}y_", f"{m}_", 1)] = ser[c]
    return out


def error_by_calendar_month(ser: pd.DataFrame, model: str, variant: str, lo: str, hi: str) -> dict:
    """ln(sum of H / sum of Aqua) for each calendar month over a window; None where either is zero."""
    h, r = h_series(ser, model, variant), ser["R"].astype(float)
    m = (ser.index >= lo) & (ser.index <= hi)
    mon = ser.index[m].str[5:7].astype(int)
    hs, rs = h[m].groupby(mon).sum(), r[m].groupby(mon).sum()
    return {int(k): (round(float(np.log(hs[k] / rs[k])), 2) if hs[k] > 0 and rs[k] > 0 else None) for k in hs.index}


def daily_series(area: str, model: str, variant: str) -> tuple[pd.Series, pd.Series]:
    """(harmonized, Aqua alone) activity per day for one model.

    Harmonized is Aqua fire cells before February 2012 and the model's VIIRS value after:
    the mean over the VIIRS satellites operating that month, where a satellite that flew
    and saw nothing counts as zero, as in the monthly series.
    """
    cells = pd.read_parquet(WORK / f"{area}_cells.parquet", columns=["satellite", "acq_date"])
    cells["acq_date"] = pd.to_datetime(cells["acq_date"])
    aqua = cells[cells["satellite"] == "Aqua"].groupby("acq_date").size().astype(float)
    col = f"{model}_{variant}"
    w = pd.read_parquet(WORK / f"{area}_weights.parquet", columns=["satellite", "acq_date", col])
    w["acq_date"] = pd.to_datetime(w["acq_date"])
    per = w.groupby(["acq_date", "satellite"])[col].sum().unstack()
    days = pd.date_range(min(aqua.index.min(), per.index.min()), max(aqua.index.max(), per.index.max()), freq="D")
    per, ym = per.reindex(days), days.strftime("%Y-%m")
    for sat, (lo, hi) in VIIRS_OPS.items():
        if sat in per:
            ok = (ym >= lo) & (ym <= hi)
            per.loc[~ok, sat] = np.nan
            per.loc[ok, sat] = per.loc[ok, sat].fillna(0.0)
    viirs = per.mean(axis=1, skipna=True).fillna(0.0)
    aqua = aqua.reindex(days).fillna(0.0)
    return aqua.where(days < "2012-02-01", viirs), aqua


def peak_shift(area: str, variant: str, model: str) -> dict:
    """Check C7: activity-weighted median day of year of Oct-Nov burning, on one model's record."""
    act, aqua_only = daily_series(area, model, variant)
    res = {}
    for name, s in (("harmonized", act), ("aqua_only", aqua_only)):
        peaks = {}
        for year in range(2003, 2020):
            w = s[(s.index >= f"{year}-10-01") & (s.index <= f"{year}-11-30")]
            if w.sum() <= 0:
                continue
            cum = w.cumsum() / w.sum()
            peaks[year] = int(cum.index[(cum >= 0.5).argmax()].day_of_year)
        early = [v for y, v in peaks.items() if 2003 <= y <= 2008]
        late = [v for y, v in peaks.items() if 2010 <= y <= 2019]
        shift = float(np.mean(late) - np.mean(early))
        p = float(stats.mannwhitneyu(late, early, alternative="greater").pvalue)
        res[name] = {"shift_days": round(shift, 1), "p": round(p, 4), "peaks": peaks,
                     "mean_early_doy": round(float(np.mean(early)), 1),
                     "mean_late_doy": round(float(np.mean(late)), 1)}
    h = res["harmonized"]
    return {"value": f"{h['shift_days']:+.1f} days (p={h['p']:.4f}); "
                     f"Aqua alone {res['aqua_only']['shift_days']:+.1f} days",
            "verdict": verdict(h["shift_days"] >= 5 and h["p"] < 0.05), "detail": res}


def shipping(checks: dict, held_out: str = "C3") -> str:
    def passes(model, ids):
        return all(checks[model].get(i, {}).get("verdict") == "pass" for i in ids)
    if passes("S0", ["C0", "C1", "C1b", "C2", held_out, "C8"]):
        return "S0"
    if passes("L2", ["C0", "C1", "C1b", "C2", held_out]):
        return "L2"
    return "L1r"


def main() -> None:
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    result = {}
    for area in AREAS:
        donor = curves["transfer"].get(area, area)
        fits = curves["areas"][donor]
        ser = load(area)
        result[area] = {"donor": donor, "variants": {}}
        for variant in VARIANTS:
            checks = {m: run_model(ser, m, variant, fits) for m in MODELS}
            ser_y = annual_view(ser)
            checks_y = {m: run_model(ser_y, m, variant, fits) for m in ("S0", "L2", "L1r")}
            ladder = [{"level": "L0 raw detections", "step_2012": round(step(ser["L0"].astype(float), *W2012)
                                                                          - step(ser["R"].astype(float), *W2012), 3)}]
            ladder.append({"level": "L1 fire cells", "step_2012": checks["cells"]["C1"]["value"],
                           "placebo_2016": checks["cells"]["C2"]["value"].split(";")[0].replace("2016: ", ""),
                           "held_out": checks["cells"]["C3"]["value"]})
            for label, m in (("L1r conversion ratio", "L1r"), ("L2 hard floor", "L2"), ("S0 detection curve", "S0")):
                for how, got in (("one year-round constant", checks_y), ("a constant per calendar month", checks)):
                    ladder.append({"level": f"{label}, {how}", "step_2012": got[m]["C1"]["value"],
                                   "placebo_2016": got[m]["C2"]["value"].split(";")[0].replace("2016: ", ""),
                                   "held_out": got[m]["C3"]["value"]})
            entry = {"checks": checks, "ladder": ladder, "ship": shipping(checks),
                     "ship_revised": shipping(checks, "C3r"),
                     # The versions with one year-round constant, which shipped until 15 Nov (decision 57).
                     "checks_year_round": checks_y, "ship_year_round": shipping(checks_y),
                     "ship_year_round_revised": shipping(checks_y, "C3r"),
                     "error_by_calendar_month": {
                         m: {how: {"fitting_years": error_by_calendar_month(s, m, variant, "2012-02", "2017-12"),
                                   "held_out_2018_2019": error_by_calendar_month(s, m, variant, "2018-01", "2019-12")}
                             for how, s in (("year_round", ser_y), ("per_calendar_month", ser))}
                         for m in ("S0", "L2", "L1r")}}
            if area == "punjab-haryana":      # one result per model; export.py shows the shipped model's
                entry["C7"] = {m: peak_shift(area, variant, m) for m in ("S0", "L2", "L1r")}
            result[area]["variants"][variant] = entry
    (WORK / "checks.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

    for area, res in result.items():
        for variant, e in res["variants"].items():
            print(f"\n== {area} | calibration {variant} | ship (original C3): {e['ship']} "
                  f"| ship (revised C3r): {e['ship_revised']}")
            for row in e["ladder"]:
                print("   ", row)
            for model in ("S0", "L2", "L1r"):
                line = "; ".join(f"{k} {v['verdict']} ({v['value']})" for k, v in e["checks"][model].items())
                print(f"  {model}: {line}")
            for model, c7 in e.get("C7", {}).items():
                print(f"  C7 {model}:", c7["verdict"], c7["value"])


if __name__ == "__main__":
    main()
