"""Harmonize MODIS and VIIRS: fire cells, detection curve, monthly series.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Idea. Every S-NPP VIIRS fire cell is a fire we know existed. For each one we
ask: did Aqua MODIS, flying over at nearly the same time, also report a fire
there? The fraction that it did, as a function of the fire's strength, is
MODIS's detection curve. The VIIRS era is then expressed as "the number of
fire cells Aqua would have reported", which is the unit of the pre-2012 record.

Levels built here (the ladder):
  L0   raw detections, all sensors added
  L1   fire cells: one per 0.01 degree cell, satellite, date and day/night
  L1r  L1 times one constant ratio (the conventional approach, our fallback)
  L2   hard floor: VIIRS cells at or above the curve's midpoint, times a constant
  S0   detection curve: each VIIRS cell weighted by its detection probability

Run: python pipeline/harmonize.py     Output: WORK/<area>_{cells,weights,series,daily}.parquet, curves.json
"""

import json

import duckdb
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression

from config import AREAS, WORK

EDGES = np.logspace(-1, 3.5, 46)           # FRP bins, 0.1 MW to about 3,160 MW
CENTRES = np.sqrt(EDGES[:-1] * EDGES[1:])
NB = len(CENTRES)
CAL = {"A": ("2012-02", "2017-12"),        # decision 10 minus the held-out years of check C3
       "B": ("2016-01", "2017-12")}        # after the 2015 change in VIIRS FRP retrieval
VIIRS_OPS = {"S-NPP": ("2012-02", "2026-10"), "NOAA-20": ("2018-04", "9999-12"),
             "NOAA-21": ("2023-03", "9999-12")}
NEIGHBOUR = 1          # an Aqua cell within +-1 cell (about 3 x 3 km) counts as the same fire
CONTROL_SHIFT = 10     # cells; a displaced search measures chance coincidences
PLATEAU_Q = 0.95       # plateau = curve value at this quantile of calibration fire strength
N_BOOT = 500
TRANSFER = {"chilecito": "cordoba"}   # too few fires for its own curve: use the donor's
RNG = np.random.default_rng(20261114)


def build_cells(con: duckdb.DuckDBPyConnection, area: str) -> None:
    src = (WORK / f"{area}.parquet").as_posix()
    con.execute(f"""
        create or replace table cells as
        select cx, cy, satellite, sensor, acq_date, daynight as dn,
               strftime(acq_date, '%Y-%m') as ym, count(*) as n_det,
               sum(frp) as frp_sum, avg(frp) as frp_mean, avg(scan) as scan, avg(track) as track,
               min(cast(substr(acq_time, 1, 2) as integer) * 60
                   + cast(substr(acq_time, 3, 2) as integer)) as tmin
        from '{src}' group by 1, 2, 3, 4, 5, 6""")
    con.execute(f"copy cells to '{(WORK / (area + '_cells.parquet')).as_posix()}' (format parquet)")


def match_table(con: duckdb.DuckDBPyConnection) -> pd.DataFrame:
    """One row per S-NPP fire cell: was there an Aqua fire cell beside it?"""
    con.execute("create or replace table s as select row_number() over () as id, * from cells where satellite = 'S-NPP'")
    con.execute("create or replace table a as select distinct cx, cy, acq_date, dn from cells where satellite = 'Aqua'")
    con.execute("create or replace table atime as select distinct acq_date, dn, tmin from cells where satellite = 'Aqua'")
    k, sh = NEIGHBOUR, CONTROL_SHIFT
    return con.execute(f"""
        with m as (select s.id from s join a on a.acq_date = s.acq_date and a.dn = s.dn
                     and a.cx between s.cx - {k} and s.cx + {k}
                     and a.cy between s.cy - {k} and s.cy + {k} group by s.id),
             c as (select s.id from s join a on a.acq_date = s.acq_date and a.dn = s.dn
                     and a.cx between s.cx + {sh} - {k} and s.cx + {sh} + {k}
                     and a.cy between s.cy - {k} and s.cy + {k} group by s.id),
             t as (select s.id, min(abs(atime.tmin - s.tmin)) as dt
                   from s join atime using (acq_date, dn) group by s.id)
        select s.id, s.ym, s.dn, s.frp_sum,
               (m.id is not null)::int as hit, (c.id is not null)::int as ctrl, t.dt
        from s left join m using (id) left join c using (id) left join t using (id)""").df()


def bin_index(frp: np.ndarray) -> np.ndarray:
    return np.clip(np.digitize(frp, EDGES) - 1, 0, NB - 1)


def month_bin_counts(df: pd.DataFrame, months: list[str]):
    """Arrays [month, bin] of S-NPP cells, Aqua matches and control matches."""
    mi = pd.Categorical(df["ym"], categories=months).codes
    b = bin_index(df["frp_sum"].to_numpy())
    n, h, c = (np.zeros((len(months), NB)) for _ in range(3))
    np.add.at(n, (mi, b), 1)
    np.add.at(h, (mi, b), df["hit"].to_numpy())
    np.add.at(c, (mi, b), df["ctrl"].to_numpy())
    return n, h, c


def fit_curve(n: np.ndarray, h: np.ndarray, c: np.ndarray):
    """Monotone detection curve from binned counts. Returns (p_raw, p_norm, plateau, f50)."""
    big_n = n.sum(0)
    ok = big_n > 0
    rate = np.clip((h.sum(0) - c.sum(0))[ok] / big_n[ok], 0, 1)   # chance matches removed
    iso = IsotonicRegression(y_min=0, y_max=1, increasing=True, out_of_bounds="clip")
    iso.fit(np.log10(CENTRES[ok]), rate, sample_weight=big_n[ok])
    p_raw = iso.predict(np.log10(CENTRES))
    cum = np.cumsum(big_n) / big_n.sum()
    plateau = max(p_raw[min(np.searchsorted(cum, PLATEAU_Q), NB - 1)], 1e-9)
    p_norm = np.clip(p_raw / plateau, 0, 1)
    above = np.nonzero(p_norm >= 0.5)[0]
    if len(above) == 0:
        f50 = np.nan
    elif above[0] == 0:
        f50 = CENTRES[0]
    else:
        i = above[0]
        x0, x1 = np.log10(CENTRES[i - 1]), np.log10(CENTRES[i])
        y0, y1 = p_norm[i - 1], p_norm[i]
        f50 = 10 ** (x0 + (0.5 - y0) * (x1 - x0) / max(y1 - y0, 1e-12))
    return p_raw, p_norm, plateau, f50


def calibrate(match: pd.DataFrame, aqua_month: pd.Series, variant: str, dn: str) -> dict:
    """Fit curve and constants for one calibration variant and one day/night class."""
    lo, hi = CAL[variant]
    months = sorted(m for m in match["ym"].unique() if lo <= m <= hi)
    sub = match[(match["dn"] == dn) & match["ym"].between(lo, hi)]
    n, h, c = month_bin_counts(sub, months)
    aq = aqua_month.reindex(months).fillna(0).to_numpy()
    p_raw, p_norm, plateau, f50 = fit_curve(n, h, c)
    floor_w = (CENTRES >= f50).astype(float)
    out = {
        "variant": variant, "dn": dn, "n_snpp_cells": int(n.sum()), "n_aqua_cells": int(aq.sum()),
        "match_rate": float(h.sum() / max(n.sum(), 1)), "control_rate": float(c.sum() / max(n.sum(), 1)),
        "plateau": float(plateau), "f50": float(f50),
        "p_norm": p_norm.tolist(), "p_raw": p_raw.tolist(),
        "k_curve": float(aq.sum() / max((n @ p_norm).sum(), 1e-9)),
        "k_floor": float(aq.sum() / max((n @ floor_w).sum(), 1e-9)),
        "k_ratio": float(aq.sum() / max(n.sum(), 1e-9)),
    }
    # Block bootstrap by month: resample whole months with replacement.
    f50s, ks, curves = [], [], []
    for _ in range(N_BOOT):
        idx = RNG.integers(0, len(months), len(months))
        _, pn, _, f = fit_curve(n[idx], h[idx], c[idx])
        f50s.append(f)
        ks.append(aq[idx].sum() / max((n[idx] @ pn).sum(), 1e-9))
        curves.append(pn)
    curves = np.array(curves)
    out["f50_lo"], out["f50_hi"] = (float(x) for x in np.nanpercentile(f50s, [5, 95]))
    out["p_lo"] = np.percentile(curves, 5, axis=0).tolist()
    out["p_hi"] = np.percentile(curves, 95, axis=0).tolist()
    # Relative spread of the calibration total, used for the range on harm.
    tot = np.array([k * (n @ pn).sum() for k, pn in zip(ks, curves)])
    base = np.array([(n @ pn).sum() for pn in curves])
    out["rel_sd_k"] = float(np.std(ks) / np.mean(ks))
    del tot, base
    # Near-simultaneous subset (Aqua overpass within 10 minutes), as a robustness figure.
    sno = sub[sub["dt"] <= 10]
    if len(sno) >= 500:
        ns, hs, cs = month_bin_counts(sno, months)
        _, _, pl_s, f_s = fit_curve(ns, hs, cs)
        out["sno"] = {"n": int(len(sno)), "plateau": float(pl_s), "f50": float(f_s),
                      "match_rate": float(sno["hit"].mean())}
    else:
        out["sno"] = {"n": int(len(sno))}
    return out


def harmonize_area(con: duckdb.DuckDBPyConnection, area: str, curves_all: dict) -> None:
    build_cells(con, area)
    cells = con.execute("select * from cells").df()
    aqua = cells[cells["satellite"] == "Aqua"]

    donor = TRANSFER.get(area)
    if donor:
        fits = curves_all[donor]
    else:
        match = match_table(con)
        fits = {}
        for variant in CAL:
            for dn in ("D", "N"):
                aq_m = aqua[aqua["dn"] == dn].groupby("ym").size()
                fits[f"{variant}_{dn}"] = calibrate(match, aq_m, variant, dn)
        curves_all[area] = fits

    # Weights for every VIIRS fire cell under each model and calibration variant.
    v = cells[cells["sensor"] == "VIIRS"].copy()
    b = bin_index(v["frp_sum"].to_numpy())
    is_day = (v["dn"] == "D").to_numpy()
    for variant in CAL:
        fd, fn = fits[f"{variant}_D"], fits[f"{variant}_N"]
        pn = np.where(is_day, np.array(fd["p_norm"])[b], np.array(fn["p_norm"])[b])
        f50 = np.where(is_day, fd["f50"], fn["f50"])
        v[f"p_{variant}"] = pn
        v[f"S0_{variant}"] = pn * np.where(is_day, fd["k_curve"], fn["k_curve"])
        v[f"L2_{variant}"] = (v["frp_sum"].to_numpy() >= f50) * np.where(is_day, fd["k_floor"], fn["k_floor"])
        v[f"L1r_{variant}"] = np.where(is_day, fd["k_ratio"], fn["k_ratio"])
    v.to_parquet(WORK / f"{area}_weights.parquet", index=False)

    # Monthly series.
    months = pd.period_range(cells["ym"].min(), cells["ym"].max(), freq="M").strftime("%Y-%m")
    ser = pd.DataFrame(index=months)
    ser.index.name = "ym"
    ser["R"] = aqua.groupby("ym").size()
    ser["terra"] = cells[cells["satellite"] == "Terra"].groupby("ym").size()
    src = (WORK / f"{area}.parquet").as_posix()
    ser["L0"] = con.execute(
        f"select strftime(acq_date, '%Y-%m') ym, count(*) n from '{src}' group by 1").df().set_index("ym")["n"]
    cols = ["cells"] + [f"{m}_{x}" for x in CAL for m in ("S0", "L2", "L1r")] + [f"small_{x}" for x in CAL]
    v["cells"] = 1.0
    for variant in CAL:
        v[f"small_{variant}"] = 1.0 - v[f"p_{variant}"]
    per_sat = v.groupby(["satellite", "ym"])[cols].sum()
    for sat, (lo, hi) in VIIRS_OPS.items():
        if sat in per_sat.index.get_level_values(0):
            block = per_sat.loc[sat].reindex(months).fillna(0)
            block[(months < lo) | (months > hi)] = np.nan
            for col in cols:
                ser[f"{col}__{sat}"] = block[col]
    for col in cols:                       # mean over the VIIRS satellites operating that month
        ser[f"V_{col}"] = ser[[c for c in ser.columns if c.startswith(col + "__")]].mean(axis=1, skipna=True)
    ser = ser.fillna({"R": 0, "terra": 0, "L0": 0})
    ser.reset_index().to_parquet(WORK / f"{area}_series.parquet", index=False)

    # Daily series for October and November (check C7).
    daily = pd.DataFrame({"aqua": aqua.groupby("acq_date").size()})
    for variant in CAL:
        d = v.groupby(["satellite", "acq_date"])[f"S0_{variant}"].sum().unstack(0)
        daily[f"V_S0_{variant}"] = d.mean(axis=1, skipna=True)
    daily = daily.join(pd.DataFrame(index=pd.to_datetime(v["acq_date"].unique())), how="outer")
    daily.index.name = "acq_date"
    daily.reset_index().to_parquet(WORK / f"{area}_daily.parquet", index=False)


def main() -> None:
    con = duckdb.connect()
    curves_all: dict = {}
    for area in AREAS:                      # donors before the areas that borrow from them
        if area not in TRANSFER:
            harmonize_area(con, area, curves_all)
    for area in TRANSFER:
        harmonize_area(con, area, curves_all)
    payload = {"edges": EDGES.tolist(), "centres": CENTRES.tolist(), "calibration": CAL,
               "transfer": TRANSFER, "areas": curves_all}
    (WORK / "curves.json").write_text(json.dumps(payload), encoding="utf-8")
    for area, fits in curves_all.items():
        for key, f in fits.items():
            sno = f["sno"]
            print(f"{area} {key}: S-NPP cells {f['n_snpp_cells']:,}, Aqua cells {f['n_aqua_cells']:,}, "
                  f"match {f['match_rate']:.3f}, chance {f['control_rate']:.3f}, plateau {f['plateau']:.3f}, "
                  f"F50 {f['f50']:.1f} MW [{f['f50_lo']:.1f}, {f['f50_hi']:.1f}], "
                  f"k curve {f['k_curve']:.3f} floor {f['k_floor']:.3f} ratio {f['k_ratio']:.3f} | "
                  f"SNO n {sno.get('n')}, plateau {sno.get('plateau', float('nan')):.3f}, "
                  f"F50 {sno.get('f50', float('nan')):.1f}")


if __name__ == "__main__":
    main()
