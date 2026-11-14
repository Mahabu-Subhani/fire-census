# Phase 2 notes: harmonization and checks (14 Nov 2026)

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Numbers are copied from script output (`harmonize.py`, `validate.py`,
`figures.py`, `export.py`). Phase 1 notes are in `NOTES.md`.

## What "harmonized" means here

One unit for the whole record: **Aqua-equivalent fire cells**. A fire cell is a
0.01 degree cell with at least one detection in one satellite overpass (one
satellite, one date, day or night). Before February 2012 the record is the
number of fire cells Aqua MODIS reported. From February 2012 it is the number
of fire cells Aqua *would be expected to report*, computed from VIIRS.

## How the detection curve is built

For every S-NPP fire cell we ask whether Aqua reported a fire cell on the same
date and day/night class within one cell (about 3 x 3 km). The matched fraction
against the cell's total FRP, made monotonic by isotonic regression, is the
curve. Chance coincidences are measured with a displaced search (10 cells east)
and subtracted. The curve is divided by its value at the 95th percentile of
fire strength (the plateau), so that coverage and timing differences are
absorbed. A single constant per day/night class then matches the calibration
total: harmonized = k x sum of curve values.

Differences from `docs/APPROACH.md`, with reasons:

| APPROACH.md said | What was built | Why |
|---|---|---|
| Curve from the ratio of two FRP histograms | Matched detection: did Aqua see this S-NPP fire cell | A histogram ratio needs Aqua FRP and VIIRS FRP on one scale. Matching uses VIIRS FRP only |
| Cell FRP = mean of detections | Cell FRP = sum of VIIRS detections | A 0.01 degree cell is about one MODIS pixel; its total power is the comparable quantity |
| Hard floor applied to both sensors | Floor on VIIRS cells at the curve midpoint, times a constant | Same reason: no shared FRP scale |
| Pre-2012 series = Aqua above the floor | Pre-2012 series = all Aqua fire cells | The curve expresses VIIRS in Aqua terms, so Aqua needs no cut |

These are method choices and need Mahabu's confirmation (see `docs/DECISIONS.md`).

## Calibration results (variant A, February 2012 to December 2017)

| Area, time | S-NPP cells | Aqua cells | Matched | Chance | Plateau | Midpoint (90% range) |
|---|---|---|---|---|---|---|
| Córdoba, day | 20,811 | 7,210 | 0.338 | 0.008 | 0.689 | 9.9 MW (8.6 to 12.3) |
| Córdoba, night | 6,350 | 575 | 0.203 | 0.031 | 0.499 | 6.9 MW (5.5 to 10.4) |
| Punjab and Haryana, day | 470,972 | 100,332 | 0.158 | 0.088 | 0.123 | 5.0 MW (4.4 to 7.3) |
| Punjab and Haryana, night | 15,842 | 350 | 0.035 | 0.001 | 0.144 | 3.8 MW (3.6 to 4.1) |

- Variant B (2016 to 2017 only) gives a Córdoba day midpoint of 10.6 MW (8.9 to
  15.4), inside variant A's range. No sign of a shift at 2015 that matters, so
  variant A is the primary calibration, as decision 10 specifies.
- Near-simultaneous subset (Aqua within 10 minutes), Córdoba day: 3,811 cells,
  plateau 0.853, midpoint 7.0 MW. Closer in time, Aqua agrees more often and
  the midpoint is lower, as expected.
- **Punjab's curve is weak.** Even the strongest VIIRS cells are matched by Aqua
  only about 12 percent of the time above chance, and chance matches are 9
  percent because burning is so dense. Crop fires are small and last minutes,
  so two satellites minutes apart often see different fires.

## The ladder: remaining step at 2012 (check C1 statistic; 0 is perfect)

| Level | Córdoba | Punjab and Haryana |
|---|---|---|
| L0 raw detections | 1.648 | 1.686 |
| L1 fire cells | 1.305 | 1.550 |
| L1r constant ratio | 0.035 | -0.030 |
| L2 hard floor | 0.066 | -0.004 |
| S0 detection curve | 0.049 | -0.020 |

A value of 1.65 is a factor of 5.2. Counting each cell once removes about a
fifth of the jump in Córdoba and less in Punjab; the rest is sensitivity and
coverage. The constant models fit the 2012 window partly by construction,
because 2012 to 2015 lies inside the calibration years.

## Pre-registered checks, variant A

| Check | Córdoba S0 | Córdoba L2 | Córdoba L1r | Punjab S0 | Punjab L2 | Punjab L1r |
|---|---|---|---|---|---|---|
| C0 raw jump | pass 1.648 | pass | pass | pass 1.686 | pass | pass |
| C1 no seam 2012 | pass 0.049 | pass 0.066 | pass 0.035 | pass -0.020 | pass -0.004 | pass -0.030 |
| C1b no change point | pass | pass | pass | pass | pass | **fail**, p<0.001 at 2012-01 |
| C2 placebo 2016 | pass -0.089 | pass -0.070 | **fail** -0.105 | pass -0.048 | pass -0.057 | pass -0.035 |
| C3 held-out 2018-19 | **fail** 0.207 | **fail** 0.284 | pass 0.120 | **fail** 0.267 | **fail** 0.291 | **fail** 0.245 |
| C4 NOAA-20 alone (slope, correlation) | pass 0.951, 0.987 | pass 0.938, 0.981 | pass 0.982, 0.986 | pass 1.030, 0.994 | pass 1.024, 0.995 | pass 1.038, 0.994 |
| C8 curve stable | pass, 38% | n/a | n/a | **fail**, 57% | n/a | n/a |
| C7 Punjab peak shift | | | | **pass**, +8.1 days, p=0.0009 (Aqua alone +7.4) | | |

C5 and C6 not run. C2's 2008 placebo is zero by construction.

**Shipping rule outcome: the constant-ratio fallback (L1r) ships in every
area**, because the curve and the floor fail C3. `shipping.json` records this.
Chilecito borrows Córdoba's constants.

## Why C3 failed: diagnosis (not pre-registered)

C3 measures the median month-to-month scatter of harmonized VIIRS against Aqua.
That scatter is large even where the models were fitted, and is not bias:

| Quantity | Córdoba | Punjab and Haryana |
|---|---|---|
| C3 statistic, S0, held-out 2018-19 | 0.207 | 0.267 |
| Same statistic inside calibration years 2012-17, S0 | 0.178 | 0.231 |
| Same statistic between S-NPP and NOAA-20 (identical sensors), S0 | 0.099 | 0.068 |
| Aggregate bias over 2018-19, ln(sum H / sum R), S0 | -0.072 | -0.034 |
| Aggregate bias over 2018-19, L1r | -0.064 | -0.031 |

Two satellites with different overpass times disagree by about 20 percent in a
typical month even when calibrated; two identical sensors 50 minutes apart
disagree by 7 to 10 percent. Over the two held-out years the totals agree to
within 3 to 7 percent. The 0.15 threshold was set for a monthly statistic that
cannot reach it.

## Year-to-year stability (not pre-registered)

Standard deviation of the yearly ratio (harmonized VIIRS / Aqua):

| Period | Córdoba S0 | Córdoba L1r | Córdoba L2 | Punjab S0 | Punjab L1r | Punjab L2 |
|---|---|---|---|---|---|---|
| 2012 to 2025 | 0.059 | 0.104 | 0.092 | 0.080 | 0.084 | 0.076 |
| 2018 to 2025 (after calibration) | 0.037 | 0.088 | 0.075 | 0.067 | 0.069 | 0.062 |

In Córdoba the detection curve tracks Aqua about twice as steadily as the
constant ratio, whose yearly ratio wanders between 0.77 and 1.10. In Punjab
the three models are indistinguishable, and all drift down to about 0.8 in
2024 to 2025. Possible causes: Aqua drifting to a later overpass, and burning
shifting later in the day. UNVERIFIED; needs a source.

## Other findings

- **Chilecito, July 2026:** 32.6 harmonized fire cells against a median of 5.4
  for the 24 earlier Julys (6.0 times), which is "far above normal" under
  decision 12. An earlier July reached 96, so it is not the record.
- **Punjab peak date (C7):** later by 8.1 days after 2009 (mean day of year
  2003-08 against 2010-19), p = 0.0009. Published: about 11 days. VERIFY the
  published figure before quoting.
- Yearly harmonized fire cells, Córdoba: 2009 3,350; 2010 1,526; 2011 1,782;
  2013 1,763; 2014 887; 2015 1,108; 2024 1,408; 2025 1,078. Raw VIIRS
  detections in 2024 were 34,056.
- Export sizes: Córdoba 6.60 MB, Punjab and Haryana 16.48 MB, Chilecito 0.34 MB.

## Known weaknesses of this build

- The constant k is fitted on 2012 to 2017, so C1's 2012 window is partly
  in-sample. Variant B (calibrated on 2016 to 2017 only) is the out-of-sample
  version: Córdoba S0 gives 0.106 there, just over the 0.10 threshold.
- Matching uses date and day/night, not exact time; the 10-minute subset is a
  robustness figure only.
- No valid-observation counts yet (cloud and coverage). Planned for Phase 3.
- Night curves rest on few Aqua cells (575 in Córdoba, 350 in Punjab).
- The range on `harm` combines sampling variance and the spread of k from the
  bootstrap. It does not include cloud or coverage uncertainty.
