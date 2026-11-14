<!-- AI-assisted: written by Claude (Anthropic) from the repository's own results, for the team to study before judging. Reviewed by: Mahabu Subhani. -->

# Fire Census, explained: everything we did and why

Read this top to bottom once. Every number here comes from the pipeline's
output files; where a number has a caveat, the caveat is next to it. If a
judge asks something not covered here, the detail is in the file named in
brackets.

---

## 1. The problem, in four sentences

NASA has watched fires from space since 2000 with an instrument called MODIS,
on two satellites, Terra and Aqua. In 2012 a sharper instrument, VIIRS, joined
on a new satellite (Suomi NPP), later on NOAA-20 (2018) and NOAA-21 (2023).
VIIRS has smaller pixels and sees weaker fires, so if you add the two records
together, fire activity seems to jump about **five times** in 2012. That jump
is the camera, not the fire, and MODIS is now ending, so without a fix the
first ten years of the record become useless for comparison.

**Our one-line answer:** Fire Census turns 24 years of NASA hotspots into one
burning calendar in which 2005 and 2025 mean the same thing.

---

## 2. The data we used

| Data | From | What | Used for |
|---|---|---|---|
| MODIS active fires, Collection 6.1 | NASA FIRMS archive | Terra and Aqua, 1 Nov 2000 to 5 Nov 2026 | The record before 2012 and the reference for calibration |
| VIIRS active fires, 375 m, Collection 2 | NASA FIRMS archive | Suomi NPP (20 Jan 2012 to 2 Nov 2026, when it stopped), NOAA-20 (from 1 Apr 2018), NOAA-21 (from 1 Mar 2023) | The record from 2012 |
| Near-real-time fires | FIRMS area API | 6 to 13 November 2026 | Bringing the calendar up to date |
| MYD14A1 daily fire mask | NASA LP DAAC | Aqua, 2002 to 2026, 5 map tiles | Counting days the ground was observable |
| Fire_cci burned area v5.1 | ESA (partner agency) | Monthly, 2001 to 2020 | Independent check C6 |
| WorldCover 2021 | ESA, via Microsoft Planetary Computer (a Global Offer) | 10 m land cover | What land burns in each area |

We requested the whole of India and of Argentina from FIRMS (eight requests,
ids 845406 to 845413): about **23 million** detections before cutting out our
areas (`pipeline/NOTES.md`).

---

## 3. The four areas, and why each

| Area | Box (west, south, east, north) | Why | Role |
|---|---|---|---|
| Córdoba and neighbouring areas, Argentina | -65.8, -35.0, -61.7, -29.5 (71% of it is Córdoba province; 57% of its fires) | The challenge author works at CONAE's space centre in Córdoba; large grass and shrub fires | Lead area for the method |
| Punjab and Haryana, India | Exact outline of Punjab, Haryana and Chandigarh, 94,490 km² (since 14 Nov evening; before, a box that was only 46% these states) | India's famous crop-residue burning; local judges know it | Second calibration area; the season story |
| Chilecito and Famatina, La Rioja | -68.2, -29.8, -66.8, -28.4 | The fire in the author's own video, July 2026 | Case study, borrows Córdoba's calibration |
| Bandipur, Nagarhole and BR Hills, Karnataka | 75.8, 11.4, 77.8, 13.0 | Forests local judges know (Bandipur fire, Feb 2019) | Late case study; added after the start |

**What burns there** (ESA WorldCover; 6,000 sampled VIIRS fire cells per area,
2012 to 2025): Punjab and Haryana 92% cropland; Córdoba area 53% grassland,
20% cropland, 18% shrubland; Chilecito 37% shrubland, 36% grassland, 16% trees;
Karnataka 40% tree cover (28 to 56% by year), 28% grassland, 20% cropland.

---

## 4. Cleaning (`pipeline/clean.py`)

Every step counts what it removes, and the counts add up exactly.

1. Cut each area out by its box.
2. Remove exact duplicate rows (there were none).
3. Remove detections NASA flags as **not vegetation fires**: volcanoes,
   offshore, and other static sources such as gas flares and factories (FIRMS
   field `type`). Near-real-time rows have no `type`, so we drop those that
   fall where the archive repeatedly flagged static sources.
4. Remove **low-confidence** detections: MODIS confidence below 30, VIIRS "low".

Example, Córdoba: 348,248 detections in the box; 8,615 not vegetation; 87
near-real-time at static sources; 23,193 low confidence; **316,353 kept**.
Punjab and Haryana: 2,780,913 in the old box; 268,289 outside the three
states; 18,742 not vegetation; 286,965 low confidence; **2,206,291 kept**. 16 automatic tests check the cleaned data.

**What the raw data shows** (yearly averages, 2009-11 against 2013-15): all
sensors added together rise 2.8 times in Córdoba and 5.8 times in Punjab and Haryana, while
MODIS alone stays flat or falls. In Córdoba the naive record goes **up** while
real burning went **down** (`submission/figures/raw_jump_*.png`).

---

## 5. The method, step by step (`pipeline/harmonize.py`)

The two sensors disagree for two reasons. We fix each separately.

### Reason 1: the sharper camera counts one fire many times

A fire that fills one 1 km MODIS pixel fills several 375 m VIIRS pixels.
**Fix: fire cells.** We lay a grid of 0.01 degree squares (about 1 km) over
the map. A *fire cell* is one square with at least one detection, from one
satellite, on one date, by day or by night. Many detections in one square
count once.

### Reason 2: the sharper camera sees weak fires the older one misses

**Fix: a measured cut-off, the hard floor.** We measure MODIS's detection curve and count only the
VIIRS fire cells at or above its midpoint. (Until 15 November the curve itself weighted every fire
in Córdoba. It now ships in no area; see "What ships".)

1. Take every fire cell Suomi NPP's VIIRS saw from February 2012 to December
   2017. Each is a fire we know existed, and we know its strength: the fire
   radiative power (FRP, in megawatts) VIIRS measured in that square.
2. For each one, ask: did Aqua's MODIS, passing over on the same date and the
   same half of the day, also report a fire within one square of it?
3. Some matches happen by chance in a busy area. We measure chance by asking
   the same question 10 squares away, and subtract it.
4. Plot "share that Aqua caught" against fire strength. It rises from near 0
   for weak fires to a plateau for strong ones. We force it to only rise
   (isotonic regression) and divide by its plateau, so the strongest fires
   count as 1.
5. The fire strength where the curve crosses half of its plateau is the
   **midpoint**. The hard floor counts every VIIRS fire cell at or above the
   midpoint as 1 and every weaker one as 0.
6. A constant then makes the 2012-2017 totals match Aqua's. Since 15 November
   there is one constant **per calendar month** (decision 57), because how
   much MODIS misses changes with the season. With one constant for the whole
   year, Punjab and Haryana's May read about 75% too high after 2012 and its
   October about 20% too low, in the fitting years and the held-out years
   alike. Each month's constant uses that month and its two neighbours, and
   falls back to the year-round value where few fires burn.

**The idea in one sentence for a judge:** astronomers combine catalogues from
telescopes of different sensitivity by measuring each telescope's chance of
detecting a star of a given brightness; we do the same for two fire sensors.

**The result:** before February 2012 the record counts what Aqua reported;
from February 2012 it counts what Aqua would have reported, computed from
VIIRS. Averaged over the VIIRS satellites flying that month, so more
satellites never means more fire. **Unit: Aqua-equivalent fire cells.**

**The midpoint, which is the floor's cut-off:** Córdoba 9.9 MW by day (90%
range 8.6 to 12.3) and 6.9 MW by night; Punjab and Haryana 4.8 MW by day, 4.2 by night.
In Punjab and Haryana the curve is weak (daytime match rate 0.160, chance
0.091, plateau 0.118), so 4.8 MW there is a cut-off we use. **Do not call it a
measured detection limit.**

### Nothing is thrown away: the small-fire layer

The part of each VIIRS cell MODIS would miss (1 minus its weight) becomes the
**small-fire layer**, shown separately. In Punjab and Haryana it is about 2.2 times the
harmonized record, because crop fires are small; that is the "greater detail
of VIIRS" the challenge asks to keep.

### Three methods were built and compared

| Method | What it does |
|---|---|
| Conversion ratio | Multiply all VIIRS fire cells by a constant. What most teams do |
| Hard floor | Count only VIIRS cells at or above the curve's midpoint, times a constant |
| Detection curve | Weight every VIIRS cell by its chance of being seen, times a constant |

Each exists with one year-round constant and with a constant per calendar
month; the ladder in the app shows all six.

**What ships** (`pipeline/shipping.json`), by the rule in the pre-registration
as first written: the **hard floor with a constant per calendar month** in
Córdoba, Chilecito (which borrows Córdoba's) and Punjab and Haryana; the
conversion ratio in Karnataka, where no method passed its held-out checks.
**The detection curve ships in no area.** In Córdoba it passes the held-out
check better than the floor (0.072 against 0.117) and is steadier year by year,
but it fails the 2016 placebo (C2, -0.114 against 0.10), and the rule then
moves to the hard floor. In Punjab and Haryana it fails C3 and C8.

---

## 6. How we tested it

### We wrote the tests down before opening the data

`docs/PREREGISTRATION.md` was committed at 00:15 on 14 November, with every
data file still zipped. Each check has a number that decides pass or fail.
This stops us tuning the tests to the result.

### The checks and their results

Step values are natural logarithms: 0.05 is about 5%; 1.65 is about 5.2 times.

| Check | Question | Córdoba | Punjab and Haryana |
|---|---|---|---|
| C0 | Does the raw record really jump? (must be over 0.5) | Pass, 1.648 | Pass, 1.674 |
| C1 | Is the jump gone after harmonizing? (at most 0.10) | Pass, 0.077 | Pass, -0.020 |
| C1b | Any statistical break between July 2011 and December 2012? | Pass by its window; a significant break at October 2013 | Pass, none |
| C2 | Any false jump in 2016, when nothing changed? (at most 0.10) | Pass, -0.094: a thin margin | Pass, -0.059 |
| C3 | Held-out 2018-19, month by month (at most 0.15) | Pass, 0.117 | Pass, 0.148 on 15 of 24 months: at the limit |
| C3x | The same on 2020-21, added after results | Pass, 0.124 | **Fail**, 0.169 |
| C3r | Held-out 2018-19, two-year total (at most 0.10), added after results | Pass, -0.068 | Pass, -0.081 |
| C4 | Does NOAA-20 alone, never used for fitting, give the same record? | Pass, slope 0.938, correlation 0.977 | Pass, 1.026, 0.989 |
| C5 | Does the curve's midpoint agree with published MODIS detection limits? | Pass | Pass (but see the note on Punjab's curve above) |
| C6 | Stable against ESA burned area? (at most 0.25) | **Fail**, -0.403 | Pass, -0.148 |
| C6m | Same with NASA MCD64A1, added after results | **Fail**, -0.404 | Pass, -0.080 |
| C7 | Did Punjab's burning peak move later after 2009? (5+ days) | | Pass, 8.2 days, p = 0.0009 |
| C8 | Is the curve stable when resampled? (range at most 50%) | Pass, 38% | **Fail**, 62% (the curve sets the floor, so the floor is uncertain too) |

### What to say about C3, before a judge asks

**It failed first, and it was right.** With one constant for the whole year C3
failed in both areas (0.207 and 0.169). We said the limit was too tight. That
was wrong and is withdrawn: counting noise alone would give 0.03 to 0.07. The
error followed the season, and a constant per calendar month removes most of
it.

**The pass is not a clean one.** Say all of this:

- The method was changed after the failure was seen, so 2018-19 is no longer
  a clean held-out test.
- On 2020-21, whose monthly values had not been looked at, Córdoba passes
  (0.124) and **Punjab and Haryana fails (0.169)**. Punjab and Haryana is at
  the limit; never say it passes without both numbers, 0.148 and 0.169.
- Under five other reasonable settings C3 fails in three of five in Córdoba
  and in all five in Punjab and Haryana.
- The settings of the monthly constants were written in the same step as the
  first run, seconds before its first result, and were not tuned afterwards.
- C3r, the two-year total we added on 14 November, cannot see a seasonal
  error. It passed while single months were far off. It decides nothing now.

**What got weaker in Córdoba.** The rule ships the hard floor although,
leaving one year out at a time, it is within 0.10 of Aqua in only 3 of 10
years (largest miss 0.233, in 2013), against 9 of 10 for the detection curve.
Yearly totals in Córdoba after 2012, and any yearly trend that includes them,
carry this error. The falling trend there is still clear (p = 0.007).

**C6 and C6m (burned area).** In Córdoba, fire cells per km² burned are about a
third lower after 2012. But **Aqua alone, which never changed sensor, gives
-0.427** on the same test, and -0.430 against NASA's MCD64A1 (our record:
-0.403 and -0.404). So the relationship between hotspots and burned area
really changed there; our record follows Aqua closely. The raw record would
be +1.289. Both burned-area products are built from MODIS and guided by MODIS
active fires: say "independent of VIIRS", not "independent".

### An honest caveat on C1

The constants are fitted on 2012-2017, which overlaps C1's window, so passing
C1 is partly built in. Fitted on 2015-2021 only (check C1x, added later) the
step is 0.072 for Córdoba's hard floor, a pass (the curve gives 0.100, just
over; the ratio 0.159, a fail), and 0.024 in Punjab and Haryana. Fitted on
2016-2017 only, Córdoba is over the limit (hard floor 0.181). Say both if
asked. The fully independent evidence is C4 (NOAA-20) and, in Córdoba, C5.

---

## 7. Evidence beyond the checks

- **Physics agreement in Córdoba (C5 in detail).** A 2026 paper (Sofiev and
  Kouznetsov, GMD) gives MODIS's detection limit as growing with pixel size.
  At the average Aqua pixel over Córdoba (2.23 km²) their formula gives
  **10.4 MW** by day; the midpoint of our curve, which is the floor's cut-off
  there, is **9.9 MW**. It does not agree at night or in Punjab and Haryana,
  where the curve is weak; we disclose both.
- **A method's error can follow the mix of weak and strong fires.** In Córdoba
  2012-2021 the hard floor's yearly error follows that mix (rank correlation
  0.76, p = 0.011), and the ratio's does the other way (-0.75, p = 0.013). The
  curve's does not (0.32, p = 0.37). This is a weakness of what ships in
  Córdoba, not a strength.
- **MODIS's orbit is drifting, and Punjab's rice fires are now seen more by a
  later pass.** Aqua's daytime pass over Punjab and Haryana moved from 13:18
  local time (2021) to 15:27 (2026); Terra's from 10:53 to 09:14. In October
  and November Aqua reported 3% more than our record in 2012-2021 and 48% more
  in 2022-2026; in April to June there is no excess. That fits reports that
  rice-residue burning moved later in the day (not verified by us). Over all
  months Aqua reports 29% more than our record since 2022 in Punjab and
  Haryana and 2.5% more in Córdoba.
- **Not robust to our own choices, month by month.** The 2012 step (C1) holds
  under five changes of settings in both areas. C3 does not: it fails in three
  of five in Córdoba and in all five in Punjab and Haryana.
- **Reproducible.** On 14 November a fresh copy of the repository rebuilt
  everything from the raw files; one value in 46,155 differed, by 0.01. The
  rebuild of 15 November ran from the raw files and reproduced, to three
  decimals, the check values of an earlier run made from the shipped hotspot
  files.
- **Observable days.** NASA's daily fire masks say the ground was observable
  on 24 to 31 days in almost every month, so gaps in observation do not explain
  changes in the calendar. (It is not a cloud map; the fire algorithm's cloud
  test is lenient.)

---

## 8. What the record discovered

- **Punjab's burning season moved later** by about 7 days per decade (peak
  day 6.7, range 5.3 to 8.2) without getting longer, straight through the 2012
  sensor change. It matches a published study: the peak moved from 24 October
  to 4 November after 2009 groundwater laws delayed rice planting. (The check
  on three different season windows was made on 14 November and not rerun
  after the rebuild.)
- **Córdoba's season peak moved later** by about 7.5 days per decade (1.0 to
  14.4).
- **Punjab's detected burning fell sharply:** 14,584 fire cells in the 2020
  season, 1,729 in 2024, 762 in 2025. Caveat: our record sees about 13:10;
  Aqua, now passing two hours later, saw 1.6 to 1.8 times as much in 2024 and
  2025. This is *detected* burning.
- **The author's Chilecito fire** (27 to 31 July 2026): July 2026 is 13.5
  times the median July, 2nd highest of 25, and the 9th largest of 277 fire
  episodes there since 2002 (7th by its peak day). Chilecito borrows Córdoba's
  calibration and fails three of its own checks; it is a case study.
- **Bandipur, February 2019:** the rebuilt record gives about 1.9 times the
  median February (it was 3.8 before the monthly constants). Read the exact
  wording in the app before quoting it.

---

## 9. What we deliver

- **The live app:** https://mahabu-subhani.github.io/fire-census/ (built by
  8crsk and Charulekha). Burning calendar of months across years; raw and
  harmonized switch; area by district search, drawing or coordinates; "is this
  month unusual?" against the same days of earlier years, with rank; what
  usually comes next; trend; season timing; fire episodes; small-fire layer;
  satellite agreement and drift; every check with its verdict; downloads.
- **Downloads:** CSV of any view, PNG and SVG of every chart, and **every
  single hotspot** with what the harmonization did to it (`harmonized`,
  `small` or `excluded`, and the reason).
- **The data is current** to 13 November 2026, and `pipeline/refresh.py`
  updates it in about ten minutes.
- **Everything is public and reproducible:** code, data files, decisions,
  checks and AI log in the repository.

---

## 10. What it does not do (say these before judges do)

- It counts what satellites **detected**, not every fire; zero detections is
  not proof of no fire.
- The unit is fire cells, not hectares.
- Two calibration areas (the Córdoba area and Punjab and Haryana) and two case
  studies. The hard floor ships in both calibration areas and the detection
  curve in none. Punjab's curve is weak, so its floor is a cut-off, not a
  measured detection limit; Karnataka fails its held-out checks; Chilecito
  borrows Córdoba's calibration.
- One month alone is noisy; compare years or the same month. In Córdoba the
  yearly totals after 2012 are within 0.10 of Aqua in only 3 of 10 years
  leaving one out, so compare years there with that in mind.
- Punjab and Haryana is at the limit month by month (C3 0.148, C3x 0.169).
- Not a live alert service and not a forecast; it does not update itself.
- The method was changed after C3 failed (decision 57), four checks were added
  after results (C1x, C3r, C3x, C6m), and the 2012 check is partly in-sample.
  All are disclosed.

---

## 11. Questions judges will ask, with answers

**"How is this different from what other teams do?"** Most fit one conversion
number or a machine-learning model. We measured *why* the sensors differ and
fixed each cause in turn: counting each place once, a measured strength
cut-off, and a constant per season. Our own held-out check showed one
year-round number is wrong by season, and we publish every check, including
the ones that fail.

**"You changed things after seeing the results."** Yes, twice, and both are
on show. On 14 November we added a check on the two-year total (C3r) when C3
failed. On 15 November we found why C3 failed, a seasonal error, and changed
the method: one constant per calendar month. C3 now passes, but not cleanly:
on two later years Punjab and Haryana fails (0.169), and the pass does not
survive other settings. The original failures stay in the app.

**"Why are your numbers lower than NASA FIRMS?"** The harmonized line is for
comparing years, so it counts what MODIS would see. The small-fire layer and the
Raw switch show everything VIIRS sees, and the hotspot download lists every
detection.

**"Why trust the cut-off?"** In Córdoba the measured midpoint is 9.9 MW; an
independent 2026 physics paper gives 10.4 MW for the same pixels. In Punjab
and Haryana we do not claim that: the curve there is weak, and the cut-off is
a working choice.

**"How is this different from Global Forest Watch?"** GFW's history starts in
2012 because it uses VIIRS only. Ours starts in 2002 with both sensors on one
scale, and publishes its checks.

**"What happens when MODIS stops?"** Nothing: the record already uses VIIRS
from 2012. And NOAA-20 alone reproduces it (C4), which matters because Suomi NPP
stopped on 2 November 2026.

**"How did you use AI?"** Heavily and openly: Claude wrote most of the
pipeline and proposed the core idea; we directed it, made it attack its own
method, fixed the tests before opening the data, showed every failure, and
logged every AI contribution in the repository.

---

## 12. Words to know

| Word | Meaning |
|---|---|
| Hotspot, detection | One satellite pixel flagged as hotter than its surroundings |
| FRP | Fire radiative power, in megawatts: how strongly a fire radiates heat |
| Fire cell | A 1 km square with fire, from one satellite pass |
| Detection curve | The chance MODIS reports a fire of a given strength |
| Midpoint | The fire strength where the curve reaches half of its plateau; the hard floor's cut-off. A measured detection limit only where the curve is strong (Córdoba), not in Punjab and Haryana |
| Harmonized | Expressed in one unit for the whole record, whichever sensor saw it |
| Small-fire layer | Fire activity only VIIRS can see, kept separately |
| Pre-registered check | A test with its pass mark written down before seeing the data |
| Held-out years | Years not used for fitting, used only for testing |
| Calibration | The years (2012-2017) used to fit the curve and the constants (one per calendar month since 15 November) |
| Orbit drift | A satellite passing later or earlier each year because its orbit is no longer corrected |

---

## 13. Where to look for more

| Topic | File |
|---|---|
| Every decision and who made it | `docs/DECISIONS.md` |
| The checks as written in advance | `docs/PREREGISTRATION.md` |
| Method detail and numbers | `pipeline/NOTES_PHASE2.md`, `pipeline/NOTES_PHASE3.md` |
| How to rerun everything | `pipeline/README.md` |
| Hostile self-review | `docs/REVIEW.md` |
| Score against the local rubric | `docs/LOCAL_JUDGING.md` |
| AI use log | `docs/AI_USE.md` |
| Project page text | `submission/project_page.md` |
| Demo script | `submission/demo.md` |
