<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# Pipeline: from NASA FIRMS files to the app's data

Owner: Mahabu (Person A). Turns the FIRMS archive files into the harmonized
record, runs the pre-registered checks, and writes every file the app reads.
Method and results: `NOTES.md` (Phase 1), `NOTES_PHASE2.md`, `NOTES_PHASE3.md`,
and `submission/results.md`.

## The short way: rebuild from the files in this repository

The app ships every detection inside each area, with the reason any of them
was left out (`app/public/data/<area>/hotspots/`). `from_hotspots.py` turns
those files back into the cleaned tables, so steps 4 to 7, 8e, 9 and 10 below
run with no NASA request, no account and no download:

```bash
cd pipeline
python from_hotspots.py     # work/<area>.parquet and <area>_with_low_conf.parquet, 1 min
python harmonize.py && python validate.py && python loyo.py
python sensitivity.py && python evidence.py && python export.py && python stretch.py && python figures.py
```

Without `FIRE_DATA` set, the work files go to `data/` in the repository
(git-ignored). What this route cannot recompute is carried over unchanged from
the files already in `app/public/data/`: clear-view days (`obs`) and the
burned-area checks C6 and C6m. Run on 14 November from a fresh clone: every
check value of every method in all four areas matched the published
`meta.json`, and the Punjab, Chilecito and Karnataka cubes matched byte for
byte (Córdoba: the one cell-month described under "Reproduction test").

## What you need (the full way, from the FIRMS archive)

- Python 3.11 or newer (developed on 3.14, Windows 11).
- About 4 GB of free disk for raw and intermediate data, plus about 4 GB if you
  also fetch the daily fire masks (`obs.py`).
- The eight FIRMS archive zip files (requests 845406 to 845413: whole of India
  and of Argentina; MODIS C6.1, VIIRS S-NPP, NOAA-20, NOAA-21; 1 Nov 2000 to
  5 Nov 2026). Request your own from https://firms.modaps.eosdis.nasa.gov/download/
  if you do not have them.
- For `obs.py` only: a free Earthdata login and token, saved in the repo's
  `.env` by `python scripts/setup_keys.py`. Never commit `.env`.

## Set up once

Data lives outside git. Choose a folder with a short path and point
`FIRE_DATA` at it (Git Bash shown; in PowerShell use `$env:FIRE_DATA = "..."`).

```bash
export FIRE_DATA=C:/Users/you/fire-census-data
python -m venv $FIRE_DATA/venv
$FIRE_DATA/venv/Scripts/python -m pip install -r pipeline/requirements.txt
```

Unzip each FIRMS zip into its own folder under `$FIRE_DATA/raw/`, keeping the
zip's name, for example `$FIRE_DATA/raw/DL_FIRE_M-C61_845406/`.

Building the environment inside a very long folder path failed on Windows;
keep `FIRE_DATA` short.

## Run, in order

Run each script from the `pipeline/` folder with `PY=$FIRE_DATA/venv/Scripts/python`.
Times are from a 32 GB Windows laptop.

| Step | Command | Writes | Time |
|---|---|---|---|
| 0. Bring data up to date (before submitting) | `$PY refresh.py` | `$FIRE_DATA/raw/NRTAPI_<country>_<sensor>_<source>/` from the FIRMS area API, from the day after the last date held to yesterday; needs `FIRMS_MAP_KEY` in `.env` | 1 min |
| 1. Inventory of raw files | `$PY inventory.py` | prints a table (copied into NOTES.md) | 1 min |
| 1b. Exact outlines (Punjab and Haryana) | `$PY make_areas.py` | `pipeline/areas/<area>.json` (in git) | 5 s |
| 2. Clean, cut out the areas (and clip to an outline) | `$PY clean.py` | `$FIRE_DATA/work/<area>.parquet`, `clean_report.json` | 30 s |
| 3. Raw record figures | `$PY raw_jump.py` | `submission/figures/raw_jump_<area>.png` | 20 s |
| 4. Harmonize (fire cells, detection curve, floor, ratio) | `$PY harmonize.py` | `work/<area>_{cells,weights,series}.parquet`, `curves.json` | 30 s |
| 5. Pre-registered checks | `$PY validate.py` | `work/checks.json` | 10 s |
| 6. Sensitivity and orbit drift | `$PY sensitivity.py` | `work/sensitivity.json`, copies in `$FIRE_DATA-sens/` | 4 min |
| 7. Reviewer objections, C5, drift figure | `$PY evidence.py` | `work/evidence.json`, `figures/orbit_drift.png` | 30 s |
| 8. Daily fire masks (optional) | `$PY obs.py download` then `$PY obs.py process` | `$FIRE_DATA/modis/MYD14A1/`, `work/obs_<area>.parquet` | about 3 h download, 20 min process |
| 8b. ESA burned area, check C6 | `$PY firecci.py` | `work/firecci_monthly.parquet`, `work/c6.json` | 10 min (network) |
| 8b2. NASA burned area, check C6m | `$PY mcd64.py` | `work/mcd64_monthly.parquet`, `work/c6m.json` | 5 min (network) |
| 8c. Land cover at fire cells | `$PY landcover.py` | `work/landcover.json` | 7 min (network) |
| 8d. Stretch analyses | `$PY stretch.py` (after step 9) | `app/public/data/<area>/{season,drift,episodes}.json`, season figures | 1 min |
| 8e. Out-of-sample checks | `$PY loyo.py` (after step 4) | `work/loyo.json`: check C1x, leave-one-year-out, monthly scatter for the rank range | 3 min |
| 8g. Two findings, reproducible (changes nothing) | `$PY findings.py` (after step 9) | `work/findings.json`: the shipped constants against the height of the midday sun; Aqua against the record by season, before and after its orbit drift | 2 s |
| 8f. Year-round against monthly constants | `$PY seasonal.py` (after step 5) | `work/seasonal.json`: for each model the checks under one year-round constant and under a constant per calendar month, and the error by calendar month, read from `checks.json`; see `docs/research/20261115-checks-audit-seasonal-bias.md` | 2 s |
| 9. App data | `$PY export.py` | `app/public/data/regions.json`, `<area>/cube.json`, `<area>/meta.json` | 1 min |
| 10. Figures | `$PY figures.py` | `submission/figures/*.png` | 20 s |
| 11. Hotspot files | `$PY hotspots.py` | `app/public/data/<area>/hotspots/<year>.csv.gz` | 2 min |

Every headline number the documents quote: `$PY key_numbers.py`.

Tests, from the repository root:

```bash
$FIRE_DATA/venv/Scripts/python -m pytest pipeline/tests -q
```

| Test file | Tests | Needs the downloaded data |
|---|---|---|
| `tests/test_clean.py` | The cleaned tables: rows conserved, inside the area, mission dates, pixel sizes | Yes (skipped without it) |
| `tests/test_method.py` | The method on simulated fires with a known answer: the code gets a known detection curve back, the curve record stays within 5 percent when the mix of weak and strong fires changes, one constant ratio is off by more than 30 percent in the same cases; the step statistic, the change-point test and the shipping rule; one test for each error corrected on 14 November (hard-floor constant, daily series for C7, change-point check on too few months) | No |
| `tests/test_docs_numbers.py` | `README.md` and `submission/results.md` quote the values in `app/public/data/<area>/meta.json` | No |
| `tests/test_findings.py` | The sun's height on known answers (overhead at the equator at the equinoxes, summer in opposite months in the two hemispheres); constants read from the shipped files; borrowed constants not reported | No |
| `tests/test_seasonal.py` | The constant per calendar month on known answers: no fires gives the year-round constant, many fires give the ratio of the three-month window, December and January are neighbours, a simulated seasonal bias is removed; the year-round versions are checked with the same code | No |

The last two run in a fresh clone. Simulated fires test the code and the
logic; they are not evidence about real fires and are not a pre-registered check.

Without step 8, `export.py` writes `obs` as null and the app treats it as
unknown. `export.py` reads `pipeline/shipping.json` to decide which model fills
`harm` in each area; change that file only through a recorded decision
(`docs/DECISIONS.md`, decision 30).

## The scripts

| File | Does |
|---|---|
| `config.py` | Paths, the three areas and their boxes, request ids, grid sizes |
| `inventory.py` | Row counts, columns, codes and ranges of every raw file, before cleaning |
| `clean.py` | One schema; satellite names; removes non-vegetation, static-source and low-confidence detections, counting each |
| `raw_jump.py` | The raw record per satellite (the problem) |
| `harmonize.py` | Fire cells; matches every S-NPP fire cell to Aqua; fits the detection curve with a month-block bootstrap; builds the ratio, hard-floor and curve series, each with one constant per calendar month (what ships, decision 57) and with one year-round constant (kept for comparison) |
| `validate.py` | Checks C0 to C4, C3r, C3x, C7, C8 exactly as `docs/PREREGISTRATION.md` defines them, on both kinds of constant; the error by calendar month; the shipping rule |
| `sensitivity.py` | Reruns steps 4 and 5 with one setting changed at a time; Aqua against the record before and after its orbit drift |
| `evidence.py` | Tests of reviewer objections; check C5 against the published detection limits; the drift figure |
| `obs.py` | Clear-view days per cell and month from Aqua's daily fire masks |
| `from_hotspots.py` | Rebuilds the cleaned tables from the hotspot files shipped with the app (the short way above) |
| `export.py` | The app's data files in the contract shape (`docs/ARCHITECTURE.md`); carries over `obs`, C5, C6 and C6m from the published files when their inputs are absent |
| `figures.py` | Figures for the method panel and the project page |
| `hotspots.py` | Per-year hotspot files: original FIRMS columns plus `harm_class`, `harm_reason`, `detect_prob` |
| `shipping.json` | Which model ships in each area, and why |
| `refresh.py` | Near-real-time detections after the archive ends (FIRMS area API, at most 5 days per call; S-NPP not requested since it stopped on 2 Nov 2026) |
| `obs_probe.py` | One-off: sizes of the fire-mask files before downloading |
| `walkthrough.py` | Writes `submission/inbox/A-what-we-show.md`: every screen of the app, every check in plain words and why C6 fails, with every number read from `app/public/data/` |

### The presenter's walkthrough

Rerun after every `export.py`, so the team never quotes a stale number. No
downloaded data and no network needed. Run on 14 November from the repo root:

```bash
python pipeline/walkthrough.py     # wrote submission/inbox/A-what-we-show.md (415 lines)
```

`pipeline/tests/test_walkthrough.py` checks that every check row in the output
matches `meta.json` and that the C6 notes were parsed (no "n/a").

### Recomputing C6 and C6m from a fresh clone (run 15 November)

The short way plus ESA's and NASA's burned area, which need a network but no
account (about 15 minutes; Git Bash, `FIRE_DATA` and the venv as in "Set up
once"; the venv also needs `rasterio pystac-client planetary-computer pyproj`):

```bash
cd pipeline
$PY from_hotspots.py && $PY harmonize.py && $PY validate.py && $PY loyo.py
$PY firecci.py      # fetching 240 months from ESA CCI ... writes work/c6.json
$PY mcd64.py        # 2114 tile-months in the catalogue ... writes work/c6m.json
$PY sensitivity.py && $PY evidence.py && $PY export.py && $PY stretch.py
```

Months or tiles that fail to download are fetched again on the next run.
October to December 2019 are read from ESA's `new-corrected` folder. Run on
15 November: every `cube.json`, season, drift and episode file came out byte
for byte as shipped. Results and fixes in `NOTES_PHASE3.md`, "Check C6
recomputed" and "Second audit of the pipeline".

## Reproduction test (14 November)

A fresh clone of the repository, run from the raw FIRMS files through steps 2,
4, 5, 6, 7 and 9, reproduced every value in all three `meta.json` files and in
the Punjab and Chilecito cubes exactly. In Córdoba 46,154 of 46,155 cell-months
matched; one (September 2024, cell -64.75, -31.95) differed by 0.01 in `harm`
and 0.05 in `small`, most likely because DuckDB sums in parallel, so a fire
cell's total power can land on the other side of a bin edge. No check verdict
changed.

## Known limits

See `submission/limits.md`. In short: Punjab's curve is uncertain (check C8);
Chilecito borrows Córdoba's calibration; one month is noisier than one year;
dates are UTC; the last three months are provisional.
