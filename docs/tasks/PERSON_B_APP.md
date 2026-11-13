# Person B (8crsk): web app

You own `app/`. You read the files in `app/public/data/` that Person A writes.
The app is what judges touch, so a small set of features that all work beats a
long list that half works.

Read first: `docs/GETTING_STARTED.md`, `AGENTS.md`, `docs/CONTEXT.md` (the
feature table), `docs/ARCHITECTURE.md` (stack, data contract, accessibility).

Your job in one line: a static website where a fire manager picks an area and
dates and sees a trustworthy burning calendar, on a laptop or a phone.

---

## Before the start (Friday; allowed prep only)

- [ ] Do everything in `docs/GETTING_STARTED.md` Part 1.
- [ ] Look at the documentation for MapLibre GL JS, a polygon draw plugin, and
      a chart library (Observable Plot or D3). Choose which you will use.
- [ ] Look at how GitHub Pages deploys a Vite site with GitHub Actions.
- [ ] Look at colour-blind-safe sequential colour ramps (viridis, cividis).
- [ ] In the team meeting: settle framework, display cell size, JSON or Parquet.
- [ ] Do **not** scaffold the project or write components today.

---

## Phase 1. Sat 10:15 to 13:00: skeleton on mock data

### 1.1 Scaffold and deploy first (finish within the first hour)

- [ ] Branch: `git checkout -b b/app`
- [ ] Scaffold the app in `app/` with the framework the team chose.
- [ ] Add a GitHub Actions workflow that builds `app/` and publishes to GitHub
      Pages. Set the site's base path to the repo name.
- [ ] Ask Mahabu to enable Pages in the repo settings (source: GitHub Actions).
      **VERIFY** whether Pages works on a private repo with the account's plan.
      If it does not, deploy from a public mirror or make the repo public only
      after the hackathon has started, with the team's agreement.
- [ ] Open the deployed link on your phone. An empty page that loads is success.

### 1.2 Mock data in the contract shape

- [ ] Create `app/public/data/regions.json`, `<region>/cube.json` and
      `<region>/meta.json` with a few hundred invented rows, in **exactly** the
      shape in `docs/ARCHITECTURE.md`. Name the region "MOCK" so it can never be
      mistaken for real data. Delete it when real data arrives.

### 1.3 Data layer

- [ ] `loadRegions()`, `loadCube(regionId)`, `loadMeta(regionId)` with loading
      and error states.
- [ ] `selectCells(cube, polygon, fromMonth, toMonth)`: rows whose cell centre
      is inside the polygon and whose month is in range.
- [ ] `toCalendar(rows, field)`: year by month matrix of sums for one field
      (`raw_modis`, `raw_viirs`, `harm`, `small`).
- [ ] Unit tests for both functions, including an empty selection.

### 1.4 Map and controls

- [ ] Map centred on the selected region, free tiles with attribution.
- [ ] Region picker from `regions.json`.
- [ ] Draw a polygon or rectangle; clear and redraw.
- [ ] Coordinate entry: a box (west, south, east, north) or a point with radius.
      Validate the input and show a clear message if it is outside the region.
- [ ] Date range control with month precision, limited to the region's
      `first_month` and `last_month`.

**Checkpoint 13:00.** Deployed page shows the map; drawing an area produces a
calendar matrix in the console; Person A's real L0 cube loads in place of MOCK.

---

## Phase 2. Sat 14:30 to 19:30: the required features

### 2.1 Burning calendar

- [ ] Heat map: years as rows, months as columns.
- [ ] Accessible colour ramp with a legend showing the value scale.
- [ ] Exact value on hover and on tap. Do not rely on colour alone.
- [ ] Row totals (per year) and column totals (per calendar month), so "which
      years and which months burn most" is answered at a glance.
- [ ] Months before `harmonized_from` visibly marked "Terra only, not harmonized".
- [ ] Months with no data shown differently from months with zero fires.

### 2.2 Raw versus harmonized toggle

- [ ] One clear switch: Raw / Harmonized. Default: Harmonized.
- [ ] Raw mode shows MODIS plus VIIRS counts as a naive user would combine them.
- [ ] A time series under the calendar that makes the 2012 jump obvious in Raw
      mode and gone in Harmonized mode.
- [ ] A one-line explanation next to the switch.

### 2.3 Historical comparison

- [ ] For the latest month in the range: its value, the median of the same
      calendar month in earlier years, and the difference.
- [ ] A plain label: below normal, near normal, above normal, far above normal.
      Agree the cut-offs with Person A and state them in the UI.
- [ ] State how many earlier years the median is based on.

### 2.4 CSV download

- [ ] Button that exports the rows behind the current view (area, dates, mode),
      with a header row and a first comment line stating the source and method.
- [ ] Build the file in the browser. Test that it opens in a spreadsheet.

### 2.5 Wire to real harmonized data

- [ ] When Person A delivers the harmonized cube, load it and confirm the toggle
      now shows a real difference.

**Checkpoint 19:30.** Calendar, toggle, comparison, CSV and Terra-only marking
all work on real data for one region, on a laptop and on a phone.

---

## Phase 3. Sat night to Sun 12:30: depth and trust

- [ ] **Small-fire layer** switch using the `small` field, with one line of
      explanation ("fires only the newer sensor can see; shown from 2012").
- [ ] **Method panel** from `meta.json`: which level shipped, the ladder table,
      each test with pass or fail and its value, the floor values, known limits.
      Failed tests are shown, not hidden.
- [ ] Range shading on the time series from `harm_lo` and `harm_hi`.
- [ ] **Unusual month alert** at the top when the latest month is far above its
      median.
- [ ] Second region in the picker.
- [ ] Stretch features the team chose from `docs/STRETCH.md` (season timing
      chart; "last updated" date).
- [ ] Raw hotspot CSV download from the per-year files, if Person A made them.
- [ ] States: loading, empty selection, area too small, data failed to load.
- [ ] A visible note: zero detections does not prove there was no fire.
- [ ] A footer: data source and citation, team name, link to the repo.
- [ ] Ask Person C to use the app as a first-time user and fix what confuses them.

**Checkpoint Sun 12:30.** Feature complete. Person C can record the demo.

---

## Phase 4. Sun 13:30 to 16:00: freeze and harden

- [ ] Feature freeze at 13:30. Fixes only.
- [ ] Test: private window, phone, slow connection, keyboard only.
- [ ] Test with a colour-blindness simulator.
- [ ] No console errors on load or on any main action.
- [ ] MOCK region removed.
- [ ] No key or secret anywhere in the built site.
- [ ] `app/README.md`: how to install, run and build.
- [ ] AI-assisted header on each file that needs it; log updated in `docs/AI_USE.md`.
- [ ] Every library, tile source, font and icon set in `docs/REFERENCES.md`.
- [ ] With the team's agreement, make the repo public and confirm the Pages
      link opens without login.
- [ ] Optional: request a FortiGuard web filter classification for the site, as
      the Project Submission Guide suggests, so judges' networks do not block it.

---

## Rules for your work

- The browser never calls the FIRMS API and never holds a key.
- Every chart states its unit and whether it is raw or harmonized.
- No number in the UI is typed by hand. All come from the data files.
- If you need the data contract changed, agree it with Person A first.

## What you need from others

| From | What | When |
|---|---|---|
| Person A | L0 cube and `regions.json` | Sat 13:00 |
| Person A | Harmonized cube and `meta.json` | Sat 19:30 |
| Person C | Wording for labels, explanations and limits | Sat afternoon onward |
| Person A | Second region, ranges, stretch data | Sun 12:30 |

## Prompt to give your AI assistant at the start

> You are helping Person B on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/ARCHITECTURE.md` and
> `docs/tasks/PERSON_B_APP.md`. The hackathon has started. Begin Phase 1,
> step 1.1. Use the data contract exactly as written and build against mock
> files first. Work on branch `b/app`. Follow the checklist in order, tick
> items as they are done, and stop and report at each checkpoint.
