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
| Córdoba province, Argentina | -65.8, -35.0, -61.7, -29.5 | The challenge author works at CONAE's space centre in Córdoba; large grass and shrub fires | Lead area for the method |
| Punjab and Haryana, India | 73.8, 27.6, 77.6, 32.6 | India's famous crop-residue burning; local judges know it | Second calibration area; the season story |
| Chilecito and Famatina, La Rioja | -68.2, -29.8, -66.8, -28.4 | The fire in the author's own video, July 2026 | Case study, borrows Córdoba's calibration |
| Bandipur, Nagarhole and BR Hills, Karnataka | 75.8, 11.4, 77.8, 13.0 | Forests local judges know (Bandipur fire, Feb 2019) | Late case study; added after the start |

**What burns there** (ESA WorldCover, sampled fire cells of 2021): Punjab 87%
cropland; Córdoba 49% grassland, 23% cropland, 19% shrubland; Chilecito 42%
shrubland, 28% trees; Karnataka 34% grassland, 29% trees, 22% cropland.

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
Punjab and Haryana: 2,772,484 in the box; **2,423,562 kept** (before the
November refresh). 16 automatic tests check the cleaned data.

**What the raw data shows** (yearly averages, 2009-11 against 2013-15): all
sensors added together rise 2.8 times in Córdoba and 5.8 times in Punjab, while
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

**Fix: the detection curve.** This is our main idea.

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
5. Now every VIIRS fire cell counts as its chance of being seen by MODIS: a
   weak cell might count 0.1, a strong one 1. A single constant then makes the
   2012-2017 totals match Aqua's.

**The idea in one sentence for a judge:** astronomers combine catalogues from
telescopes of different sensitivity by measuring each telescope's chance of
detecting a star of a given brightness; we do the same for two fire sensors.

**The result:** before February 2012 the record counts what Aqua reported;
from February 2012 it counts what Aqua would have reported, computed from
VIIRS. Averaged over the VIIRS satellites flying that month, so more
satellites never means more fire. **Unit: Aqua-equivalent fire cells.**

**Where the curve crosses 50%** (the "midpoint"): Córdoba 9.9 MW by day (90%
range 8.6 to 12.3) and 6.9 MW by night; Punjab 5.0 MW by day, 3.8 by night.

### Nothing is thrown away: the small-fire layer

The part of each VIIRS cell MODIS would miss (1 minus its weight) becomes the
**small-fire layer**, shown separately. In Punjab it is about 2.2 times the
harmonized record, because crop fires are small; that is the "greater detail
of VIIRS" the challenge asks to keep.

### Three methods were built and compared

| Method | What it does |
|---|---|
| Constant ratio | Multiply all VIIRS fire cells by one number. What most teams do |
| Hard floor | Count only VIIRS cells stronger than the curve's midpoint, times a constant |
| Detection curve | Weight every VIIRS cell by its chance of being seen |

**What ships:** the detection curve for Córdoba and Chilecito; the hard floor
for Punjab (its curve was too uncertain, check C8); the constant ratio for
Karnataka (no method passed its held-out checks) (`pipeline/shipping.json`).

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
| C0 | Does the raw record really jump? (must be over 0.5) | Pass, 1.648 | Pass, 1.686 |
| C1 | Is the jump gone after harmonizing? (at most 0.10) | Pass, 0.049 | Pass, -0.004 |
| C1b | Any statistical break near 2012? | Pass, none | Pass, none |
| C2 | Any false jump in 2016, when nothing changed? | Pass, -0.089 | Pass, -0.057 |
| C3 | Held-out 2018-19, month by month (at most 0.15) | **Fail**, 0.207 | **Fail**, 0.291 |
| C3r | Held-out 2018-19, two-year total (at most 0.10), added after results | Pass, -0.072 | Pass, -0.022 |
| C4 | Does NOAA-20 alone, never used for fitting, give the same record? | Pass, slope 0.951, correlation 0.987 | Pass, 1.024, 0.995 |
| C5 | Does the curve agree with published MODIS detection limits? | Pass | Pass |
| C6 | Stable against ESA burned area? (at most 0.25) | **Fail**, -0.440 | Pass, -0.153 |
| C7 | Did Punjab's burning peak move later after 2009? (5+ days) | | Pass, 8.1 days, p = 0.0009 |
| C8 | Is the curve stable when resampled? (range at most 50%) | Pass, 38% | **Fail**, 57% |

### The two failures, and how to explain them

**C3 (held-out months).** Two satellites passing at different times disagree
by about 20% in a typical month even in the years we fitted on (0.18 to 0.23),
and two *identical* VIIRS satellites disagree by 7-10%. So the 0.15 limit was
below what any two satellites can achieve month by month. We kept the fail,
wrote a dated note, and added C3r on the two-year total. **All three methods
pass C3r, so it does not favour ours.** Say this first, before a judge asks.

**C6 (ESA burned area).** In Córdoba, fire cells per km² burned are 36% lower
after 2012. But **Aqua alone, which never changed sensor, gives -0.427** on the
same test. So the relationship between hotspots and burned area really changed
there; our record follows Aqua to within 0.013. The raw record would be +1.289.

### An honest caveat on C1

The constant in each method is fitted on 2012-2017, which overlaps C1's
window, so passing C1 is partly built in. Fitted on 2016-2017 only, the step
is 0.106 for Córdoba's curve, just over the limit. The fully independent
evidence is C4 (NOAA-20), C3r (2018-19) and C5 (physics).

---

## 7. Evidence beyond the checks

- **Physics agreement (C5 in detail).** A 2026 paper (Sofiev and
  Kouznetsov, GMD) gives MODIS's detection limit as growing with pixel size.
  At the average Aqua pixel over Córdoba (2.23 km²) their formula gives
  **10.4 MW** by day; our curve, built only from where two satellites agreed,
  says **9.9 MW**. It does not agree at night or in Punjab, which we disclose.
- **Why the curve beats a constant ratio.** A constant ratio should go wrong in
  years with an unusual mix of weak and strong fires. In Córdoba 2012-2021 its
  error follows that mix (rank correlation -0.76, p = 0.011); the curve's does
  not (0.35, p = 0.33). Year to year, the curve tracks Aqua about twice as
  steadily.
- **MODIS's orbit is drifting, measured from our own data.** Aqua's daytime
  pass over Punjab moved from 13:17 local time (2021) to 15:17 (2026); Terra's
  from 10:52 to 09:14. Aqua's last orbit correction was December 2021. Since
  2022 Aqua reports 8.7% more fire than our record in Punjab (0.9% before).
  A MODIS-only calendar would carry that drift; ours uses VIIRS after 2012.
- **Robust to our own choices.** In Córdoba every verdict stayed the same
  under five changes of settings. Punjab is fragile: two changes flip C3r.
- **Reproducible.** A fresh copy of the repository rebuilt everything from the
  raw files; one value in 46,155 differed, by 0.01.
- **Observable days.** NASA's daily fire masks say the ground was observable
  on 24 to 31 days in almost every month, so gaps in observation do not explain
  changes in the calendar. (It is not a cloud map; the fire algorithm's cloud
  test is lenient.)

---

## 8. What the record discovered

- **Punjab's burning season moved later** by about 7 days per decade (peak
  day 6.7, range 5.7 to 8.3) without getting longer, straight through the 2012
  sensor change. It matches a published study: the peak moved from 24 October
  to 4 November after 2009 groundwater laws delayed rice planting. Same result
  for three different season windows.
- **Córdoba's season peak moved later** by about 10 days per decade (2.7 to 16).
- **Punjab's detected burning fell sharply:** 14,025 fire cells in the 2020
  season, 1,913 in 2024, 944 in 2025. Caveat: satellites pass around 13:30, and
  burning reportedly moved to the evening, so this is *detected* burning.
- **The author's Chilecito fire** (27 to 31 July 2026): July 2026 is 8.8 times
  the median July, 2nd highest of 25, and the 11th largest of 238 fire
  episodes there since 2002 (11th or 12th under nine different definitions).
- **Bandipur, February 2019:** 3.8 times the median February, 9th of 26.
  Several Februaries in the 2000s were larger.

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
- Four areas only. Punjab's calibration is weak; Karnataka fails its held-out
  checks; Chilecito borrows Córdoba's calibration.
- One month alone is noisy (about 20%); compare years or the same month.
- Not a live alert service and not a forecast; it does not update itself.
- One check was revised after results (C3r), and the 2012 check is partly
  in-sample. Both are disclosed.

---

## 11. Questions judges will ask, with answers

**"How is this different from what other teams do?"** Most fit one conversion
number or a machine-learning model. We measured *why* the sensors differ and
fixed each cause, and we can show the conversion number fails exactly when the
mix of fires changes.

**"You changed a check after seeing the results."** Yes, and we kept the
original failure on show. The original limit was below the disagreement between
two identical satellites. The new check is passed equally by all three methods,
so it does not favour ours.

**"Why are your numbers lower than NASA FIRMS?"** The harmonized line is for
comparing years, so it counts what MODIS would see. The small-fire layer and the
Raw switch show everything VIIRS sees, and the hotspot download lists every
detection.

**"Why trust the curve?"** It puts MODIS's detection limit over Córdoba at
9.9 MW; an independent 2026 physics paper gives 10.4 MW for the same pixels.

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
| Midpoint | The fire strength MODIS catches half the time |
| Harmonized | Expressed in one unit for the whole record, whichever sensor saw it |
| Small-fire layer | Fire activity only VIIRS can see, kept separately |
| Pre-registered check | A test with its pass mark written down before seeing the data |
| Held-out years | Years not used for fitting, used only for testing |
| Calibration | The years (2012-2017) used to fit the curve and constant |
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
