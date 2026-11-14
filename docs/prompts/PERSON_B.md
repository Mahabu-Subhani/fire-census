# Prompts for Person B (8crsk): app foundation, map and controls

Paste one prompt per session. Your checklist is `docs/tasks/PERSON_B_APP.md`.
Setup and usage tips: `docs/prompts/README.md`.

---

## B0. Orientation (allowed before the start; makes no changes)

```text
I am 8crsk, Person B on the Fire Census hackathon team. Read CLAUDE.md and
everything in its read order, then docs/DECISIONS.md, docs/RESEARCHER_EXPERIENCE.md
and my task file docs/tasks/PERSON_B_APP.md. Do not create or change any file,
and do not write solution code: the hackathon has not started.

Then tell me, briefly:
1. What we are building and who it is for, in three sentences.
2. Exactly what I own and what I must not touch.
3. The two contracts I depend on (the data files from Person A, and the
   useSelection() hook I provide to Person C), restated in your own words, and
   anything in them that looks ambiguous or likely to cause trouble.
4. My first three hours on Saturday as a timed list, including the 11:30
   hand-off to Person C.
5. Any generic tooling I should install tonight (Node.js version, Git), and
   the commands to check it. Nothing project-specific.
6. Questions I should settle with my teammates before we start.
```

---

## B1. Phase 1: shell, deploy, selection (Sat 10:15 to 13:00)

```text
I am 8crsk, Person B. The hackathon has started. Read CLAUDE.md, docs/DECISIONS.md,
docs/ARCHITECTURE.md and docs/tasks/PERSON_B_APP.md, then do Phase 1 on a
branch named b/app.

What I need by 11:30, in this order, because Person C is blocked until it exists:

1. A Vite + React + TypeScript app in app/, deployed to GitHub Pages by a
   GitHub Actions workflow, with the base path set for this repository. Merge
   to main as soon as an empty page loads at the public URL. If Pages will not
   publish from a private repository on this account, stop and tell me; do not
   work around it silently.
2. Mock data in app/public/data/ in exactly the contract shape from
   docs/ARCHITECTURE.md, for one region named "MOCK", a few hundred rows,
   including some terra_only months, some months with small-fire counts, and
   at least one cell with no rows at all.
3. app/src/selection: the types and the useSelection() hook exactly as
   specified under "Inside the app". It may return mock rows for now.
4. Empty placeholder components in app/src/charts/ named BurningCalendar,
   ActivitySeries, MonthComparison and UnusualBanner, each rendering its own
   name, placed in a layout with a slot for each. After this commit, never
   edit that folder again: it belongs to Person C.

Then, by 13:00:

5. The data layer: loadRegions, loadCube, loadMeta with loading and error
   states, and selectCells(cube, polygon, fromMonth, toMonth) that keeps rows
   whose cell centre is inside the polygon and whose month is in range. Unit
   tests including an empty selection and a polygon outside the region.
6. A MapLibre map with free tiles and attribution, a region picker from
   regions.json, and polygon and rectangle drawing with clear and redraw.
   Drawing must update useSelection().

Constraints: the browser never calls FIRMS and never holds a key. No number is
typed by hand. Add the AI-assisted header from docs/AI_USE.md to each file you
write, and add every library and the tile source to docs/REFERENCES.md.

Work in small commits and merge to main after items 1 to 4 and again after 6.
When you reach the 13:00 checkpoint, stop and give me: done, not done, blocked,
and the public URL.
```

---

## B2. Phase 2: controls and downloads (Sat 14:30 to 19:30)

```text
I am 8crsk, Person B. Read CLAUDE.md, the newest hand-off note for me in
docs/handoffs/ if there is one, and docs/tasks/PERSON_B_APP.md. Do Phase 2 on
branch b/app, pulling main first.

Build, in this order:

1. Coordinate entry as an alternative to drawing: a box (west, south, east,
   north) and a point with a radius in km. Validate input and show a clear
   message when the area is outside the region or too small to contain a cell.
2. A date-range control with month precision, limited to the region's
   first_month and last_month.
3. The Raw / Harmonized switch in the header, defaulting to Harmonized, wired
   to mode in useSelection(), with the one-line explanation Person C supplies
   (use a clearly marked placeholder if it has not arrived).
4. A small-fire layer switch wired to showSmall. This layer is a core feature,
   not optional: see decision 23 in docs/DECISIONS.md.
5. A "Download CSV" button that exports the rows behind the current view. The
   file starts with comment lines giving the source products, the processing
   date and code version from meta.json, the mode, the area and the date range,
   then a header row. Build it in the browser and confirm it opens in a
   spreadsheet.
6. A shareable link: put region, area, date range and mode in the URL so that
   opening the link restores the same view. See docs/RESEARCHER_EXPERIENCE.md.
7. When Person A's real cube is in app/public/data/, load it, remove MOCK from
   the picker, and confirm the switch changes what the charts show.
8. Phone layout: map, controls and charts stack in one column and stay usable
   at about 400 px wide.

Check performance on the real cube: drawing an area must update the charts
without a visible stall. If it stalls, index cells by grid position.

Before the 19:30 checkpoint, run the adversarial review prompt from
docs/prompts/SHARED.md on your own work. At the checkpoint, stop and report.
```

---

## B3. Phase 3: trust and completeness (Sat night to Sun 12:30)

```text
I am 8crsk, Person B. Read CLAUDE.md, my newest hand-off note, docs/tasks/PERSON_B_APP.md,
docs/PREREGISTRATION.md and docs/RESEARCHER_EXPERIENCE.md. Do Phase 3 on
branch b/app.

In this order:

1. A Checks panel driven entirely by meta.json: every pre-registered check
   with its threshold, its measured value and pass, fail or not run. Failed
   and not-run checks are displayed as clearly as passed ones. If meta.json
   lacks a field you need, tell me what to ask Person A for; do not invent it.
2. A Method panel: which level shipped, the ladder table, the detection curve
   drawn from the points in meta.json, and the known limits. Text comes from
   Person A's files in submission/.
3. The second region and the Chilecito case-study area in the picker
   (decisions 14, 26 and 27).
4. Bulk download of the whole cube per region, a data dictionary page built
   from the contract table, and a "Cite this" box with the tool citation and
   the NASA FIRMS acknowledgement from docs/CONTEXT.md.
5. States everywhere: loading, empty selection, area too small, data failed.
   A visible note that zero detections does not prove there was no fire, and
   that "no valid observation" is different from zero.
6. Footer: data source, data version and processing date from meta.json, team
   name, repository link.
7. If time remains, in this order and stopping when time runs out: GeoJSON
   upload for the area; Python and R snippets that load the files.

Then fix what my teammates report from using the app on their phones. Stop at
the 12:30 checkpoint and report. Tell me plainly if anything in items 1 to 6
is not finished.
```

---

## B4. Phase 4: freeze and harden (Sun 13:30 to 16:00)

```text
I am 8crsk, Person B. Features are frozen: fixes only from now on. Read
CLAUDE.md, my newest hand-off note and the Phase 4 list in
docs/tasks/PERSON_B_APP.md.

1. Test the deployed site as a stranger would: a private window, a phone-width
   viewport, keyboard only, and a throttled connection. List every defect you
   find, most serious first, and fix them in that order. Do not add features.
2. Confirm there are no console errors on load or on any main action.
3. Confirm MOCK data is gone and that no key, token or .env content appears
   anywhere in the repository history or the built site. Show me how you checked.
4. Check contrast and the colour ramp with a colour-vision-deficiency
   simulation, in light and dark themes.
5. Write app/README.md: how to install, run, test and build.
6. Make sure every file you helped write carries the AI-assisted header, and
   that docs/AI_USE.md and docs/REFERENCES.md are complete for the app.
7. Draft the "tools, languages and software used" paragraph for the project
   page, save it as submission/tools.md, and tell me to send it to Person C.

When I say the team has agreed, walk me through making the repository public
and confirm the public URL opens without signing in. Finish with a list of
anything still wrong that we are choosing to ship with.
```
