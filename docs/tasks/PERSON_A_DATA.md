# Person A (Mahabu Subhani): data and science
> **Prompts for each phase:** `docs/prompts/PERSON_A.md`. **Current decisions:** `docs/DECISIONS.md` (it overrides anything below marked DECIDE). **Also read:** `docs/PREREGISTRATION.md` and `docs/RESEARCHER_EXPERIENCE.md`, written after this checklist; where they add work (checks panel, per-chart downloads, shareable link, small-fire layer as core, the Chilecito case study), the phase prompts include it.

You own `pipeline/` and `data/`, and you write the files in `app/public/data/`.
Everything else in the project depends on your output, so ship something small
early and improve it.

Read first: `docs/GETTING_STARTED.md`, `AGENTS.md`, `docs/CONTEXT.md`,
`docs/APPROACH.md`, `docs/ARCHITECTURE.md` (the data contract is your output format).

Your job in one line: turn FIRMS hotspot files into small, tested data files in
the contract shape, and hand Person C honest numbers.

---

## Before the start (Friday; allowed prep only)

- [ ] Do everything in `docs/GETTING_STARTED.md` Part 1.
- [ ] Create a free FIRMS MAP_KEY at https://firms.modaps.eosdis.nasa.gov/api/map_key/
- [ ] Create an Earthdata login at https://urs.earthdata.nasa.gov/users/new
      (the archive download tool may ask for it).
- [ ] Save the key in a file named `.env` in a folder **outside** the repo:
      `FIRMS_MAP_KEY=...`. Never paste it in chat or commit it.
- [ ] Read the FIRMS pages on: archive download, file attributes for MODIS and
      for VIIRS, and the difference between standard (archive) and
      near-real-time data. Note anything that contradicts `docs/ARCHITECTURE.md`.
- [ ] Invite both teammates to the repo. Confirm both accepted.
- [ ] Run the team meeting and commit the decisions (see GETTING_STARTED).
- [ ] Do **not** request or download fire data today.

---

## Phase 1. Sat 10:15 to 13:00: get data, ship a first cube

### 1.1 Request the data (first 10 minutes; delivery can be slow)

- [ ] Open the FIRMS archive download tool.
- [ ] For **each region**, submit a request for **each source**: MODIS
      Collection 6.1, VIIRS S-NPP 375 m, VIIRS NOAA-20 375 m, VIIRS NOAA-21 375 m.
- [ ] Date range: earliest available to the latest available. If the tool limits
      the range per request, split by years and note the splits.
- [ ] Format: CSV.
- [ ] Write down each request (region, source, dates, time submitted) in
      `pipeline/NOTES.md`.
- [ ] While waiting, download the per-country yearly files for the same
      countries as a backup source.

### 1.2 Set up the pipeline folder

- [ ] Branch: `git checkout -b a/pipeline`
- [ ] Create `pipeline/`, `pipeline/tests/`, `data/raw/`, `data/work/`.
- [ ] Create a virtual environment and `pipeline/requirements.txt` (DuckDB,
      pandas, pyarrow, numpy, matplotlib, a test runner).
- [ ] Confirm `data/` and `.env` are ignored: `git status` must not list them.
- [ ] Add each library to `docs/REFERENCES.md`.

### 1.3 Clean (`pipeline/clean.py`)

- [ ] Load every raw file. Record rows per file in `pipeline/NOTES.md`.
- [ ] One schema for all sensors: `lat, lon, acq_date, acq_time, daynight,
      satellite, sensor (MODIS or VIIRS), scan, track, frp, confidence_raw,
      confidence_class (low / nominal / high), type, region_id, source_file`.
- [ ] Map every `satellite` code to a clear name (Terra, Aqua, S-NPP, NOAA-20,
      NOAA-21). Fail loudly on an unknown code.
- [ ] Unify confidence using the rule the team decided. Keep the raw value too.
- [ ] Keep `type == 0` where the field exists. Count what was removed.
- [ ] Remove exact duplicate rows. Count them.
- [ ] Write one Parquet file per region and sensor to `data/work/`.

Checks (write them as tests in `pipeline/tests/`):

- [ ] Rows in = rows out + rows removed by each stated filter.
- [ ] No missing latitude, longitude, date or satellite.
- [ ] All coordinates fall inside the region's bounding box.
- [ ] Date range per satellite matches its mission dates (Terra from late 2000,
      Aqua from mid 2002, S-NPP from 2012, NOAA-20 from 2018, NOAA-21 from 2023).
      **VERIFY** exact first dates in the data.
- [ ] `scan` and `track` ranges are plausible for each sensor.

### 1.4 See the problem

- [ ] Plot monthly raw counts per sensor for one region, full period. The VIIRS
      line should sit well above MODIS, and a combined line should jump in 2012.
      Save as `submission/figures/raw_jump.png`. Person C needs this picture.

### 1.5 First export (`pipeline/export.py`)

- [ ] Write `regions.json` exactly as in the contract.
- [ ] Write an **L0-only** `cube.json` per region: `raw_modis`, `raw_viirs`
      real; `harm = raw_modis` and `small = 0` as placeholders; `terra_only`
      true before July 2002.
- [ ] Write `meta.json` with `level_shipped: "L0"` and empty tests.
- [ ] Check the file size. If a cube is over 20 MB, tell Person B and discuss
      Parquet or a coarser display cell.
- [ ] Merge to `main` and tell Person B the files are in `app/public/data/`.

**Checkpoint 13:00.** Real L0 cube for at least one region loads in the app.
Report: done, not done, blocked.

---

## Phase 2. Sat 14:30 to 19:30: harmonize and test

### 2.1 L1 fire cells (`pipeline/harmonize.py`)

- [ ] Snap each detection to the internal grid the team chose.
- [ ] Group by `cell, satellite, acq_date, daynight`. One row per group = one
      fire cell. Keep: number of detections, mean FRP, mean `scan`, mean `track`.
- [ ] Count L1 fire cells per month per satellite. Plot against L0. The
      MODIS-VIIRS gap should shrink.

### 2.2 L2 common floor

- [ ] Take Aqua and S-NPP only, overlap years only, day and night separately.
- [ ] For a range of candidate floors F, count fire cells with mean FRP >= F per
      month for each sensor. Compute the Aqua to S-NPP ratio.
- [ ] Plot ratio against F. Save as `submission/figures/floor_curve.png`.
- [ ] Choose F by the rule in `docs/APPROACH.md`. Record F for day and for night
      in `pipeline/NOTES.md` with the plot as evidence.
- [ ] If no F brings the ratio near 1, write that down and go to 2.5.

### 2.3 Build the harmonized series

- [ ] MODIS side: Aqua fire cells with FRP >= F.
- [ ] VIIRS side: fire cells with FRP >= F, **averaged across the VIIRS
      satellites flying on that date**, so more satellites never means more fire.
- [ ] Overlap period: decide and document one rule for which side is shown
      (proposal: Aqua until VIIRS begins, then VIIRS; test both sides agree).
- [ ] Small-fire layer: VIIRS fire cells below F, same averaging.
- [ ] Terra: kept as a separate raw series, not in the harmonized series.

### 2.4 Validate (`pipeline/validate.py`)

- [ ] T1 step at 2012, T2 overlap agreement, T5 placebo seam, T6 ladder table
      (definitions in `docs/APPROACH.md`).
- [ ] One figure per test in `submission/figures/`.
- [ ] Write every result into `meta.json` as numbers with pass or fail. A failed
      test is recorded as failed.

### 2.5 L3 or fallback (only if needed)

- [ ] If L2 passes: skip L3 unless a swath-edge effect is visible and you have
      an hour spare.
- [ ] If L2 fails: try L3 (floor grows with `scan * track`) for at most one hour.
- [ ] If L3 also fails: build the fallback ratio method from `docs/APPROACH.md`.

### 2.6 Re-export

- [ ] Cube with real `harm` and `small`. Aggregate from the internal grid to the
      display cell size.
- [ ] Merge to `main`. Tell Person B and Person C.

**Checkpoint 19:30, go or no-go.** Tell the team, with numbers: which level
ships, whether T1 and T2 pass, and what the floor is. After this point the
method is fixed. Do not keep tuning.

---

## Phase 3. Sat night to Sun 12:30: evidence and robustness

- [ ] T3: refit the floor on half the overlap years, test on the other half.
- [ ] T4: apply region 1's floor to region 2 without refitting. Report honestly
      if region 2 needs its own floor; that is a finding, not a failure to hide.
- [ ] Range: bootstrap over calibration months to get `harm_lo` and `harm_hi`.
- [ ] Sensitivity: rerun with the confidence filter off. Note how much the
      result changes.
- [ ] Second region processed end to end and exported.
- [ ] Stretch goals the team chose from `docs/STRETCH.md`, in the agreed order.
- [ ] Per-year hotspot CSV files for the raw download (stretch).

### Writing (yours, because the web app is split between B and C)

Finish by **Sun 10:00** and save in `submission/` so Charulekha can edit it into
the project page.

- [ ] `submission/method.md`: the method for an emergency manager, about 200
      words. Two reasons the sensors disagree, one fix for each, what the
      small-fire layer is.
- [ ] `submission/results.md`: one sentence per test (what it checks, the
      result, pass or fail), including any that failed, plus the ladder table.
- [ ] `submission/limits.md`: from `docs/APPROACH.md`, "Known limits".
- [ ] `submission/nasa_data.md`: FIRMS, the exact MODIS and VIIRS product names
      and satellites used, and the citation.
- [ ] The text for the app's method panel; give it to 8crsk.
- [ ] Fact-check every claim: source, and whether you read the source yourself.
      Resolve or remove each item still marked VERIFY.
- [ ] Hand Charulekha every figure with a one-line caption.

**Checkpoint Sun 12:30.** Final data files merged. `meta.json` complete.

---

## Phase 4. Sun 13:30 to 16:00: verify

- [ ] Read the project page and watch the demo. Check every number against
      `meta.json`. Correct anything that does not match.
- [ ] Write `pipeline/README.md`: exact steps to reproduce the data from the
      raw FIRMS files.
- [ ] Add the AI-assisted header to each pipeline file that needs it and update
      the log in `docs/AI_USE.md`.
- [ ] Confirm no key, no `.env` and no raw data is in the repo before it goes
      public: search the history for the key string.
- [ ] No new analysis after 13:30. Fixes only.

---

## Rules for your work

- Never edit a number by hand. If a test fails, record it as failed.
- Log every filter and threshold, and why, in `pipeline/NOTES.md`.
- Every external data source and library goes in `docs/REFERENCES.md`.
- If you must change the data contract, agree it with Person B first and update
  `docs/ARCHITECTURE.md` in the same commit.

## What you hand to others

| To | What | When |
|---|---|---|
| Person B | L0 cube and `regions.json` | Sat 13:00 |
| Person C | `raw_jump.png` | Sat 13:00 |
| Person B | Harmonized cube and `meta.json` | Sat 19:30 |
| Person C | Test results in plain sentences; cut-offs for the comparison labels | Sat 19:30 |
| Person C | Draft text for the project page (method, results, limits, NASA data) | Sun 10:00 |
| Person B | Method panel text, second region, ranges, stretch data | Sun 12:30 |

## Prompt to give your AI assistant at the start

> You are helping Person A on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/APPROACH.md`,
> `docs/ARCHITECTURE.md` and `docs/tasks/PERSON_A_DATA.md`. The hackathon has
> started. Begin Phase 1, step 1.2. Before writing code, list the facts marked
> VERIFY that affect the pipeline and tell me how you will check each one.
> Work on branch `a/pipeline`. Follow the checklist in order, tick items as
> they are done, and stop and report at each checkpoint.
