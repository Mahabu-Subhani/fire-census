<!-- AI-assisted: drafted with help from Claude (Anthropic). Every number is copied from pipeline output (WORK/checks.json, sensitivity.json, evidence.json). Reviewed by: Mahabu Subhani. -->

# Results (draft by Mahabu for the project page)

Shipped methods: **detection curve** for Córdoba (and the Chilecito case
study, which borrows Córdoba's calibration); **hard floor** for Punjab and
Haryana, because the curve there was too uncertain (check C8). Calibration:
Aqua MODIS against S-NPP VIIRS, February 2012 to December 2017.

## The checks, written before the data was opened

"Step" values are natural logarithms: 0.05 means about 5 percent; 1.65 means
about 5.2 times.

| Check | What it tests | Córdoba | Punjab and Haryana |
|---|---|---|---|
| C0 | The raw record really jumps at 2012 | **Pass.** Step 1.648 (5.2 times) | **Pass.** Step 1.686 (5.4 times) |
| C1 | The harmonized record does not jump at 2012 (limit 0.10) | **Pass.** 0.049 | **Pass.** -0.004 |
| C1b | No statistical change point near 2012 | **Pass.** Strongest change point at April 2013, p = 0.16 | **Pass.** p = 1.00 |
| C2 | No jump at a date when no sensor changed (2016; limit 0.10) | **Pass.** -0.089 | **Pass.** -0.057 |
| C3 | Held-out years 2018 to 2019, month by month (limit 0.15) | **Fail.** 0.207 | **Fail.** 0.291 |
| C3r | Held-out years, two-year total (limit 0.10), added after results | **Pass.** -0.072 | **Pass.** -0.022 |
| C4 | NOAA-20 alone, never used for fitting, gives the same record | **Pass.** Slope 0.951, correlation 0.987 | **Pass.** Slope 1.024, correlation 0.995 |
| C5 | The curve agrees with published MODIS detection limits (within a factor of 2) | **Pass.** Day 9.9 MW against 5.7 MW at nadir; night 6.9 against 3.7 | **Pass.** Day 5.0 against 5.7; night 3.8 against 3.7 |
| C6 | Stable relationship with ESA burned area | Not run | Not run |
| C7 | Punjab's burning peak moves later after 2009 (at least 5 days) | | **Pass.** 8.1 days later, p = 0.0009 |
| C8 | The curve is stable when resampled (range at most 50 percent) | **Pass.** 9.9 MW, range 8.6 to 12.3 (38 percent) | **Fail.** 5.0 MW, range 4.4 to 7.3 (57 percent) |

**About C3.** It fails for every method that does real harmonization, and the
simple ratio fails it in Punjab too. Two satellites passing at different times
disagree by about 20 percent in a typical month even in the years used for
fitting, and two identical VIIRS sensors disagree by 7 to 10 percent. So the
0.15 limit could not be met. We added C3r on the two-year total, said so in a
dated note, and show both results.

## The ladder: what each step removes

Remaining step at 2012 (0 is perfect):

| Level | Córdoba | Punjab and Haryana |
|---|---|---|
| Raw detections, all sensors added | 1.648 | 1.686 |
| Count each 1 km square once | 1.305 | 1.550 |
| Constant conversion ratio (what most teams do) | 0.035 | -0.030 |
| Hard floor | 0.066 | -0.004 |
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
  pass over Punjab moved from 13:17 local time in 2021 to 15:17 in 2026, and
  Terra's from 10:52 to 09:14. Aqua now reports 8.7 percent more fire than the
  harmonized record in Punjab (0.9 percent before 2022), and 6.1 percent more in
  Córdoba (1.9 percent before). A MODIS-only calendar continued past 2022 would
  carry that drift. Ours uses VIIRS after 2012, calibrated before the drift.
- **The record reproduces a documented event.** A 2019 study reported that
  Punjab's peak burning day moved from 24 October to 4 November after 2009
  groundwater laws delayed rice planting. Across a record that spans both
  sensors, our median burning day moves 8.1 days later. MODIS alone gives 7.4.
  The two studies measure the peak differently, so the numbers need not match.
- **Robustness.** In Córdoba every check keeps its verdict when we keep
  low-confidence detections, change what counts as the same fire, or move the
  curve's reference point. Punjab is fragile: two of those changes push C3r over
  its limit.
- **The author's own example.** The challenge video shows a fire near
  Chilecito, La Rioja, in July 2026. In our record that July has 6.0 times the
  median of the 24 earlier Julys, which the app labels "far above normal".
