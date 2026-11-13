# Person A (Mahabu Subhani): data and science

You own `pipeline/` and `data/`, and you write the files in `app/public/data/`.
Everything else in the project depends on your output, so ship something small
early and improve it.

Read first: `AGENTS.md`, `docs/CONTEXT.md`, `docs/APPROACH.md`,
`docs/ARCHITECTURE.md` (the data contract is your output format).

## Before the start (allowed prep only)

- Create a free FIRMS MAP_KEY. Keep it in a `.env` file outside the repo.
- Install Python 3.11+ and Git. Do not install project code yet.
- Read the FIRMS documentation on file formats and the archive download tool.
- With the team: settle the DECIDE items in APPROACH.md (regions, grid,
  confidence filter, tolerances).

## Phase 1: Sat 10:15 to 13:00. Get data, ship a first cube

1. **First 10 minutes:** submit FIRMS archive requests for both regions, all
   sensors (MODIS, VIIRS S-NPP, NOAA-20, NOAA-21), full date range. While
   waiting, pull the per-country yearly files for the same countries.
2. Set up `pipeline/` with a `requirements.txt` and a `.gitignore` that ignores
   `data/` and `.env`.
3. Write `pipeline/clean.py`: one schema for all sensors, UTC timestamps, a
   `sensor` and `satellite` column, unified confidence class, region id. Assert
   row counts in equal row counts out, minus stated filters.
4. Write `pipeline/export.py` producing `regions.json` and a **L0-only**
   `cube.json` (raw counts; set `harm` equal to `raw_modis` for now) in the
   contract shape.
5. Hand the L0 cube to Person B.

**Checkpoint 13:00:** real L0 cube for at least one region is in
`app/public/data/` and loads in Person B's app.

## Phase 2: Sat 14:30 to 19:30. Harmonize and test

1. `pipeline/harmonize.py`: build L1 fire cells (APPROACH.md definitions).
2. Fit the L2 common floor on Aqua versus S-NPP, day and night separately.
3. Build L3 only if L2 leaves a visible swath-edge effect and time allows.
4. `pipeline/validate.py`: run T1, T2, T5 and the T6 ladder table. Write results
   into `meta.json`. Save one plot per test into `submission/figures/`.
5. Re-export the cube with real `harm` and `small` values.

**Checkpoint 19:30, go or no-go:** tell the team, with numbers, whether T1 and
T2 pass and at which level. If neither L2 nor L3 passes, switch to the fallback
in APPROACH.md tonight. Do not keep tuning past this point.

## Phase 3: Sat night to Sun 12:30. Evidence and robustness

1. T3 (held-out years) and T4 (second region without refitting).
2. A range for `harm` (`harm_lo`, `harm_hi`), by bootstrap over calibration months.
3. Twin-satellite evidence (S-NPP versus NOAA-20 miss rate against pixel area),
   as one figure, if time allows.
4. Per-year hotspot CSV files for the download feature (stretch goal).
5. Give Person C the final numbers, the ladder table and the figures, with one
   plain sentence explaining each.

**Checkpoint Sun 12:30:** final data files committed; `meta.json` complete.

## Phase 4: Sun 13:30 to 16:00. Verify

- Check every number on the project page and in the demo against `meta.json`.
- Write `pipeline/README.md`: how to reproduce the data from scratch.
- No new analysis after 13:30. Fixes only.

## Rules for your work

- Never edit a number by hand. If a test fails, record it as failed.
- Keep a short log in `pipeline/NOTES.md` of every filter and threshold and why.
- Add every data source and library to `docs/REFERENCES.md`.

## Prompt to give your AI assistant at the start

> You are helping Person A on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/APPROACH.md`,
> `docs/ARCHITECTURE.md` and `docs/tasks/PERSON_A_DATA.md`. The hackathon has
> started. Begin Phase 1, step 2. Before writing code, list the facts marked
> VERIFY that affect the pipeline and tell me how you will check each one.
> Work on branch `a/pipeline`. Stop and report at each checkpoint.
