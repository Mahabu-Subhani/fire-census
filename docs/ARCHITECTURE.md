# Architecture: stack, layout and the data contract

Status: proposal under team review. Items marked DECIDE need a human choice.

## Principle: a static site that still works in December

Judges open the link weeks after the hackathon. A free backend can sleep or
expire. So the app is **fully static**: a Python pipeline runs on a laptop and
writes small data files; the browser loads those files and does the rest. No
server, no database, no API key in the browser.

```
FIRMS archive CSVs --> pipeline (Python, DuckDB) --> small data files --> static web app
     (Person A)              (Person A)              (the contract)        (Person B)
```

The calendar is by month and year, so the app only needs **cell x month**
totals. A user-drawn area is answered by summing the cells whose centres fall
inside it, in plain JavaScript. This keeps files small and the app fast on a phone.

## Stack

| Part | Choice | Why |
|---|---|---|
| Pipeline | Python 3.11+, DuckDB, pandas, pyarrow | Handles tens of millions of rows on a laptop |
| App | Vite + React + TypeScript (DECIDE: plain HTML and JS is fine if Person B prefers) | Fast to build, static output |
| Map | MapLibre GL JS with a draw plugin; OpenStreetMap-based free tiles | No key needed. **VERIFY** the tile provider's usage terms |
| Charts | Observable Plot or D3 | Calendar heat map and time series |
| Hosting | GitHub Pages from this repo | Free, static, stable |
| Data hosting | In the repo under `app/public/data/` if each file is under 50 MB. Otherwise a public Hugging Face dataset | GitHub blocks files over 100 MB |

## Repository layout and ownership

| Path | Owner | Contents |
|---|---|---|
| `pipeline/` | A | Download, clean, harmonize, validate, export scripts |
| `pipeline/tests/` | A | Data checks and the T1 to T6 tests |
| `data/` | A | Raw and intermediate data. **Git-ignored** |
| `app/` except `app/src/charts/` | B | App shell, deployment, data loading, map, controls, downloads, method panel |
| `app/src/charts/` | C | Calendar, time series, comparison and other chart components |
| `app/public/data/` | A writes, B reads | Files defined by the data contract below |
| `docs/` | A | These documents, methods text |
| `docs/REFERENCES.md`, `docs/AI_USE.md` | everyone | Every external resource used; every use of AI |
| `submission/` | C | Project page text, demo script, screenshots |

## Inside the app (Person B provides, Person C consumes)

The web app is built by two people. This interface lets them work in parallel
without editing each other's files. Changing it needs both B and C to agree.

B exports one hook from `app/src/selection`. C's chart components call it and
never load files themselves.

```ts
type Mode = "raw" | "harmonized";

interface CubeRow {            // one cell and month; same fields as cube.json
  lon: number; lat: number; ym: string;
  raw_modis: number; raw_viirs: number;
  harm: number; harm_lo: number; harm_hi: number;
  small: number; terra_only: boolean;
}

interface Selection {
  region: Region | null;       // entry from regions.json
  meta: Meta | null;           // contents of meta.json
  rows: CubeRow[];             // rows inside the drawn area and date range
  from: string; to: string;    // "YYYY-MM"
  mode: Mode;
  showSmall: boolean;
  status: "idle" | "loading" | "ready" | "empty" | "error";
}

function useSelection(): Selection;
```

Chart components C builds, each taking no props and reading `useSelection()`:

| Component | Shows |
|---|---|
| `BurningCalendar` | Year by month heat map with totals and legend |
| `ActivitySeries` | Monthly time series; range shading; small-fire layer |
| `MonthComparison` | Latest month against the historical median, with a label |
| `UnusualBanner` | Alert when the latest month is far above its median |
| `SeasonTiming` | Stretch goal S1 only |

B places these components in the layout and owns everything around them. B
merges the hook (returning mock rows if needed) and empty placeholder
components by Saturday 11:30 so C can start.

## The data contract (Person A produces, Person B consumes)

Person B can start with a **mock file** in exactly this shape on Saturday
morning, so neither person waits for the other. Changing this contract needs
both A and B to agree.

### `app/public/data/regions.json`

```json
[
  { "id": "india-nw", "name": "Punjab and Haryana, India",
    "bbox": [73.8, 27.6, 77.6, 32.6], "cell_deg": 0.1,
    "first_month": "2000-11", "last_month": "2026-10",
    "harmonized_from": "2002-07" }
]
```

### `app/public/data/<region_id>/cube.json` (or `.parquet` if large; DECIDE)

One row per cell and month that has any value. Missing rows mean zero.

| Field | Type | Meaning |
|---|---|---|
| `lon`, `lat` | number | Cell centre, degrees. Grid step is `cell_deg` |
| `ym` | string | Month, `YYYY-MM` |
| `raw_modis` | integer | L0 MODIS hotspot count (Terra + Aqua) |
| `raw_viirs` | integer | L0 VIIRS hotspot count (all VIIRS satellites) |
| `harm` | number | Harmonized fire-cell count (shipped ladder level) |
| `harm_lo`, `harm_hi` | number | Range for `harm`. Equal to `harm` if no range is computed |
| `small` | number | Small-fire layer count (VIIRS below the floor). 0 before 2012 |
| `terra_only` | boolean | True for months before `harmonized_from` |

Display grid `cell_deg` is 0.1 degree (about 11 km) by default. The 1 km grid
in APPROACH.md is internal to the pipeline. DECIDE 0.05 if files stay small.

### `app/public/data/<region_id>/meta.json`

```json
{
  "level_shipped": "L2",
  "floor_mw": { "day": null, "night": null },
  "ladder": [ { "level": "L0", "step_ratio": null } ],
  "tests": [ { "id": "T1", "pass": null, "value": null, "threshold": null } ],
  "generated_at": "2026-11-14T00:00:00Z",
  "sources": ["MODIS C6.1 (MCD14ML / MCD14DL)", "VIIRS 375 m S-NPP, NOAA-20, NOAA-21"]
}
```

`null` values above are placeholders. Real values come only from the pipeline.

### `app/public/data/<region_id>/hotspots/<YYYY>.csv.gz` (stretch goal)

Raw FIRMS rows for the region and year, original columns plus `harm_class`
(`harmonized`, `small` or `excluded`). Used for the "CSV of hotspots" download:
the app fetches the years in the date range and filters by the drawn area.
If this is not ready, the CSV download exports the cube rows for the selection,
which already satisfies "downloadable analytics".

## FIRMS data notes for the pipeline

**VERIFY every item here against the live FIRMS site at the start.**

- Bulk archive: https://firms.modaps.eosdis.nasa.gov/download/ (request by area
  and date; files arrive by email link) and per-country yearly files at
  https://firms.modaps.eosdis.nasa.gov/country/. Request both regions for all
  sensors **first thing Saturday**, because delivery can take time.
- API (needs a free MAP_KEY, limited requests per 10 minutes): area endpoint of
  the form `/api/area/csv/<MAP_KEY>/<SOURCE>/<west,south,east,north>/<DAYS>/<DATE>`.
  Useful for recent days, too slow for 24 years.
- MODIS columns: `latitude, longitude, brightness, scan, track, acq_date,
  acq_time, satellite, instrument, confidence (0-100), version, bright_t31, frp,
  daynight, type`.
- VIIRS columns: `latitude, longitude, bright_ti4, scan, track, acq_date,
  acq_time, satellite, instrument, confidence (l/n/h), version, bright_ti5, frp,
  daynight, type`.
- `type` exists in archive (standard) files only: 0 vegetation fire, 1 volcano,
  2 other static land source, 3 offshore. Near-real-time files lack it.
- `acq_date` and `acq_time` are UTC. The `satellite` codes for VIIRS differ by
  file; map them explicitly and assert no unknown codes.
- S-NPP data availability in FIRMS may have ended in November 2026.

## Accessibility and usability requirements for the app

- Colour ramp readable with colour-vision deficiency (for example viridis or
  cividis), with a legend and numeric values on hover and tap.
- Works at phone width. Keyboard focus visible.
- Area selection by drawing **and** by typing coordinates.
- Every chart states its unit and whether it shows raw or harmonized data.
- A visible note that zero detections does not prove no fire.
