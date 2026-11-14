# Phase 3 notes: evidence, robustness, hotspots, refresh (14 Nov 2026)

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Numbers are copied from `work/sensitivity.json`, `work/evidence.json` and
script output. Phase 2 is in `NOTES_PHASE2.md`.

## No second model

Gemini 4 Argon, which earlier phases used as a critic through Composio, was
disabled by the Composio administrator all day. OpenAI through Composio needs
the user's own account. So each objection a sceptical reviewer would raise was
turned into a test on the data instead (`evidence.py`, `sensitivity.py`).

## Check C5: published detection limits (verified at the source)

Sofiev and Kouznetsov (2026), GMD 19, 10123, full text read: MODIS C6.1
detection limits for the smallest pixels at the middle of the swath are 5.7 MW
by day and 3.7 MW by night; the limit grows linearly with pixel area (Table 1:
day slope 4.44 MW per km², intercept 0.52 MW; night 4.43 and 1.01).

| Area, time | Our midpoint | Published at nadir | Ratio | Mean Aqua pixel (km²) | Published at that pixel size |
|---|---|---|---|---|---|
| Córdoba, day | 9.87 MW | 5.7 | 1.73 | 2.23 | 10.40 MW |
| Córdoba, night | 6.86 | 3.7 | 1.85 | 3.53 | 16.64 |
| Punjab, day | 4.95 | 5.7 | 0.87 | 1.65 | 7.84 |
| Punjab, night | 3.81 | 3.7 | 1.03 | 1.57 | 7.99 |

The pre-registered check (within a factor of 2 of the nadir value) passes in
all four. The stronger comparison, at the pixel sizes Aqua actually had, agrees
within 5 percent for Córdoba by day, where the curve rests on 20,811 S-NPP
cells. It does not agree by night (6.9 against 16.6; only 575 Aqua night cells)
or in Punjab, whose curve is the uncertain one (check C8). Our curve is in VIIRS
fire-strength units and averages over Aqua's whole swath, so exact agreement is
not expected.

## Objection: "a constant ratio would do just as well"

If the curve is right, a constant ratio should drift with the share of strong
fires in a year, and the curve should not. Spearman rank correlation, 2012 to
2021, between each model's yearly ratio to Aqua and the share of S-NPP day
cells above the curve midpoint:

| Model | Córdoba | Punjab and Haryana |
|---|---|---|
| Detection curve | 0.35 (p = 0.33) | -0.27 (p = 0.45) |
| Hard floor | 0.89 (p = 0.0005) | -0.04 (p = 0.91) |
| Constant ratio | -0.76 (p = 0.011) | -0.43 (p = 0.21) |

In Córdoba, where the share of strong fires varied from 35 to 60 percent, the
constant ratio and the floor go wrong in opposite directions as predicted, and
the curve does not. In Punjab the share hardly varies (50 to 57 percent), so
the test has no power there.

## Objection: "is Aqua still a valid reference?" Orbit drift

Mean local solar time of daytime detections, from our data:

| Year | Aqua, Punjab | Terra, Punjab | S-NPP, Punjab | Aqua, Córdoba |
|---|---|---|---|---|
| 2005 | 13:12 | 10:53 | | |
| 2021 | 13:17 | 10:52 | 13:08 | 13:59 |
| 2023 | 13:37 | 10:27 | 13:10 | 14:16 |
| 2025 | 14:35 | 09:44 | 13:07 | 15:07 |
| 2026 | 15:17 | 09:14 | 13:07 | 15:46 |

Aqua's last orbit-maintenance manoeuvre was in December 2021 (NASA; see
REFERENCES.md). Since 2022 Aqua reports more fire than the harmonized record:
ln(Aqua / harmonized) is 0.019 for 2012 to 2021 and 0.059 for 2022 to 2026 in
Córdoba; 0.009 and 0.083 in Punjab. A MODIS-only continuation would carry this
drift. Our record uses VIIRS after January 2012 and was calibrated in 2012 to
2017, before the drift. In the FIRMS near-real-time data for 6 to 13 November
2026, MODIS reported 3,456 detections over Punjab against 2,393 (NOAA-20) and
2,580 (NOAA-21): Aqua now passes in the afternoon peak of crop burning.

## Sensitivity (each setting changed alone)

Córdoba, detection curve: every verdict unchanged under all five changes (keep
low-confidence detections; same fire = same cell only; within 2 cells; plateau
at the 90th or 99th percentile). C1 ranges 0.045 to 0.054, C3r -0.069 to
-0.079, NOAA-20 slope 0.944 to 0.962. The day midpoint moves from 8.4 to 15.3
MW: the curve's position depends on the settings, the record does not.

Punjab, hard floor: C1 ranges -0.091 to 0.069; C3r fails with the plateau at
the 90th (-0.104) or 99th percentile (-0.128). Punjab's record is fragile.

## Hotspot files

`hotspots.py` writes every FIRMS detection in each box, by year, with
`harm_class`, `harm_reason` and `detect_prob`. Before the November refresh:
Córdoba 348,248 detections (179,184 harmonized, 84,901 small, 84,163 excluded);
Punjab 2,772,484 (1,352,928; 762,077; 657,479); Chilecito 26,304. In each area
the cleaned rows equal the kept rows plus the MODIS rows outside their period,
so no detection is lost or counted twice.

## Refresh to 13 November

`refresh.py` fetched 6 to 13 November 2026 from the FIRMS area API (MODIS,
NOAA-20, NOAA-21; S-NPP has stopped): Córdoba 41, 133, 133 detections; Punjab
3,456, 2,393, 2,580; Chilecito 0, 19, 13. The API accepts at most 5 days per
call. These rows are near-real-time and have no `type` field.

## Reproduction

See `README.md`, "Reproduction test": exact except one Córdoba cell-month that
differs by 0.01.

## `obs`: days the MODIS fire algorithm could see the ground

Processed all 4,480 MYD14A1 files (four tiles, July 2002 to November 2026;
the first search was silently capped, so the India tiles were fetched again in
four-year windows). `obs` is the mean, over the 1 km pixels of a 0.1 degree
cell, of the days in the month whose daily fire mask was water, land or fire.

It hardly varies. In Punjab and Haryana the median is 30 days, the 5th
percentile 24 and the 1st percentile 13; even July (monsoon) has a 10th
percentile of 24. Córdoba: median 28, 5th percentile 24. The only months with
many cells under 10 are November 2026, which is incomplete. Reasons: the daily
mask keeps the best of all Aqua passes that day, day and night, and the fire
algorithm's own cloud test is lenient.

So `obs` is not a cloud climatology. It says how many days NASA's fire
algorithm judged the ground observable, which is the right denominator for
detection, and it shows that in these regions observation gaps do not explain
changes in the calendar, nor the month-to-month scatter behind check C3. That
points to overpass timing as the cause. Not fetched for the Karnataka area
(tile h25v08), fetched and processed later the same day.

## Check C6: ESA Fire_cci burned area (`firecci.py`)

Fire_cci v5.1 grid, monthly 2001 to 2020, read by netCDF byte-range requests
(only each area's rows; about 13 s per month; netCDF-C is not thread-safe, so
eight processes). October to December 2019 could not be read from the server.

| Area | C6 (harmonized) | Aqua alone | Raw record | Verdict |
|---|---|---|---|---|
| Córdoba (gated) | -0.440 | -0.427 | +1.289 | fail |
| Punjab and Haryana (reported) | -0.153 | -0.185 | +1.534 | pass |
| Chilecito (not pre-registered) | +0.430 | +0.157 | +1.854 | fail |
| Karnataka (not pre-registered) | +0.276 | +0.340 | +2.537 | fail |

Aqua alone has no sensor change, so its value is what the statistic gives with
no seam at all. In Córdoba our record differs from it by -0.013: the check
fails because burned area per detected fire changed after 2012, not because of
the harmonization. The raw record would be off by +1.289.

## Land cover at fire cells (`landcover.py`)

ESA WorldCover 2021 via the Microsoft Planetary Computer, 3,000 sampled NOAA-20
fire cells of 2021 per area (262 in Chilecito, 1,672 in Karnataka). Punjab and
Haryana: cropland 87%, tree cover 7%, built-up 3%. Córdoba: grassland 49%,
cropland 23%, shrubland 19%. Chilecito: shrubland 42%, tree cover 28%, bare
12%. Karnataka: grassland 34%, tree cover 29%, cropland 22%. The share of the
small-fire layer by class is within a few points of the MODIS-visible share
in every area.

## C5 for Karnataka

Day midpoint 17.45 MW against 5.7 at nadir (3.06 times): fails the factor-of-2
rule. Night 3.73 against 3.7: passes. So C5 fails for Karnataka.

## Still open

- C6 (ESA burned area): not run. *(Resolved later the same day; see "Check C6" above.)*
- C5 for Karnataka: not run (evidence.py covers the two calibration areas). *(Resolved; see "C5 for Karnataka" above.)*

## Areas fixed and rerun (14 November, about 21:30)

Punjab and Haryana was a box (73.8 to 77.6 E, 27.6 to 32.6 N) that was only
46 percent Punjab, Haryana and Chandigarh by area; 23 percent Rajasthan, 15
percent Himachal Pradesh, 9.5 percent Pakistani Punjab (no data: the FIRMS
request was for India), and smaller parts of Uttar Pradesh, Delhi and Jammu
and Kashmir. 91 percent of its detections were in the three units. It is now
clipped to their exact outline (94,490 km²; official total about 94,700 km²).
`clean.py` removes 268,289 detections outside it; 2,206,291 are kept.

Everything was rerun. Punjab and Haryana, hard floor (ships): C0 1.674, C1
0.028, C1b pass, C2 -0.060, **C3 0.144 (now passes)**, C3r 0.003, C4 slope
1.025 and correlation 0.993, C5 pass (day 4.78 MW), C6 -0.104, C6m -0.036, C7
8.1 days (p = 0.0009). The detection curve: midpoint 4.78 MW, C8 fails (62
percent). Drift: ln(Aqua / harmonized) -0.022 before 2022, 0.060 after; Aqua
day pass 13:18 (2021) to 15:27 (2026). Season peak +6.7 days per decade (5.3
to 8.2). Land cover 92 percent cropland. November 1 to 13, 2026: 24th of 25.

Córdoba is unchanged in method and numbers; renamed "Córdoba and neighbouring
areas" because the box is 71 percent the province and holds 57 percent of its
fires in the province.

NASA MCD64A1 (C6m, added after results): Córdoba -0.392 (Aqua alone -0.430),
Punjab and Haryana -0.036, Chilecito -0.237, Karnataka +0.374.

Land cover now uses Suomi NPP fire cells from 2012 to 2025 (6,000 per area),
not 2021 alone: Karnataka is 40 percent tree cover (28 to 56 percent by year),
not the 2021 figure of 29 percent.

## Corrections after an independent read of the code (14 November, about 23:30)

AI-assisted: found by a second, independent AI read of `pipeline/`, each item
then confirmed on the data by rebuilding the record from the shipped hotspot
files (`from_hotspots.py`). Reviewed by: Mahabu Subhani (pending).

1. **Hard-floor constant (changes Punjab and Haryana's record).** `k_floor`
   was fitted on whole strength bins (bin centre at or above the midpoint) but
   applied to each cell's own strength. In Punjab and Haryana, daytime, 257,686
   cells were counted against a constant fitted on 246,372: the record after
   2012 was 4.6 percent too high. Fixed in `harmonize.py` (and `loyo.py`, which
   had the bin rule on both sides). Day constant 0.3881 to 0.3711, night 0.205
   to 0.221. Hard floor, Punjab and Haryana, before and after: C1 0.028 to
   -0.016; C1b p 1.00 to 0.32 (pass); C2 -0.060 unchanged; **C3 0.144 (pass) to
   0.169 (fail)**; C3r 0.003 to -0.042 (pass); C4 unchanged; C1x 0.024 to 0.023.
   The shipping rule now gives the ratio under the original C3 and the hard
   floor under C3r (decision 30), as it did before the area was clipped.
   Season totals fall by the same 4.6 percent (2020: 13,521; 2024: 1,605; 2025:
   706); timing results are unchanged (peak +6.7 days per decade). Drift:
   ln(Aqua / harmonized) 0.023 before 2022, 0.105 after. Córdoba, Chilecito
   (curve) and Karnataka (ratio) records are unchanged; their hard-floor rows in
   the ladder moved slightly (Córdoba 0.066 to 0.062).
2. **Check C7 ran on the wrong record.** It used the detection curve's daily
   series in every area, and that series lost any day on which VIIRS saw fire
   and Aqua saw none (2,237 of 4,760 days from February 2012, about 1 percent
   of October to November activity). It now uses the shipped model and the
   same daily series as `stretch.py`: +8.2 days (was +8.1), p = 0.0009.
3. **C1b said "pass" where it could not fail.** Chilecito has 4 usable months;
   the test cannot reach p < 0.05 below about 11. Now "not run" there.
4. **Ranges (`harm_lo`, `harm_hi`)** used the detection curve's daytime
   constant spread for every model and for night cells. Each model now has its
   own, for day and night.
5. **C8 is read on the daytime curve.** The night curve would be over the
   limit (Córdoba 72 percent, Punjab and Haryana 86, Karnataka 54). The check
   row now says so. Verdicts unchanged.
6. **Hotspot files** labelled S-NPP detections of 20 to 31 January 2012 and
   1 to 2 November 2026 as used, though the record does not use S-NPP in those
   months (985 rows across the four areas). Relabelled "excluded" with the
   reason, in `hotspots.py` and in the shipped files.
7. **`obs`** counted the first days of January twice (`obs.py` fixed; data
   capped at the days in the month, not yet recomputed).
8. **C6** included 2019 with three ESA months missing (`firecci.py` now uses
   complete years; value not yet recomputed; *recomputed 15 Nov, see the last section*). C6 and C6m for Punjab and Haryana
   predate item 1 (about -0.05 each when recomputed; still inside the limit).
9. **`refresh.py`** took the last fetched date across all sources, so a run
   that stopped after one sensor could leave a gap in the others. Now per source.
10. **Figures.** `harmonized_<area>.png` drew the detection curve in every
    area; it now draws the model that ships there.

Sensitivity, rerun: every verdict is unchanged under all five alternative
settings in both calibrated areas (before item 1, two Punjab verdicts moved).

## Check C6 recomputed (15 November)

AI-assisted, at Mahabu's request. Reviewed by: Mahabu Subhani (pending).

1. **Why October to December 2019 were "missing".** Not a server failure. ESA
   found an error in the processing of November 2019 (October and December
   less affected), reprocessed the three months and put them in
   `2019/new-corrected/` on the CEDA archive; the top-level path is a 404.
   `firecci.py` now reads them there (`CORRECTED`, `url()`).
2. **Failed months were never retried.** They were dropped before the cache
   was saved, and the cache was reused whenever it existed. Now every month
   missing from the cache is fetched again on each run, and the fetched
   months are merged into it.
3. **Rerun** from a fresh clone: `from_hotspots.py`, `harmonize.py`
   (constants as published: Punjab floor 0.371 day, 0.221 night; Córdoba
   midpoint 9.9 MW), then `firecci.py`; 240 of 240 months read.
4. **Reproduction first.** With October to December 2019 removed and 2019
   kept (the old rule), the numbers are Córdoba -0.440, Karnataka +0.276,
   Chilecito +0.430: the published values. Punjab gives -0.149 under both
   rules; the published -0.104 predates the hard-floor correction.
5. **Result.** With 2019 complete: Córdoba -0.440 (fail; Aqua alone -0.427),
   Punjab and Haryana -0.149 (pass; Aqua alone -0.125; seam part -0.024),
   Chilecito +0.430 (fail), Karnataka +0.276 (fail). 2019 is not the median
   year of 2013 to 2019 in any area, so completing it changes no value.
6. **Into the app.** Only the C6 rows of the four `meta.json` files changed,
   worded exactly as `export.py` writes them from `work/c6.json` (a full
   `export.py` run with that file present writes the same rows).
7. **Still to recompute:** C6m for Punjab and Haryana (before the hard-floor
   correction; about -0.08 expected). *Done: item 8.*
8. **C6m recomputed** the same day (`mcd64.py`, 2,114 tile-months): Punjab
   and Haryana -0.036 to **-0.081** (pass; Aqua alone -0.089); Córdoba -0.392,
   Chilecito -0.237, Karnataka +0.374 unchanged. `mcd64.py` had the same
   never-retry flaw as `firecci.py` (fixed). Its 289 "failed" tile-months
   were tiles the catalogue search returns because they touch the box but
   that hold no pixel of it ("Intersection is empty"); they now count as
   zero, and no value changes.

## Second audit of the pipeline (15 November)

AI-assisted: an independent AI read of `pipeline/` (given the code, not our
conclusions), then a full rerun from the shipped hotspot files: `harmonize`,
`validate`, `loyo`, `sensitivity`, `evidence`, `firecci`, `mcd64`, `export`,
`stretch`. Reviewed by: Mahabu Subhani (pending).

**Reproduction.** Every `cube.json` and every season, drift and episode file
came out byte for byte as shipped; in `meta.json` every check value except
C6 and C6m (recomputed above) matched. The reviewer confirmed the step
windows (36 months each side), every threshold comparison, the C3/C3r cell
filter, the C4 period (103 months), C7's windows and test, the Pettitt
p-value, and the shipping rule.

**Fixed:**

1. **Chilecito showed Córdoba's numbers as its own** in two places. Its C1x
   row had Córdoba's value (+0.087) beside "not run", and its `month_log_sd`
   (the monthly error behind the rank range) was Córdoba's 0.244, so its rank
   range was too narrow for an area that fails C1 and C4. Now C1x has no
   value (the note gives Córdoba's result as Córdoba's), and `month_log_sd` is
   null, so the app shows no range there (`loyo.py`).
2. **Stale note would come back on a rebuild.** `shipping.json` still told
   `export.py` to mark Punjab's C6 and C6m as computed before the
   correction; on a fresh clone without the burned-area work files that note
   would be attached to the recomputed values. Removed.
3. **Season label by year, not by date** (`stretch.py`): a season window
   starting in January 2012 (Karnataka) was labelled VIIRS although January
   2012 is still Aqua. Now the record in use on the peak day. No shipped file
   changes (Karnataka's 2012 peak falls after February).
4. **Notes for borrowing areas** ended in a lower-case sentence fragment with
   the area id ("curve and constants borrowed from cordoba"); now a sentence
   with the area's name (`export.py`). The C2 note now says that only the 2016
   placebo tests anything (`validate.py`; wording asked for by the session
   reviewing the project page).

**Not fixed, reported:**

- **PELT was not run.** The pre-registration lists PELT as an ungated second
  opinion for C1b; no code computes it. Its penalty was never fixed in
  advance, so choosing one now would be a choice made after seeing results.
  Stated in `limits.md` and in a dated note in `PREREGISTRATION.md`.
- **Variant A is assumed** in `stretch.py`, `firecci.py`, `mcd64.py`,
  `evidence.py` and `figures.py`. Every area ships variant A, so no number is
  wrong; switching an area to B in `shipping.json` would need these changed.
- **`docs/ARCHITECTURE.md`'s file list** says `season.json` and
  `episodes.json` exist for fewer areas, and `drift.json` for three; the code
  writes them for all four (Punjab's `episodes.json` is an explicit null).
  It is the shared contract, so the change is left to Mahabu and 8crsk.
- **`obs` (clear-view days)** is still up to 3 days high in January. It needs
  the Aqua daily fire masks (Earthdata login, about 3 hours of download).

## One constant per calendar month (15 November, decision 57)

AI-assisted. Reviewed by: Mahabu Subhani (pending). Every number is from
`checks.json`, `loyo.json`, `sensitivity.json`, `evidence.json`, `c6.json`
and `c6m.json` of the rebuild of 15 November (from the raw FIRMS files:
`clean.py` to `hotspots.py`; data to 13 November as before, `refresh.py` not
run).

1. **Why.** Check C3's error followed the season, the same in the fitting
   years and in 2018 to 2019 (`docs/research/20261115-checks-audit-seasonal-
   bias.md`). `harmonize.seasonal_constants` fits each model's daytime
   constant per calendar month; the year-round versions are kept as `S0y`,
   `L2y`, `L1ry`.
2. **What the rule ships, as first written.** Córdoba: hard floor (the curve
   fails C2). Punjab and Haryana: hard floor (the curve fails C3 and C8).
   Chilecito: Córdoba's. Karnataka: ratio. The detection curve ships nowhere.
3. **Shipped models, before (year-round, as shipped until 15 Nov) and after.**

| | Córdoba before (curve) | Córdoba after (hard floor) | Punjab and Haryana before (hard floor) | Punjab and Haryana after (hard floor) |
|---|---|---|---|---|
| C1 | 0.049 | 0.077 | -0.016 | -0.020 |
| C2 (2016) | -0.089 | -0.094 | -0.060 | -0.059 |
| C3 | 0.207 fail | 0.117 | 0.169 fail | 0.148 |
| C3x (2020 to 2021) | 0.125 | 0.124 | 0.223 fail | 0.169 fail |
| C3r | -0.072 | -0.068 | -0.042 | -0.081 |
| C4 slope, correlation | 0.951, 0.987 | 0.938, 0.977 | 1.025, 0.993 | 1.026, 0.989 |
| C1x | 0.087 | 0.072 | 0.023 | 0.024 |
| C6 | -0.440 fail | -0.403 fail | -0.149 | -0.148 |
| C6m | -0.392 fail | -0.404 fail | -0.081 | -0.080 |
| Leave one year out: years within 0.10, largest miss | 8 of 10, 0.181 | 3 of 10, 0.233 (2013) | 8 of 10, 0.129 | 8 of 10, 0.135 |
| Monthly error used for the rank range (`month_log_sd`) | 0.244 | 0.246 | 0.426 | 0.361 |

   Córdoba's detection curve with monthly constants, which does not ship: C1
   0.066, C2 -0.114 fail, C3 0.072, C3x 0.125, C1x 0.100 fail, 9 of 10 years
   within 0.10 (largest 0.193, 2013), `month_log_sd` 0.186.
4. **Sensitivity of the shipped models** (five other settings). Córdoba: C1
   0.070 to 0.088; C2 -0.094 to -0.111, a fail in three; C3 0.098 to 0.222, a
   fail in three; C3x 0.114 to 0.143; C3r -0.088 to -0.056. Punjab and
   Haryana: C1 -0.025 to -0.008; C2 -0.086 to -0.047; C3 0.154 to 0.242, a
   fail in all five; C3x 0.148 to 0.173, a fail in three; C3r -0.100 to
   -0.072, one a fail.
5. **Mix test, Córdoba 2012 to 2021.** Hard floor 0.76 (p = 0.011), ratio
   -0.75 (p = 0.013), curve 0.32 (p = 0.37).
6. **Aqua against the record, ln(Aqua / record).** Córdoba -0.011 (2012 to
   2021) and 0.025 (2022 to 2026). Punjab and Haryana 0.028 and 0.258; in
   October and November alone 0.032 and 0.395; in April to June -0.000 and
   -0.041.
7. **Other values that changed.** Season totals, Punjab and Haryana rice
   season: 2020 14,584; 2024 1,729; 2025 762 (timing trends unchanged: peak
   +6.7 days per decade). Córdoba season peak +7.5 days per decade (1.0 to
   14.4). Chilecito July 2026: 65.21 against a median of 4.83 (13.5 times),
   2nd of 25; its episode is the 9th of 277 by total. 1 to 13 November 2026:
   Punjab and Haryana 23rd of 25 (0.09 times the median), Córdoba 22nd of 25
   (0.30 times). Small-fire layer over the record, median 2013 to 2025: 2.17
   and 1.75.
8. **Hotspot files.** Rows changed class only in Córdoba and Chilecito from
   2012 on (30 files), where the model changed from the curve to the floor.
   The Punjab and Haryana and Karnataka files have the same rows as before
   and were left as committed.
9. **Not rerun.** `landcover.json`, `sources.json` and `population.json`
   (app scripts; the first two use the hotspot classes, so Córdoba's and
   Chilecito's are slightly out of date) and `obs` (carried in from the
   daily-mask tables as before).

