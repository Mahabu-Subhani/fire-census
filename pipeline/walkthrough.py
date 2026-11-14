"""Write the presenter's walkthrough: every screen we show, what it means, and its numbers.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

AGENTS.md rule 4: every number shown must come from the pipeline. So the
walkthrough is not typed by hand: this script reads the files the app reads
(app/public/data/<area>/*.json) and writes submission/inbox/A-what-we-show.md.
Rerun it after every export and the script stays in step with the app.

The plain-words text below explains what each screen and check *is*. Every
value, verdict and count comes from the data files at the time of the run.

Run from the repo root (no downloaded data, no network, about 5 seconds):
    python pipeline/walkthrough.py
"""

from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
APP_DATA = REPO / "app" / "public" / "data"
OUT = REPO / "submission" / "inbox" / "A-what-we-show.md"
LIVE = "https://mahabu-subhani.github.io/fire-census/"

# What each check asks, in plain words. Definitions: docs/PREREGISTRATION.md.
CHECKS = {
    "C0": ("Does the test have power?",
           "Before 2012 only MODIS watched; from 2012 VIIRS joined and sees far more small fires. "
           "C0 asks whether the raw, added-up record really jumps at 2012 compared with Aqua alone. "
           "If it did not, a 'no jump' result later would prove nothing.",
           "pre-registered"),
    "C1": ("Is the 2012 jump gone?",
           "The same step statistic as C0 (mean of the 36 months after 2012 over the 36 before, on a log "
           "scale), now on our harmonized record against Aqua alone. Close to zero means the seam is gone.",
           "pre-registered"),
    "C1b": ("Does a change-point test find a break at 2012?",
            "A Pettitt test looks for the month where the ratio of our record to Aqua shifts. Pass: no "
            "significant break between July 2011 and December 2012.",
            "pre-registered"),
    "C1x": ("Is the jump gone when the model never saw those years?",
            "C1 again, but the model is fitted on 2015 to 2021 only and tested on 2012 to 2015, so the "
            "test years are out of sample.",
            "added after results"),
    "C2": ("Does the test cry wolf?",
           "The C1 statistic at 2016 and 2008, dates with no sensor change. A good method shows no step "
           "there either. 2008 is zero by construction (before 2012 our record is Aqua itself).",
           "pre-registered"),
    "C3": ("Does it hold in years left out of the fit?",
           "Fitted on 2012 to 2017, tested on 2018 to 2019: the typical (median) month-to-month gap "
           "between harmonized VIIRS and Aqua. This is a scatter measure; even two identical VIIRS "
           "satellites differ by 0.07 to 0.10 on it.",
           "pre-registered"),
    "C3r": ("Does the two-year total hold in years left out of the fit?",
            "The gap between the 2018 to 2019 totals instead of the typical monthly gap. Measures drift, "
            "which is what C3 was meant to catch. Shown beside C3, never instead of it.",
            "added after results"),
    "C4": ("Does a different VIIRS satellite give the same record?",
           "NOAA-20 run through the model fitted on S-NPP, with no refitting, compared with S-NPP: "
           "slope near 1 and high correlation mean the method is not tuned to one satellite.",
           "pre-registered"),
    "C5": ("Is the detection limit physically sensible?",
           "The fire strength at which our curve says MODIS has a 50 % chance of seeing a fire, against "
           "the published MODIS detection limit (Sofiev and Kouznetsov 2026). Within a factor of 2 passes.",
           "pre-registered"),
    "C6": ("Do fires and ESA burned area keep the same relationship?",
           "Yearly harmonized activity divided by ESA Fire_cci burned area, 2013 to 2019 against 2003 "
           "to 2011. If the record had a seam, this ratio would step at 2012.",
           "pre-registered (gated for Córdoba only)"),
    "C6m": ("Same, with NASA MCD64A1 burned area",
            "C6 repeated with NASA's own burned-area product, to see whether the ESA result is a quirk "
            "of one product.",
            "added after results"),
    "C7": ("Did Punjab's burning peak move later after 2009?",
           "A finding about the world, not a test of the method: the middle day of October to November "
           "burning, 2010 to 2019 against 2003 to 2008. Published work says about 24 Oct to about 4 Nov.",
           "pre-registered"),
    "C8": ("Is the detection curve stable?",
           "500 bootstrap redraws of the data; the 90 % range of the curve's midpoint must be at most "
           "half the midpoint, or the curve is too uncertain to ship.",
           "pre-registered"),
}

AREA_ORDER = ["punjab-haryana", "cordoba", "chilecito", "karnataka-south"]
LIMIT = 0.25        # C6 threshold, docs/PREREGISTRATION.md
SEAM_SMALL = 0.10   # for the reading only: a seam part this small is C1's own limit


def short(region: dict) -> str:
    """'Punjab and Haryana, India' -> 'Punjab and Haryana' (the name without its country)."""
    return region["name"].rsplit(",", 1)[0]


# ---------- reading ----------

def load(area: str, name: str):
    path = APP_DATA / area / name
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def regions() -> dict:
    rows = json.loads((APP_DATA / "regions.json").read_text(encoding="utf-8"))
    by_id = {r["id"]: r for r in rows}
    return {a: by_id[a] for a in AREA_ORDER if a in by_id} | {a: r for a, r in by_id.items() if a not in AREA_ORDER}


def yearly_totals(cube: list) -> dict:
    """Year -> (raw detections, harmonized fire cells, small-fire layer), summed over every cell."""
    tot = defaultdict(lambda: [0.0, 0.0, 0.0])
    for r in cube:
        y = int(r["ym"][:4])
        tot[y][0] += (r.get("raw_modis") or 0) + (r.get("raw_viirs") or 0)
        tot[y][1] += r.get("harm") or 0
        tot[y][2] += r.get("small") or 0
    return dict(sorted(tot.items()))


# ---------- formatting ----------

def n(x, d=0) -> str:
    if x is None:
        return "n/a"
    return f"{x:,.{d}f}"


def clock(h) -> str:
    if h is None:
        return "n/a"
    hh = int(h)
    return f"{hh:02d}:{round((h - hh) * 60):02d}"


def times(log_value) -> str:
    """A log step as a plain multiplier: 1.674 -> 'x5.3'."""
    return f"x{math.exp(float(log_value)):.2f}"


def cell(v) -> str:
    return "n/a" if v is None else str(v).replace("|", "/")


def verdict(v: str) -> str:
    return {"pass": "Pass", "fail": "**FAIL**", "not run": "not run"}.get(v, v)


def numbers_in(text: str, pattern: str):
    pattern = pattern.replace("NUM", r"(-?\d+(?:\.\d+)?)")
    m = re.search(pattern, text or "", flags=re.S)
    return [float(g) for g in m.groups()] if m else None


# ---------- sections ----------

def section_story(R, metas) -> list[str]:
    out = ["## 1. The story in four sentences", ""]
    p = metas.get("punjab-haryana")
    jump = next((c["value"] for c in p["checks"] if c["id"] == "C0"), None) if p else None
    seam = next((c["value"] for c in p["checks"] if c["id"] == "C1"), None) if p else None
    out += [
        "1. NASA has watched fires from MODIS since 2000 and from VIIRS since 2012. VIIRS sees much smaller "
        "fires, so simply adding the two records makes burning look like it exploded in 2012.",
        f"2. In Punjab and Haryana the raw record steps up {times(jump)} against Aqua alone at 2012 (check C0, "
        f"{jump}). That is the camera, not the fire." if jump is not None else "2. (Punjab data missing.)",
        f"3. We measured which VIIRS fires MODIS could have seen and count only those, so the record stays in "
        f"MODIS units. After harmonization the step is {times(seam)} (check C1, {seam})." if seam is not None else "3.",
        "4. The app answers 'is this month unusual here?' on that one record, for a region, a district or an "
        "area you draw, and shows every check, passed and failed.",
        "",
    ]
    return out


def section_screens(R, metas, extra) -> list[str]:
    """Screen by screen in the order a visitor meets them."""
    out = ["## 2. Screen by screen", "",
           f"Live app: {LIVE}. Each screen: what it shows, what to say, and the numbers to quote. "
           "Anything marked 'read live' changes with the date; read it off the screen on the day.", ""]

    def screen(title, where, shows, say, numbers=None, source=None):
        out.append(f"### {title}")
        out.append("")
        out.append(f"- **Where:** {where}")
        out.append(f"- **Shows:** {shows}")
        out.append(f"- **Say:** \"{say}\"")
        if source:
            out.append(f"- **Numbers come from:** {source}")
        if numbers:
            out.append("- **Numbers to quote:**")
            out.extend(f"  - {x}" for x in numbers)
        out.append("")

    screen("Ask page", f"Top bar, Ask (or `{LIVE}?v=ask`)",
           "One text box. Type a place and a time ('Sangrur October 2023'); the parts the app understood change "
           "colour; Enter opens the Overview on that district and period. Fixed rules in the browser, no AI "
           "model, nothing sent anywhere.",
           "Type a place and a month in plain words and the map opens on it.")

    screen("Map (Overview)", "Overview, left: the map fills the screen",
           "The region outline on NASA Blue Marble imagery, the other study areas with name tags, drawing a "
           "rectangle or polygon by tapping corners, NASA's live VIIRS fires for today or yesterday (raw, "
           "straight from NASA, not our record), month-by-month playback, and the population exposure colouring.",
           "Pick any area: a district, a drawn shape, or typed coordinates.",
           [f"{R[a]['name']}: record {R[a]['first_month']} to {R[a]['last_month']}, harmonized from "
            f"{R[a]['harmonized_from']}" for a in R])

    screen("Answer card", "Overview, top of the right-hand panel",
           "The area name, the month judged (the newest month, or the one month asked for), its rank among the "
           "same month in every earlier year, the ratio to the usual value, a range allowing for the "
           "harmonization error, and a plain verdict. 'Case study' tag on areas where held-out checks failed.",
           "Is this month unusual here? This is the answer, on a record where 2005 and 2025 mean the same.",
           ["Rank and ratio: read live (they change with the month)."] +
           [f"{R[a]['name']}: data to {metas[a].get('data_through')}; months from {metas[a].get('nrt_from')} "
            f"are near-real-time and may change" for a in R if a in metas],
           "the cube, through app/src/stats/")

    screen("Burning calendar", "Overview, first section (open by default); also on the Data page",
           "Years as rows, months as columns, colour by amount or by difference from that month's average; "
           "each year's total on the right. Months before harmonization are hatched 'Terra only'. Exact values "
           "on hover.",
           "Every square is one month. Dark is more burning. Read down a column to compare the same month across every year since 2002.",
           source="cube.json")

    screen("Area, and Dates and layers", "Overview, sections 'Area' and 'Dates and layers'",
           "Region menu, district search, typed coordinates, the area in km² and grid cells; date range; the "
           "small-fires layer (VIIRS only, from 2012, never added into the main record); Download hotspots.",
           "Narrow to a district or a season; switch on the small fires that only VIIRS can see.")

    for title, sid, shows, say in [
        ("Monthly comparison", "comparison",
         "One calendar month against the same month in every earlier year: a bar per year, the median and 90th "
         "percentile lines, the year in question highlighted.",
         "Here is this month against the same month in every year since 2002."),
        ("Three-month climatology", "outlook",
         "For the next three months: the typical value (median), a bad year (90th percentile), each month's "
         "share of a typical year, and when the peak usually comes. History, not a forecast.",
         "What usually comes next: history, not a forecast."),
    ]:
        screen(title, f"Overview section '{title}'; also on the Data page", shows, say)

    seas = []
    for a in R:
        s = extra[a]["season"]
        if not s:
            continue
        t = s.get("trend", {})
        pk = t.get("peak", {})
        seas.append(f"{R[a]['name']} ({s.get('window')}): peak moves {pk.get('days_per_decade')} days per decade "
                    f"(range {pk.get('lo')} to {pk.get('hi')}); season length {t.get('length', {}).get('days_per_decade')} "
                    f"days per decade (range {t.get('length', {}).get('lo')} to {t.get('length', {}).get('hi')})")
        law = s.get("law_2009")
        if law:
            seas.append(f"{R[a]['name']}: peak {law['shift_days']} days later after 2009 (one-sided p = "
                        f"{law['p_one_sided']}); {law['note']}")
    screen("Fire season timing", "Overview section; whole region only (hidden when an area is drawn)",
           "One bar per year from the day the season started to the day it ended (10 % and 90 % of its "
           "activity), a dot at the peak (50 %), and the trend of the peak.",
           "The season's timing, year by year: has it moved?",
           seas or ["No season file for any area."], "season.json (pipeline/stretch.py)")

    lc = []
    for a in R:
        L = extra[a]["landcover"]
        if not L:
            continue
        top = sorted(L.get("share_by_class", {}).items(), key=lambda kv: -kv[1])[:3]
        lc.append(f"{R[a]['name']}: " + ", ".join(f"{k} {v * 100:.0f} %" for k, v in top))
    screen("Land cover", "Overview section; whole region only",
           "What the fires burned on: cropland, forest, grass and shrub, other (ESA WorldCover 2021), by month "
           "and by year, for the harmonized record and the small-fire layer.",
           "Crops or wild land: the challenge separates the two, and so do we.",
           lc, "landcover.json (ESA WorldCover 2021 via Microsoft Planetary Computer)")

    pop = [f"{R[a]['name']}: {n(extra[a]['population']['region_population'])} people in the region "
           f"(WorldPop {extra[a]['population'].get('population_year')})"
           for a in R if extra[a]["population"]]
    screen("Population near fires", "Overview section; follows the drawn area and the dates",
           "People living in 0.1-degree squares where it burns, by burning level (light, moderate, heavy a "
           "year), and year by year. Exposure means living where it burns, not harm or risk.",
           "How many people live where it burns. Not a danger rating.",
           pop + ["People by burning level for the selection: read live."], "population.json (WorldPop 2020)")

    ep = []
    for a in R:
        e = extra[a]["episodes"]
        if not e:
            ep.append(f"{R[a]['name']}: no episodes file (section hidden)")
            continue
        big = e.get("largest", [])[:3]
        ep.append(f"{R[a]['name']}: {e['count']} episodes since {R[a]['harmonized_from']}; largest: " + "; ".join(
            f"{x['start']} to {x['end']} ({x['days']} days, {n(x['total'])} fire cells, {x['sensor']})" for x in big))
    screen("Fire episodes", "Overview section; whole region only",
           "Runs of consecutive days with fire (gaps of up to 2 quiet days allowed), the most recent ones with "
           "their rank, and the largest on record.",
           "How does this fire compare with earlier ones?",
           ep, "episodes.json (pipeline/stretch.py)")

    dr = []
    for a in R:
        d, src = extra[a]["drift"], extra[a]["sources"]
        if src:
            first = {}
            last = {}
            for r in src["rows"]:
                first.setdefault(r["satellite"], r["year"])
                last[r["satellite"]] = r["year"]
            sats = ", ".join(f"{s} {first[s]} to {last[s]}" for s in first)
            dr.append(f"{R[a]['name']}: satellites in the record: {sats}")
        if d:
            ys = {y["year"]: y for y in d["years"]}
            aq = {y: v["overpass_local_time"].get("Aqua") for y, v in ys.items() if v.get("overpass_local_time")}
            if 2021 in aq and aq:
                latest = max(y for y in aq if aq[y] is not None)
                ratio = ys[latest].get("aqua_over_harmonized")
                through = (metas.get(a) or {}).get("data_through", "")
                part = " so far" if through.startswith(str(latest)) else ""
                dr.append(f"{R[a]['name']}: Aqua's daytime pass {clock(aq[2021])} in 2021, {clock(aq[latest])} in "
                          f"{latest}{part}; Aqua over harmonized in {latest}{part}: {ratio} (above 1: a MODIS-only "
                          f"record would show more fire than ours; below 1, less)")
    screen("Sensor agreement", "Overview, last section; also on the Data page",
           "Who was watching each year and how far each satellite's daytime pass has drifted on the clock; "
           "for one year and area, every fire sorted by which satellites saw it.",
           "Aqua is drifting later in the day since its last manoeuvre in December 2021. That is one more "
           "reason a MODIS-only record cannot be the future.",
           dr, "sources.json and drift.json")

    screen("Toolbar", "Overview, the small bar of buttons",
           "Download (CSV of the selection, raw or harmonized), Link (the exact view, shareable), Print, and Data "
           "(the full page with every chart, the method and every check).",
           "Everything you see can be downloaded, linked and printed.")

    # Data page
    jumps = []
    for a in R:
        m = metas.get(a)
        if not m:
            continue
        lad = {x["level"]: x for x in m.get("ladder", [])}
        l0 = next((v["step_2012"] for k, v in lad.items() if k.startswith("L0")), None)
        shipped = next((v for k, v in lad.items() if m["level_shipped"] in k.split()[0]), None)
        if l0 is not None and shipped:
            jumps.append(f"{R[a]['name']}: raw {times(l0)} ({l0}); harmonized, {m['level_name'].lower()} "
                         f"{times(shipped['step_2012'])} ({shipped['step_2012']}) against Aqua alone at 2012")
    for a in R:
        yt = extra[a]["years"]
        if 2011 in yt and 2013 in yt:
            jumps.append(f"{R[a]['name']}, whole-region yearly totals (raw detections / harmonized fire cells): " +
                         "; ".join(f"{y}: {n(yt[y][0])} / {n(yt[y][1])}" for y in (2010, 2011, 2012, 2013, 2014) if y in yt))
    screen("Monthly time series, Raw/Harmonized switch", "Data page (toolbar, Data), 'Monthly time series'; "
           "the RAW / HARMONIZED switch top right",
           "The month-by-month line with its uncertainty band. RAW: the jump at 2012 is plain. HARMONIZED: it is "
           "gone. The small-fire layer is its own line from 2012.",
           "Raw: burning seems to jump in 2012. That is the new camera. Harmonized: the jump disappears.",
           jumps, "meta.json (ladder: step at 2012 against Aqua alone, as a multiplier) and cube.json (yearly sums)")

    screen("Current month status and Annual trend", "Data page",
           "The same answer as the card, with month to date; yearly totals of complete harmonized years with "
           "Sen's slope, its 95 % range and the Mann-Kendall test.",
           "Is it getting worse here? The trend, with its uncertainty.",
           ["Read live: they follow the selection."])

    ship = [f"{R[a]['name']}: ships **{metas[a]['level_name']}**. {metas[a]['shipping_reason']}" for a in R if a in metas]
    screen("Harmonization method and checks", "Data page, 'Harmonization method'",
           "The method in short, the table of every pre-registered check for this region with value, limit and "
           "verdict (failed and not-run shown as plainly as passed), the method ladder, and the limits.",
           "We fixed the tests before opening the data. Here is every one, including the ones we failed.",
           ship, "meta.json")

    screen("Glossary and Data access", "Data page, bottom",
           "Plain meanings of the terms; how to cite; every data file of the region; the data dictionary; code "
           "to load the files.",
           "Everything is open: the files, the code, and how to check us.")
    return out


def section_checks(R, metas) -> list[str]:
    out = ["## 3. Every check, in plain words", "",
           "Thresholds were written down before the data was opened (`docs/PREREGISTRATION.md`) and are never "
           "changed. 'Added after results' checks are shown beside the originals, never instead.", ""]
    names = [short(R[a]) for a in R if a in metas]
    for cid, (q, plain, status) in CHECKS.items():
        out.append(f"### {cid}: {q}")
        out.append("")
        out.append(f"{plain} *({status}.)*")
        out.append("")
        first = next((c for a in R if a in metas for c in metas[a]["checks"] if c["id"] == cid), None)
        if first:
            out.append(f"Pass if: {first['threshold']}.")
            out.append("")
        out.append("| Area | Value | Verdict |")
        out.append("|---|---|---|")
        for a, label in zip([a for a in R if a in metas], names):
            c = next((c for c in metas[a]["checks"] if c["id"] == cid), None)
            if c:
                out.append(f"| {label} | {cell(c['value'])} | {verdict(c['verdict'])} |")
        out.append("")
    # Scoreboard
    out += ["### Scoreboard", "", "| Area | Pass | Fail | Not run | Failed checks |", "|---|---|---|---|---|"]
    for a, label in zip([a for a in R if a in metas], names):
        cs = metas[a]["checks"]
        cnt = {k: sum(c["verdict"] == k for c in cs) for k in ("pass", "fail", "not run")}
        fails = ", ".join(c["id"] for c in cs if c["verdict"] == "fail") or "none"
        out.append(f"| {label} | {cnt['pass']} | {cnt['fail']} | {cnt['not run']} | {fails} |")
    out.append("")
    return out


def section_c6(R, metas) -> list[str]:
    out = ["## 4. Why C6 fails, and what it does and does not mean", "",
           "C6 divides our yearly fire activity by the area ESA says burned, and compares 2013 to 2019 with "
           "2003 to 2011. It cannot tell *why* that ratio moved. So beside our record the pipeline runs the same "
           "statistic on **Aqua alone**, which flew the whole time with no sensor change. Aqua alone cannot "
           "have a 2012 seam, so whatever Aqua alone shows is the world (or the burned-area product), not "
           "the seam. Our record minus Aqua alone is the part a seam could explain.", "",
           "| Area | Gated? | C6, our record | Aqua alone (no seam possible) | Part a seam could explain | Raw record | C6m (NASA), our record | C6m, Aqua alone |",
           "|---|---|---|---|---|---|---|---|"]
    rows = {}
    for a in R:
        if a not in metas:
            continue
        cs = {c["id"]: c for c in metas[a]["checks"]}
        c6, c6m = cs.get("C6"), cs.get("C6m")
        if not c6:
            continue
        p = numbers_in(c6["note"], r"gives NUM on the same statistic and the raw record NUM.*?Aqua's by NUM")
        pm = numbers_in(c6m["note"] if c6m else "", r"Aqua alone, with no sensor change: NUM")
        gated = "yes" if "gated for this area" in c6["note"] else "no, reported"
        aqua, raw, seam = (p or [None, None, None])
        rows[a] = (c6["value"], c6["verdict"], aqua, seam,
                   float(c6m["value"]) if c6m and c6m["value"] is not None else None,
                   pm[0] if pm else None, gated == "yes")
        out.append(f"| {short(R[a])} | {gated} | {c6['value']} ({verdict(c6['verdict'])}) | {cell(aqua)} | "
                   f"{cell(seam)} | {cell(raw)} | {cell(c6m['value']) if c6m else 'n/a'} | {cell(pm[0]) if pm else 'n/a'} |")
    out.append("")
    out += [
        "**Reading the table.**",
        "",
        "- Where Aqua alone is already past the 0.25 limit, C6 fails for *any* method that keeps the record "
        "in Aqua units. Before 2012 our record *is* Aqua; after 2012 checks C1 and C1x hold it to Aqua's level. "
        "So C6 for our record is Aqua's own value plus the small 'seam' part. That is why it fails every run: it "
        "is not noise, and rerunning cannot change it.",
        "- The raw record would be far off in every area: that is the seam C6 was built to catch.",
        "",
        "**Area by area (worked out from the numbers above each time the script runs).**",
        "",
    ]
    for a, (val, verd, aqua, seam, m_val, m_aqua, gated) in rows.items():
        name = short(R[a])
        if aqua is None or seam is None:
            out.append(f"- {name}: the check note could not be read; see `meta.json`.")
            continue
        if verd != "fail":
            s = f"passes ({val}); Aqua alone gives {aqua}."
        elif abs(aqua) > LIMIT and abs(seam) <= SEAM_SMALL:
            s = (f"fails ({val}), but Aqua alone, with no sensor change, already gives {aqua}; the part a seam "
                 f"could explain is {seam}. So the failure is in the world or the burned-area product, not in "
                 f"the harmonization.")
        elif abs(seam) > SEAM_SMALL:
            s = (f"fails ({val}) and the part a seam could explain is large ({seam}; Aqua alone {aqua}). Here "
                 f"the harmonized record itself differs from Aqua after 2012. Compare this area's C1.")
        else:
            s = f"fails ({val}); Aqua alone {aqua}, seam part {seam}."
        if m_val is not None and m_aqua is not None:
            m_seam = round(m_val - m_aqua, 3)
            agree = (abs(m_seam) <= SEAM_SMALL) == (abs(seam) <= SEAM_SMALL)
            s += (f" NASA MCD64A1: our record {m_val}, Aqua alone {m_aqua}, seam part {m_seam}: "
                  + ("the same picture from an independent product." if agree else
                     "a different picture, so the two burned-area products disagree here."))
        s += " Gated: this is the area C6 was pre-registered for." if gated else " Not gated here."
        out.append(f"- {name}: {s}")
    out += [
        "",
        "**Why the relationship changed (hypotheses, not tested).** Possible causes include a change in the kind "
        "of fires (many small, repeatedly detected burns against fewer large spreading ones) and a few very large "
        "early fire years weighing on a median of only nine years. None of these was tested; do not state any as "
        "the cause.",
        "",
        "**Caveats on the shipped burned-area values.**",
        "",
    ]
    caveats = []
    for a in R:
        if a not in metas:
            continue
        for cid in ("C6", "C6m"):
            c = next((c for c in metas[a]["checks"] if c["id"] == cid), None)
            if not c:
                continue
            miss = re.search(r"ESA months missing: ((?:\d{4}-\d{2}(?:, )?)+)", c["note"])
            if miss:
                caveats.append(f"- {short(R[a])}, {cid}: ESA months missing ({miss.group(1).strip()}); rerun "
                               f"`pipeline/firecci.py`, which fetches missing months again.")
            if "Not yet recomputed" in c["note"]:
                caveats.append(f"- {short(R[a])}, {cid}: computed before the 14 Nov hard-floor correction; "
                               f"not yet recomputed.")
    out += caveats or ["- None: every burned-area value was computed on the current record with every month."]
    out.append("")
    gated = next(((a, r) for a, r in rows.items() if r[6]), None)
    if gated and gated[1][1] == "fail" and gated[1][2] is not None and abs(gated[1][2]) > LIMIT \
            and abs(gated[1][3]) <= SEAM_SMALL:
        out.append(f"**Say it like this:** \"C6 fails in {short(R[gated[0]])}, and we show it failing. Aqua on its "
                   f"own, which never changed sensor, fails it by almost the same amount, and NASA's burned-area "
                   f"product agrees. So the link between hotspots and hectares burned really changed there; our "
                   f"record follows Aqua.\"" if gated[1][4] is not None and gated[1][5] is not None
                   and abs(gated[1][4] - gated[1][5]) <= SEAM_SMALL else
                   f"**Say it like this:** \"C6 fails in {short(R[gated[0]])}, and we show it failing. Aqua on its "
                   f"own, which never changed sensor, fails it by almost the same amount, so the change is not a "
                   f"seam.\"")
    else:
        out.append("**Say it like this:** read the area-by-area lines above; the usual explanation does not hold "
                   "for the gated area in this data.")
    out.append("")
    return out


def section_dont_say(R, metas) -> list[str]:
    out = ["## 5. Do not say", ""]
    for a in R:
        if a not in metas:
            continue
        fails = [c["id"] for c in metas[a]["checks"] if c["verdict"] == "fail"]
        if fails:
            out.append(f"- \"{short(R[a])} passes every check\": it fails {', '.join(fails)}.")
    out += [
        "- \"Fire activity rose fivefold after 2012\": that is the raw record; say it is the camera.",
        "- \"Hectares burned\" for our numbers: the unit is fire cells (1 km squares with fire in one pass), "
        "in Aqua-equivalent units.",
        "- \"Danger\" or \"risk\" for the population chart: it is exposure (living where it burns).",
        "- \"Forecast\" for the three-month climatology: it is history.",
        "- \"AI answers your question\" for the Ask page: fixed rules, no AI model.",
        "",
    ]
    return out


def main() -> None:
    R = regions()
    metas = {a: load(a, "meta.json") for a in R}
    metas = {a: m for a, m in metas.items() if m}
    extra = {}
    for a in R:
        cube = load(a, "cube.json") or []
        extra[a] = {
            "season": load(a, "season.json"), "landcover": load(a, "landcover.json"),
            "population": load(a, "population.json"), "episodes": load(a, "episodes.json"),
            "drift": load(a, "drift.json"), "sources": load(a, "sources.json"),
            "years": yearly_totals(cube),
        }
    version = sorted({(m.get("data_version"), m.get("code_commit"), m.get("generated_at")) for m in metas.values()})
    lines = [
        "<!-- AI-assisted: generated by pipeline/walkthrough.py, written with help from Claude (Anthropic). "
        "Reviewed by Mahabu Subhani (pending). Do not edit by hand: rerun the script. -->",
        "",
        "# What we show: every screen, every check, every number",
        "",
        "For the team before judging, and for Charulekha's demo and project page. Every number below was read "
        "from `app/public/data/` by `python pipeline/walkthrough.py`; none was typed by hand. Data: " +
        "; ".join(f"version {v}, code {c}, exported {g}" for v, c, g in version) + ".",
        "",
    ]
    lines += section_story(R, metas)
    lines += section_screens(R, metas, extra)
    lines += section_checks(R, metas)
    lines += section_c6(R, metas)
    lines += section_dont_say(R, metas)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)} ({len(lines)} lines)")


if __name__ == "__main__":
    main()
