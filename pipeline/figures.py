"""Figures for the method panel and the project page.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Run: python pipeline/figures.py     Output: submission/figures/*.png
"""

import json

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import AREAS, FIGURES, REPO, WORK

INK, GREY = "#1b2230", "#8a93a3"
C = {"raw": "#b8400f", "S0": "#1f5f8b", "L1r": "#8c6d1f", "L2": "#2a7f62", "R": "#222222"}
MODEL = {"S0": "detection curve", "L2": "hard floor", "L1r": "constant ratio"}


def shipped_model(area: str) -> str:
    """The model that fills the record in this area (pipeline/shipping.json)."""
    return json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))["areas"][area]["model"]


def yearly(area: str) -> pd.DataFrame:
    s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
    s["year"] = s.index.str[:4].astype(int)
    late = s.index >= "2012-02"
    out = pd.DataFrame({"R": s.groupby("year")["R"].sum(), "L0": s.groupby("year")["L0"].sum()})
    for m in ("S0", "L1r", "L2"):
        h = s["R"].astype(float).where(~late, s[f"V_{m}_A"])
        out[m] = h.groupby(s["year"]).sum()
        out[f"{m}_ratio"] = (s.loc[late, f"V_{m}_A"].groupby(s.loc[late, "year"]).sum()
                             / s.loc[late, "R"].groupby(s.loc[late, "year"]).sum())
    return out[(out.index >= 2003) & (out.index <= 2025)]


def fig_series(area: str, name: str) -> None:
    y = yearly(area)
    fig, ax = plt.subplots(figsize=(9, 4.2))
    ax.plot(y.index, y["L0"], color=C["raw"], lw=1.6, ls="--", marker="o", ms=3,
            label="Raw: all sensors' detections added")
    # The thick line is the record the app shows for this area; one other method is drawn for comparison.
    ship = shipped_model(area)
    other = "L1r" if ship != "L1r" else "S0"
    ax.plot(y.index, y[ship], color=C["S0"], lw=2.2, marker="o", ms=3,
            label=f"Harmonized, as shipped here: {MODEL[ship]}")
    ax.plot(y.index, y[other], color=C["L1r"], lw=1.4, marker="o", ms=3,
            label=f"For comparison: {MODEL[other]}")
    ax.plot(y.index, y["R"], color=C["R"], lw=1.0, ls=":", label="Aqua MODIS alone (reference)")
    ax.axvline(2011.6, color=GREY, lw=0.8)
    ax.text(2011.75, ax.get_ylim()[1] * 0.95, "VIIRS starts", color=GREY, fontsize=8, va="top")
    ax.set_yscale("log")
    ax.set_ylabel("Per year (log scale)")
    ax.set_title(f"Raw and harmonized fire activity, {name}", color=INK)
    ax.legend(frameon=False, fontsize=8)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(FIGURES / f"harmonized_{area}.png", dpi=150)
    plt.close(fig)


def fig_ratio(area: str, name: str) -> None:
    y = yearly(area)
    y = y[y.index >= 2012]
    fig, ax = plt.subplots(figsize=(9, 3.8))
    ax.axhspan(0.9, 1.1, color="#e8ecf2", lw=0)
    ax.axhline(1, color=GREY, lw=0.8)
    for m, label in (("S0", "Detection curve"), ("L1r", "Constant ratio"), ("L2", "Hard floor")):
        ax.plot(y.index, y[f"{m}_ratio"], color=C[m], lw=1.8, marker="o", ms=4, label=label)
    ax.axvspan(2011.9, 2017.9, color="#fde9a6", alpha=0.35, lw=0)
    ax.text(2012, ax.get_ylim()[0] + 0.01, "calibration years", fontsize=8, color=INK)
    ax.set_ylabel("Harmonized VIIRS / Aqua MODIS, per year")
    ax.set_title(f"Does the harmonized record keep tracking Aqua? {name}", color=INK)
    ax.legend(frameon=False, fontsize=8, ncol=3)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(FIGURES / f"ratio_stability_{area}.png", dpi=150)
    plt.close(fig)


def fig_curve(area: str, name: str, curves: dict) -> None:
    centres = np.array(curves["centres"])
    fig, ax = plt.subplots(figsize=(7.5, 4.2))
    for dn, colour, label in (("D", C["S0"], "Day"), ("N", C["raw"], "Night")):
        f = curves["areas"][area][f"A_{dn}"]
        ax.fill_between(centres, f["p_lo"], f["p_hi"], color=colour, alpha=0.18, lw=0)
        ax.plot(centres, f["p_norm"], color=colour, lw=2, label=f"{label} (50% at {f['f50']:.1f} MW)")
    ax.axhline(0.5, color=GREY, lw=0.8, ls=":")
    ax.set_xscale("log")
    ax.set_xlim(0.3, 1000)
    ax.set_xlabel("Fire strength of the VIIRS fire cell (FRP, MW)")
    ax.set_ylabel("Chance Aqua MODIS also reports it\n(relative to the strongest fires)")
    ax.set_title(f"MODIS detection curve, {name}", color=INK)
    ax.legend(frameon=False, fontsize=9)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(FIGURES / f"detection_curve_{area}.png", dpi=150)
    plt.close(fig)


def main() -> None:
    FIGURES.mkdir(parents=True, exist_ok=True)
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    for area, (name, *_rest) in AREAS.items():
        fig_series(area, name)
        if area in curves["areas"]:
            fig_ratio(area, name)
            fig_curve(area, name, curves)
            y = yearly(area)
            y = y[(y.index >= 2012) & (y.index <= 2025)]
            print(area, "yearly ratio to Aqua, standard deviation 2012-2025:",
                  {m: round(float(y[f"{m}_ratio"].std()), 3) for m in ("S0", "L1r", "L2")},
                  "| 2018-2025 only:",
                  {m: round(float(y.loc[2018:, f"{m}_ratio"].std()), 3) for m in ("S0", "L1r", "L2")})


if __name__ == "__main__":
    main()
