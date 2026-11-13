# Pre-registered checks

Written **before any fire data was opened or analysed** (committed 14 November
2026, about 00:30 IST; the data files were still zipped). The thresholds below
must not be edited after results exist. If a threshold turns out to be badly
chosen, add a dated note explaining why and report both the original verdict
and the revised one.

Status of the numbers: thresholds were proposed by the AI assistant and
accepted by Mahabu. Published values marked VERIFY must be checked against the
source before the verdict is reported.

## Definitions

- **H**: the harmonized monthly series for the region (Aqua-based before the
  VIIRS era, VIIRS-based after), per valid observation where step 3 achieves it.
- **R**: the Aqua-only reference series built with the same grid and filters.
  Aqua flew on both sides of 2012, so R has no sensor seam.
- **L0**: raw combined hotspot counts (MODIS plus VIIRS), the naive record.
- **Step statistic at year Y**: ln of [mean of the series over the 36 months
  after Y] divided by [mean over the 36 months before Y].
- Region: Punjab and Haryana. Months with fewer than 30 fire cells are excluded
  from ratio statistics and their number is reported.

## Checks

| # | Check | Statistic | Pass if | Notes |
|---|---|---|---|---|
| C0 | The test has power | Step statistic of L0 minus that of R, at 2012 | **Greater than 0.5** (the raw record does show the jump) | If C0 fails, C1 proves nothing |
| C1 | No seam at 2012 | Step statistic of H minus that of R, at 2012 | Absolute value at most **0.10** | About 10 percent |
| C1b | No change point at 2012 | Pettitt test on the monthly ratio H / R, 2005 to 2019 | No change point with p below 0.05 located between July 2011 and December 2012 | PELT reported as a second opinion, not gated |
| C2 | Placebo seams | Same statistic as C1 at 2016 and at 2008 | Absolute value at most **0.10** at both | Dates with no sensor change |
| C3 | Held-out years | Curve fitted on calibration years only; median over months of absolute ln(H_VIIRS / H_Aqua) in 2018 to 2019 | At most **0.15** | Calibration years per DECISIONS.md |
| C4 | NOAA-20 reproduces the record | H from NOAA-20 alone, using the curve fitted on S-NPP, against H from S-NPP, April 2018 to October 2026: slope through the origin, and Spearman correlation | Slope between **0.90 and 1.10**, correlation at least **0.90** | No refitting allowed |
| C5 | Curve midpoint is physically plausible | Fire strength at which the fitted detection probability is 0.5, day and night | Within a **factor of 2** of the published MODIS detection limit for that time of day | Published values to VERIFY: about 5.7 MW day, 3.7 MW night (GMD 2026). Our strength is in VIIRS fire-cell units, so this is a plausibility check, not an equality |
| C6 | Burned area relationship is stable | Annual H divided by annual ESA Fire_cci burned area; ln of [median over 2013 to 2019] over [median over 2003 to 2011] | Absolute value at most **0.25** | Gated for Córdoba only. Reported, not gated, for Punjab, where Fire_cci misses small crop fires. "Not run" if the data is not obtained |
| C7 | Punjab peak moves later after 2009 | Activity-weighted median day of year of October to November burning, per year; mean over 2010 to 2019 minus mean over 2003 to 2008 | Shift of at least **+5 days**, Mann-Whitney p below 0.05 | Published: about 24 October to about 4 November. VERIFY. This is a hypothesis about the world; a fail is a finding |
| C8 | Curve is stable under resampling | Bootstrap (block by month, 500 draws) 90 percent range of the midpoint | Range width at most **50 percent** of the midpoint | Otherwise the curve is too uncertain to ship |

## Shipping rule

- Ship the observation-aware curve if C0, C1, C1b, C2, C3 and C8 pass.
- Otherwise ship the hard-floor version if it passes C0 to C3.
- Otherwise ship the fallback ratio method and say so.
- C4 to C7 are reported whatever they show. A failed check is displayed as
  failed in the app's method panel and on the project page.

## What these checks cannot show

- That the absolute number of fires is right. Every check is about consistency
  between sensors and over time.
- Anything about fires hidden by cloud or smoke for all sensors.
- Anything outside the processed regions.
- That the record is consistent with Terra's morning overpass.
