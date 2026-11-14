<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk. -->
# Fire Census web app

Static site: Vite, React and TypeScript, with MapLibre for the map and
Observable Plot for the charts. It reads the data files in `public/data/`
(written by the pipeline; contract in `docs/ARCHITECTURE.md`) and needs no
server, no account and no key. Live at https://mahabu-subhani.github.io/fire-census/

| Command (run in `app/`) | Does |
|---|---|
| `npm install` | Install dependencies (Node 20 or newer) |
| `npm run dev` | Local server at http://localhost:5173/fire-census/ |
| `npm test` | Unit tests (vitest), including render tests on the real data files |
| `npm run build` | Type-check and build to `dist/` |
| `npx vite preview` | Serve the built site at http://localhost:4173/fire-census/ |

Every push to `main` runs the tests, builds and publishes to GitHub Pages
(`.github/workflows/deploy.yml`).

## What a visitor gets

Two views share one selection; the view is part of the shareable link (`v=research`).

| View | For | Shows |
|---|---|---|
| Overview | Everyone, first | Hero with the answer for this month, four numbers and the record as a dot grid; the calendar; this month against past years; the next three months from history; for the whole region, when the season starts, peaks and ends and whether it has moved, and the latest fire episodes ranked against all earlier ones |
| Data & methods | Scientists, judges | The satellite comparison (who was watching, at what local time, who saw each fire), every chart (adds the status panel, the monthly series and the trend), every pre-registered check with its verdict, the method, the glossary, whole files, a data dictionary, a citation and Python and R code |

The left panel (region, district search, map with drawing, coordinates,
dates, downloads) scrolls on its own. With no area drawn, the selection is the
whole region.

Number rule (`src/stats/format.ts`): harmonized values always show two
decimals, raw counts whole numbers, ratios two decimals, shares one decimal.
Nothing is shortened ("12K") or rounded further.

## Layout and owners

| Path | Owner | What |
|---|---|---|
| `src/data/` | B | Contract types, file loading, `selectCells`, district search |
| `src/selection/` | B | `useSelection()` for charts, `useSelectionActions()` for controls, the shareable link |
| `src/map/` | B | Map, area drawing, fire-activity layer, no-WebGL fallback |
| `src/controls/` | B | District search, date range, coordinate entry |
| `src/downloads/` | B | Selection CSV, hotspot CSV |
| `src/evidence/` | B | Checks and method panel, checks badge |
| `src/sources/` | B | "Do the satellites agree?": who was watching each year, pass-time drift, who saw each fire |
| `src/guide/` | B | Glossary, researcher section, live-fire link |
| `src/layout/` | B | Top bar, hero, dot grid, motion helpers |
| `src/App.tsx`, `src/styles.css`, `src/theme.tsx` | B | Page layout, design tokens, dark and light theme, colour ramps |
| `src/charts/` | C | Chart components, their order and views (`index.ts`), legend, export |
| `src/stats/` | C | The maths every chart shares, and the number formats |

## Design notes

- Dark theme by default, light on request (remembered in this browser only).
  Fonts are bundled with the app; nothing is fetched from a font service.
- Colour ramps in `src/theme.tsx` were checked with the dataviz palette
  validator: steady lightness, one hue per arm, and the two ends of the
  difference ramp distinct under colour-vision deficiency.
- Motion (scroll reveal, count-up, dot grid) switches off when the visitor
  asks the device to reduce motion.
- The first screen loads about 66 KB (compressed) of script. The map
  (MapLibre) and the chart library load just after, on demand.
- If WebGL is missing or lost, the map shows a message and everything else
  keeps working. Each chart and panel sits in its own error boundary.

## Hotspot CSV

"Download hotspots" appears only for a region whose files exist at
`public/data/<region>/hotspots/<YYYY>.csv.gz` (one per year, original FIRMS
columns plus `harm_class`). It fetches the years in the date range (at most 5
per download), keeps the detections inside the area and months chosen, and
writes the original columns under provenance comment lines.

## Satellite summary

`public/data/<region>/sources.json` comes from `scripts/make_sources.py`, which
counts the published hotspot files. Rerun it after the pipeline rewrites them:
`python -I app/scripts/make_sources.py` from the repo root. The rules for the
section (same fire, agreement, drift) are constants in
`src/sources/agreement.ts` and decision 38.

## Land cover

`public/data/<region>/landcover.json` comes from `scripts/make_landcover.py`
(needs only numpy; reads ESA WorldCover 2021 through the Planetary Computer
data API, no account). Rerun after the hotspot files change:
`python -I app/scripts/make_landcover.py` from the repo root, optionally with
region ids. Takes a few minutes per area.

## Population

`public/data/<region>/population.json` comes from `scripts/make_population.py`
(needs numpy and Pillow). Download the two WorldPop 2020 1 km UN-adjusted
GeoTIFFs (about 18 MB each, URLs in the script) to a folder outside git, then
from the repo root:
`python -I app/scripts/make_population.py <that folder>`, optionally with
region ids. Takes about 20 seconds for all four areas. The rule that joins it
to the fire record is in `src/charts/population.ts` (decision 45).

## District files

`public/data/<region>/districts.json` comes from `scripts/make_districts.py`.
To rebuild: download the simplified ADM2 and ADM1 GeoJSON for IND, PAK and ARG
from the geoBoundaries API (links in `docs/REFERENCES.md`) into an empty folder
outside the repo, named `<ISO>-ADM2.geojson` and `<ISO>-ADM1.geojson`, then run
`python -I scripts/make_districts.py <that folder> <repo root>`. The downloads
are not committed.

## Checking it in a browser without a screen

Headless Chrome screenshots of the map need real waiting: Chrome's
`--virtual-time-budget` pauses the worker MapLibre uses, so fire squares look
missing. Use a DevTools-protocol script that waits on a real clock.
