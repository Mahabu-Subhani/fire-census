<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# Pipeline: from NASA FIRMS files to the app's data

Owner: Mahabu (Person A). Turns the FIRMS archive files into the harmonized
record, runs the pre-registered checks, and writes every file the app reads.
Method and results: `NOTES.md` (Phase 1), `NOTES_PHASE2.md`, `NOTES_PHASE3.md`,
and `submission/results.md`.

## What you need

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
| 1. Inventory of raw files | `$PY inventory.py` | prints a table (copied into NOTES.md) | 1 min |
| 2. Clean, cut out the three areas | `$PY clean.py` | `$FIRE_DATA/work/<area>.parquet`, `clean_report.json` | 30 s |
| 3. Raw record figures | `$PY raw_jump.py` | `submission/figures/raw_jump_<area>.png` | 20 s |
| 4. Harmonize (fire cells, detection curve, floor, ratio) | `$PY harmonize.py` | `work/<area>_{cells,weights,series,daily}.parquet`, `curves.json` | 30 s |
| 5. Pre-registered checks | `$PY validate.py` | `work/checks.json` | 10 s |
| 6. Sensitivity and orbit drift | `$PY sensitivity.py` | `work/sensitivity.json`, copies in `$FIRE_DATA-sens/` | 4 min |
| 7. Reviewer objections, C5, drift figure | `$PY evidence.py` | `work/evidence.json`, `figures/orbit_drift.png` | 30 s |
| 8. Daily fire masks (optional) | `$PY obs.py download` then `$PY obs.py process` | `$FIRE_DATA/modis/MYD14A1/`, `work/obs_<area>.parquet` | about 3 h download, 20 min process |
| 9. App data | `$PY export.py` | `app/public/data/regions.json`, `<area>/cube.json`, `<area>/meta.json` | 1 min |
| 10. Figures | `$PY figures.py` | `submission/figures/*.png` | 20 s |
| 11. Hotspot files | `$PY hotspots.py` | `app/public/data/<area>/hotspots/<year>.csv.gz` | 2 min |

Tests, from the repository root:

```bash
$FIRE_DATA/venv/Scripts/python -m pytest pipeline/tests -q
```

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
| `harmonize.py` | Fire cells; matches every S-NPP fire cell to Aqua; fits the detection curve with a month-block bootstrap; builds the constant-ratio, hard-floor and curve series |
| `validate.py` | Checks C0 to C4, C3r, C7, C8 exactly as `docs/PREREGISTRATION.md` defines them; the shipping rule |
| `sensitivity.py` | Reruns steps 4 and 5 with one setting changed at a time; Aqua against the record before and after its orbit drift |
| `evidence.py` | Tests of reviewer objections; check C5 against the published detection limits; the drift figure |
| `obs.py` | Clear-view days per cell and month from Aqua's daily fire masks |
| `export.py` | The app's data files in the contract shape (`docs/ARCHITECTURE.md`) |
| `figures.py` | Figures for the method panel and the project page |
| `hotspots.py` | Per-year hotspot files: original FIRMS columns plus `harm_class`, `harm_reason`, `detect_prob` |
| `shipping.json` | Which model ships in each area, and why |
| `obs_probe.py` | One-off: sizes of the fire-mask files before downloading |

## Known limits

See `submission/limits.md`. In short: Punjab's curve is uncertain (check C8);
Chilecito borrows Córdoba's calibration; one month is noisier than one year;
dates are UTC; the last three months are provisional.
