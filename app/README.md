<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk. -->
# Fire Census web app

Static site: Vite + React + TypeScript, MapLibre. It reads the data files in
`public/data/` (written by the pipeline, see `docs/ARCHITECTURE.md`) and needs
no server and no key.

| Command (run in `app/`) | Does |
|---|---|
| `npm install` | Install dependencies (Node 20 or newer) |
| `npm run dev` | Local server at http://localhost:5173/fire-census/ |
| `npm test` | Unit tests for the data layer |
| `npm run build` | Type-check and build to `dist/` |

Every push to `main` builds, tests and publishes to GitHub Pages
(`.github/workflows/deploy.yml`).

## Layout and owners

| Path | Owner | What |
|---|---|---|
| `src/data/` | B | Contract types, file loading, `selectCells` |
| `src/selection/` | B | `useSelection()` for charts, `useSelectionActions()` for controls |
| `src/map/` | B | Map and area drawing |
| `src/App.tsx`, `src/styles.css` | B | Layout, header, controls, footer |
| `src/charts/` | C | Chart components. Each reads `useSelection()` and takes no props |

With no area drawn, the selection is the whole region.

## District files

`public/data/<region>/districts.json` comes from `scripts/make_districts.py`.
To rebuild: download the simplified ADM2 and ADM1 GeoJSON for IND, PAK and ARG
from the geoBoundaries API (links in `docs/REFERENCES.md`) into an empty folder
outside the repo, named `<ISO>-ADM2.geojson` and `<ISO>-ADM1.geojson`, then run
`python -I scripts/make_districts.py <that folder> <repo root>`. The downloads
are not committed.
