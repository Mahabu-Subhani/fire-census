<!-- AI-assisted: drafted with help from Claude (Anthropic). Every number is copied from pipeline output (WORK/checks.json, sensitivity.json, evidence.json). Reviewed by: Mahabu Subhani. -->

# Results (draft by Mahabu for the project page)

What ships since 15 November, all with one conversion constant per calendar
month (decision 57):

- **Córdoba and neighbouring areas: the detection curve** (each VIIRS fire cell
  counted by its chance of being seen by MODIS). This is decision 58, which
  **sets the shipping rule aside there**: the curve fails a check the rule
  names (C2), so by the rule the hard floor would ship. Chilecito, a case
  study, borrows Córdoba's calibration and model.
- **Punjab and Haryana: the hard floor** (VIIRS fire cells at or above the
  midpoint of the measured curve), by the rule as first written.
- **Karnataka: the conversion ratio**, the rule's fallback.

In every area the curve also weights the small-fire layer (each VIIRS fire
cell adds 1 minus its detection probability; `pipeline/export.py`). Until 15
November the detection curve (Córdoba) and the hard floor (Punjab and
Haryana) shipped with one year-round constant, under the revised check C3r;
their values are kept in the ladder below. Punjab and Haryana means exactly
the two states and Chandigarh (94,490 km², decision 44). Calibration: Aqua
MODIS against S-NPP VIIRS, February 2012 to December 2017.

## The checks, written before the data was opened

"Step" values are natural logarithms: 0.05 means about 5 percent; 1.65 means
about 5.2 times.

| Check | What it tests | Córdoba (detection curve) | Punjab and Haryana (hard floor) |
|---|---|---|---|
| C0 | The raw record really jumps at 2012 | **Pass.** Step 1.648 (5.2 times) | **Pass.** Step 1.674 (5.3 times) |
| C1 | The harmonized record does not jump at 2012 (limit 0.10) | **Pass.** 0.066 | **Pass.** -0.020 |
| C1x | The same step with the model fitted only on later years (Feb 2015 to Dec 2021; limit 0.10), added after results | **Fail.** 0.100 against 0.10 (the hard floor passes here, 0.072) | **Pass.** 0.024 |
| C1b | No statistical change point between July 2011 and December 2012 | **Pass** by the rule. But the strongest change point, October 2013, is significant (p = 0.014); see caution 4 | **Pass.** Strongest at November 2014, p = 0.43 |
| C2 | No jump at a date when no sensor changed (2016; limit 0.10) | **Fail.** -0.114 against 0.10. The shipping rule names this check; the hard floor passes it (-0.094) and would ship by the rule (caution 2) | **Pass.** -0.059 |
| C3 | Held-out years 2018 to 2019, month by month (limit 0.15) | **Pass.** 0.072 | **Pass.** 0.148 against 0.15, on 15 of 24 months: at the limit, and C3x below fails |
| C3r | Held-out years, two-year total (limit 0.10), added after results | **Pass.** -0.062 | **Pass.** -0.081 |
| C3x | C3's statistic and limit on 2020 to 2021, added after results | **Pass.** 0.125 | **Fail.** 0.169 against 0.15, on 14 of 24 months |
| C4 | NOAA-20 alone, never used for fitting, gives the same record | **Pass.** Slope 0.951, correlation 0.988 | **Pass.** Slope 1.026, correlation 0.989 |
| C5 | The curve's midpoint agrees with published MODIS detection limits (within a factor of 2) | **Pass.** Day 9.9 MW against 5.7 MW at nadir; night 6.9 against 3.7 | **Pass.** Day 4.8 against 5.7; night 4.2 against 3.7 |
| C6 | Stable relationship with ESA Fire_cci burned area (limit 0.25) | **Fail.** -0.446 (Aqua alone -0.427) | **Pass.** -0.148 (Aqua alone -0.125) |
| C6m | Same with NASA MCD64A1 burned area, added after results | **Fail.** -0.381 (Aqua alone -0.430) | **Pass.** -0.080 (Aqua alone -0.089) |
| C7 | Punjab's burning peak moves later after 2009 (at least 5 days) | | **Pass.** 8.2 days later, p = 0.0009 |
| C8 | The curve is stable when resampled (range at most 50 percent) | **Pass.** 9.9 MW, range 8.6 to 12.3 (38 percent). Daytime curve; see the note on C8 below | **Fail.** 4.8 MW, range 4.2 to 7.1 (62 percent); the curve sets the floor here, so the floor is uncertain too |

**Read this table with five cautions.**

1. **The method was changed after C3 failed.** With one year-round constant
   C3 was a fail in both areas (0.207 and 0.169). We then saw that the error
   followed the season and fitted the constant per calendar month. So C3's pass
   is no longer a clean held-out result. C3x uses 2020 to 2021, whose monthly
   values had not been looked at (their yearly totals were already in the
   leave-one-year-out table of 14 November). It is the cleaner one: a pass in
   Córdoba, a **fail in Punjab and Haryana**. Punjab and Haryana is at the
   limit: C3 0.148 against 0.15, C3x 0.169.
2. **In Córdoba the model that ships fails a check its own rule names.** The
   pre-registered rule ships the curve only if it passes C2, the 2016
   placebo. It does not: -0.114 against 0.10. It also fails C1x (0.100). By
   the rule the hard floor would ship there, and it passes both (-0.094 and
   0.072). Mahabu chose the curve after both sets of results were on the
   table (decision 58), so this choice was not made blind. What the curve
   does better: C3 0.072 against 0.117; leaving one year out at a time it is
   within 0.10 of Aqua in 9 of 10 years (largest miss 0.193, in 2013), against
   3 of 10 for the hard floor (0.233); its yearly error does not follow the mix
   of weak and strong fires. The app shows both models' verdicts.
3. **How the results hold under other settings.** Five other reasonable
   settings were tried (keeping low-confidence detections, two other rules for
   what counts as the same fire, two other reference points for the curve). In
   Córdoba the curve passes C3 in all five (0.075 to 0.105) and C3x in all five
   (0.093 to 0.129), and fails C2 in all five (-0.114 to -0.117). In Punjab
   and Haryana the hard floor fails C3 in all five (0.154 to 0.242) and C3x in
   three. C1 passes in all of them (0.065 to 0.070; -0.025 to -0.008).
4. **C1b in Córdoba passes only by its window.** The rule looks for a change
   point between July 2011 and December 2012. The strongest one found is at
   October 2013 and is significant. It is not at the sensor change, but the
   record does drift against Aqua within the VIIRS years, which is what C2's
   failure measures (C2 is negative in every area).
5. **Thin margins.** Punjab and Haryana passes C3 at 0.148 against 0.15.
   Córdoba fails C2 by 0.014 and C1x by less than 0.001; neither failure is
   large, and neither is waved away: they are shown as failed.

**What C3's failure was.** Not noise, and not a badly chosen limit (we said so
on 14 November; that is withdrawn). Counting noise alone would give about 0.07
in Córdoba and 0.03 in Punjab and Haryana. Split by calendar month, the error
ln(record / Aqua) was the same in the fitting years and the held-out years:

| ln(record / Aqua), shipped model | Fitting years, one constant | 2018 to 2019, one constant | Fitting years, monthly constants | 2018 to 2019, monthly constants |
|---|---|---|---|---|
| Punjab and Haryana, May | +0.56 | +0.43 | +0.05 | -0.08 |
| Punjab and Haryana, October | -0.22 | -0.24 | -0.14 | -0.17 |
| Punjab and Haryana, November | +0.04 | -0.09 | +0.11 | -0.02 |
| Córdoba, January | +0.16 | +0.15 | -0.10 | -0.09 |
| Córdoba, July | -0.19 | -0.19 | -0.01 | -0.01 |
| Córdoba, August | -0.20 | -0.22 | -0.10 | -0.12 |

(All twelve months are in each area's `meta.json`,
`error_by_calendar_month`.) With one constant, Punjab and Haryana's May was
about 75 percent too high after 2012 and its October about 20 percent too low:
an error in exactly the comparison the app is built for, this month against
the same month in earlier years. The monthly constants are not perfect: the
three-month pooling is too coarse for Punjab and Haryana's April, which takes
mostly May's constant and reads 35 to 45 percent too low. The settings were
written in the same step as the first run, seconds before its first result,
and were not tuned afterwards.

**About C3r.** A two-year total cancels a seasonal error, so C3r passed while
single calendar months were far off. It stays in the table and decides
nothing now.

**About C6 and C6m.** Both burned-area records are built from MODIS
reflectance and guided by MODIS active fires, so they are independent of
VIIRS and of the 2012 seam, not of MODIS. Córdoba fails both, and Aqua alone
fails them the same way (-0.427 and -0.430): fire activity per km² burned
really is lower after 2012, by about a third. The check assumed a fixed amount
of burned area per detected fire, which is not a law of nature. Our record
differs from Aqua's on this statistic by 0.02 (ESA) and 0.05 (NASA). All 240
ESA months are used.

**About C1, out of sample.** The constants are fitted on 2012 to 2017, which
overlaps C1's window, so part of C1's pass is built in. Refitted on February
2015 to December 2021 only (check C1x): Córdoba curve 0.100 (fail, by less
than 0.001), hard floor 0.072 (pass), ratio 0.159 (fail); Punjab and Haryana
0.019, 0.024 and 0.011. On a shorter fit, 2016 to 2017 only (24 months for
twelve constants), Córdoba is over the limit: curve 0.148, hard floor 0.181;
Punjab and Haryana -0.014 and -0.008. Leaving one year out at a time, 2012 to
2021, the shipped model is within 0.10 of Aqua in 9 of 10 years in Córdoba
(largest miss 0.193, in 2013) and in 8 of 10 in Punjab and Haryana (largest
0.135).

**Yearly figures in Córdoba, re-read from the rebuilt data.** Activity fell by
49.2 percent of a typical year per decade from 2003 to 2025 (Sen's slope
-85.00 a year; Mann-Kendall p = 0.004), computed with the app's own tests on
`cube.json`; re-read the wording in the app on the day. 1 to 13 November 2026
is 16.63 against a median of 44.49 (0.37 times), 22nd of 25.

## The ladder: what each step removes

Remaining step at 2012 (0 is perfect) and the month-by-month held-out error
(C3's statistic, limit 0.15):

| Level | Córdoba: step, held-out | Punjab and Haryana: step, held-out |
|---|---|---|
| Raw detections, all sensors added | 1.648 | 1.674 |
| Count each 1 km square once | 1.305, 1.259 | 1.528, 1.781 |
| Conversion ratio, one year-round constant (what most teams do) | 0.035, 0.120 | -0.029, 0.322 |
| Conversion ratio, a constant per calendar month | 0.054, 0.173 | -0.028, 0.176 |
| Hard floor, one year-round constant | 0.062, 0.292 | -0.016, 0.169 |
| Hard floor, a constant per calendar month | 0.077, 0.117 | **-0.020, 0.148 (ships)** |
| Detection curve, one year-round constant | 0.049, 0.207 | -0.020, 0.273 |
| Detection curve, a constant per calendar month | **0.066, 0.072 (ships, decision 58)** | -0.022, 0.208 |

## Evidence beyond the checks

- **In Córdoba the curve agrees with physics it never saw.** Sofiev and
  Kouznetsov (2026) model MODIS's detection limit as growing with pixel size
  (by day, 4.44 MW per km² of pixel plus 0.52 MW, table 1 of their preprint).
  At the average size of Aqua's pixels over Córdoba (2.23 km²) that gives
  10.4 MW. Our curve, built only from whether two satellites agreed, crosses
  half of its plateau at 9.9 MW. **In Punjab and Haryana the curve is weak**
  (daytime match rate 0.160, chance 0.091, plateau 0.118: Aqua matches even
  the strongest VIIRS fire cells about 12 percent of the time above chance),
  so the floor there, 4.8 MW, is a cut-off we use, not a measured detection
  limit.
- **The conversion constants follow the sun.** The twelve daytime constants
  of the shipped model are lowest in each area's own summer: January in
  Córdoba, June in Punjab and Haryana, and highest in July and in January.
  Their rank correlation with the height of the midday sun is -0.92 in
  Córdoba and -0.78 in Punjab and Haryana (`pipeline/findings.py`). Two
  areas in opposite hemispheres agreeing fits a physical cause: MODIS misses
  more against a hotter, brighter background, which is also why its limit
  is higher by day than by night. Cautions: each constant pools three
  months, so the twelve values are not independent; season, crop and fire
  type change together, so this does not separate the causes; in Karnataka,
  where few fires burn outside January to May, there is no such pattern
  (-0.22).
- **A method's error can follow the mix of weak and strong fires.** In
  Córdoba, 2012 to 2021, the hard floor's yearly error follows that mix (rank
  correlation 0.76, p = 0.011) and the ratio's does in the opposite direction
  (-0.75, p = 0.013). The detection curve's, which ships there, does not
  (0.32, p = 0.37). In Punjab and Haryana no method's error follows the mix.
- **The fix holds without the satellite it was fitted on.** NOAA-20 was never
  used for fitting, and it reproduces the record (C4). This matters because
  S-NPP stopped delivering data on 2 November 2026.
- **MODIS's orbit is drifting, and in Punjab's rice season a later pass now
  sees far more.** In our own data, Aqua's daytime pass over Punjab and
  Haryana moved from 13:18 local time in 2021 to 15:27 in 2026, and Terra's
  from 10:53 to 09:14. In October and November, Aqua reported 3 percent more
  than the harmonized record in 2012 to 2021 and 48 percent more in 2022 to
  2026 (log ratios 0.032 and 0.395; over whole years 1.6 times in 2024 and
  1.8 in 2025). In April to June there is no such excess (-0.04). So this is
  not only the orbit: rice-residue burning is now seen much more by a
  mid-afternoon pass than by VIIRS at about 13:10, which fits reports that
  burning has moved later in the day (news reports of a 2025 ISRO study;
  UNVERIFIED, the paper was not read). Over all months the excess is 29
  percent in Punjab and Haryana since 2022 (3 percent before) and 6.6 percent
  in Córdoba (1.5 percent before); log ratios 0.258, 0.028, 0.064 and 0.015.
  A MODIS-only calendar continued past 2022 would mix this in; ours uses
  VIIRS after 2012 at a steady overpass time. Every figure in this point is
  printed by `pipeline/findings.py`.
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
  season's midpoint moved later by 6.9 days per decade (0.6 to 13.6).
- **Punjab's detected burning fell sharply in 2024 and 2025.** Harmonized
  activity in the rice-residue season was 14,584 fire cells in 2020, 1,729 in
  2024 and 762 in 2025. This is what a pass at about 13:10 sees. Aqua, now
  passing two hours later, saw 1.6 to 1.8 times as much in those years (the
  point above), so read the fall as detected burning, not all burning.
- **How this fire compares with earlier ones.** In the Chilecito area we found
  230 fire episodes since July 2002 (runs of active days, allowing two quiet
  days). The July 2026 fire, 27 to 31 July, is the 9th largest by total
  activity and the 9th by its peak day. The largest was in September 2017,
  then August 2024 and October 2017.
- **Robustness.** See caution 3. The 2012 step is stable under five changes of
  settings (0.065 to 0.070 in Córdoba, -0.025 to -0.008 in Punjab and
  Haryana), and so is the two-year held-out total (-0.069 to -0.059; -0.100 to
  -0.072, one of them just over the 0.10 limit). The curve's midpoint moves
  from 8.4 to 15.3 MW in Córdoba and from 3.3 to 8.2 MW in Punjab and Haryana.
- **About C8.** We read it on the daytime curve, and the app says so. Read the
  same way, the night curve would be over the limit in every area (Córdoba 72
  percent, Punjab and Haryana 86). Night fires are 7.4 percent of the
  reference fire cells in Córdoba's fitting years and 0.2 percent in Punjab
  and Haryana's, so the record depends little on them, but night values on
  their own are uncertain.
- **The author's own example.** The challenge video shows a fire near
  Chilecito, La Rioja, in July 2026. In our record that July has 50.84 fire
  cells against a median of 5.00 for the 24 earlier Julys (10.2 times), the
  second highest July on record after 2003. The app labels it "far above
  normal". Chilecito has too few fires to calibrate, so it borrows Córdoba's
  curve and monthly constants, and three of its own checks fail on that
  borrowed calibration: the 2012 step (C1, 0.268), NOAA-20 agreement (C4,
  correlation 0.899) and the ESA burned-area check (C6, +0.394). Treat it as
  a case study, not a validated region. Because it has too few months to
  measure its own monthly error, the app shows no rank range for it.
- **Why the small-fire layer is larger than the record in Punjab.** From 2013
  to 2025 the small-fire layer is 2.17 times the harmonized record in Punjab
  and Haryana and 1.83 times in Córdoba (median of the years). Crop-residue
  fires are small and short, so VIIRS sees two to three weak fires there for
  every fire MODIS would have reported. That is the "greater detail" of VIIRS,
  kept separately so the long record stays comparable.
