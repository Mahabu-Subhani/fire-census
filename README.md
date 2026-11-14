<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending). -->

# Fire Census

**One fire record, whichever satellite was watching.**

NASA Space Apps Challenge 2026, challenge *Harmonization of MODIS and VIIRS Hot Spots*.
Team Sharmaji Ka Satellite, Bangalore.

**Live app: https://mahabu-subhani.github.io/fire-census/**

![Córdoba: the raw record against the harmonized record](submission/figures/harmonized_cordoba.png)

## The problem

NASA satellites have recorded fires since 2000. In 2012 a sharper sensor,
VIIRS, joined the older MODIS, and the raw hotspot count jumps about fivefold
overnight. The jump is the camera, not the fire, so 2005 and 2025 cannot be
compared.

## What Fire Census does

It rebuilds the NASA FIRMS record into one burning calendar in which every
year means the same thing, and shows it in a web app that needs no account.

- **Burning calendar**: every month from 2000 to today, one row per year.
- **Is this month unusual?** The current month ranked against the same days in every earlier year.
- **Area and dates**: draw a rectangle or polygon, type coordinates, or search a district; pick any date range.
- **Raw or harmonized**: one switch shows the 2012 jump appear and disappear.
- **Downloads**: every chart as CSV, PNG and SVG, and the hotspots behind a search as CSV.

Four regions are processed: Córdoba and Chilecito (Argentina), Punjab and
Haryana, and south Karnataka's forests (India). Selection works inside these
regions, not worldwide.

## How it works

1. **Count each place once.** One fire fills several VIIRS pixels, so
   detections are counted per 1 km grid square per satellite pass.
2. **Weight by what MODIS could see.** Where Aqua MODIS and VIIRS passed on the
   same day, we measured how often MODIS also reported a fire VIIRS saw, at
   each fire strength. Each VIIRS detection is then counted by its chance of
   being seen by MODIS.

| Step at 2012 (1.0 = no jump) | Córdoba | Punjab and Haryana |
|---|---|---|
| Raw record | about 5.2× | about 5.3× |
| After harmonization | 1.05× | 0.98× |

## How we tested it, including what failed

Ten checks and their limits were written down before the data was analysed
([docs/PREREGISTRATION.md](docs/PREREGISTRATION.md)). All results are shown in the app.

- **Passed in Córdoba:** no step at 2012, NOAA-20 (never used for fitting)
  reproduces the record (slope 0.951, correlation 0.987), the curve is stable
  when resampled.
- **Caveat on the 2012 check:** the fitted constant overlaps the test window.
  Refitted without those years (check C1x, added afterwards and labelled so:
  fitted on 2015 to 2021, tested on 2012 to 2015) the step is 0.087 against a
  limit of 0.10, a pass, while a plain conversion ratio fails the same test
  (0.143). On a shorter fit, 2016 to 2017 only, the curve is just over (0.106).
- **Failed:** the month-by-month held-out check (0.207 against 0.15). A plain
  conversion ratio passes this one (0.120), so under the rule as first written
  the ratio would ship. We added a two-year-total check afterwards, ship the
  curve under it, and report both verdicts.
- **Failed:** the comparison with ESA burned area in Córdoba. Aqua alone fails
  it the same way.
- **Weaker regions:** Punjab's curve was too unstable to ship, so a simpler
  threshold is used there; it fails the same month-by-month check (0.169) and
  passes the two-year one. Chilecito and Karnataka fail several checks and are
  labelled in the app.

Full limits: [submission/limits.md](submission/limits.md).

## Run it

App (Node 20 or newer):

```bash
cd app && npm install && npm run dev
```

Tests: `npm test` in `app/`.

**Check our numbers yourself, from this repository alone.** Every detection we
used ships with the app, so the method can be rerun with no NASA account and
no download (Python 3.11 or newer, about 15 minutes):

```bash
pip install duckdb pandas pyarrow numpy scipy scikit-learn pytest
```

```bash
cd pipeline && python from_hotspots.py && python harmonize.py && python validate.py && python loyo.py
```

`validate.py` prints every check for every method; they match the Checks panel
in the app. Rebuilding from the original FIRMS archive files, and the tests:
[pipeline/README.md](pipeline/README.md).

## Team

| Person | Role |
|---|---|
| Mahabu Subhani | Data, science, technical writing |
| 8crsk | App foundation, map, controls |
| Charulekha Rajesh | Charts, demo, submission |

## Use of AI

Most of the code and documentation in this repository was written with Claude
(Anthropic), directed and reviewed by the team. Details: [docs/AI_USE.md](docs/AI_USE.md).

## Data and licence

Apache 2.0. We acknowledge the use of data from NASA's Fire Information for
Resource Management System (FIRMS), part of NASA LANCE. Also used: MYD14A1
(NASA LP DAAC), ESA Fire_cci v5.1, ESA WorldCover 2021. Full references:
[docs/REFERENCES.md](docs/REFERENCES.md).
