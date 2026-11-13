# Decisions

This file settles every item marked DECIDE in the other documents. **Where
another document says DECIDE, the answer here applies.**

Status: these are defaults recommended by the AI assistant on 13 November 2026
and accepted by Mahabu so the team can start without delay. 8crsk and
Charulekha have not yet reviewed them. Any teammate can change one: edit the
row, add your name and the reason, and tell the others. Changes after Saturday
13:00 need all three to agree.

## Project

| # | Decision | Answer | Why |
|---|---|---|---|
| 1 | Name | **Fire Census** | A census counts the same way every time, whoever does the counting. That is the point of the project |
| 2 | Tagline | "One fire record, whichever satellite was watching." | States the outcome in the challenge's own terms: the sensor of origin no longer matters |
| 3 | Demo format | 30-second video, target 28 seconds | The switch from raw to harmonized is a moving image; slides cannot show it |

## Method

| # | Decision | Answer | Why |
|---|---|---|---|
| 4 | Core approach | The ladder in `APPROACH.md`: L0 raw, L1 fire cells, L2 common floor | Each step removes one named cause and is measured separately |
| 5 | Completeness curve (S0) | **Yes**, attempted after L2 has a test result. Ship it only if it does at least as well as L2 on T1 to T5 | Gives a range for free and one explanatory picture; L2 remains the fallback |
| 6 | Internal grid | 0.01 degree | Simple. Both regions are at low to middle latitudes; state the approximation |
| 7 | Overpass key | `satellite + acq_date + daynight` | `acq_time` varies within one pass |
| 8 | Confidence filter | Drop MODIS below 30 and VIIRS "low". Report how results change with the filter off | Matches common practice; the sensitivity check keeps it honest |
| 9 | Agreement tolerance for the floor | Ratio within 10 percent of 1 | A starting point; record the achieved value |
| 10 | Reference pair | Aqua MODIS and S-NPP VIIRS, calibration years 2012 to 2019 | Matched overpass time; ends before Aqua's orbit began to drift |
| 11 | Held-out years (T3) | 2020 to 2021 | After calibration, before the drift becomes large. **VERIFY** drift dates |
| 12 | Comparison labels | Below normal: under 0.5 x median. Near normal: 0.5 to 1.5. Above: 1.5 to 3. Far above: over 3 | Simple and explainable. Shown in the UI. Needs at least 5 earlier years, else "not enough history" |

## Regions

| # | Region | Bounding box (west, south, east, north) | Why |
|---|---|---|---|
| 13 | Punjab and Haryana, India | 73.8, 27.6, 77.6, 32.6 (approximate; **VERIFY**) | Small crop-residue fires, where the two sensors disagree most. Enables the Punjab season-shift check (S1). Meaningful to the Bangalore judges |
| 14 | Córdoba province, Argentina | -65.8, -35.0, -61.7, -29.5 (approximate; **VERIFY**) | Larger wildland fires, a contrasting fire regime for the held-out-region test (T4). Argentina's space agency, credited on the challenge page, has its space centre in Córdoba. **VERIFY** |

Region 13 is built first, end to end. Region 14 starts only after region 13
passes the Saturday 19:30 checkpoint.

## App

| # | Decision | Answer | Why |
|---|---|---|---|
| 15 | Framework | Vite + React + TypeScript | Two people share the app; typed interfaces prevent collisions |
| 16 | Display cell | 0.1 degree | Small files, fast on a phone |
| 17 | Cube format | JSON, gzip-served. Move to Parquet only if a cube exceeds 20 MB | No extra library in the browser |
| 18 | Map | MapLibre GL JS with free OpenStreetMap-based tiles | No key. **VERIFY** the tile provider's terms |
| 19 | Charts | Observable Plot | Quick heat maps and series |
| 20 | Colour ramp | Cividis | Designed for colour-vision deficiency; test in both themes |

## Stretch goals, in order

1. **S0** completeness curve (decision 5).
2. **S1** Punjab season-shift check.
3. **S2** daily self-updating record, only if both above are done by Sunday 09:30.

S3 (estimated small fires before 2012) is not planned.

## Change log

| Date | Who | Change | Reason |
|---|---|---|---|
| 13 Nov 2026 | Mahabu | Accepted the AI-recommended defaults above | To start on time; team to review |
