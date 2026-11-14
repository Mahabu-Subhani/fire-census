<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk (pending). -->
# Draft for the judges' visit: what to say, and what to answer

For whoever presents at the table. The judges score the plan and the path, in
one to two minutes, on five criteria. Every number below is from the pipeline
or the app; re-read it on screen before saying it.

## The 90 seconds

1. **Problem (10 s).** "Satellites have counted fires since 2000, but the
   newer sensor reports several times more hotspots for the same burning. Put
   the two records together and fire seems to explode in 2012. It did not. The
   instrument changed."
2. **Show it (15 s).** Open the app on Córdoba, switch to Raw: the calendar
   jumps at 2012. Switch to Harmonized: the jump is gone.
3. **How (20 s).** "We do not multiply by one learned factor. We remove each
   cause with its own step: count a square kilometre once however many pixels
   fall in it, then keep only the fires both sensors can see. The weak fires
   only VIIRS sees are kept as a separate layer, never mixed in."
4. **Why trust it (20 s).** "We wrote the pass marks before opening the data.
   The app shows every check, including the ones we failed." Point at the
   checks badge.
5. **Who uses it (15 s).** "Pick a district, read one sentence: this month is
   the Nth highest of 25. Then the calendar, the next three months from
   history, and a CSV of every hotspot in the area."
6. **The part nobody else has (10 s).** Open "Do the satellites agree?":
   "Aqua's pass over Punjab has moved from 13:13 to 15:25. A MODIS-only record
   is drifting. Ours does not use it after 2012."

## The five criteria, and our evidence for each

| Criterion | What we show |
|---|---|
| Impact | A fire officer gets an answer for their own district in one sentence, on a phone, with no login. Ten years of MODIS-only history stay usable on today's scale |
| Creativity | The ladder (one step per cause) instead of one ratio; checks fixed in advance and failures displayed; the small-fire layer; the satellite agreement panel |
| Validity | Checks C0 to C8 with thresholds committed before the data was opened; the detection limit we fitted agrees with the published one within a factor of 2; a second satellite (NOAA-20) reproduces the record without refitting |
| Relevance | NASA FIRMS MODIS (MCD14ML, MCD14DL) and VIIRS 375 m from S-NPP, NOAA-20 and NOAA-21: the datasets the challenge names. Every hotspot row is downloadable with its class |
| Presentation | Raw to Harmonized switch as the opening image; one presenter; the app itself is the slide |

## "Three sources say different things." How we tell them apart

Five satellites, two sensor types, different times of day. The app's rules:

| Situation in the real world | What the data looks like | What the app does |
|---|---|---|
| One big fire fills several small VIIRS pixels | Many rows, one fire | Counts a square of about 1 km once per satellite, date and half-day |
| A small crop fire, too weak for MODIS | VIIRS sees it, MODIS does not | Goes to the small-fire layer, not the harmonized count |
| A burn lasting 30 minutes | One VIIRS satellite sees it; the next, 50 minutes later, does not | Shown as "seen by one VIIRS satellite only". In Punjab in 2026 this is 57.7 percent of fire cells |
| Terra passes in the morning, the others after noon | Terra reports less: fires peak in the afternoon | Terra is a separate raw series, never mixed in |
| Aqua's and Terra's orbits are drifting | Aqua passes at 15:25, not 13:13 (Punjab, 2026), and reports more | The record uses VIIRS from 2012; the drift is drawn year by year |
| More satellites fly (one in 2012, three in 2023) | More rows for the same fire | Averaged over the VIIRS satellites present. More satellites never means more fire |
| A steel plant or gas flare | Hot every day, not a fire | Left out, using the FIRMS type field |
| Cloud or smoke covers the area | Zero detections | The app says zero does not prove there was no fire |
| The month is not over | A partial month looks low | Compared with the same days of the month in past years |
| The newest data is preliminary | It may change | Marked near-real-time; the date the data ends is on screen |
| A tiny area with two fires in its history | Ratios jump wildly | "Too little activity to judge" below 5; "not enough history" below 5 years |
| Burning really did change (Punjab fell after 2021) | "Below normal" every year | A switch between all years and the last 10 as the baseline |

## Thresholds, in one table

| Rule | Value | Where it comes from |
|---|---|---|
| No seam at 2012 | Log step at most 0.10 | Pre-registered (C1) |
| Second satellite reproduces the record | Slope 0.90 to 1.10, correlation at least 0.90 | Pre-registered (C4) |
| Minimum sample | 30 fire cells | Pre-registered |
| Below, near, above, far above normal | Under 0.5, 0.5 to 1.5, 1.5 to 3, over 3 times the median | Decision 12 |
| Too little activity to judge | Median and this month both under 5 | Decision 32 |
| Same fire | Same or neighbouring 1 km square, same date, same half-day | The pipeline's matching rule |
| Two VIIRS satellites agree | Log ratio at most 0.25, on at least 30 fire cells each | Decision 38 (new). Identical sensors scatter by 0.07 to 0.10 a month in our data |
| A pass has drifted | Moved more than 30 minutes | Decision 38 (new) |

## Questions a judge may ask

- **"Why not just scale VIIRS down by a factor?"** In Córdoba a constant ratio
  goes wrong as the share of strong fires changes from year to year
  (rank correlation -0.76, p = 0.011). The detection curve does not (0.35,
  p = 0.33). Source: `pipeline/NOTES_PHASE3.md`.
- **"Did anything fail?"** Yes. The held-out-years check C3 fails at its
  original threshold. We publish it as failed, beside a revised check we added
  after the results and labelled as such. Punjab's detection curve was too
  uncertain to ship, so Punjab ships the simpler hard floor.
- **"Is this the true number of fires?"** No. It is a consistent count of what
  both sensors can see. Consistency over time is what a calendar needs.
- **"What happens when MODIS is switched off?"** Nothing changes: the record
  already runs on VIIRS from 2012.
- **"Does it work anywhere?"** For the four processed areas. The pipeline
  is region-independent; adding a region is a FIRMS download and one run.

## Not built (say so if asked)

- No cloud mask: FIRMS point files carry none.
- No automatic alert when one satellite stops reporting; the number of days
  each satellite reported per year is in `sources.json` but not yet on screen.
- Burned-area check C6 is not run.
