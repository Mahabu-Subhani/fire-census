"""Tests of objections a sceptical reviewer would raise, and the drift figure.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Objection 1: "The constant k absorbs everything. What does the curve add over a
constant ratio?" If the curve is physically right, a constant ratio should go
wrong in years when the mix of weak and strong fires changes, and the curve
should not. Test: across years, correlate each model's yearly ratio to Aqua
with the share of VIIRS fire cells above the curve's midpoint.

Objection 2: "Is Aqua still a valid reference?" Measure Aqua's overpass time by
year from the data, and how far Aqua departs from the harmonized record since.

Objection 3 (check C5): is the curve midpoint consistent with published MODIS
detection limits, given the pixel sizes Aqua actually had over each area?

Run: python pipeline/evidence.py     Output: WORK/evidence.json, figures
"""

import json

import duckdb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats

from config import FIGURES, WORK

AREAS = {"cordoba": ("Córdoba", -63.7), "punjab-haryana": ("Punjab and Haryana", 75.7),
         "karnataka-south": ("South Karnataka forests", 76.8)}
# Sofiev and Kouznetsov (2026), GMD 19, 10123: MODIS C6.1 detection limit at nadir,
# and linear in pixel area (Table 1): limit = slope * area + intercept.
PUB_NADIR = {"D": 5.7, "N": 3.7}
PUB_LINEAR = {"D": (4.44, 0.52), "N": (4.43, 1.01)}


def mix_test(area: str, curves: dict) -> dict:
    s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
    w = pd.read_parquet(WORK / f"{area}_weights.parquet", columns=["satellite", "ym", "frp_sum", "dn"])
    f50 = curves["areas"][area]["A_D"]["f50"]
    w = w[(w["satellite"] == "S-NPP") & (w["dn"] == "D")]
    w["year"] = w["ym"].str[:4].astype(int)
    strong = w.groupby("year")["frp_sum"].apply(lambda x: float((x >= f50).mean()))
    s = s[(s.index >= "2012-02") & (s.index <= "2021-12")]
    yr = s.index.str[:4].astype(int)
    out = {"years": "2012-2021 (before Aqua's orbit drift)"}
    for m in ("S0", "L2", "L1r"):
        ratio = s.groupby(yr)[f"V_{m}_A"].sum() / s.groupby(yr)["R"].sum()
        both = pd.concat([ratio, strong], axis=1, keys=["ratio", "strong"]).dropna()
        rho, p = stats.spearmanr(both["strong"], both["ratio"])
        out[m] = {"spearman_rho": round(float(rho), 3), "p": round(float(p), 4),
                  "ratio_sd": round(float(both["ratio"].std()), 3)}
    out["strong_share_range"] = [round(float(strong.min()), 3), round(float(strong.max()), 3)]
    return out


def overpass_and_pixels(con, area: str, lon: float) -> pd.DataFrame:
    src = (WORK / f"{area}.parquet").as_posix()
    return con.execute(f"""
        select year(acq_date) as year, satellite, daynight as dn,
               avg(((cast(substr(acq_time, 1, 2) as int) * 60 + cast(substr(acq_time, 3, 2) as int))
                    + 4 * {lon}) / 60.0 + 24) % 24 as local_h,
               avg(scan * track) as pixel_km2, count(*) as n
        from '{src}' where satellite in ('Aqua', 'Terra', 'S-NPP', 'NOAA-20')
        group by 1, 2, 3 order by 1, 2, 3""").df()


def main() -> None:
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    sens = json.loads((WORK / "sensitivity.json").read_text(encoding="utf-8"))
    con = duckdb.connect()
    ev = {"mix_test": {}, "c5": {}, "overpass": {}}
    fig, axes = plt.subplots(1, len(AREAS), figsize=(5.5 * len(AREAS), 4))
    for k, (area, (name, lon)) in enumerate(AREAS.items()):
        ev["mix_test"][area] = mix_test(area, curves)
        op = overpass_and_pixels(con, area, lon)
        day = op[op["dn"] == "D"].pivot(index="year", columns="satellite", values="local_h")
        ev["overpass"][area] = {str(y): {s: round(float(v), 2) for s, v in r.items() if pd.notna(v)}
                                for y, r in day.loc[[2005, 2015, 2021, 2022, 2023, 2024, 2025, 2026]].iterrows()}
        # C5: published limit at the mean Aqua pixel area of 2012-2017 over this area.
        aq = op[(op["satellite"] == "Aqua") & op["year"].between(2012, 2017)]
        c5 = {}
        for dn in ("D", "N"):
            a = aq[aq["dn"] == dn]
            area_km2 = float(np.average(a["pixel_km2"], weights=a["n"]))
            slope, icpt = PUB_LINEAR[dn]
            mid = curves["areas"][area][f"A_{dn}"]["f50"]
            c5[dn] = {"our_midpoint_MW": round(mid, 2), "published_nadir_MW": PUB_NADIR[dn],
                      "ratio_to_nadir": round(mid / PUB_NADIR[dn], 2),
                      "mean_aqua_pixel_km2": round(area_km2, 2),
                      "published_at_mean_pixel_MW": round(slope * area_km2 + icpt, 2),
                      "pass_factor_2": bool(0.5 <= mid / PUB_NADIR[dn] <= 2.0)}
        ev["c5"][area] = c5
        ax = axes[k]
        for sat, colour in (("Aqua", "#1f5f8b"), ("Terra", "#8c6d1f"), ("S-NPP", "#b8400f"), ("NOAA-20", "#6a3d9a")):
            if sat in day:
                ax.plot(day.index, day[sat], color=colour, lw=1.8, marker="o", ms=3, label=sat)
        ax.axvspan(2021.5, 2026.9, color="#fde9a6", alpha=0.4, lw=0)
        ax.set_title(f"{name}: daytime overpass, local solar time", fontsize=10)
        ax.set_ylabel("Hour of day (mean of detections)")
        ax.spines[["top", "right"]].set_visible(False)
        d = sens["aqua_drift_ln_aqua_over_harmonized"].get(area)
        if d:
            ax.text(2003, ax.get_ylim()[1] - 0.3, f"Aqua vs harmonized record: {100 * (np.exp(list(d.values())[0]) - 1):+.0f}% "
                    f"before 2022, {100 * (np.exp(list(d.values())[1]) - 1):+.0f}% after", fontsize=8, va="top")
    axes[0].legend(frameon=False, fontsize=8, loc="lower left")
    fig.tight_layout()
    fig.savefig(FIGURES / "orbit_drift.png", dpi=150)
    plt.close(fig)
    (WORK / "evidence.json").write_text(json.dumps(ev, indent=2), encoding="utf-8")
    print(json.dumps({"mix_test": ev["mix_test"], "c5": ev["c5"]}, indent=1))


if __name__ == "__main__":
    main()
