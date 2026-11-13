# Person B (8crsk): web app

You own `app/`. You read the files in `app/public/data/` that Person A writes.
The app is what judges touch, so a small set of features that all work beats a
long list that half works.

Read first: `AGENTS.md`, `docs/CONTEXT.md` (the feature table),
`docs/ARCHITECTURE.md` (stack, data contract, accessibility requirements).

## Before the start (allowed prep only)

- Install Node.js LTS and Git. Do not scaffold the project yet.
- Look at MapLibre GL JS and a draw plugin, and at calendar heat map examples,
  to choose tools.
- With the team: settle the DECIDE items in ARCHITECTURE.md (framework, display
  cell size, JSON or Parquet).

## Phase 1: Sat 10:15 to 13:00. Skeleton on mock data

1. Scaffold `app/` and deploy an empty page to GitHub Pages **in the first
   hour**, so deployment is never a last-minute risk.
2. Write a small mock `regions.json`, `cube.json` and `meta.json` in the exact
   contract shape, clearly named as mock, so you do not wait for Person A.
3. Map with region picker, draw-an-area tool, and coordinate entry.
4. Date range control (month precision).
5. A function `selectCells(cube, polygon, from, to)` that returns the matching
   rows. Write a unit test for it.

**Checkpoint 13:00:** deployed page shows the map; drawing an area logs the
selected cells; Person A's real L0 cube loads in place of the mock.

## Phase 2: Sat 14:30 to 19:30. The required features

1. **Burning calendar:** heat map with years as rows and months as columns,
   value shown on hover and tap, accessible colour ramp with legend.
2. **Raw versus harmonized toggle.** This is the single most important control.
   Raw shows the 2012 jump; harmonized removes it.
3. **Historical comparison:** for the latest month in the range, show its value
   against the median of the same calendar month in earlier years, and mark it
   as below, near or above normal.
4. **CSV download** of the rows behind the current view.
5. Mark the Terra-only period (before `harmonized_from`) visibly.

**Checkpoint 19:30:** all five work on real data for one region, on a laptop
and on a phone.

## Phase 3: Sat night to Sun 12:30. Depth and trust

1. **Small-fire layer** toggle (the `small` field), with one line explaining it.
2. **Method panel** fed from `meta.json`: the ladder table, each test with pass
   or fail, the floor values, and the known limits. Show failures honestly.
3. Range display (`harm_lo`, `harm_hi`) on the time series.
4. "Unusual month" alert at the top when the latest month is far above its median.
5. Raw hotspot CSV download from the per-year files, if Person A has produced them.
6. Second region in the picker.
7. Empty, loading and error states. A note that zero detections does not prove
   no fire.

**Checkpoint Sun 12:30:** feature complete. Person C can record the demo.

## Phase 4: Sun 13:30 to 16:00. Freeze and harden

- Feature freeze at 13:30. Fixes only.
- Test in a private window, on a phone, and with a colour-blindness simulator.
- Make the repository public when the team agrees, and confirm the Pages link
  opens without login.
- Write `app/README.md`: how to run and build.

## Rules for your work

- The browser never calls the FIRMS API and never holds a key.
- Every chart states its unit and whether it is raw or harmonized.
- No number in the UI is typed by hand. All come from the data files.
- Add every library, tile source and icon set to `docs/REFERENCES.md`.

## Prompt to give your AI assistant at the start

> You are helping Person B on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/ARCHITECTURE.md` and
> `docs/tasks/PERSON_B_APP.md`. The hackathon has started. Begin Phase 1,
> step 1. Use the data contract exactly as written and build against mock
> files first. Work on branch `b/app`. Stop and report at each checkpoint.
