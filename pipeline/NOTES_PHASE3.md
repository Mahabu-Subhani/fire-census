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

## Still open

- `obs` from Aqua's daily fire masks: the first search was capped and the India
  tiles stopped in mid-2019; re-downloading in four-year search windows.
- C6 (ESA burned area): not run.
