"""Print every headline number the documents quote, from the current outputs.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Run after the pipeline; compare with the documents before submitting.
Run: python pipeline/key_numbers.py
"""

import json

import numpy as np
import pandas as pd

from config import APP_DATA, WORK


def main() -> None:
    checks = json.loads((WORK / "checks.json").read_text(encoding="utf-8"))
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    ev = json.loads((WORK / "evidence.json").read_text(encoding="utf-8"))
    sens = json.loads((WORK / "sensitivity.json").read_text(encoding="utf-8"))
    c6 = json.loads((WORK / "c6.json").read_text(encoding="utf-8"))
    lc = json.loads((WORK / "landcover.json").read_text(encoding="utf-8"))
    rep = {r["area"]: r for r in json.loads((WORK / "clean_report.json").read_text(encoding="utf-8"))}
    for area, model in (("cordoba", "S0"), ("punjab-haryana", "L2")):
        a = checks[area]["variants"]["A"]
        b = checks[area]["variants"]["B"]
        print(f"\n===== {area} (shipped {model})")
        r = rep[area]
        print("clean: in box", r["rows_in_box"], "outside outline", r.get("removed_outside_outline", 0),
              "non-veg", r["removed_non_vegetation_standard"], "low conf", r["removed_low_confidence"], "kept", r["rows_out"])
        for m in ("S0", "L2", "L1r"):
            print(f"  {m}: " + "; ".join(f"{k} {v['verdict']} {v['value']}" for k, v in a["checks"][m].items()))
            print(f"  {m} C1 fitted on 2016-17 only: {b['checks'][m]['C1']['value']}")
        print("  ladder:", [(x["level"], x["step_2012"]) for x in a["ladder"]])
        if "C7" in a:
            print("  C7:", a["C7"]["value"])
        for dn in ("D", "N"):
            f = curves["areas"][area][f"A_{dn}"]
            print(f"  curve {dn}: S-NPP cells {f['n_snpp_cells']}, Aqua {f['n_aqua_cells']}, matched {f['match_rate']:.3f}, "
                  f"chance {f['control_rate']:.3f}, plateau {f['plateau']:.3f}, midpoint {f['f50']:.2f} [{f['f50_lo']:.2f}, {f['f50_hi']:.2f}]")
        print("  C5:", json.dumps(ev["c5"][area]))
        print("  mix test:", json.dumps(ev["mix_test"][area]))
        print("  overpass:", json.dumps({y: ev["overpass"][area][y] for y in ("2021", "2026")}))
        print("  drift ln(Aqua/harm):", sens["aqua_drift_ln_aqua_over_harmonized"][area])
        print("  sensitivity:", {k: (v[area]["C1"], v[area]["C3r"], [x for x, y in v[area]["verdicts"].items() if y == "fail"])
                                  for k, v in sens.items() if k != "aqua_drift_ln_aqua_over_harmonized"})
        print("  C6:", {k: c6[area][k] for k in ("value", "verdict", "aqua_only_same_statistic", "raw_record_same_statistic", "seam_share")})
        print("  land cover:", {k: v["share_of_fire_cells"] for k, v in list(lc[area]["classes"].items())[:4]})
        s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
        y = s.index.str[:4].astype(int)
        raw = s["L0"].groupby(y).sum()
        modis = None
        print("  raw L0 yearly mean 2009-11 -> 2013-15:", round(raw.loc[2009:2011].mean()), "->", round(raw.loc[2013:2015].mean()))
        cube = pd.DataFrame(json.loads((APP_DATA / area / "cube.json").read_text(encoding="utf-8")))
        n = cube[cube.ym.str.endswith("-11") & (cube.ym >= "2002-07")].groupby("ym")["mtd"].sum()
        cur, prev = n["2026-11"], n[n.index < "2026-11"]
        print(f"  Nov 1-13 2026: {cur:.2f}, median {prev.median():.2f}, ratio {cur / prev.median():.2f}, "
              f"rank {(prev > cur).sum() + 1} of {len(n)}")
        yr = cube.assign(y=cube.ym.str[:4]).groupby("y")[["harm", "small"]].sum()
        late = yr.loc["2013":"2025"]
        print(f"  small/harm 2013-25 median {np.median(late.small / late.harm):.2f}")
        meta = json.loads((APP_DATA / area / "meta.json").read_text(encoding="utf-8"))
        print("  meta verdicts:", ", ".join(f"{c['id']}:{c['verdict']}" for c in meta["checks"]))
        se = APP_DATA / area / "season.json"
        if se.exists():
            sj = json.loads(se.read_text(encoding="utf-8"))
            print("  season trend:", sj["trend"], sj.get("law_2009", {}).get("shift_days"))
            tot = {r["year"]: r["total"] for r in sj["years"]}
            print("  season totals 2020, 2024, 2025:", tot.get(2020), tot.get(2024), tot.get(2025))
    regions = json.loads((APP_DATA / "regions.json").read_text(encoding="utf-8"))
    print("\nregions:", [(r["id"], r["name"], r.get("area_km2")) for r in regions])


if __name__ == "__main__":
    main()
