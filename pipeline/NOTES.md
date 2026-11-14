# Pipeline notes

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

A running log of every filter, threshold and finding, with the reason. Numbers
here are copied from script output, never typed from memory.

## Where things are

- Raw and intermediate data live outside git. Set `FIRE_DATA` to that folder
  (it must contain `raw/` and will get `work/`). On Mahabu's laptop:
  `C:/Users/hp/fire-census-data`. The Python environment is in `venv/` there,
  because building it inside a very long folder path failed on Windows.
- Raw input: eight FIRMS archive requests (ids 845406 to 845413), whole of India
  and Argentina, requested 13 Nov 2026 17:24 UTC, delivered within hours.
  Each zip holds `fire_archive_*.csv` (standard quality) and `fire_nrt_*.csv`.

## Inventory of the raw files (14 Nov 2026, before any cleaning)

| File | Rows | Dates | satellite | instrument | version | confidence | type | scan | track | frp |
|---|---|---|---|---|---|---|---|---|---|---|
| india fire_archive_J1V-C2_845407.csv | 5,109,832 | 2018-04-01 to 2026-07-31 | N20:5109832 | VIIRS:5109832 | 2:5109832 | n:4091364, l:884730, h:133738 | 0:4502607, 2:596620, 3:10549, 1:56 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 3.6, p99 48, max 2161 |
| india fire_nrt_J1V-C2_845407.csv | 39,863 | 2026-08-01 to 2026-11-05 | N20:39863 | VIIRS:39863 | 2.0NRT:39863 | n:34976, l:4656, h:231 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.1, med 2.5, p99 20, max 250 |
| argentina fire_archive_J1V-C2_845411.csv | 1,780,438 | 2018-04-01 to 2026-07-31 | N20:1780438 | VIIRS:1780438 | 2:1780438 | n:1492702, l:163401, h:124335 | 0:1720614, 2:53477, 3:6347 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 5.5, p99 133, max 1656 |
| argentina fire_nrt_J1V-C2_845411.csv | 39,899 | 2026-08-01 to 2026-11-05 | N20:39899 | VIIRS:39899 | 2.0NRT:39899 | n:34650, l:2879, h:2370 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.0, med 5.0, p99 137, max 1712 |
| india fire_archive_J2V-C2_845408.csv | 2,135,511 | 2023-03-01 to 2026-07-31 | N21:2135511 | VIIRS:2135511 | 2:2135511 | n:1672808, l:395634, h:67069 | 0:1871835, 2:259859, 3:3790, 1:27 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 4.3, p99 55, max 1334 |
| india fire_nrt_J2V-C2_845408.csv | 34,760 | 2026-08-01 to 2026-11-05 | N21:34760 | VIIRS:34760 | 2.0NRT:34760 | n:31064, l:3494, h:202 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.1, med 2.9, p99 18, max 139 |
| argentina fire_archive_J2V-C2_845412.csv | 495,292 | 2023-03-01 to 2026-07-31 | N21:495292 | VIIRS:495292 | 2:495292 | n:415244, l:45600, h:34448 | 0:469527, 2:24533, 3:1232 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 6.0, p99 158, max 2236 |
| argentina fire_nrt_J2V-C2_845412.csv | 38,257 | 2026-08-01 to 2026-11-05 | N21:38257 | VIIRS:38257 | 2.0NRT:38257 | n:32687, l:2823, h:2747 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.0, med 5.9, p99 165, max 673 |
| india fire_archive_M-C61_845406.csv | 1,917,344 | 2000-11-01 to 2026-08-31 | Aqua:1322914, Terra:594430 | MODIS:1917344 | 6.03:1600841, 61.03:316503 | <30:79811, 30-79:1471636, >=80:365897 | 0:1819804, 2:95601, 3:1914, 1:25 | 1.00-4.80 | 1.00-2.00 | min 0.0, med 13.8, p99 287, max 11212 |
| india fire_nrt_M-C61_845406.csv | 5,955 | 2026-09-01 to 2026-11-05 | Aqua:4071, Terra:1884 | MODIS:5955 | 6.1NRT:5955 | <30:277, 30-79:5136, >=80:542 | no type column | 1.00-4.82 | 1.00-2.00 | min 0.0, med 8.9, p99 59, max 213 |
| argentina fire_archive_M-C61_845410.csv | 1,726,328 | 2000-11-01 to 2026-08-31 | Aqua:1073297, Terra:653031 | MODIS:1726328 | 6.03:1566712, 61.03:159616 | <30:82677, 30-79:1117125, >=80:526526 | 0:1648967, 2:77244, 3:92, 1:25 | 1.00-4.80 | 1.00-2.00 | min 0.0, med 20.5, p99 596, max 13294 |
| argentina fire_nrt_M-C61_845410.csv | 9,229 | 2026-09-01 to 2026-11-05 | Aqua:6719, Terra:2510 | MODIS:9229 | 6.1NRT:9229 | <30:375, 30-79:6317, >=80:2537 | no type column | 1.00-4.82 | 1.00-2.00 | min 2.5, med 15.0, p99 326, max 2571 |
| india fire_archive_SV-C2_845409.csv | 8,726,813 | 2012-01-20 to 2026-07-31 | SNPP:8726813 | SNPP:8726813 | 2:8726813 | n:6957355, l:1513266, h:256192 | 0:7782376, 2:924256, 3:20090, 1:91 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 3.7, p99 51, max 1553 |
| india fire_nrt_SV-C2_845409.csv | 31,579 | 2026-08-01 to 2026-11-02 | SNPP:31579 | SNPP:31579 | 2.0NRT:31579 | n:28475, l:2957, h:147 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.1, med 2.3, p99 15, max 117 |
| argentina fire_archive_SV-C2_845413.csv | 2,936,368 | 2012-01-20 to 2026-07-31 | SNPP:2936368 | SNPP:2936368 | 2:2936368 | n:2449992, l:255344, h:231032 | 0:2843178, 2:84887, 3:8303 | 0.32-0.80 | 0.36-0.78 | min 0.0, med 5.5, p99 131, max 2066 |
| argentina fire_nrt_SV-C2_845413.csv | 41,674 | 2026-08-01 to 2026-11-02 | SNPP:41674 | SNPP:41674 | 2.0NRT:41674 | n:35949, l:2920, h:2805 | no type column | 0.32-0.80 | 0.36-0.78 | min 0.0, med 5.1, p99 127, max 968 |

## Where the data differs from what the documents said

| Document said | Data shows | Action |
|---|---|---|
| VIIRS satellite codes are `N`, `N20`, `N21` | Archive files use `SNPP`, `N20`, `N21`; MODIS uses `Terra`, `Aqua` | `clean.py` accepts both spellings and fails on any unknown code |
| Roughly the latest 5 months are near-real-time | NRT starts 1 Aug 2026 for VIIRS and 1 Sep 2026 for MODIS (about 2 to 3 months) | Split on the file, confirmed by the `version` suffix |
| VIIRS is Collection 1 in the attribute page | Files are Collection 2 (`version` = 2, NRT = `2.0NRT`) | Cite Collection 2 |
| `type` only for MODIS standard data | Standard VIIRS files also carry `type` | Use it for both |
| VIIRS column `bright_ti4` | The column is named `brightness` | Not used by the pipeline |
| MODIS `version` | Two values in standard data: `6.03` and `61.03` | Both are Collection 6.1 standard; kept |

Other observations: MODIS `scan` runs 1.0 to 4.8 km and `track` 1.0 to 2.0 km;
VIIRS `scan` 0.32 to 0.80 km. Median FRP per detection is about 14 to 20 MW
for MODIS and 4 to 6 MW for VIIRS, consistent with VIIRS seeing weaker fires.

## Cleaning (`clean.py`), rows removed by each step

| Area | Rows in box | Exact duplicates | Non-vegetation (standard) | NRT in static cells | Low confidence | Rows kept |
|---|---|---|---|---|---|---|
| Córdoba | 348,248 | 0 | 8,615 | 87 | 23,193 | 316,353 |
| Punjab and Haryana | 2,772,484 | 0 | 30,299 | 871 | 317,752 | 2,423,562 |
| Chilecito | 26,304 | 0 | 95 | 0 | 1,780 | 24,429 |

- Static mask for NRT rows: 0.01 degree cells with at least 3 non-vegetation
  detections in the standard data (491 cells in Córdoba, 908 in Punjab and
  Haryana, 6 in Chilecito). The threshold of 3 is a judgement call.
- Low confidence: MODIS below 30, VIIRS `l` (decision 8). A copy keeping
  low-confidence rows is saved as `<area>_with_low_conf.parquet` for the
  sensitivity check.
- Dates are UTC. Monthly totals use the UTC date; a night overpass in India
  falls on the previous UTC date relative to local time. Not corrected.
- 12 data tests pass (`pipeline/tests/test_clean.py`).

## First look at the raw record (level L0, `raw_jump.py`)

Mean detections per year, 2009 to 2011 against 2013 to 2015:

| Area | All sensors added (naive) | MODIS only |
|---|---|---|
| Córdoba | 3,602 to 10,165 (x2.82) | x0.57 |
| Punjab and Haryana | 20,162 to 116,127 (x5.76) | x0.99 |
| Chilecito | 89 to 271 (x3.04) | x0.56 |

The naive record rises about threefold to sixfold across 2012 while MODIS
alone is flat or falling. In Córdoba the naive record points the wrong way.
These are descriptive numbers, not the pre-registered check C0.

## The July 2026 Chilecito fire (decision 26)

Confirmed in the data. Detections in the Chilecito box by day, all sensors:
27 Jul 37, 28 Jul 382, 29 Jul 170, 30 Jul 148, 31 Jul 190, 1 Aug 43, centred
near 29.1 to 29.2 S, 67.7 W. NOAA-20 detections in July, by year: 2018 25,
2019 16, 2020 64, 2021 62, 2022 33, 2023 30, 2024 22, 2025 25, **2026 373**.
News reports gave a start of about 27 July; the data agrees.

## First export (`export.py`)

`cube.json` sizes at 0.1 degree: Córdoba 6.15 MB, Punjab and Haryana 15.27 MB,
Chilecito 0.32 MB. Level L0: `harm` is a placeholder equal to raw MODIS counts.
