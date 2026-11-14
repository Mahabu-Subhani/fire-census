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
| C1 | The harmonized record does not jump at 2012 (limit 0.10) | **Pass.** 0.049 | **Pass.** 0.028 |
| C1b | No statistical change point near 2012 | **Pass.** Strongest change point at April 2013, p = 0.16 | **Pass.** p = 1.00 |
| C2 | No jump at a date when no sensor changed (2016; limit 0.10) | **Pass.** -0.089 | **Pass.** -0.060 |
| C3 | Held-out years 2018 to 2019, month by month (limit 0.15) | **Fail.** 0.207 | **Pass.** 0.144 |
| C3r | Held-out years, two-year total (limit 0.10), added after results | **Pass.** -0.072 | **Pass.** 0.003 |
| C4 | NOAA-20 alone, never used for fitting, gives the same record | **Pass.** Slope 0.951, correlation 0.987 | **Pass.** Slope 1.025, correlation 0.993 |
| C5 | The curve agrees with published MODIS detection limits (within a factor of 2) | **Pass.** Day 9.9 MW against 5.7 MW at nadir; night 6.9 against 3.7 | **Pass.** Day 4.8 against 5.7; night 4.2 against 3.7 |
| C6 | Stable relationship with ESA Fire_cci burned area (limit 0.25) | **Fail.** -0.440 (Aqua alone -0.427) | **Pass.** -0.104 |
| C6m | Same with NASA MCD64A1 burned area, added after results | **Fail.** -0.392 (Aqua alone -0.430) | **Pass.** -0.036 |
| C7 | Punjab's burning peak moves later after 2009 (at least 5 days) | | **Pass.** 8.1 days later, p = 0.0009 |
| C8 | The curve is stable when resampled (range at most 50 percent) | **Pass.** 9.9 MW, range 8.6 to 12.3 (38 percent) | **Fail.** 4.8 MW, range 4.2 to 7.1 (62 percent); applies to the curve, which does not ship here |

**About C3.** In Córdoba it fails for every method that does real
harmonization. In Punjab and Haryana the hard floor that ships passes it
(0.144), so Punjab meets every pre-registered check that applies to its
method; the curve (0.273) and the ratio (0.322) fail it there. Two satellites passing at different times
disagree by about 20 percent in a typical month even in the years used for
fitting, and two identical VIIRS sensors disagree by 7 to 10 percent. So the
0.15 limit could not be met. We added C3r on the two-year total, said so in a
dated note, and show both results.

**About C1, out of sample.** The constant in each model is fitted on 2012 to
2017, which overlaps C1's window. Fitted on 2016 to 2017 only, the 2012 step is
0.106 for Córdoba's curve (just over the limit), 0.090 for the hard floor and
0.105 for the ratio; in Punjab -0.010, 0.038 and -0.029. The stronger,
fully out-of-sample evidence is C4 (NOAA-20), C3r (2018 to 2019) and C5.

## The ladder: what each step removes

Remaining step at 2012 (0 is perfect):

| Level | Córdoba | Punjab and Haryana |
|---|---|---|
| Raw detections, all sensors added | 1.648 | 1.674 |
| Count each 1 km square once | 1.305 | 1.528 |
| Constant conversion ratio (what most teams do) | 0.035 | -0.029 |
| Hard floor | 0.066 | 0.028 |
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
  2026, and Terra's from 10:53 to 09:14. Since 2022 Aqua reports 6.2 percent
  more fire than the harmonized record there (2.2 percent less before), and 6.1
  percent more in Córdoba (1.9 percent more before). A MODIS-only calendar continued past 2022 would
  carry that drift. Ours uses VIIRS after 2012, calibrated before the drift.
- **The record reproduces a documented event.** A 2019 study reported that
  Punjab's peak burning day moved from 24 October to 4 November after 2009
  groundwater laws delayed rice planting. Across a record that spans both
  sensors, our median burning day moves 8.1 days later. MODIS alone gives 7.4.
  The two studies measure the peak differently, so the numbers need not match.
- **The burning season itself has moved, across the sensor change.** On the
  harmonized daily record, the day by which half of Punjab's rice-residue
  season (15 September to 15 December) had burned moved later by 6.7 days per
  decade (90 percent range 5.3 to 8.2). The start and end moved about as much,
  so the season shifted without growing longer. The trend runs straight
  through 2012, when the record switches from MODIS to VIIRS. In Córdoba the
  season's midpoint moved later by 10.0 days per decade (2.7 to 16.0).
- **Punjab's burning fell sharply in 2024 and 2025.** Harmonized activity in
  the rice-residue season was 14,142 fire cells in 2020, 1,677 in 2024 and 737
  in 2025. Our record shows what a 13:30 satellite pass sees: a reported shift
  of burning to the evening (UNVERIFIED lead from a 2025 study summary) would
  also lower it, so read this as detected burning, not all burning.
- **How this fire compares with earlier ones.** In the Chilecito area we found
  238 fire episodes since July 2002 (runs of active days, allowing two quiet
  days). The July 2026 fire, 27 to 31 July, is the 11th largest by total
  activity and the 9th by its peak day. The largest were in September and
  October 2017.
- **Robustness.** In Córdoba every check keeps its verdict when we keep
  low-confidence detections, change what counts as the same fire, or move the
  curve's reference point. Punjab and Haryana is less robust: keeping
  low-confidence detections pushes C3r over its limit (-0.122), and moving the
  curve's reference point to the 99th percentile breaks C1b.
- **The author's own example.** The challenge video shows a fire near
  Chilecito, La Rioja, in July 2026. In our record that July has 44.07 fire
  cells against a median of 5.00 for the 24 earlier Julys (8.8 times), the
  second highest July on record after 2003. The app labels it "far above
  normal". Chilecito has too few fires to calibrate, so it borrows Córdoba's
  curve, and two of its own checks fail on that borrowed calibration: the 2012
  step (C1, 0.29) and NOAA-20 agreement (C4, correlation 0.889). Treat it as a
  case study, not a validated region.
- **Why the small-fire layer is larger than the record in Punjab.** From 2013
  to 2025 the small-fire layer is 1.96 times the harmonized record in Punjab and
  Haryana (1.85 to 2.22 by year) and 1.8 times in Córdoba. Crop-residue fires are
  small and short, so VIIRS sees two to three weak fires there for every fire
  MODIS would have reported. That is the "greater detail" of VIIRS, kept
  separately so the long record stays comparable.
