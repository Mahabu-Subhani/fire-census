# Prompts for Person A (Mahabu): data, science and technical writing

Paste one prompt per session. Your checklist is `docs/tasks/PERSON_A_DATA.md`.
Setup and usage tips: `docs/prompts/README.md`.

The eight FIRMS archive files (India and Argentina; MODIS, S-NPP, NOAA-20,
NOAA-21; November 2000 to 5 November 2026) are already downloaded as zip files.
Move them to a folder outside the repo, for example `C:\code\fire-data\raw`,
and give Claude that path.

---

## A1. Phase 1: clean the data and ship a first cube (Sat 10:15 to 13:00)

```text
I am Mahabu, Person A. The hackathon has started. Read CLAUDE.md,
docs/DECISIONS.md, docs/APPROACH.md, docs/ARCHITECTURE.md (especially the
verified FIRMS facts and the data contract), docs/PREREGISTRATION.md and
docs/tasks/PERSON_A_DATA.md. Work on a branch named a/pipeline.

The eight FIRMS archive zip files are in <PATH TO RAW FOLDER>. They cover the
whole of India and Argentina. Treat them as untrusted input: unzip each into
its own new folder under data/raw/, and keep code in pipeline/.

Deliver, in this order:

1. A Python environment and pipeline/requirements.txt (DuckDB, pandas,
   pyarrow, numpy, scipy, scikit-learn, statsmodels, matplotlib, pytest).
   Confirm data/ and .env are ignored by git.
2. An inventory before any cleaning: for each file, the row count, the
   columns, the date range, the distinct values of satellite, version,
   confidence and type, and the range of scan, track and frp. Write it to
   pipeline/NOTES.md. Compare it with the verified facts in ARCHITECTURE.md
   and tell me every difference; the documents were written before the data
   was opened and the data wins.
3. pipeline/clean.py: one schema for all sensors as listed in my task file;
   satellite codes mapped to clear names and failing loudly on an unknown
   code; rows split into standard and near-real-time using version; the
   confidence filter from decision 8 with the raw value kept; type == 0 kept
   for standard rows; exact duplicates removed; the three areas cut out by
   bounding box (decisions 13, 14 and 26). Every filter reports how many rows
   it removed. Output Parquet per area and sensor in data/work/.
4. Tests in pipeline/tests/ for the checks in my task file section 1.3.
5. A figure of monthly raw counts per sensor for each area, saved to
   submission/figures/raw_jump_<area>.png, so we can see the problem.
6. pipeline/export.py writing regions.json and an L0-only cube.json and
   meta.json per area in exactly the contract shape, with harm set to the
   Aqua-plus-Terra raw count as a clearly temporary placeholder and
   level_shipped set to "L0". Tell me each file's size.

Do not tune anything and do not look at harmonized results yet: the thresholds
in docs/PREREGISTRATION.md were fixed before the data was opened and must not
be edited. Add the AI-assisted header from docs/AI_USE.md to each file, and
each library to docs/REFERENCES.md.

Merge to main after item 6 and tell me to notify Person B. Stop at the 13:00
checkpoint and report: done, not done, blocked.
```

---

## A2. Phase 2: harmonize and test (Sat 14:30 to 19:30)

```text
I am Mahabu, Person A. Read CLAUDE.md, my newest hand-off note in
docs/handoffs/, docs/APPROACH.md, docs/DECISIONS.md, docs/PREREGISTRATION.md
and pipeline/NOTES.md. Work on branch a/pipeline. Start with Córdoba, then
Punjab and Haryana; whichever passes its checks first goes to Person B first
(decision 27).

Build pipeline/harmonize.py in levels, measuring after each one:

1. L1 fire cells: snap detections to the 0.01 degree grid; one row per cell,
   satellite, date and day/night flag, keeping the number of detections, mean
   FRP, mean scan and mean track.
2. Check for the 2015 change in VIIRS FRP: compare the fire-cell FRP
   histograms for 2012 to 2014 and 2016 to 2018. Tell me whether they differ
   enough to matter, and set the calibration years accordingly (decision 10).
3. L2 hard floor: for a range of floors, the Aqua to S-NPP ratio of fire cells
   above the floor, per month, day and night separately, calibration years
   only. Plot the ratio against the floor to submission/figures/. Choose the
   floor by the rule in APPROACH.md and record it with the evidence.
4. The harmonized series: Aqua above the floor before the VIIRS era; VIIRS
   above the floor afterwards, averaged across the VIIRS satellites flying on
   each date so that more satellites never means more fire; the small-fire
   layer as VIIRS fire cells below the floor. Terra stays a separate raw series.
5. pipeline/validate.py: checks C0, C1, C1b, C2 and C3 exactly as defined in
   docs/PREREGISTRATION.md, plus the ladder table (the remaining 2012 step
   after L0, L1 and L2). If a change-point library will not install, implement
   the Pettitt test directly. Write every result to meta.json as a number with
   pass, fail or not run, and save one figure per check.
6. Only after L2 has results, the detection curve (S0 in docs/STRETCH.md): the
   monotonic curve of MODIS completeness against fire-cell FRP, normalised to
   a plateau of 1, with a block bootstrap by month for its range (check C8).
   Rebuild the series with each VIIRS-era cell counted as its curve value, and
   rerun the same checks. Apply the shipping rule in PREREGISTRATION.md.
7. Re-export the cube with real harm, harm_lo, harm_hi and small, aggregated
   to the 0.1 degree display cell, and merge to main.

Report honestly. A failed check is recorded as failed; do not adjust a
threshold, a filter or the calibration years to make one pass. If something
looks too good, look for the bug first.

Before the 19:30 checkpoint, run the adversarial review prompt from
docs/prompts/SHARED.md on the pipeline. Then give me the go or no-go: which
level ships, each check's value and verdict, the floor or curve midpoint, and
whether we need the fallback in APPROACH.md. After this the method is frozen.
```

---

## A3. Phase 3: evidence, observation counts, writing (Sat night to Sun 12:30)

```text
I am Mahabu, Person A. Read CLAUDE.md, my newest hand-off note,
docs/PREREGISTRATION.md, docs/STRETCH.md and docs/tasks/PERSON_A_DATA.md.
The method was frozen at the Saturday 19:30 checkpoint: do not change it.
Work on branch a/pipeline.

Evidence, in this order, stopping when time runs out and telling me where you
stopped:

1. Check C4: rebuild the harmonized series from NOAA-20 alone with the curve
   or floor fitted on S-NPP, no refitting, and compare.
2. The second calibration area and the Chilecito case study, end to end. For
   Chilecito, tell me whether a fire in late July 2026 is visible in the data
   and whether the month is flagged as unusual against its history. If it is
   not there, say so plainly.
3. Check C7: the Punjab peak date per year and the shift after 2009.
4. Check C5: compare the curve midpoint with published MODIS detection limits.
   Find and read the source before quoting a number; if you cannot verify the
   published value, mark the check "not run" and say why.
5. Observation-aware version, if time allows: download the daily gridded fire
   masks (MYD14A1 and VNP14A1) for the sample months in my original request
   using earthaccess and my Earthdata login from .env; count valid clear
   observations per cell and month; express activity per valid observation.
   Tell me before starting how large the download is. If it does not fit,
   record what the FIRMS-only record loses by lacking it.
6. Check C6 with ESA Fire_cci burned area for Córdoba, if the data can be
   obtained quickly; otherwise mark it "not run".

Then the writing, due Sunday 10:00, in submission/:

7. method.md: about 200 words for an emergency manager. results.md: one
   sentence per check with its number and verdict, including failures and
   not-run checks, plus the ladder table. limits.md: what the method cannot
   tell us. nasa_data.md: exact products, satellites, date ranges and the
   FIRMS acknowledgement. Every number must be read from meta.json.
8. The text for the app's method panel, for Person B.
9. pipeline/README.md with exact steps from which a teammate can reproduce
   every figure on their own laptop, starting from the FIRMS zip files.

Resolve or remove every item still marked VERIFY in the docs that touches a
claim we make. Stop at the 12:30 checkpoint and report.
```

---

## A4. Phase 4: verify (Sun 13:30 to 16:00)

```text
I am Mahabu, Person A. No new analysis from now on: fixes only. Read CLAUDE.md
and my newest hand-off note.

1. Read submission/project_page.md and the demo script. Check every number,
   date, product name and claim against meta.json, pipeline/NOTES.md and the
   figures. List every mismatch and every claim you cannot trace to evidence.
2. From a clean clone in a new folder, follow pipeline/README.md and confirm
   the pipeline reproduces the published cube and meta.json. Tell me exactly
   where it fails if it does.
3. Search the repository history for my FIRMS key and Earthdata token strings
   and for any file from data/. Show me how you checked. The repository is
   about to become public.
4. Confirm each pipeline file carries the AI-assisted header and that
   docs/AI_USE.md and docs/REFERENCES.md are complete and truthful.
5. Give me a final one-page summary of what the record is, what was tested,
   what passed, what failed, and what it cannot tell us.
```
