"""Three analyses only a harmonized record allows, written as small app files.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

1. season.json  "Has the burning season moved?" For each year, the days by
   which 10, 50 and 90 percent of the season's activity had happened, on the
   harmonized daily record, with a trend in days per decade (Theil-Sen, 90%
   range). Answers the challenge's "recognize changes relative to historical
   patterns". Needs a record that spans both sensors: 2002 to 2011 is MODIS,
   2012 onwards is VIIRS.

2. drift.json   "Would a MODIS-only calendar still be right?" Each satellite's
   daytime overpass time by year, measured from the detections, and how far
   Aqua departs from the harmonized record. MODIS's orbits drift after 2021.

3. episodes.json "How does this fire compare with previous ones?" (challenge
   text). Runs of days with fire activity in the area, each with start, end,
   length, total and peak, ranked against every earlier episode.

All three use the whole area (not a drawn shape). Run after export.py:
python pipeline/stretch.py
"""

import json

import duckdb
import numpy as np
import pandas as pd
from scipy import stats

from config import APP_DATA, AREAS, FIGURES, REPO, WORK
from harmonize import VIIRS_OPS

# Season windows (day of year, inclusive), chosen from each area's climatology.
SEASONS = {
    "punjab-haryana": {"name": "rice-residue burning, 15 Sep to 15 Dec", "from": (9, 15), "to": (12, 15)},
    "cordoba": {"name": "winter-spring fire season, 1 Jun to 31 Dec", "from": (6, 1), "to": (12, 31)},
    "karnataka-south": {"name": "dry-season forest fires, 1 Jan to 31 May", "from": (1, 1), "to": (5, 31)},
}
EPISODE_AREAS = ["chilecito", "cordoba", "karnataka-south"]
EPISODE_GAP = 2          # an episode continues across up to 2 quiet days (cloud, no overpass)
EPISODE_MIN = 1.0        # harmonized fire cells per day to count as active
LAW_YEAR = 2009          # Punjab Preservation of Subsoil Water Act


def daily(area: str, model: str, variant: str) -> pd.Series:
    """Harmonized activity per day: Aqua fire cells before Feb 2012, VIIRS weights after."""
    cells = pd.read_parquet(WORK / f"{area}_cells.parquet", columns=["satellite", "acq_date"])
    cells["acq_date"] = pd.to_datetime(cells["acq_date"])
    aqua = cells[cells["satellite"] == "Aqua"].groupby("acq_date").size().astype(float)
    w = pd.read_parquet(WORK / f"{area}_weights.parquet", columns=["satellite", "acq_date", f"{model}_{variant}"])
    w["acq_date"] = pd.to_datetime(w["acq_date"])
    per = w.groupby(["acq_date", "satellite"])[f"{model}_{variant}"].sum().unstack()
    days = pd.date_range("2002-07-04", max(aqua.index.max(), per.index.max()), freq="D")
    per = per.reindex(days)
    ym = days.strftime("%Y-%m")
    for sat, (lo, hi) in VIIRS_OPS.items():
        if sat in per:
            ok = (ym >= lo) & (ym <= hi)
            per.loc[~ok, sat] = np.nan
            per.loc[ok, sat] = per.loc[ok, sat].fillna(0.0)
    viirs = per.mean(axis=1, skipna=True)
    out = aqua.reindex(days).fillna(0.0)
    late = days >= "2012-02-01"
    out[late] = viirs[late].fillna(0.0)
    return out


def theil_sen(years, values):
    res = stats.theilslopes(values, years, alpha=0.90)
    return {"days_per_decade": round(10 * res.slope, 1), "lo": round(10 * res.low_slope, 1),
            "hi": round(10 * res.high_slope, 1)}


def season(area: str, d: pd.Series) -> dict:
    s = SEASONS[area]
    rows = []
    for year in range(2002, d.index.max().year + 1):
        start = pd.Timestamp(year, *s["from"])
        end = pd.Timestamp(year, *s["to"])
        if start < d.index.min() or end > d.index.max():
            continue
        w = d[(d.index >= start) & (d.index <= end)]
        if w.sum() < 30:
            continue
        cum = w.cumsum() / w.sum()
        pick = {q: cum.index[(cum >= q).argmax()] for q in (0.1, 0.5, 0.9)}
        rows.append({"year": year, "start": pick[0.1].strftime("%m-%d"), "peak": pick[0.5].strftime("%m-%d"),
                     "end": pick[0.9].strftime("%m-%d"), "start_doy": int(pick[0.1].day_of_year),
                     "peak_doy": int(pick[0.5].day_of_year), "end_doy": int(pick[0.9].day_of_year),
                     "length_days": int((pick[0.9] - pick[0.1]).days) + 1, "total": round(float(w.sum()), 2),
                     "sensor": "MODIS (Aqua)" if year < 2012 else "VIIRS, harmonized"})
    df = pd.DataFrame(rows)
    out = {"window": s["name"], "years": rows,
           "trend": {k: theil_sen(df["year"], df[f"{k}_doy" if k != "length" else "length_days"])
                     for k in ("start", "peak", "end", "length")},
           "method": "Day by which 10, 50 and 90 percent of the season's harmonized activity had happened. "
                     "Trend: Theil-Sen slope with 90 percent range. Years with fewer than 30 fire cells "
                     "in the window are left out."}
    if area == "punjab-haryana":
        before = df[(df["year"] >= 2003) & (df["year"] <= 2008)]["peak_doy"]
        after = df[(df["year"] >= 2010) & (df["year"] <= 2019)]["peak_doy"]
        out["law_2009"] = {"mean_peak_before": round(float(before.mean()), 1),
                           "mean_peak_after": round(float(after.mean()), 1),
                           "shift_days": round(float(after.mean() - before.mean()), 1),
                           "p_one_sided": round(float(stats.mannwhitneyu(after, before,
                                                                         alternative="greater").pvalue), 4),
                           "note": "2003-2008 against 2010-2019. Published: peak moved from 24 Oct to 4 Nov "
                                   "(Balwinder-Singh et al. 2019, Nature Sustainability), a different statistic"}
    return out


def drift(area: str) -> dict:
    lon = 0.5 * (AREAS[area][1] + AREAS[area][3])
    con = duckdb.connect()
    src = (WORK / f"{area}.parquet").as_posix()
    op = con.execute(f"""
        select year(acq_date) y, satellite,
               avg(((cast(substr(acq_time,1,2) as int)*60 + cast(substr(acq_time,3,2) as int)) + 4*{lon})/60.0 + 24) % 24 h
        from '{src}' where daynight = 'D' group by 1, 2 order by 1, 2""").df()
    s = pd.read_parquet(WORK / f"{area}_series.parquet").set_index("ym")
    meta = json.loads((APP_DATA / area / "meta.json").read_text(encoding="utf-8"))
    col = f"V_{meta['level_shipped']}_A"
    s["year"] = s.index.str[:4].astype(int)
    late = s[s.index >= "2012-02"].groupby("year")[["R", col]].sum()
    years = []
    for y, g in op.groupby("y"):
        row = {"year": int(y), "overpass_local_time": {r.satellite: round(float(r.h), 2) for r in g.itertuples()}}
        if y in late.index and late.loc[y, col] > 0 and y <= 2026:
            row["aqua_over_harmonized"] = round(float(late.loc[y, "R"] / late.loc[y, col]), 3)
        years.append(row)
    return {"years": years,
            "note": "Mean local solar time of daytime detections. Aqua's last orbit-maintenance manoeuvre was in "
                    "December 2021; since then its afternoon pass moves later each year and Terra's morning pass "
                    "earlier. aqua_over_harmonized above 1 means a MODIS-only calendar would show more fire than "
                    "the harmonized record."}


def episodes(area: str, d: pd.Series) -> dict:
    active = d >= EPISODE_MIN
    eps, start, last = [], None, None
    for day, on in active.items():
        if on:
            if start is None:
                start = day
            elif (day - last).days > EPISODE_GAP + 1:
                eps.append((start, last))
                start = day
            last = day
    if start is not None:
        eps.append((start, last))
    rows = []
    for a, b in eps:
        w = d[(d.index >= a) & (d.index <= b)]
        rows.append({"start": a.strftime("%Y-%m-%d"), "end": b.strftime("%Y-%m-%d"),
                     "days": int((b - a).days) + 1, "total": round(float(w.sum()), 2),
                     "peak": round(float(w.max()), 2), "peak_day": w.idxmax().strftime("%Y-%m-%d"),
                     "sensor": "MODIS (Aqua)" if b < pd.Timestamp("2012-02-01") else "VIIRS, harmonized"})
    df = pd.DataFrame(rows)
    df["rank_total"] = df["total"].rank(ascending=False, method="min").astype(int)
    df["rank_peak"] = df["peak"].rank(ascending=False, method="min").astype(int)
    top = df.sort_values("total", ascending=False).head(15)
    latest = df.sort_values("start").tail(5)
    return {"definition": f"Consecutive days with at least {EPISODE_MIN:g} harmonized fire cell in the area, "
                          f"allowing gaps of up to {EPISODE_GAP} quiet days. Ranks are among all "
                          f"{len(df)} episodes since July 2002.",
            "count": int(len(df)), "largest": top.to_dict("records"), "latest": latest.to_dict("records")}


def main() -> None:
    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))["areas"]
    summary = {}
    for area in AREAS:
        model, variant = shipping[area]["model"], shipping[area]["variant"]
        d = daily(area, model, variant)
        out = APP_DATA / area
        drift_data = drift(area)
        (out / "drift.json").write_text(json.dumps(drift_data, indent=1), encoding="utf-8")
        # Areas an analysis does not cover get an explicit `null` file: the app hides
        # the section, and the browser no longer logs a 404 for a missing file.
        if area in SEASONS:
            se = season(area, d)
            (out / "season.json").write_text(json.dumps(se, indent=1), encoding="utf-8")
            summary[area + " season"] = {"trend": se["trend"], "law_2009": se.get("law_2009")}
        else:
            (out / "season.json").write_text("null\n", encoding="utf-8")
        if area in EPISODE_AREAS:
            ep = episodes(area, d)
            (out / "episodes.json").write_text(json.dumps(ep, indent=1), encoding="utf-8")
            summary[area + " episodes"] = {"count": ep["count"], "largest": ep["largest"][:3],
                                           "latest": ep["latest"][-2:]}
        else:
            (out / "episodes.json").write_text("null\n", encoding="utf-8")
    print(json.dumps(summary, indent=1))



def season_figure(area: str, title: str) -> None:
    """Start, peak and end of the season per year, coloured by the sensor behind it."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    s = json.loads((APP_DATA / area / "season.json").read_text(encoding="utf-8"))
    df = pd.DataFrame(s["years"])
    fig, ax = plt.subplots(figsize=(9, 4.4))
    for sensor, colour in (("MODIS (Aqua)", "#1f5f8b"), ("VIIRS, harmonized", "#b8400f")):
        g = df[df["sensor"] == sensor]
        ax.vlines(g["year"], g["start_doy"], g["end_doy"], color=colour, lw=5, alpha=0.35)
        ax.plot(g["year"], g["peak_doy"], "o", color=colour, ms=6, label=f"Peak day ({sensor})")
    t = s["trend"]["peak"]
    x = np.array([df["year"].min(), df["year"].max()])
    b = np.median(df["peak_doy"] - t["days_per_decade"] / 10 * df["year"])
    ax.plot(x, b + t["days_per_decade"] / 10 * x, color="#222", lw=1, ls="--",
            label=f"Peak trend: {t['days_per_decade']:+.1f} days per decade ({t['lo']:+.1f} to {t['hi']:+.1f})")
    if area == "punjab-haryana":
        ax.axvline(LAW_YEAR + 0.5, color="#8a93a3", lw=0.8)
        ax.text(LAW_YEAR + 0.6, ax.get_ylim()[0] + 2, "2009 groundwater laws", fontsize=8, color="#555")
    ticks = pd.date_range("2001-09-01", "2001-12-31", freq="MS") if area == "punjab-haryana" \
        else pd.date_range("2001-06-01", "2001-12-31", freq="MS")
    ax.set_yticks([d.day_of_year for d in ticks], [d.strftime("%d %b") for d in ticks])
    ax.set_ylabel("Bar: 10% to 90% of the season's activity")
    ax.set_title(title)
    ax.legend(frameon=False, fontsize=8, loc="upper left")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(FIGURES / f"season_{area}.png", dpi=150)
    plt.close(fig)


if __name__ == "__main__":
    main()
    season_figure("punjab-haryana", "Punjab and Haryana: the rice-residue burning season, 2002 to 2025")
    season_figure("cordoba", "Córdoba: the fire season, 2002 to 2025")
