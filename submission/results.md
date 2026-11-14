<!-- AI-assisted: drafted with help from Claude (Anthropic). Every number is copied from pipeline output (WORK/checks.json, sensitivity.json, evidence.json). Reviewed by: Mahabu Subhani. -->

# Results (draft by Mahabu for the project page)

Shipped methods: **detection curve** for Córdoba and neighbouring areas (and
the Chilecito case study, which borrows Córdoba's calibration); **hard floor**
for Punjab and Haryana, because the curve there was too uncertain (check C8).
Since 14 November evening, Punjab and Haryana means exactly the two states and
Chandigarh (94,490 km²); before that it was a box that also covered parts of
Rajasthan, Himachal Pradesh and Pakistan (decision 44). All Punjab numbers
below are from the clipped area. Calibration:
Aqua MODIS against S-NPP VIIRS, February 2012 to December 2017.

## The checks, written before the data was opened

"Step" values are natural logarithms: 0.05 means about 5 percent; 1.65 means
about 5.2 times.

| Check | What it tests | Córdoba | Punjab and Haryana |
|---|---|---|---|
| C0 | The raw record really jumps at 2012 | **Pass.** Step 1.648 (5.2 times) | **Pass.** Step 1.674 (5.3 times) |
| C1 | The harmonized record does not jump at 2012 (limit 0.10) | **Pass.** 0.049 | **Pass.** -0.016 |
| C1x | The same step with the model fitted only on later years (Feb 2015 to Dec 2021; limit 0.10), added after results | **Pass.** 0.087 (constant ratio: fail, 0.143) | **Pass.** 0.023 |
| C1b | No statistical change point near 2012 | **Pass.** Strongest change point at April 2013, p = 0.16 | **Pass.** Strongest at September 2012, p = 0.32 |
| C2 | No jump at a date when no sensor changed (2016; limit 0.10) | **Pass.** -0.089 | **Pass.** -0.060 |
| C3 | Held-out years 2018 to 2019, month by month (limit 0.15) | **Fail.** 0.207 | **Fail.** 0.169 |
| C3r | Held-out years, two-year total (limit 0.10), added after results | **Pass.** -0.072 | **Pass.** -0.042 |
| C4 | NOAA-20 alone, never used for fitting, gives the same record | **Pass.** Slope 0.951, correlation 0.987 | **Pass.** Slope 1.025, correlation 0.993 |
| C5 | The curve agrees with published MODIS detection limits (within a factor of 2) | **Pass.** Day 9.9 MW against 5.7 MW at nadir; night 6.9 against 3.7 | **Pass.** Day 4.8 against 5.7; night 4.2 against 3.7 |
| C6 | Stable relationship with ESA Fire_cci burned area (limit 0.25) | **Fail.** -0.440 (Aqua alone -0.427) | **Pass.** -0.149 (Aqua alone -0.125) |
| C6m | Same with NASA MCD64A1 burned area, added after results | **Fail.** -0.392 (Aqua alone -0.430) | **Pass.** -0.081 (Aqua alone -0.089) |
| C7 | Punjab's burning peak moves later after 2009 (at least 5 days) | | **Pass.** 8.2 days later, p = 0.0009 |
| C8 | The curve is stable when resampled (range at most 50 percent) | **Pass.** 9.9 MW, range 8.6 to 12.3 (38 percent). Daytime curve; see the note on C8 below | **Fail.** 4.8 MW, range 4.2 to 7.1 (62 percent); applies to the curve, which does not ship here |

**About C6 and C6m.** C6 was recomputed on 15 November on the corrected
record, with all 240 ESA months. The October to December 2019 files had not
been missing by chance: ESA reprocessed them after finding an error in
November 2019 and moved them to a `new-corrected` folder, which the old code
did not read. With 2019 complete, every value is unchanged except Punjab and
Haryana's, which moves from -0.104 to -0.149 because of the hard-floor
correction described below (still a pass). 2019 is not the median year of
2013 to 2019 in any area, which is why it changes nothing. C6m was recomputed
the same day on the corrected record: Punjab and Haryana moves from -0.036 to
-0.081 (still a pass; Aqua alone -0.089), and the other three areas are
unchanged. Every burned-area value in the app is now from the current record.

**About C3.** The method we ship fails it in both areas. In Córdoba the
detection curve (0.207) and the hard floor (0.292) fail; the constant ratio
passes (0.120). In Punjab and Haryana all three fail: hard floor 0.169, curve
0.273, ratio 0.322. So under the rule as pre-registered the constant ratio
would ship in both areas (in Córdoba because it passes, in Punjab and Haryana
as the fallback when nothing passes). We ship the curve in Córdoba and the
hard floor in Punjab and Haryana under the revised check C3r, and both
verdicts are shown.

**A correction made on 14 November, late.** Until then this page said Punjab
and Haryana's hard floor passed the original C3 (0.144). That came from an
error in our code: the floor's constant was fitted with fires grouped into
strength bins, but applied to each fire's own strength, so fires between the
floor (4.78 MW) and the next bin edge (5.01 MW) were counted without being in
the constant. The record after 2012 was 4.6 percent too high there. With the
constant fitted the way it is applied, C3 is 0.169, a fail, and C1 moves from
0.028 to -0.016. Córdoba's shipped record does not use the floor and did not
change. Found by an independent read of the code and confirmed by rebuilding
the record from the files in the repository (`pipeline/from_hotspots.py`).

Why we still prefer the curve in Córdoba: C3 measures month-by-month scatter,
where two satellites passing at different times disagree by about 20 percent
in a typical month (for the curve the same statistic is 0.178 inside the
fitting years; two identical VIIRS sensors disagree by 7 to 10 percent). On
the two-year total (C3r, added after results and said so in a dated note) all
three methods pass. What separates them is the seam itself, out of sample
(C1x below), and whether the error follows the mix of weak and strong fires.
A reader who weighs monthly scatter most would choose the ratio; the app shows
all three methods' results so that choice can be checked.

**About C1, out of sample.** The constant in each model is fitted on 2012 to
2017, which overlaps C1's window, so part of C1's pass is built in. Two refits
without that overlap:

| Fitted on | Córdoba: curve, floor, ratio | Punjab and Haryana: curve, floor, ratio |
|---|---|---|
| Feb 2015 to Dec 2021 (check C1x) | 0.087, 0.058, **0.143 (fail)** | 0.016, 0.023, 0.005 |
| 2016 to 2017 only | **0.106 (just over)**, **0.124**, **0.105** | -0.010, 0.000, -0.029 |

Leaving one year out at a time, 2012 to 2021, the shipped model is within 0.10
of Aqua in 8 of 10 years in both areas (largest miss 0.181 in Córdoba, 0.129
in Punjab and Haryana). The stronger, fully out-of-sample evidence is C4
(NOAA-20), C3r (2018 to 2019) and C5.

## The ladder: what each step removes

Remaining step at 2012 (0 is perfect):

| Level | Córdoba | Punjab and Haryana |
|---|---|---|
| Raw detections, all sensors added | 1.648 | 1.674 |
| Count each 1 km square once | 1.305 | 1.528 |
| Constant conversion ratio (what most teams do) | 0.035 | -0.029 |
| Hard floor | 0.062 | -0.016 |
| Detection curve | 0.049 | -0.020 |

## Evidence beyond the checks

- **The curve matches physics it never saw.** Sofiev and Kouznetsov (2026)
  model MODIS's detection limit as growing with pixel size. At the average size
  of Aqua's pixels over Córdoba (2.23 km²), their formula gives 10.4 MW in
  daytime. Our curve, built only from whether two satellites agreed, crosses 50
  percent at 9.9 MW.
- **Why the curve beats a constant ratio.** A constant ratio should go wrong in
  years with an unusual mix of weak and strong fires. In Córdoba, 2012 to 2021,
  the constant ratio's error follows that mix closely (rank correlation -0.76,
  p = 0.011) and the hard floor's does too in the opposite direction (0.89,
  p = 0.0005). The detection curve's does not (0.35, p = 0.33). Its yearly
  ratio to Aqua varies by 0.066, against 0.094 for the constant ratio.
- **The fix holds without the satellite it was fitted on.** NOAA-20 was never
  used for fitting, and it reproduces the record (C4). This matters because
  S-NPP stopped delivering data on 2 November 2026.
- **The record survives MODIS's orbit drift.** In our own data, Aqua's daytime
  pass over Punjab and Haryana moved from 13:18 local time in 2021 to 15:27 in
  2026, and Terra's from 10:53 to 09:14. Since 2022 Aqua reports about 11 percent
  more fire than the harmonized record there (2.3 percent more before), and 6.1
  percent more in Córdoba (1.9 percent more before); the log ratios are 0.105,
  0.023, 0.059 and 0.019. A MODIS-only calendar continued past 2022 would
  carry that drift. Ours uses VIIRS after 2012, calibrated before the drift.
- **The record reproduces a documented event.** A 2019 study reported that
  Punjab's peak burning day moved from 24 October to 4 November after 2009
  groundwater laws delayed rice planting. Across a record that spans both
  sensors, our median burning day moves 8.2 days later. MODIS alone gives 7.4.
  The two studies measure the peak differently, so the numbers need not match.
- **The burning season itself has moved, across the sensor change.** On the
  harmonized daily record, the day by which half of Punjab's rice-residue
  season (15 September to 15 December) had burned moved later by 6.7 days per
  decade (90 percent range 5.3 to 8.2). The start and end moved about as much,
  so the season shifted without growing longer. The trend runs straight
  through 2012, when the record switches from MODIS to VIIRS. In Córdoba the
  season's midpoint moved later by 10.0 days per decade (2.7 to 16.0).
- **Punjab's burning fell sharply in 2024 and 2025.** Harmonized activity in
  the rice-residue season was 13,521 fire cells in 2020, 1,605 in 2024 and 706
  in 2025. Our record shows what a 13:30 satellite pass sees: a reported shift
  of burning to the evening (UNVERIFIED lead from a 2025 study summary) would
  also lower it, so read this as detected burning, not all burning.
- **How this fire compares with earlier ones.** In the Chilecito area we found
  238 fire episodes since July 2002 (runs of active days, allowing two quiet
  days). The July 2026 fire, 27 to 31 July, is the 11th largest by total
  activity and the 9th by its peak day. The largest were in September and
  October 2017.
- **Robustness.** In both areas every check keeps its verdict under five
  changes of settings: keeping low-confidence detections, two other rules for
  what counts as the same fire, and two other reference points for the curve.
  Across them the 2012 step stays between 0.045 and 0.054 in Córdoba and
  between -0.023 and -0.002 in Punjab and Haryana; the two-year held-out total
  (C3r) between -0.079 and -0.069, and between -0.053 and -0.035. What does
  move is the curve's midpoint: 8.4 to 15.3 MW in Córdoba and 3.3 to 8.2 MW in
  Punjab and Haryana, which is why the curve does not ship there.
- **About C8.** We read it on the daytime curve, and the app says so. Read the
  same way, the night curve would be over the limit in every area (Córdoba 72
  percent, Punjab and Haryana 86). Night fires are 7.4 percent of the
  reference fire cells in Córdoba's fitting years and 0.2 percent in Punjab
  and Haryana's, so the record depends little on them, but night values on
  their own are uncertain.
- **The author's own example.** The challenge video shows a fire near
  Chilecito, La Rioja, in July 2026. In our record that July has 44.07 fire
  cells against a median of 5.00 for the 24 earlier Julys (8.8 times), the
  second highest July on record after 2003. The app labels it "far above
  normal". Chilecito has too few fires to calibrate, so it borrows Córdoba's
  curve, and two of its own checks fail on that borrowed calibration: the 2012
  step (C1, 0.29) and NOAA-20 agreement (C4, correlation 0.889). Treat it as a
  case study, not a validated region. Because it has too few months to measure
  its own monthly error, the app shows no rank range for it (until 15 November
  it showed a range built on Córdoba's error, which was too narrow).
- **Why the small-fire layer is larger than the record in Punjab.** From 2013
  to 2025 the small-fire layer is 2.05 times the harmonized record in Punjab and
  Haryana (1.94 to 2.32 by year) and 1.74 times in Córdoba. Crop-residue fires are
  small and short, so VIIRS sees two to three weak fires there for every fire
  MODIS would have reported. That is the "greater detail" of VIIRS, kept
  separately so the long record stays comparable.
