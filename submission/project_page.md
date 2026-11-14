<!-- AI-assisted: assembled and edited with help from Claude (Anthropic) from the team's drafts (method.md, results.md, limits.md, nasa_data.md by Mahabu; app by 8crsk and Charulekha). Reviewed by Charulekha Rajesh (pending). -->

# Project page: Fire Census

Paste each section into the field of the same name on the Space Apps project
page. Every number below is copied from `submission/results.md` (pipeline
output) or from the app's data files. Items marked **[CHECK]** must be settled
before submitting; see the list at the end.

---

## Project name

Fire Census

## High-level summary

An emergency manager in Córdoba or Punjab wants to know whether this month's
burning is unusual, and what usually comes next. NASA's satellites have watched
these places since 2000, but the record cannot answer that today: in 2012 a
sharper sensor, VIIRS, joined the older MODIS, and the raw count of hotspots
jumps about fivefold overnight. The jump is the camera, not the fire. Fire
Census rebuilds 24 years of NASA FIRMS hotspots into one burning calendar in
which 2005 and 2025 mean the same thing, using a measured curve of what MODIS
can see. A free web app shows the calendar for any area a user draws, names or
types, ranks the current month against every earlier year, and hands over the
data and charts. Ten checks were written down before the data was opened, and
every result is published, including the ones that failed.

*One fire record, whichever satellite was watching.*

## Link to demo

[CHECK] Public link to the 30-second video, once recorded and uploaded.

## Link to final project

App: https://mahabu-subhani.github.io/fire-census/
Code: https://github.com/Mahabu-Subhani/fire-census (public; opens without signing in, checked 14 Nov)

## Detailed description

### What it does

Open the link and the first line answers the question a manager asks first.
For Punjab and Haryana with data to 13 November 2026, November so far (1 to 13
November) ranks 23rd of 25 Novembers, at 0.11 times the median of the same days
in earlier years. The app ranks first and
gives the ratio second, because a ratio means nothing where the usual value is
zero. The current month is never complete, so every earlier year is counted
over the same days. Where there is too little activity to judge, it says so
instead of guessing.

Below that answer:

- **The burning calendar.** Every month from November 2000 to today as one row
  per year, so "which months and years burned most" can be read at a glance.
  It can be coloured by amount or by difference from that month's average. The
  months that usually hold most of the burning are outlined, and the current
  month is marked "you are here". Months before July 2002, when only Terra was
  flying, are hatched and labelled as not harmonized.
- **What usually comes next.** For the next three months: a typical year and a
  bad year from history, and the month that is usually the busiest. It is
  labelled "history, not a forecast", because it is one.
- **The month against earlier years.** Every year's value of the chosen month,
  with the median and the 90th percentile.
- **Is it getting worse here?** Yearly totals with a trend line and a
  statistical test, or "no clear trend". For Córdoba province the app finds
  activity fell by about half per decade from 2003 to 2025 (Mann-Kendall
  p = 0.004); for Punjab and Haryana it finds no clear trend in yearly totals.
- **The monthly series,** with a switch between the raw record and the
  harmonized one. One click shows the 2012 jump appear and disappear.
- **Small fires kept, not thrown away.** The weak fires only VIIRS can see form
  a separate layer that can be switched on.

A user can pick a region, draw an area, type coordinates or search for a
district, and choose any date range. Every chart downloads as CSV, PNG and SVG,
and each file states its sources, data version and the code version that made
it. The whole view can be shared as a link. It works on a phone, needs no
account, and runs as static files.

### How it works

Two things make MODIS and VIIRS disagree, and we fix each one separately.

1. **The sharper camera counts one fire many times.** A fire that fills one
   MODIS pixel fills several VIIRS pixels. We lay a 1 km grid over the map and
   count each square once per satellite pass.
2. **The sharper camera sees weak fires the older one misses.** Where Aqua MODIS
   and VIIRS flew over the same place on the same day, we measured how often
   MODIS also reported a fire that VIIRS saw, at every fire strength (fire
   radiative power). That gives MODIS's detection curve: weak fires are usually
   missed, strong ones almost always caught. Each fire VIIRS sees today is
   counted by its chance of being seen by MODIS, so the record keeps one unit,
   "Aqua-equivalent fire cells", from 2002 to now.

We built the correction as a ladder, measuring what each step removes. The raw
record steps up at 2012 by 1.648 in Córdoba and 1.686 in Punjab and Haryana
(natural logarithms, about 5.2 and 5.4 times). Counting each square once
leaves 1.305 and 1.550. The detection curve leaves 0.049 in Córdoba; in Punjab
and Haryana the hard floor, which we ship there, leaves -0.004. A constant
conversion ratio removes the step too, but its error follows the mix of weak
and strong fires from year to year (in Córdoba, 2012 to 2021, rank correlation
-0.76, p = 0.011); the detection curve's does not (0.35, p = 0.33).

### How we know it works

Ten checks and their limits were written down before the data was opened
(`docs/PREREGISTRATION.md` in the repository). Every result is shown in the
app, including the failures. In Córdoba:

- The raw record really jumps at 2012 (C0), and the harmonized one does not:
  step 0.049 against a limit of 0.10 (C1). A change-point test finds no break
  near 2012 (C1b), and there is no false step in 2016, when no sensor changed (C2).
  Honest caveat: the model's constant is fitted on 2012 to 2017, which overlaps
  this check. Fitted on 2016 to 2017 only, the step is 0.106, just over the
  limit. The checks below are fully out of sample.
- NOAA-20, never used for fitting, reproduces the record: slope 0.951,
  correlation 0.987 (C4). This matters because S-NPP stopped delivering data on
  2 November 2026.
- The curve agrees with physics it never saw (C5). A 2026 model of MODIS's
  detection limit (Sofiev and Kouznetsov, GMD) gives 10.4 MW in daytime for the
  average Aqua pixel over Córdoba; our curve, built only from whether two
  satellites agreed, crosses 50 percent at 9.9 MW.
- The curve is stable when resampled (C8).
- **One check failed.** Held-out years 2018 to 2019, compared month by month
  (C3): 0.207 against a limit of 0.15. Two satellites passing at different
  times disagree by about 20 percent in a typical month even in the fitting
  years, so the limit could not be met by any real harmonization. We added a
  check on the two-year total (C3r, limit 0.10, passes at -0.072), recorded the
  change in a dated note, and show both verdicts side by side.
- Not run: the comparison with ESA burned area (C6).

In Punjab and Haryana the same checks pass except C3 (0.291) and the curve's
stability (C8: 57 percent against a limit of 50), which is why the hard floor
ships there; C6 was not run there either. The record also reproduces a documented change: a 2019 study
reported that Punjab's peak burning day moved later after 2009 groundwater laws
delayed rice planting, and across both sensors our median burning day moves
8.1 days later (C7, p = 0.0009).

The Chilecito area, the fire the challenge author shows, borrows Córdoba's
calibration because it has too few fires of its own. There it fails the 2012
step check (C1) and the NOAA-20 check (C4), and the app says so. Its July 2026
fire stands out: 8.8 times the median July, the 2nd highest of 25 Julys, and
the 11th largest of 238 fire episodes there since 2002.

A fourth area, the forests of Bandipur, Nagarhole and BR Hills in Karnataka,
was added late as a case study and was not pre-registered. No method passes
its held-out checks, so the simple ratio is used there and the app labels it.

The harmonized record also shows that Punjab and Haryana's rice-residue
burning season has moved later by about 7 days per decade (peak day: 6.7 days
per decade, 90 percent range 5.7 to 8.3) without getting longer, and the trend
runs straight through 2012, when the record switches from MODIS to VIIRS.

### Why it matters

MODIS is near the end of its life, and its orbits have already drifted: in our
own data Aqua's daytime pass over Punjab moved from 13:17 local time in 2021 to
15:17 in 2026, and Aqua now reports 8.7 percent more fire there than the
harmonized record (0.9 percent before 2022). A MODIS-only calendar would carry
that drift; ours uses VIIRS after 2012, calibrated before the drift began. The
first ten MODIS-only years stay usable on today's scale instead of being lost,
the sensor of origin no longer matters, and the greater detail of VIIRS is kept
in the small-fire layer.

Tools that exist today each miss part of this. The FIRMS Fire Map shows recent
hotspots with no history. Area dashboards that say whether activity is normal
start in 2012 because they use VIIRS only. [CHECK on the live Global Forest
Watch page; docs/APP_VISION.md still marks this VERIFY.] Fire Census gives one consistent
record from 2002 to now, for any area a user names or draws, with its evidence
one click away.

### What it does not do

- It counts what satellites detected, not every fire. Fires under cloud or
  smoke, or between overpasses, are missed by every sensor. Zero detections
  does not prove there was no fire.
- The unit is "Aqua-equivalent fire cells", not fires or hectares. It is built
  so that years can be compared, not to measure burned area.
- It is calibrated in three places: Córdoba, Punjab and Haryana, and
  Chilecito (borrowing Córdoba's calibration). Punjab's calibration is the
  weakest, because crop-residue fires are small and brief.
- A single month can differ by about 20 percent from what MODIS would have
  reported. Years, and the same month across years, are more reliable.
- The last months are near-real-time data (from August 2026) and may change.
- The outlook is history, not a forecast. We did not build a forecasting model.

### Tools used

Pipeline: Python with DuckDB, pandas, PyArrow, NumPy, SciPy, scikit-learn and
matplotlib (earthaccess for the MODIS fire mask). App:
React, TypeScript and Vite; MapLibre GL JS with OpenFreeMap tiles and
OpenStreetMap data; Observable Plot for the charts, with the cividis colour
scale; geoBoundaries district boundaries for the place search. Hosting: GitHub
Pages, built and tested by GitHub Actions. [CHECK with 8crsk: no
`submission/tools.md` yet; confirm this list against `docs/REFERENCES.md`.]

## Use of AI

We used AI tools to speed up the work, not to come up with the idea. The team
chose the approach, the regions and every decision, and recorded each choice
with its reason in `docs/DECISIONS.md`.

- **Claude (Anthropic)** helped write code and text: the data pipeline
  (cleaning, harmonization, checks, export, figures), the web app shell and
  controls, the charts and the statistics behind them, and drafts of this page
  and the method notes. It also laid out options and evidence for team
  decisions, read the challenge page and official guides, and critiqued
  candidate approaches. Team members reviewed what it produced.
- **Gemini (Google)** critiqued the proposed method and architecture before the
  hackathon.
- Every AI-assisted file carries a header saying so, and
  `docs/AI_USE.md` logs each contribution with the person who reviewed it.
- No images, video or audio in the submission were generated by AI. [CHECK
  before recording the demo; if any AI image is used, it needs a visible
  watermark.]

## NASA data used

- **MODIS Collection 6.1 active fire locations** (MCD14ML standard, MCD14DL
  near-real-time), Terra and Aqua, 1 November 2000 to 5 November 2026 from the
  NASA FIRMS archive, and to 13 November 2026 from the FIRMS area API. Fire detections before VIIRS, and the reference for
  calibration.
- **VIIRS 375 m active fire locations, Collection 2,** standard and
  near-real-time, Suomi NPP, NOAA-20 and NOAA-21, 20 January 2012 to 5 November
  2026 from the NASA FIRMS archive, and NOAA-20 and NOAA-21 to 13 November 2026
  from the FIRMS area API (Suomi NPP stopped on 2 November 2026). Fire detections from 2012; the harmonized
  record.
- **MYD14A1 Collection 6.1,** Aqua daily 1 km fire mask, July 2002 to November
  2026, from NASA LP DAAC through earthaccess. Clear-view days per cell and month.

"We acknowledge the use of data and/or imagery from NASA's Fire Information
for Resource Management System (FIRMS) (https://www.earthdata.nasa.gov/data/tools/firms),
part of NASA's Land, Atmosphere Near real-time Capability for Earth observations
(LANCE)." Wording as on NASA Earthdata's FIRMS page, 14 November 2026.

## Space agency partner data and other references

The challenge was authored by CONAE (Argentina). We cite its hotspot service
as context and lead with one of its places, Córdoba. No CONAE or ESA data was
processed.

- NASA FIRMS: https://www.earthdata.nasa.gov/data/tools/firms
- Sofiev, M. and Kouznetsov, R. (2026): Observation operator and detection
  limits for MODIS and VIIRS Fire Radiative Power products, Geoscientific Model
  Development, 19, 10123–10142, https://doi.org/10.5194/gmd-19-10123-2026.
  Published MODIS detection limits used in check C5.
- Balwinder-Singh, McDonald, A. J., Srivastava, A. K. and Gerard, B. (2019):
  Tradeoffs between groundwater conservation and air pollution from
  agricultural fires in northwest India, Nature Sustainability, 2, 580–583.
  Punjab's later burning peak, used in check C7.
- Cividis colour map: Nuñez, Anderton and Renslow (2018), PLOS ONE,
  doi:10.1371/journal.pone.0199239. [CHECK the citation.]
- geoBoundaries district boundaries, OpenStreetMap data (© OpenStreetMap
  contributors, ODbL) via OpenFreeMap tiles.
- Software: React, Vite, TypeScript, Vitest, MapLibre GL JS, Observable Plot,
  d3-scale-chromatic, DuckDB, pandas, PyArrow, NumPy, SciPy, scikit-learn,
  matplotlib, earthaccess. Full list with licences:
  `docs/REFERENCES.md` in the repository.

---

## Before submitting: open items

| Item | Who |
|---|---|
| Demo video link (public, opens in a private window) | Charulekha |
| Repository public? Check in a private window | 8crsk |
| Chilecito July 2026: 8.8 times, 2nd of 25 (resolved) | Mahabu, done |
| Full citations for Sofiev and Kouznetsov (2026) and the 2019 Punjab study (added) | Mahabu, done |
| FIRMS acknowledgement wording (updated from the Earthdata FIRMS page) | Mahabu, done |
| Tools list confirmed (no `submission/tools.md` yet) | 8crsk |
| Python libraries and earthaccess in docs/REFERENCES.md (added) | Mahabu, done |
| "Ten checks" wording: confirmed, ten written in advance (C0, C1, C1b, C2 to C8), plus C3r added after | Mahabu, done |
| Numbers that come from the live app (Punjab November, Córdoba trend) change as data updates: re-read them from the app on the day of submission | Charulekha |
