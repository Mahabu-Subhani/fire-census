# Person B (8crsk): app foundation, map and controls

The web app is shared between two people. You build the **foundation**: the
project, deployment, data loading, map, area and date selection, downloads and
the method panel. Charulekha (Person C) builds the **charts** that sit inside
your layout. The interface between you is in `docs/ARCHITECTURE.md`, "Inside
the app".

You own: `app/` except `app/src/charts/`. You read `app/public/data/`, which
Person A writes.

Read first: `docs/GETTING_STARTED.md`, `AGENTS.md`, `docs/CONTEXT.md` (the
feature table), `docs/ARCHITECTURE.md` (stack, both contracts, accessibility).

Your job in one line: a deployed, working shell where a user picks a region,
an area and dates, and every chart receives the right rows.

---

## Before the start (Friday; allowed prep only)

- [ ] Do everything in `docs/GETTING_STARTED.md` Part 1.
- [ ] Look at the documentation for MapLibre GL JS and a polygon draw plugin.
- [ ] Look at how GitHub Pages deploys a Vite site with GitHub Actions.
- [ ] In the team meeting: settle framework, display cell size, JSON or Parquet,
      and agree the "Inside the app" interface with Charulekha.
- [ ] Do **not** scaffold the project or write components today.

---

## Phase 1. Sat 10:15 to 13:00: shell, deploy, selection

### 1.1 Scaffold and deploy first (finish within the first hour)

- [ ] Branch: `git checkout -b b/app`
- [ ] Scaffold the app in `app/` with the framework the team chose.
- [ ] Add a GitHub Actions workflow that builds `app/` and publishes to GitHub
      Pages. Set the site's base path to the repo name.
- [ ] Ask Mahabu to enable Pages in the repo settings (source: GitHub Actions).
      **VERIFY** whether Pages works on a private repo with the account's plan.
      If not, agree with the team to make the repo public now that the
      hackathon has started.
- [ ] Open the deployed link on your phone. An empty page that loads is success.
- [ ] Merge to `main` at once so Charulekha can branch from a working app.

### 1.2 Mock data and the shared interface (finish by 11:30)

- [ ] Create `app/public/data/regions.json`, `<region>/cube.json` and
      `<region>/meta.json` with a few hundred invented rows in **exactly** the
      contract shape. Name the region "MOCK". Delete it when real data arrives.
- [ ] Create `app/src/selection` exporting the types and the `useSelection()`
      hook described in `docs/ARCHITECTURE.md`. Even if it returns fixed mock
      rows at first, merge it so Charulekha can build charts against it.
- [ ] Create empty placeholder components in `app/src/charts/` with the agreed
      names, then hand that folder to Charulekha. Do not edit it afterwards.

### 1.3 Data layer

- [ ] `loadRegions()`, `loadCube(regionId)`, `loadMeta(regionId)` with loading
      and error states.
- [ ] `selectCells(cube, polygon, fromMonth, toMonth)`: rows whose cell centre
      is inside the polygon and whose month is in range.
- [ ] Unit tests, including an empty selection and a polygon outside the region.

### 1.4 Map and area selection

- [ ] Map centred on the selected region, free tiles with attribution.
- [ ] Region picker from `regions.json`.
- [ ] Draw a polygon or rectangle; clear and redraw.
- [ ] Layout with named slots for the charts: calendar, time series, comparison.

**Checkpoint 13:00.** Deployed page shows the map; drawing an area updates
`useSelection()`; Person A's real L0 cube loads in place of MOCK; Charulekha's
first chart renders inside your layout.

---

## Phase 2. Sat 14:30 to 19:30: controls and downloads

### 2.1 Controls

- [ ] Coordinate entry: a box (west, south, east, north) or a point with radius.
      Validate input; clear message if it is outside the region.
- [ ] Date range control with month precision, limited to the region's
      `first_month` and `last_month`.
- [ ] **Raw / Harmonized switch** in the header. Default: Harmonized. It sets
      `mode` in `useSelection()`; the charts react to it. One line of
      explanation next to it (wording from Charulekha).
- [ ] Small-fire layer switch (sets `showSmall`).

### 2.2 CSV download

- [ ] Button that exports the rows behind the current view (area, dates, mode),
      with a header row and a first comment line stating source and method.
- [ ] Built in the browser. Test that it opens in a spreadsheet.

### 2.3 Real data and layout

- [ ] Load Person A's harmonized cube when it arrives. Confirm the switch now
      changes what the charts show.
- [ ] Phone layout: map, controls and charts stack in one column and stay usable.
- [ ] Selection stays fast on the full cube. If drawing lags, index cells by
      grid position or precompute month totals.

**Checkpoint 19:30.** Area by drawing and by coordinates, date range, both
switches and CSV all work on real data for one region, on a laptop and a phone.

---

## Phase 3. Sat night to Sun 12:30: trust and completeness

- [ ] **Method panel** from `meta.json`: which level shipped, the ladder table,
      each test with pass or fail and its value, the floor values, known
      limits. Failed tests are shown, not hidden. Text from Mahabu.
- [ ] Second region in the picker.
- [ ] States everywhere: loading, empty selection, area too small, data failed.
- [ ] A visible note: zero detections does not prove there was no fire.
- [ ] Footer: data source and citation, team name, link to the repo.
- [ ] "Last updated" date, and the daily update display if stretch goal S2 is chosen.
- [ ] Raw hotspot CSV download from the per-year files, if Person A made them.
- [ ] Fix what Charulekha and Mahabu report from using the app.

**Checkpoint Sun 12:30.** Feature complete. The demo can be recorded.

---

## Phase 4. Sun 13:30 to 16:00: freeze and harden

- [ ] Feature freeze at 13:30. Fixes only.
- [ ] Test: private window, phone, slow connection, keyboard only.
- [ ] No console errors on load or on any main action.
- [ ] MOCK region removed. No key or secret anywhere in the built site.
- [ ] `app/README.md`: how to install, run and build.
- [ ] AI-assisted header on each file that needs it; log updated in `docs/AI_USE.md`.
- [ ] Every library, tile source, font and icon set in `docs/REFERENCES.md`.
- [ ] Write the "tools, languages and software used" paragraph for the project
      page and give it to Charulekha.
- [ ] With the team's agreement, make the repo public and confirm the Pages
      link opens without login.
- [ ] Optional: request a FortiGuard web filter classification for the site, as
      the Project Submission Guide suggests.

---

## Rules for your work

- The browser never calls the FIRMS API and never holds a key.
- No number in the UI is typed by hand. All come from the data files.
- Do not edit `app/src/charts/`. If a chart needs different data, change the
  interface together with Charulekha and update `docs/ARCHITECTURE.md`.
- If you need the data contract changed, agree it with Person A first.

## Hand-offs

| Direction | What | When |
|---|---|---|
| You to C | Deployed app on `main`, `useSelection()`, chart placeholders | Sat 11:30 |
| A to you | L0 cube and `regions.json` | Sat 13:00 |
| A to you | Harmonized cube and `meta.json` | Sat 19:30 |
| C to you | Wording for labels and explanations | Sat afternoon |
| A to you | Method panel text, second region, stretch data | Sun 12:30 |
| You to C | Tools paragraph for the project page | Sun 13:30 |

## Prompt to give your AI assistant at the start

> You are helping Person B on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/ARCHITECTURE.md` and
> `docs/tasks/PERSON_B_APP.md`. The hackathon has started. Begin Phase 1,
> step 1.1. I build the app foundation; another person builds the charts in
> `app/src/charts/`, which you must not edit. Use both contracts in
> ARCHITECTURE.md exactly as written and build against mock files first. Work
> on branch `b/app`. Follow the checklist in order and stop and report at each
> checkpoint.
