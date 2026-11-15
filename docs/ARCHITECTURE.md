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
| `submission/inbox/` | anyone writes, C reads | Draft project-page sentences from A and B (prompt D3) |
| `docs/research/` | everyone | One note per research question (prompt D2); append to others' notes, do not rewrite them |

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
  mtd: number | null;          // month-to-date count; see the cube table
}

interface Selection {
  region: Region | null;       // entry from regions.json
  meta: Meta | null;           // contents of meta.json
  rows: CubeRow[];             // rows inside the drawn area and date range
  areaRows: CubeRow[];         // rows inside the area for ALL months (history for comparisons)
  from: string; to: string;    // "YYYY-MM"
  mode: Mode;
  showSmall: boolean;
  status: "idle" | "loading" | "ready" | "empty" | "error";
  drawn: boolean;              // true for a drawn, typed or searched shape; false = whole region
  areaKm2: number | null;      // area of the selection
  place: string | null;        // name of a searched place, or null if drawn
  dataThrough: string | null;  // "YYYY-MM-DD", copied from meta.data_through
  season: Season | null;       // <region>/season.json, null if the file does not exist
  drift: DriftFile | null;     // <region>/drift.json
  episodes: Episodes | null;   // <region>/episodes.json
  landcover: LandCover | null; // <region>/landcover.json
  population: Population | null; // <region>/population.json
}

function useSelection(): Selection;
```

How to read the rows (one rule for every chart, implemented once in `app/src/stats/`):

- **Raw** mode value per row: `raw_modis + raw_viirs` (the naive record, with its 2012 jump).
- **Harmonized** mode value per row: `harm`, with range `harm_lo` to `harm_hi`.
  The small-fire layer `small` is shown as its own layer when `showSmall` is
  true, never added into `harm`.
- Missing rows mean zero. The unit label comes from `meta.unit` in Harmonized
  mode and from `meta.unit_raw` in Raw mode.
- Comparisons with history (median, rank, outlook, trend) use `areaRows`, so
  the result does not change when the user narrows the date range. The
  calendar and the series show `rows`.
- The month of `dataThrough` is incomplete: compare it using `mtd`, never `harm`.

Working together in `app/`: C owns `app/src/charts/` and `app/src/stats/`. The
order of charts on the page is the list in `app/src/charts/index.ts`, so C adds
or reorders charts without touching `App.tsx`. B owns everything else in
`app/`, including `package.json`; ask B to add a dependency. If C needs a new
field in `useSelection()`, C asks B; B adds it and updates this section.

Chart components C builds, each taking no props and reading `useSelection()`:

| Component | Shows |
|---|---|
| `BurningCalendar` | Year by month heat map with totals and legend |
| `ActivitySeries` | Monthly time series; range shading; small-fire layer |
| `MonthComparison` | Latest month against the historical median, with a label |
| `UnusualBanner` | Alert when the latest month is far above its median |
| `SeasonTiming` | Season start, peak and end per year with the peak trend (`season.json`) |
| `FireEpisodes` | Latest and largest fire episodes with ranks (`episodes.json`) |
| `LandCover` | Fire activity split by land cover, by month or year (`landcover.json`) |
| `PeopleNearFire` | People by burning level (light, moderate, heavy fire detections a year in their square) for the area and dates shown, and per year in the record the switch shows (`population.json`, decision 52); works for drawn areas too |

A chart in `charts/index.ts` may give `available(selection)`; the shell hides
it when that returns false. The two above are whole-region analyses, so they
are hidden when an area is drawn or the file is missing.


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

`regions.json` entries may also carry `outline` (one or more rings of
[lon, lat], not closed), `area_km2` (true area of the outline) and
`outline_source`, for areas clipped to an exact outline (Punjab and Haryana,
decision 44). The app draws the outline and uses `area_km2` for the whole
region; without them it uses the box.

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
| `mtd` | number or null | Month to date: `harm` counted over days 1 to D only, where D is the day of `meta.data_through`. Filled for that calendar month in every year (for example every November when data runs to 7 November); null in all other rows. Lets the app compare an incomplete current month fairly (docs/APP_VISION.md, trap 1) |

Display grid `cell_deg` is 0.1 degree (about 11 km) by default. The 1 km grid
in APPROACH.md is internal to the pipeline. DECIDE 0.05 if files stay small.

### `app/public/data/<region_id>/meta.json`

```json
{
  "level_shipped": "L2",
  "floor_mw": { "day": null, "night": null },
  "ladder": [ { "level": "L0", "step_ratio": null } ],
  "checks": [
    { "id": "C1", "name": "No seam at 2012", "value": null,
      "threshold": "absolute value at most 0.10",
      "verdict": "not run", "note": "" }
  ],
  "curve": { "day": [ { "frp": null, "p": null, "p_lo": null, "p_hi": null } ],
             "night": [] },
  "data_version": "0.1.0",
  "code_commit": "",
  "generated_at": "2026-11-14T00:00:00Z",
  "data_through": null,
  "nrt_from": null,
  "sources": ["MODIS C6.1 (MCD14ML / MCD14DL)", "VIIRS 375 m S-NPP, NOAA-20, NOAA-21"]
}
```

`null` values above are placeholders. Real values come only from the pipeline.

`checks` holds one entry per check in `docs/PREREGISTRATION.md` (C0 to C8).
`verdict` is exactly one of `pass`, `fail` or `not run`. `curve` holds the
points of the detection curve for the method panel. It is filled in every
area, also where the hard floor or the ratio ships, because the curve still
defines the small-fire layer there. The older name `tests` is replaced by `checks`.

`unit` labels the harmonized value (`harm`, `harm_lo`, `harm_hi`, `small`,
`mtd`). `unit_raw` labels the raw value (`raw_modis + raw_viirs`), which counts
FIRMS detections and is not in the harmonized unit. Charts take both labels
from here and never type them by hand. `unit_raw` proposed 14 November by
Mahabu (A); awaiting 8crsk (B).

Fields added 15 November by Mahabu (A) with decision 57, all optional for the
app, **proposed, awaiting 8crsk (B)**; no existing field changed shape:
`constants_by_month.day` (twelve daytime conversion constants, January first;
`constants.day` is the year-round value they are pulled towards and
`constants.night` the night constant), `year_round_constant` (the checks C1 to
C4 of each model with one year-round constant, as shipped until 15 November)
and `error_by_calendar_month` (ln of record over Aqua for each calendar month,
with and without the monthly constants). `checks` gained the row `C3x`. The
`ladder` now has two rows per method, one for each kind of constant.

`data_through` is the last date with data, `YYYY-MM-DD`. `nrt_from` is the
first month (`YYYY-MM`) built from near-real-time rows, which may still change.
The app shows both in its freshness line. Fields added 14 November with the
agreement of all three (docs/APP_VISION.md).

Optional cube field, present only if the observation-aware step is completed:
`obs` (integer or null), the number of valid clear observations of the cell in
that month. The app must treat a missing or null `obs` as "unknown", never as zero.
Filled since 14 November for Córdoba, Punjab and Haryana and Chilecito from
Aqua's daily fire masks (MYD14A1): the mean number of days the MODIS fire
algorithm judged the ground observable. It is nearly always 24 to 31, so it is
best shown as a data-quality note, not a chart. The current month is partial.

### Stretch files (optional; written by A with `pipeline/stretch.py`, added 14 November)

Whole-area analyses, not recomputed for a drawn shape. The app should show
them only when the whole region is selected, and hide a view if its file is
missing. Proposed by A; awaiting B and C.

| File | Areas | Answers | Shape |
|---|---|---|---|
| `season.json` | punjab-haryana, cordoba | "Has the burning season moved?" | `window` (text); `years`: one entry per year with `start`, `peak`, `end` (`MM-DD`), `start_doy`, `peak_doy`, `end_doy`, `length_days`, `total`, `sensor`; `trend.start/peak/end/length` with `days_per_decade`, `lo`, `hi`; Punjab also `law_2009` |
| `drift.json` | all three | "Would a MODIS-only calendar still be right?" | `years`: `year`, `overpass_local_time` (hours, per satellite), `aqua_over_harmonized` (from 2012); `note` |
| `episodes.json` | chilecito, cordoba | "How does this fire compare with previous ones?" | `definition`, `count`, `largest` (top 15 by total) and `latest` (last 5): `start`, `end`, `days`, `total`, `peak`, `peak_day`, `sensor`, `rank_total`, `rank_peak` |

### `app/public/data/<region_id>/districts.json` (optional; written by B)

District outlines for the place search, built by `app/scripts/make_districts.py`
from geoBoundaries ADM2 and ADM1 files (sources and licences in
`docs/REFERENCES.md`). One entry per district overlapping the region box:
`name`, `province`, `country`, `label` (unique, "Ludhiana, Punjab, India"),
`ring` (outer outline, simplified to about 200 m), `bbox`, `partly_outside`,
`parts_dropped` (islands or exclaves left out), `source`, `licence`. If the file
is missing, the app hides the search.

### `app/public/data/<region_id>/hotspots/<YYYY>.csv.gz` (stretch goal)

Raw FIRMS rows for the region and year, original columns plus `harm_class`
(`harmonized`, `small` or `excluded`). Used for the "CSV of hotspots" download:
the app fetches the years in the date range and filters by the drawn area.
If this is not ready, the CSV download exports the cube rows for the selection,
which already satisfies "downloadable analytics". The app side is built: a "Download hotspots" button appears as
soon as `<region>/hotspots/<last year>.csv.gz` exists, reads at most 5 years per
download, and needs at least the columns `latitude`, `longitude` and `acq_date`.

### `app/public/data/<region_id>/landcover.json`

Written by `app/scripts/make_landcover.py` (Person B) from the hotspot files
and ESA WorldCover 2021 (Planetary Computer data API); rerun it when the
hotspot files change. `source`, `method`, `groups` (`id`, `name`, `classes`;
ids `cropland`, `forest`, `grass_shrub`, `other`), `years` and `months` (one
entry each with `harmonized` and `small`: fire cells per group id),
`harmonized_by_class`, `share_by_class`, `unlabelled_fire_cells`. A fire cell
is one 0.01 degree cell per satellite, date and half of the day; it takes the
cell's dominant land cover. Shown by the `LandCover` chart for the whole
region; hidden if the file is missing.

### `app/public/data/<region_id>/population.json`

Written by `app/scripts/make_population.py` (Person B) from WorldPop 2020,
1 km, UN-adjusted (one GeoTIFF per country, kept outside git). `source`,
`population_year`, `square_deg` (the region's `cell_deg`), `method`,
`region_population`, and `squares`: `[lon, lat, people]` per square, centres
as in `cube.json`, squares with nobody left out. Each 1 km population pixel
counts whole in the square holding its centre. The app joins it to the cube
rows (`app/src/charts/population.ts`): each square gets a burning level from
its fire detections per year (decision 52). Hidden if the file is missing.

### `app/public/data/<region_id>/sources.json`

Written by `app/scripts/make_sources.py` (Person B) from the hotspot files
above; rerun it whenever they change. An object with `note` and `rows`, one
row per year and satellite that reported: `year`, `satellite` (Terra, Aqua,
S-NPP, NOAA-20, NOAA-21), `family` (MODIS or VIIRS), `day` and `night`
(detections, before any filter), `days_with_detections`, and `day_local_time`
(mean local solar time of daytime detections, in hours; null if none). Used by
the "Do the satellites agree?" section. If the file is missing, the section is
hidden.

## FIRMS data notes for the pipeline

### Verified on the FIRMS site, 13 November 2026

Sources: https://firms.modaps.eosdis.nasa.gov/download/ and
https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs

| Fact | Value |
|---|---|
| Archive coverage, MODIS Collection 6.1 | 1 November 2000 to present |
| Archive coverage, VIIRS S-NPP 375 m | 20 January 2012 to **2 November 2026**. S-NPP no longer delivers new data |
| Archive coverage, VIIRS NOAA-20 375 m | 1 April 2018 to present |
| Archive coverage, VIIRS NOAA-21 375 m | 1 March 2023 to present |
| Archive tool | Serves data older than the last 7 days, as CSV, shapefile or JSON. Sign in with Earthdata login or an email code. A download link arrives by email once the request is processed. A "yearly summary by country" CSV download is also offered |
| Standard versus near-real-time | NRT data are replaced by standard (science quality) data with a lag of about 5 months. So roughly the latest 5 months of any download are NRT |
| `satellite` codes, MODIS | `A` = Aqua, `T` = Terra (documented for NRT; archive files may spell the names out, so accept both) |
| `satellite` codes, VIIRS | `N` = Suomi NPP, `N20` = NOAA-20, `N21` = NOAA-21 |
| `type` field | Standard-quality data only. NRT rows do not have it |
| `version` field | A suffix marks the processing: `NRT`, `RT`, `URT`, or none for standard (for example `6.1NRT` versus `6.1`). Use this to tell standard rows from NRT rows |
| VIIRS FRP | A hybrid of 375 m and 750 m data; the 750 m M13 channel was incorporated **starting in 2015** |
| VIIRS low-confidence night pixels | Removed from NRT data over the South Atlantic Magnetic Anomaly region (11 E to 110 W, 7 N to 55 S). Córdoba lies inside this region |

Consequences for the pipeline:

- Split rows into standard and NRT using `version`. Apply `type == 0` to
  standard rows; for NRT rows use a mask of cells that are persistently
  non-vegetation in the standard data.
- Check whether VIIRS FRP behaves differently before and after 2015 (compare
  the FRP histograms for 2012 to 2014 and 2016 to 2018). If it does, calibrate
  the floor and the completeness curve on 2016 to 2019 only, and say so.
- The harmonized series after 2 November 2026 must run without S-NPP. Test that
  NOAA-20 alone reproduces the S-NPP-based series in the years both flew.

**Not found on the public pages** (visible only after signing in to the request
form): the maximum area or date range per archive request, and the usual
delivery time. Find these out in the first minutes on Saturday and keep the
per-country yearly files as the backup.

The items below were written before this check. Where they differ from the
table above, the table is correct.

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
