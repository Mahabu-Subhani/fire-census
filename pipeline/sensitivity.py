"""Sensitivity of the results to choices we made, and to Aqua's orbit drift.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Each run copies the cleaned tables into its own folder, reruns harmonize.py and
validate.py there with one setting changed, and collects the key numbers.
The shipped results are never touched.

Run: python pipeline/sensitivity.py     Output: WORK/sensitivity.json and printed tables
"""

import json
import os
import shutil
import subprocess
import sys

import numpy as np
import pandas as pd

from config import AREAS, DATA, WORK

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = {
    "shipped settings": ({}, ""),
    "low-confidence detections kept": ({}, "_with_low_conf"),
    "same fire = same cell only": ({"FC_NEIGHBOUR": "0"}, ""),
    "same fire = within 2 cells": ({"FC_NEIGHBOUR": "2"}, ""),
    "plateau at 90th percentile": ({"FC_PLATEAU_Q": "0.90"}, ""),
    "plateau at 99th percentile": ({"FC_PLATEAU_Q": "0.99"}, ""),
}
SHOWN = {"cordoba": "S0", "punjab-haryana": "L2"}


def run(name: str, env_extra: dict, suffix: str) -> dict:
    base = DATA.parent / f"{DATA.name}-sens" / name.replace(" ", "_")
    work = base / "work"
    work.mkdir(parents=True, exist_ok=True)
    for area in AREAS:
        shutil.copyfile(WORK / f"{area}{suffix}.parquet", work / f"{area}.parquet")
    env = {**os.environ, **env_extra, "FIRE_DATA": str(base)}
    for script in ("harmonize.py", "validate.py"):
        subprocess.run([sys.executable, script], cwd=HERE, env=env, check=True, capture_output=True)
    checks = json.loads((work / "checks.json").read_text(encoding="utf-8"))
    curves = json.loads((work / "curves.json").read_text(encoding="utf-8"))
    out = {}
    for area, model in SHOWN.items():
        c = checks[area]["variants"]["A"]["checks"][model]
        f = curves["areas"][area]["A_D"]
        out[area] = {"model": model, "C1": c["C1"]["value"], "C2": c["C2"]["value"].split(";")[0],
                     "C3r": c["C3r"]["value"], "C4": c["C4"]["value"],
                     "midpoint_day_MW": round(f["f50"], 1),
                     "verdicts": {k: v["verdict"] for k, v in c.items()}}
    return out


def drift() -> dict:
    """How far Aqua departs from the harmonized VIIRS record once its orbit drifts."""
    res = {}
    for area, model in SHOWN.items():
        s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
        col = f"V_{model}_A"
        out = {}
        for label, lo, hi in (("2012-2021 (stable orbit)", "2012-02", "2021-12"),
                              ("2022-2026 (drifting orbit)", "2022-01", "2026-10")):
            m = (s.index >= lo) & (s.index <= hi)
            out[label] = round(float(np.log(s.loc[m, "R"].sum() / s.loc[m, col].sum())), 3)
        res[area] = out
    return res


def main() -> None:
    results = {name: run(name, env, suffix) for name, (env, suffix) in RUNS.items()}
    results["aqua_drift_ln_aqua_over_harmonized"] = drift()
    (WORK / "sensitivity.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    for area, model in SHOWN.items():
        print(f"\n{area} ({model})")
        print("| Setting | C1 step 2012 | C2 placebo 2016 | C3r held-out | C4 NOAA-20 | Day midpoint MW | Fails |")
        print("|---|---|---|---|---|---|---|")
        for name in RUNS:
            r = results[name][area]
            fails = ", ".join(k for k, v in r["verdicts"].items() if v == "fail") or "none"
            print(f"| {name} | {r['C1']} | {r['C2']} | {r['C3r']} | {r['C4']} | {r['midpoint_day_MW']} | {fails} |")
    print("\nAqua against harmonized record, ln(Aqua / harmonized):",
          json.dumps(results["aqua_drift_ln_aqua_over_harmonized"]))


if __name__ == "__main__":
    main()
