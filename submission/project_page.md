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
which 2005 and 2025 mean the same thing: from 2012 it counts only the fires
above a measured strength cut-off, scaled by a constant for each calendar
month. A free web app covers four study areas in Argentina and India. Inside
them it shows the calendar for any area a user draws, names or types, ranks the
current month against every earlier year, and hands over the data and charts.
Ten checks were written down before the data was opened, and every result is
published, including the ones that failed.

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
November) ranks 23rd of 25 Novembers (likely 22nd to 25th, allowing for the
harmonization error measured on held-out years), at 0.09 times the median of
the same days in earlier years. The app ranks first and
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
   missed, strong ones almost always caught. From 2012 the record counts each
   VIIRS fire by its chance of being seen by MODIS, read off that curve, in
   Córdoba (the "detection curve"). In Punjab and Haryana, where the curve is
   weak, it counts only the fires at or above the curve's midpoint (the "hard
   floor"). Both are scaled by a constant fitted for each calendar month,
   because how much MODIS misses changes with the season. The record keeps one
   unit, "Aqua-equivalent fire cells", from 2002 to now. The part of VIIRS
   that MODIS would miss becomes the small-fire layer.

We built the correction as a ladder, measuring what each step removes. The raw
record steps up at 2012 by 1.648 in Córdoba and 1.674 in Punjab and Haryana
(natural logarithms, about 5.2 and 5.3 times). Counting each square once
leaves 1.305 and 1.528. With a constant per calendar month, the detection
curve in Córdoba leaves 0.066 and the hard floor in Punjab and Haryana leaves
-0.020. A plain conversion ratio removes
the step too (0.054 and -0.028); what separates the methods is the
month-by-month check on held-out years, below.

### How we know it works

Ten checks and their limits were written down before the data was opened
(`docs/PREREGISTRATION.md` in the repository). Every result is shown in the
app, including the failures. In Córdoba:

- **We ship a model our own rule would not ship.** The pre-registered rule
  ships the detection curve only if it passes the 2016 check for a false step
  (C2), when no sensor changed. In Córdoba it does not: -0.114 against 0.10.
  By the rule the hard floor would ship, and it passes (-0.094). We chose the
  curve after seeing both results (decision 58), because it is closer to Aqua
  month by month (C3 0.072 against 0.117) and year by year (leaving one year
  out, within 0.10 of Aqua in 9 of 10 years against 3 of 10). The rule was
  set aside to do this, the app shows the failure, and Punjab and Haryana and
  Karnataka still follow the rule.
- The raw record really jumps at 2012 (C0), and the harmonized one does not:
  step 0.066 against a limit of 0.10 (C1). A change-point test finds no break
  between July 2011 and December 2012 (C1b); it does find a significant one at
  October 2013, outside that window. Caveat: the model's constants are fitted
  on 2012 to 2017, which overlaps this check. So we repeated it out of sample
  (C1x, added after results and labelled so): fitted on 2015 to 2021 only, the
  step is 0.100, over the limit by less than 0.001 (the hard floor gives
  0.072). On a shorter fit, 2016 to 2017 only, it is 0.148.
- NOAA-20, never used for fitting, reproduces the record: slope 0.951,
  correlation 0.988 (C4). This matters because S-NPP stopped delivering data on
  2 November 2026.
- The curve's midpoint agrees with physics it never saw (C5). A 2026 model of
  MODIS's detection limit (Sofiev and Kouznetsov, GMD) gives 10.4 MW in
  daytime for the average Aqua pixel over Córdoba; the midpoint of our curve,
  built only from whether two satellites agreed, is 9.9 MW.
- The curve is stable when resampled (C8).
- **The month-by-month check failed first, and it was right.** Held-out years
  2018 to 2019 (C3, limit 0.15): with one conversion constant for the whole
  year it failed, 0.207 in Córdoba and 0.169 in Punjab and Haryana. We first
  blamed the limit and added a check on the two-year total (C3r). That was
  wrong. The error followed the season, the same in the fitting years and the
  held-out years: in Punjab and Haryana, May read about 75 percent too high
  after 2012 and October about 20 percent too low. With one constant per
  calendar month C3 passes in Córdoba (0.072).
- **That pass is not a clean one.** The method was changed after the failure
  was seen. On two later years whose monthly values had not been looked at
  (2020 to 2021, check C3x, added after results) Córdoba passes (0.125). Under
  five other reasonable settings C3 and C3x pass in all five in Córdoba, and
  C2 fails in all five (-0.114 to -0.117).
- **A second check failed, and it taught us something.** We compared with
  ESA's Fire_cci burned area, a record built from MODIS reflectance and
  guided by MODIS active fires, so it has no 2012 seam and owes nothing to
  VIIRS (C6). Fire activity per km² burned is 36 percent lower after 2012 than
  before (-0.446 against a limit of 0.25). But Aqua alone, which never changed
  sensor, gives -0.427 on the same test, and the raw record +1.289. NASA's own
  burned-area product (MCD64A1) gives the same answer: -0.381 for our record,
  -0.430 for Aqua alone. So burned area per detected fire in Córdoba really
  changed, and two burned-area records from two agencies agree on it (both
  are MODIS-based, so they are independent of VIIRS, not of MODIS); our record
  follows Aqua closely, while adding the sensors up naively is off by a factor
  of about 3.6.

In Punjab and Haryana (exactly the two states and Chandigarh, 94,490 km²) the
hard floor ships, by the rule, and it is **at the limit**: the month-by-month check C3
is 0.148 against 0.15, on 15 of 24 months, and the same check on 2020 to 2021
(C3x) is 0.169, a fail. Under five other settings C3 fails every time. The
curve there is weak and too uncertain to use (C8: 62 percent against a limit
of 50), so the floor's cut-off of 4.8 MW is a working choice, not a measured
detection limit. It passes the 2012 step (-0.020), the 2016 check (-0.059),
the two-year held-out total (C3r, -0.081), NOAA-20 agreement (slope 1.026,
correlation 0.989) and both burned-area checks (ESA -0.148; NASA -0.080). The
record also reproduces a documented change: a 2019 study reported that
Punjab's peak burning day moved later after 2009 groundwater laws delayed
rice planting, and across both sensors our median burning day moves 8.2 days
later (C7, p = 0.0009).

**We corrected ourselves, twice.** Late on 14 November an independent read of
our code found that the hard floor's constant was fitted on a different rule
from the one it was applied with; Punjab and Haryana's record was 4.6 percent
too high after 2012, and C3 there had been reported as a pass when it was a
fail. On 15 November an audit of the checks found the seasonal error above,
and the record was rebuilt with one constant per calendar month. The app and
this page show the rebuilt values.

**Anyone can check us.** Every detection we used ships with the app, so the
method can be rerun from the repository alone, with no NASA account
(`pipeline/README.md`). We did this from a fresh clone and every check value
matched the published one.

The Chilecito area, the fire the challenge author shows, borrows Córdoba's
calibration and model because it has too few fires of its own. There it
fails the 2012 step check (C1), the NOAA-20 check (C4) and the ESA
burned-area check (C6), and the app says so. Its July 2026 fire stands out:
10.2 times the median July, the 2nd highest of 25 Julys, and the 9th largest
of 230 fire episodes there since 2002.

A fourth area, the forests of Bandipur, Nagarhole and BR Hills in Karnataka,
was added late as a case study and was not pre-registered. No method passes
its held-out checks, so the simple ratio is used there and the app labels it.

The harmonized record also shows that Punjab and Haryana's rice-residue
burning season has moved later by about 7 days per decade (peak day: 6.7 days
per decade, 90 percent range 5.3 to 8.2) without getting longer, and the trend
runs straight through 2012, when the record switches from MODIS to VIIRS.

### Why it matters

**The problem has a date.** NASA plans to stop collecting Terra's MODIS data
in January 2027 and Aqua's around September 2027 (Copernicus CAMS), and Suomi
NPP's VIIRS stopped on 2 November 2026. Without harmonization, every fire
manager's history effectively starts again in 2012: the first ten years of the
record cannot be compared with today. Fire Census keeps them, on today's scale.

**MODIS is already drifting.** In our own data, Aqua's daytime pass over
Punjab and Haryana moved from 13:18 local time in 2021 to 15:27 in 2026, and
Terra's from 10:53 to 09:14, because their orbits are no longer corrected.
Since 2022 Aqua reports 29 percent more fire there than the harmonized
record (3 percent more before), and 48 percent more in October and November. A MODIS-only calendar would carry that drift; ours
uses VIIRS from 2012, calibrated before the drift began.

**Who uses it, and for what decision**

| User | Question they bring | What Fire Census answers |
|---|---|---|
| Emergency and early-warning teams (the challenge author's team at CONAE) | Is what is burning now unusual here? | The current month ranked against every earlier year on the same days; Chilecito's July 2026 fire shows as 10.2 times a normal July, the 2nd highest of 25 |
| Fire services and forest departments | When should crews be ready? | The usual critical months and how the season has moved: Punjab and Haryana's rice-residue season now peaks about two weeks later than in the early 2000s |
| Pollution-control boards (north India) | Is crop burning really falling, and when does it peak? | Detected burning in Punjab and Haryana's season fell from 14,584 fire cells in 2020 to 762 in 2025. This is what an early-afternoon satellite pass sees: if burning has moved to the evening, as has been reported, part of the fall is burning the satellites no longer catch; the peak keeps moving later into November |
| Land managers | Which places and years burned most? | Any district by name, drawn area or coordinates, with totals per 1,000 km² |
| Researchers | Can I use a 24-year series without a fake 2012 step? | One consistent record, every hotspot with how it was treated, data dictionary, Python and R loaders, citation |

**Why existing tools do not answer this.** The FIRMS Fire Map shows recent
hotspots without history. Global Forest Watch compares fire with previous
years back to 2012, using VIIRS; its MODIS alerts reach 2000 but as a separate
series, not one harmonized record. CONAE's viewer shows MODIS and VIIRS side by
side without harmonizing them. Fire Census gives one consistent record from
2002 to now, for any area a user names or draws inside its four study areas, with its evidence one click
away, and it continues on VIIRS when MODIS ends.

**It costs nothing to use or to extend.** No login, no key, works on a phone.
The data is updated in about ten minutes with one script, and a new area needs
only NASA FIRMS data, an outline, and its own checks written down first.

### What it does not do

- It counts what satellites detected, not every fire. Fires under cloud or
  smoke, or between overpasses, are missed by every sensor. Zero detections
  does not prove there was no fire.
- The unit is "Aqua-equivalent fire cells", not fires or hectares. It is built
  so that years can be compared, not to measure burned area.
- It is calibrated in two places: the Córdoba area (a box covering Córdoba
  province and parts of its neighbours) and Punjab and Haryana (the exact
  states). In Córdoba the model that ships fails the pre-registered 2016
  check (C2), and we chose it anyway (see above). Chilecito borrows Córdoba's
  calibration. Punjab's detection curve is
  weak because crop-residue fires are small and brief, so its cut-off is a
  working choice and its month-by-month result is at the limit. A fourth area,
  south Karnataka's forests, is a case study whose held-out checks fail.
- A single month can differ from what MODIS would have reported: in a typical
  held-out month by about 7 percent in Córdoba and 16 percent in Punjab and
  Haryana, in some months much more (one standard deviation is about 20
  percent in Córdoba and 43 percent in Punjab and Haryana). The app widens
  every rank by this error. Years, and the same month across years, are more
  reliable.
- The last months are near-real-time data (from August 2026) and may change.
- The outlook is history, not a forecast. We did not build a forecasting model.
- It does not update itself. `pipeline/refresh.py` brings it up to date in
  about ten minutes; we did not schedule it, because the data would then
  change after the submission deadline.

### What comes next

Not built during the hackathon; listed so the next step is clear.

- **Official ground records.** Compare with Punjab's official farm-fire
  counts (Punjab Remote Sensing Centre, Central Pollution Control Board) and
  CONAE's fire catalogue for Argentina. Punjab's official counts are
  themselves satellite-based, so they test our pipeline, not the satellites.
- **Fire weather.** With a record free of the 2012 jump, fire activity can be
  related to 24 years of temperature, humidity, wind and drought (for example
  ERA5-Land or NASA MERRA-2) without a fake step in the middle.
- **More places.** Each new area needs its own calibration and its own checks
  written down first; Karnataka showed that a method does not transfer by
  itself.

### Tools used

Pipeline: Python with DuckDB, pandas, PyArrow, NumPy, SciPy, scikit-learn and
matplotlib; earthaccess and pyhdf for the MODIS daily fire mask; netCDF4,
rasterio, pystac-client and planetary-computer for the ESA and NASA
burned-area and land-cover data. App: React, TypeScript and Vite; MapLibre GL
JS over NASA GIBS Blue Marble imagery, with NASA GIBS VIIRS layers for today's
fires; Observable Plot for the charts, with our own colour ramps checked for
colour-vision deficiency; geoBoundaries district boundaries for the place
search; WorldPop 2020 population for the "people near fires" section. Hosting:
GitHub Pages, built and tested by GitHub Actions. Checked against
`docs/REFERENCES.md` on 15 November.

## Use of AI

[CHECK, all three: every line below is taken from `docs/DECISIONS.md` and
`docs/AI_USE.md`, and Mahabu's lines from Mahabu. Read it, delete anything that
is not true, and fill the one bracket left before pasting.]

We used AI heavily and want to be exact about where.

**What AI did.** Claude (Anthropic) wrote most of the code in this project
under our direction: the data pipeline, the statistical checks, and the web
app. It also drafted most of the documentation and this page, proposed
candidate harmonization approaches and the thresholds for our checks, and
reviewed our own work critically. An AI read of the pipeline code found the
error in the hard floor that we corrected on 14 November. Gemini (Google)
critiqued the method once, before the hackathon. Every AI-assisted file says
so in its header, and `docs/AI_USE.md` logs each contribution.

**What the team did.**

- Chose the challenge. The users we design for and our third area come from
  the challenge author's video: her team does early warning, and her example
  fire near Chilecito became the Chilecito case study (decisions 21 to 27).
- Accepted the two calibration regions the AI recommended, Punjab and
  Haryana for small crop fires and Córdoba for larger wildland fires
  (decisions 13 and 14). When Mahabu asked for stretch goals, the AI proposed
  and added the Karnataka forests as a case study (decision 36).
- Chose the approach: the ladder of named corrections and the detection curve,
  from the candidates the AI proposed (decisions 4 and 5). Mahabu fixed the ten
  checks and their limits before the data was opened and adopted the revised
  check C3r after the results, keeping the original verdict on the page
  (decision 30). On 15 November Mahabu adopted one constant per calendar
  month, as the AI recommended (decision 57), and then chose to ship the
  detection curve in Córdoba, setting the pre-registered rule aside there,
  against the AI's recommendation to keep the rule (decision 58).
- Obtained the data: Mahabu requested the eight FIRMS archives from NASA and
  set up the data access.
- Steered the work on the evidence: Mahabu saw that the Punjab area did not
  look right, which led to clipping it to the real state outline (decision 44);
  Mahabu asked for NASA's own burned-area product as a second check (decision
  46).
- Designed the app with the AI: Charulekha the map-first layout (decision 39)
  and the exposure colouring (decision 53); 8crsk the population chart and
  burning levels (decisions 48 and 52) and the stretch list for the app;
  Mahabu the plain-words question bar (decision 55), which uses no AI.
- Reviewed the data and the results: Mahabu. [8crsk and Charulekha: add what
  each of you checked in the app, and anything you corrected or rejected.]
- Recorded the demo and presented the work.

**Where AI went further than assisting.** The detection-curve approach was
first proposed by the AI among several candidates; the team selected it. The
thresholds of the checks were proposed by the AI and accepted by Mahabu before
any data was opened. Five decisions (30, 31, 36, 37 and 54 in
`docs/DECISIONS.md`) were made by the AI on a team member's instruction and are
recorded that way.

**No AI-generated images, video or audio** are in the submission.

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
- **MCD64A1 Collection 6.1,** MODIS monthly 500 m burned area, November 2000
  to 2026, read through the Microsoft Planetary Computer. Second independent
  burned-area check (C6m).

"We acknowledge the use of data and/or imagery from NASA's Fire Information
for Resource Management System (FIRMS) (https://www.earthdata.nasa.gov/data/tools/firms),
part of NASA's Land, Atmosphere Near real-time Capability for Earth observations
(LANCE)." Wording as on NASA Earthdata's FIRMS page, 14 November 2026.

## Space agency partner data and other references

The challenge was authored by CONAE (Argentina). We cite its hotspot service
as context and lead with one of its places, Córdoba. We used two datasets
from ESA, a 2026 Space Apps partner agency:

- **ESA Fire_cci burned area v5.1** (monthly, 0.25 degree, 2001 to 2020),
  read from the CEDA archive, for check C6.
- **ESA WorldCover 2021** (10 m land cover), read through the Microsoft
  Planetary Computer, to show what burns where (6,000 sampled VIIRS fire cells
  per area, 2012 to 2025): in Punjab and Haryana 92 percent are cropland; in
  the Córdoba area 53 percent grassland, 20 percent cropland and 18 percent
  shrubland; in Karnataka 40 percent tree cover (28 to 56 percent by year),
  28 percent grassland, 20 percent cropland. That difference
  is why Punjab's small crop fires are hard for MODIS to see and its
  calibration is weaker.

- NASA FIRMS: https://www.earthdata.nasa.gov/data/tools/firms
- Sofiev, M. and Kouznetsov, R. (2026): Observation operator and detection
  limits for MODIS and VIIRS Fire Radiative Power products, Geoscientific Model
  Development, 19, 10123–10142, https://doi.org/10.5194/gmd-19-10123-2026.
  Published MODIS detection limits used in check C5.
- Balwinder-Singh, McDonald, A. J., Srivastava, A. K. and Gerard, B. (2019):
  Tradeoffs between groundwater conservation and air pollution from
  agricultural fires in northwest India, Nature Sustainability, 2, 580–583.
  Punjab's later burning peak, used in check C7.
- NASA GIBS: Blue Marble imagery for the base map and VIIRS thermal
  anomalies for today's fires, https://gibs.earthdata.nasa.gov
- geoBoundaries district and state boundaries (Runfola et al. 2020, PLoS ONE
  15(4): e0231866), https://www.geoboundaries.org
- WorldPop 2020 population, 1 km, UN-adjusted (WorldPop, University of
  Southampton), for the "people near fires" section.
- Software: React, Vite, TypeScript, Vitest, MapLibre GL JS, Observable Plot,
  DuckDB, pandas, PyArrow, NumPy, SciPy, scikit-learn, matplotlib,
  earthaccess, pyhdf, netCDF4, rasterio, pystac-client, planetary-computer.
  Full list with licences: `docs/REFERENCES.md` in the repository.

---

## Before submitting: open items

| Item | Who |
|---|---|
| Demo video link (public, opens in a private window) | Charulekha |
| Repository public? Check in a private window | 8crsk |
| Chilecito July 2026: 10.2 times, 2nd of 25 (re-read after decision 58, 15 Nov) | Mahabu, done |
| Full citations for Sofiev and Kouznetsov (2026) and the 2019 Punjab study (added) | Mahabu, done |
| FIRMS acknowledgement wording (updated from the Earthdata FIRMS page) | Mahabu, done |
| Tools list confirmed against `docs/REFERENCES.md` and the app's code (15 Nov: OpenFreeMap and cividis are no longer used and were removed) | Done by the AI assistant for Mahabu; 8crsk to glance |
| "Use of AI": one bracket left (what 8crsk and Charulekha reviewed) and a read by all three | 8crsk, Charulekha |
| Python libraries and earthaccess in docs/REFERENCES.md (added) | Mahabu, done |
| "Ten checks" wording: confirmed, ten written in advance (C0, C1, C1b, C2 to C8), plus C3r added after | Mahabu, done |
| Numbers that come from the live app (Punjab November, Córdoba trend) change as data updates: re-read them from the app on the day of submission | Charulekha |
