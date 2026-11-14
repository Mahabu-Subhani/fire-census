"""Run the pre-registered checks (docs/PREREGISTRATION.md) on every model.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Thresholds are copied from the pre-registration and must not be changed here.
Reading of the definitions (recorded in pipeline/NOTES.md):
  R  = Aqua fire cells per month (the series H equals before the VIIRS era).
  H  = R up to January 2012, then the model's VIIRS-based value.
  Step statistic at 2012: 36 months from Feb 2012 over the 36 months of 2009-2011.

Run: python pipeline/validate.py     Output: WORK/checks.json
"""

import json

import numpy as np
import pandas as pd
from scipy import stats

from config import AREAS, WORK

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
    t, p = pettitt(ratio.to_numpy())
    at = ratio.index[t]
    bad = p < 0.05 and "2011-07" <= at <= "2012-12"
    out["C1b"] = {"value": f"p={p:.3f} at {at}", "verdict": verdict(not bad),
                  "note": f"{int(m.sum())} months with at least {MIN_CELLS} Aqua fire cells"}

    c2a = step(h, *W2016) - step(r, *W2016)
    c2b = step(h, *W2008) - step(r, *W2008)
    out["C2"] = {"value": f"2016: {c2a:+.3f}; 2008: {c2b:+.3f}",
                 "verdict": verdict(abs(c2a) <= 0.10 and abs(c2b) <= 0.10),
                 "note": "2008 is zero by construction: H equals the Aqua reference before 2012"}

    m3 = (ser.index >= "2018-01") & (ser.index <= "2019-12") & (r >= MIN_CELLS) & (h > 0)
    if m3.sum() >= 6:
        c3 = float(np.median(np.abs(np.log(h[m3] / r[m3]))))
        out["C3"] = {"value": round(c3, 3), "verdict": verdict(c3 <= 0.15),
                     "note": f"{int(m3.sum())} of 24 months have at least {MIN_CELLS} Aqua fire cells"}
    else:
        out["C3"] = {"value": None, "verdict": "not run",
                     "note": f"only {int(m3.sum())} months with at least {MIN_CELLS} Aqua fire cells"}

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
        f = fits[f"{variant}_D"]
        width = (f["f50_hi"] - f["f50_lo"]) / f["f50"]
        out["C8"] = {"value": f"midpoint {f['f50']:.1f} MW, 90% range {f['f50_lo']:.1f} to {f['f50_hi']:.1f} "
                              f"(width {100 * width:.0f}% of midpoint)",
                     "verdict": verdict(width <= 0.50), "note": "daytime curve"}
    return out


def peak_shift(area: str, variant: str) -> dict:
    """Check C7: activity-weighted median day of year of Oct-Nov burning."""
    d = pd.read_parquet(WORK / f"{area}_daily.parquet")
    d["acq_date"] = pd.to_datetime(d["acq_date"])
    d = d.set_index("acq_date").fillna(0.0)
    act = d["aqua"].where(d.index < "2012-02-01", d[f"V_S0_{variant}"])
    aqua_only = d["aqua"]
    res = {}
    for name, s in (("harmonized", act), ("aqua_only", aqua_only)):
        peaks = {}
        for year in range(2003, 2020):
            w = s[(s.index >= f"{year}-10-01") & (s.index <= f"{year}-11-30")]
            if w.sum() <= 0:
                continue
            cum = w.cumsum() / w.sum()
            peaks[year] = int(cum.index[(cum >= 0.5).argmax()].dayofyear)
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


def shipping(checks: dict) -> str:
    def passes(model, ids):
        return all(checks[model].get(i, {}).get("verdict") == "pass" for i in ids)
    if passes("S0", ["C0", "C1", "C1b", "C2", "C3", "C8"]):
        return "S0"
    if passes("L2", ["C0", "C1", "C1b", "C2", "C3"]):
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
            ladder = [{"level": "L0 raw detections", "step_2012": round(step(ser["L0"].astype(float), *W2012)
                                                                          - step(ser["R"].astype(float), *W2012), 3)}]
            for label, m in (("L1 fire cells", "cells"), ("L1r constant ratio", "L1r"),
                             ("L2 hard floor", "L2"), ("S0 detection curve", "S0")):
                ladder.append({"level": label, "step_2012": checks[m]["C1"]["value"],
                               "placebo_2016": checks[m]["C2"]["value"].split(";")[0].replace("2016: ", ""),
                               "held_out": checks[m]["C3"]["value"]})
            entry = {"checks": checks, "ladder": ladder, "ship": shipping(checks)}
            if area == "punjab-haryana":
                entry["C7"] = peak_shift(area, variant)
            result[area]["variants"][variant] = entry
    (WORK / "checks.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

    for area, res in result.items():
        for variant, e in res["variants"].items():
            print(f"\n== {area} | calibration {variant} | ship: {e['ship']}")
            for row in e["ladder"]:
                print("   ", row)
            for model in ("S0", "L2", "L1r"):
                line = "; ".join(f"{k} {v['verdict']} ({v['value']})" for k, v in e["checks"][model].items())
                print(f"  {model}: {line}")
            if "C7" in e:
                print("  C7:", e["C7"]["verdict"], e["C7"]["value"])


if __name__ == "__main__":
    main()
