# Pre-registered checks

Written **before any fire data was opened or analysed** (committed 14 November
2026, 00:15 IST; the data files were still zipped). *Corrected on 15 November:
this said "about 00:30 IST"; the commit is dated 00:15:11 (`git log`, commit
64ef07e).* The thresholds below
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

---

## Notes added after results

### 14 November 2026: check C3 (drafted by the AI assistant; awaiting Mahabu's decision)

*Time corrected on 15 November. The heading said "about 12:30 IST"; that was an estimate and it was wrong. This note was first committed at 11:08 IST and the decision at its end at 11:13 IST (`git log -S`, commits 87fcb84 and de7b52c).*

The thresholds above are unchanged. This note records what was found and
proposes a revised reading, as the first paragraph of this file requires.

**Original verdict stands as recorded.** C3 fails for the detection curve and
the hard floor in both calibration areas (Córdoba 0.207 and 0.284; Punjab and
Haryana 0.267 and 0.291; threshold 0.15).

**Why the threshold looks badly chosen.** C3 is a monthly scatter statistic.
Inside the calibration years it is already 0.178 (Córdoba) and 0.231 (Punjab)
for the detection curve, and between two identical VIIRS sensors it is 0.07 to
0.10. A threshold of 0.15 sits between the noise of identical sensors and the
noise of a calibrated pair, so no model could be expected to pass it. Details:
`pipeline/NOTES_PHASE2.md`, "Why C3 failed".

**Proposed revised check C3r,** to be reported beside C3, never instead of it:
aggregate bias over the held-out years, the absolute value of
ln(sum of H_VIIRS / sum of H_Aqua) over 2018 to 2019, at most 0.10. This
measures what C3 was meant to: whether the harmonized record drifts from the
reference outside the calibration years. Values: Córdoba detection curve 0.072,
hard floor 0.071, constant ratio 0.064; Punjab and Haryana 0.034, 0.022, 0.031.
All would pass, so the revision does not favour one model over another.

**What it would change.** Under C3r the shipping rule gives the detection curve
for Córdoba (and Chilecito, which borrows it) and the hard floor for Punjab and
Haryana, where the curve still fails C8. Under the original C3 the constant
ratio ships everywhere.

**Decision, 14 November 2026:** Mahabu adopted C3r (DECISIONS.md, decision 30).
`pipeline/shipping.json` now follows the revised rule. The app's Checks panel
and `meta.json` show C3 with its fail verdict and C3r beside it, labelled as
added after results.

### 14 November 2026: out-of-sample C1 (check C1x, added after results)

*Time corrected on 15 November. The heading said "about 22:30 IST", an estimate; the note was first committed at 21:48 IST (`git log -S`, commit 73cabed).*

C1 fits its constant on 2012 to 2017 and tests on 2012 to 2015, so part of its
pass is in-sample. Check C1x repeats C1's statistic with the model fitted on
February 2015 to December 2021 only. It does not replace C1 and does not change
what ships. Results (`pipeline/loyo.py`, `WORK/loyo.json`):

| Area | Detection curve | Hard floor | Constant ratio |
|---|---|---|---|
| Córdoba | +0.087 pass | +0.059 pass | +0.143 **fail** |
| Punjab and Haryana | +0.016 pass | +0.024 pass | +0.005 pass |
| Karnataka (case study) | +0.012 pass | +0.011 pass | -0.007 pass |

Leaving one year out at a time over 2012 to 2021, the shipped model is within
0.10 of Aqua in 8 of 10 years in Córdoba (largest miss 0.181, in 2013) and in
8 of 10 in Punjab and Haryana (largest 0.132). Chilecito borrows Córdoba's
model and cannot be tested this way.

### 14 November 2026, about 23:30 IST: correction to results reported above (drafted by the AI assistant; decision 54, made on Mahabu's instruction)

No threshold and no definition is changed. An error in the code was found and
fixed (`pipeline/NOTES_PHASE3.md`, "Corrections after an independent read of
the code"): the hard floor's constant was fitted on a different rule from the
one it was applied with. Values in the notes above that change:

- **C3, hard floor, Punjab and Haryana (the clipped area): 0.169, fail.** It
  had been reported as 0.144, pass, and the shipped method there was said to
  pass every pre-registered check that applies to it. That is withdrawn.
  Under the original C3 the constant ratio ships in both calibrated areas;
  under C3r (decision 30) the detection curve ships in Córdoba and the hard
  floor in Punjab and Haryana, as this file's note of 12:30 already said.
- **C3r, hard floor:** Córdoba -0.077, Punjab and Haryana -0.042. Both pass.
- **C1x table, hard floor column:** Córdoba +0.058 pass, Punjab and Haryana
  +0.023 pass, Karnataka +0.003 pass. Leave-one-year-out for the shipped model
  in Punjab and Haryana: 8 of 10 within 0.10, largest 0.129.
- **C7** is now computed on the shipped model: +8.2 days, p = 0.0009.
- **C1b** is reported as "not run" where fewer months are available than the
  test needs to reach p < 0.05 at all (Chilecito, 4 months).
- **C8** is read on the daytime curve, as before; the check row now states
  that the night curve would be over the limit.

### 15 November 2026: check C6 recomputed (drafted by the AI assistant, at Mahabu's request)

No threshold and no definition is changed. C6 is now computed as defined,
with complete years 2003 to 2011 and 2013 to 2019. ESA's October to December
2019 files had been reprocessed after a processing error and moved to a
`new-corrected` folder on the CEDA archive (ESA's note
`Error_in_November_2019_files.txt` in the 2019 folder); `firecci.py` now
reads them there, so all 240 months are used.

| Area | C6 | Verdict | Aqua alone | Before |
|---|---|---|---|---|
| Córdoba (gated) | -0.440 | fail | -0.427 | -0.440 |
| Punjab and Haryana | -0.149 | pass | -0.125 | -0.104 (before the hard-floor correction) |
| Chilecito | +0.430 | fail | +0.157 | +0.430 |
| Karnataka | +0.276 | fail | +0.340 | +0.276 |

The Córdoba verdict is unchanged: fail, reported as failed.

### 15 November 2026: C6m recomputed; PELT not run (drafted by the AI assistant, at Mahabu's request)

No threshold and no definition is changed.

- C6m (added after results, not pre-registered) recomputed on the corrected
  record: Punjab and Haryana -0.081 (was -0.036), pass. Other areas unchanged.
- **The PELT second opinion listed under C1b was never run.** This file says
  it would be reported, not gated. No penalty was fixed in advance, and
  picking one after the results are known would be a post-hoc choice, so it
  is reported as not run rather than added now. C1b's verdict rests on the
  Pettitt test alone, as the table says.

### 15 November 2026: what C3's failure was, and one constant per calendar month (drafted by the AI assistant; decision 57, chosen by Mahabu)

*Time corrected on 15 November. The heading first said "about 02:00 IST", an estimate; the note was written at 01:05 IST (the file's time, read with `ls -l` before this correction).*

No threshold and no definition above is changed. The method changed, and
every check was run again with the same code and limits.

**What was found.** C3's failure was not noise and not a badly chosen limit.
Split by calendar month, ln(H / R) is the same in the fitting years and in
2018 to 2019: with the hard floor in Punjab and Haryana, May +0.56 and +0.43,
October -0.22 and -0.24, January -0.48 and -0.49; with the detection curve in
Córdoba, January +0.16 and +0.15, July -0.19 and -0.19. One year-round
constant leaves a seasonal bias. Counting noise alone would give C3 about
0.07 in Córdoba and 0.03 in Punjab and Haryana (4,000 Poisson draws on the
held-out months). **The sentence in the first note of 14 November, that no
model could be expected to pass C3, is withdrawn.** C3r, a two-year total,
cannot see a seasonal bias; it stays reported beside C3 and decides nothing.

**What changed.** Each model's daytime constant is fitted per calendar month
on the same fitting years (`harmonize.seasonal_constants`; decision 57). The
settings and three predictions were written in the same step as the one run, seconds before its first result (files saved at 00:50:03 and 00:50:09 IST);
see `docs/research/20261115-checks-audit-seasonal-bias.md`. Nothing was tuned
afterwards.

**Results, shipped models** (year-round constant in brackets):

| Check | Córdoba, hard floor | Punjab and Haryana, hard floor |
|---|---|---|
| C1 | +0.077 pass (curve, year-round: +0.049) | -0.020 pass (-0.016) |
| C1b | pass by the rule; strongest change point October 2013, p below 0.001, outside the window | pass; November 2014, p = 0.43 |
| C2 (2016) | -0.094 pass | -0.059 pass |
| C3 | **0.117 pass** (curve, year-round: 0.207 fail; hard floor, year-round: 0.292 fail) | **0.148 pass** (0.169 fail) |
| C3r | -0.068 pass | -0.081 pass |
| C4 | slope 0.938, correlation 0.977, pass | slope 1.026, correlation 0.989, pass |
| C1x (added after results) | +0.072 pass | +0.024 pass |
| C3x (added now: C3's statistic and limit on 2020 to 2021) | 0.124 pass | **0.169 fail** |

**The shipping rule, as first written, now decides without C3r.** Córdoba:
the detection curve passes C3 (0.072) but fails C2 (-0.114 against 0.10), so
the rule moves to the hard floor, which passes C0 to C3. Punjab and Haryana:
the curve fails C3 (0.208) and C8; the hard floor passes C0 to C3. Chilecito
borrows Córdoba's model. Karnataka: no model passes C3; the ratio fallback
ships.

**What did not hold.** Of the three predictions: C3
passes in both calibrated areas (held; Punjab and Haryana only just). The
same statistic on 2020 to 2021 is within the limit in both (held in Córdoba,
**failed in Punjab and Haryana**, 0.169). The other checks keep their pass
(held for the hard floor; **failed for Córdoba's curve**, C2). In Córdoba the
hard floor is worse than the curve year by year: leaving one year out at a
time, 3 of 10 years are within 0.10 of Aqua (largest miss 0.233, in 2013),
against 9 of 10 for the curve. The rule chooses on the registered checks, so
the hard floor ships; yearly totals and trends in Córdoba after 2012 carry
this error, and `submission/results.md` and `limits.md` say so. The passes
are thin and not robust: Córdoba C2 is -0.094 against 0.10; Punjab and
Haryana C3 is 0.148 against 0.15 on 15 of 24 months; under five other
settings C3 fails in three (Córdoba) and in all five (Punjab and Haryana). A known weakness of the
fixed settings: pooling three months is too coarse for Punjab and Haryana's
April, which takes mostly May's constant.

**Honesty note.** The seasonal pattern was seen in the 2018 to 2019 results
before the model was changed, so C3's pass is no longer a clean held-out
result. C3x on 2020 to 2021 is cleaner, and it is why it was added: the
monthly values of those years had not been looked at. Their yearly totals
had been, in the leave-one-year-out table of 14 November.
