<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk (pending team review). -->

# App vision: what the person using it needs

Status: **agreed by all three on 14 November** (decision 28), except the
section "First principles", which was added afterwards and is still a proposal
(decision 29). It builds on `docs/RESEARCHER_EXPERIENCE.md` and does not
replace it. Where the two disagree on build order, this file wins. Nothing
here changes the B1 deliverables due at Sat 11:30 (shell, deploy, mock data,
`useSelection()`, placeholder charts): every version of the app needs them.

## The one job

An emergency manager opens the link and asks: **"Is what is happening here
now unusual, and what usually comes next?"** The app answers in 10 seconds,
defends the answer in 2 minutes, and hands over the data in 10.

## First principles: the challenge text, sentence by sentence

Proposal (decision 29). Reduced to its parts, the challenge asks for **an
updated and consistent record, read three ways (patterns, trends, anomalies),
for an area the user selects, exported as analytics, visualizations and
hotspots.** Each row below takes one sentence of the challenge page and says
what it requires and what it changes in our plan.

| The challenge says | What it requires | What it changes |
|---|---|---|
| "an updated and consistent hotspot calendar"; "integrating historical information with recent data" | Two properties of equal weight. *Consistent* is the harmonization. *Updated* means the calendar reaches the present and keeps up | Judges open the link on 3 Dec, 17 Dec and 26 Jan (docs/CONTEXT.md). A snapshot that stops on 7 Nov looks stale by then, and its "current month" is wrong. Build the refresh (S2: a scheduled GitHub Action that pulls recent FIRMS data, with the key stored as a repository secret) during the hackathon. **VERIFY** with the Local Lead and the FAQ whether automatic data updates after the deadline are allowed. If they are not, freeze the data and state "data to <date>" on every view |
| "patterns, trends, and anomalies become the focus" (said twice) | Three analytics, so three views: the seasonal pattern (calendar and season band), the trend (yearly totals with a trend line) and the anomaly (current month against the median) | Trend (Q5) moves from a Sunday stretch goal into the core |
| "the sensor of origin no longer matters"; MODIS is "being replaced by VIIRS"; "continuity" | No sensor appears in the default view. The record keeps running after MODIS stops, in the same units | No default chart legend names a sensor; sensors appear only behind the Raw switch and in downloads. Add one line to the page: "When MODIS ends, the record continues on VIIRS in the same units." This is a demo point |
| "the greater detail of VIIRS" | VIIRS's extra small fires are kept, not thrown away | No change: the small-fire layer is core (decision 23) |
| "which month and years had the highest fire activity"; "compare the burning activity of the current month against the historical median" | Ranking, plus a median comparison for the current month in the selected area | Supports rank first (Q1) and the agreed `mtd` field. Add trap 10 below: which years count as "historical" |
| "anomalies against multi-year averages"; colour ramps that show "similarities and differences ... across months" | The colour is the analysis, not decoration | The calendar gets two colour modes: counts (sequential, cividis) and difference from that month's multi-year average (diverging, colour-vision safe). Legend with numbers in both |
| "select a region and a specific date range, then download analytics and visualizations" | Downloads of both data and pictures | PNG and SVG export of each chart moves into the core (`RESEARCHER_EXPERIENCE.md` had it among the first things to drop) |
| "A downloadable CSV File of hot spots detected during a search" | Hotspot rows, not monthly totals | The per-year hotspot files in the contract become the target. The cube-row CSV stays as the fallback. Each hotspot carries its class (counted, small fire, excluded), so the user sees what the harmonization did to every detection |
| "how a current fire compares with previous ones" | A comparison at the level of one fire event | Q6 stays a stretch goal (it needs daily data); Chilecito is the case |
| "monitor sensitive regions" | Coming back to the same areas | Saved areas in the browser, plus the shareable link. No accounts, no backend |
| "recognize changes relative to historical patterns" | Changes in timing as well as in amount | The season-timing view (S1, the Punjab shift) answers this. It stays in the stretch order |
| "anticipate critical periods"; "strengthen fire forecasting" | Looking ahead | Season band (Q2) and outlook strip (Q3). We do not build a forecast model, and we say so |
| "Number of fires detected and reported" | Detected against officially reported | Idea only, not planned: show an agency's reported counts beside our detections where public data exists. VERIFY the sources. Punjab's official stubble-burning counts are themselves satellite-based, so they would not be an independent check there |
| "agriculture, land-clearing, waste disposal, and industrial activities"; "increasingly human-related" | Burning activity, not only wildfire | The wording rule already exists. Also state on the page that static industrial sources (gas flares) and volcanoes are excluded, and why |

## What already exists, and the gap we fill

| Tool | What it gives a manager | What it cannot do |
|---|---|---|
| NASA FIRMS Fire Map | Hotspots now and recently, any area | No history, no "is this unusual", MODIS and VIIRS not harmonized |
| Global Forest Watch area dashboards | "Normal compared to previous years" for any area | VIIRS only, so the history starts in 2012 (seen in a GFW dashboard snippet, 14 Nov 2026; VERIFY on the live page) |
| GWIS Country Profile (JRC) | Fire regime by country and province | Fixed admin units, period 2002 to 2019 (gwis.jrc.ec.europa.eu, 14 Nov 2026) |
| CONAE hotspot viewer | MODIS and VIIRS side by side | Not harmonized (docs/CONTEXT.md) |

**Our gap:** one consistent record from 2002 to now, for any area the user
names or draws, read as months across years, with its evidence one click away.
GFW is the closest competitor. The demo and the project page must say in one
line why ours is different: ten more years, both sensors, and a method that
passed its checks.

## The user's questions, mapped to the screen

The challenge text is the acceptance test. Each row quotes it or the author's
video (`docs/DECISIONS.md` 21 to 27).

| # | The user asks | On screen | In the current plan? |
|---|---|---|---|
| Q1 | "Is now unusual?" ("compare the burning activity of the current month against the historical median") | A status sentence at the top: **rank first, ratio second**. "October 2026: 2nd highest of 24 Octobers (2.4 times the median)." Uses month-to-date (see trap 1) | Partly: ratio only, full month only |
| Q2 | "When is the dangerous period here?" ("anticipate critical periods") | A band on the calendar marking the months that historically hold most of the year's activity, and a "you are here" marker on the current month | No |
| Q3 | "What usually comes next?" ("strengthen fire forecasting") | An outlook strip for the next three months: typical (median) and bad year (90th percentile) from history. Labelled "history, not a forecast" | No |
| Q4 | "Which periods and years were worst?" | The calendar (months across years), year totals, ranks on hover | Yes |
| Q5 | "Is it getting worse here?" | Annual trend with its uncertainty, or "no clear trend". Only on the harmonized record, because the raw record has a fake jump in 2012 | No |
| Q6 | "How does this fire compare with previous ones?" (challenge text) | Episode comparison: consecutive days of activity in the area, duration and peak against past episodes. Chilecito, July 2026 is the demo case | No. Stretch: needs daily data |
| Q7 | "Can I trust this?" | Data-freshness line, check-verdict badge, Raw / Harmonized switch | Yes, except freshness |
| Q8 | "I have to brief my boss" | One-page print or PNG summary of the current view, plus the shareable link | Link yes; print no |
| Q9 | "My district, not a polygon" ("monitor sensitive regions") | Search by place name with district or department boundaries, as well as drawing and coordinates | No |

## What the plan is not seeing

1. **The partial-month trap.** The newest month is never complete. Archive data
   stops about 7 days back, so November 2026 holds only a few days. Comparing
   it with full Novembers always says "below normal". Compare the same days
   instead: days 1 to D of this month against days 1 to D of the same month in
   every earlier year. This needs a contract change (below).
2. **The zero-median trap.** In a small area or an off-season month the median
   is often 0, and "2 times the median" is meaningless or infinite. Rank ("3rd
   highest of 24") always works and a manager understands it. Below a minimum
   amount of activity, show "too little activity to judge" instead of a label.
3. **Naming the unit.** The harmonized value is not a hotspot count: it is
   MODIS-equivalent fire cells. Call it one thing everywhere, for example
   "fire activity (MODIS-equivalent detections)", and say so on every chart. A
   manager who sees fewer "hotspots" than FIRMS shows will otherwise stop
   trusting us.
4. **Freshness.** State what the data covers: "Data to 7 Nov 2026. The last
   ~5 months are near-real-time and may change." S-NPP stopped on 2 Nov 2026
   (docs/ARCHITECTURE.md). A manager must never take an old view for today.
5. **Managers think in named places, not polygons.** Drawing is for
   researchers. A place search with district boundaries is the fastest path.
6. **Comparing places needs area.** Show the area in km² and offer activity
   per 1,000 km², or a big district will always look worse than a small one.
7. **Areas outside our regions.** Someone will search Bengaluru. Say plainly
   which regions are processed and why, and show them on the map.
8. **Two devices.** The manager uses a phone, often in the field on a slow
   connection. The researcher uses a desktop. The first view must load small
   and fast (the monthly cube only). Dense tables stay on desktop.
9. **The local judges are in Bengaluru.** Córdoba leads the global demo
   (decision 27), but the local judges choose the Global Nominees. Punjab's
   October to November burning is the image they know.
10. **Which years count as "historical".** Where activity has a trend (Punjab's
    crop burning is reported to have fallen in recent years; VERIFY in our
    data), a median over 2002 to now makes every recent month look "below
    normal" even when it is high for today. Show the comparison against all
    years (the challenge's wording) and against the last 10 years, or offer a
    baseline choice. Settle the default with D1 (proposal, decision 29).

## Stack

**Recommendation: keep the stack** (Vite + React + TypeScript, MapLibre,
Observable Plot, static JSON files on GitHub Pages). The bottleneck is what the
app answers, not the framework. The current stack is static, needs no key,
works on a phone, and already splits cleanly between B and C. Switching at
11:00 on Saturday costs the 11:30 hand-off and gains nothing a user would see.

Small additions, each its own decision:

| Addition | For | Cost |
|---|---|---|
| District boundaries (geoBoundaries ADM2, licence to VERIFY) clipped to our regions, plus a place-name search | Q9 | About 2 hours for B; A clips the file |
| Print stylesheet and "save as PNG" | Q8 | About 1 hour for B |
| DuckDB-WASM, loaded only when someone downloads hotspot-level CSV | Raw hotspot export | Stretch. Several MB, so never on first load |

Considered and not recommended now: Observable Framework (its maintenance
status in 2026 is UNVERIFIED, and it would change the folder layout both app
owners use) and SvelteKit (no gain over React for this team).

## Contract changes this needs (A and B must agree; B and C for the hook)

| Change | Why | Who |
|---|---|---|
| `meta.json`: `data_through` (last day with data, `YYYY-MM-DD`) and `nrt_from` (first month that is near-real-time) | Freshness line (trap 4) and month-to-date (trap 1) | A writes, B shows |
| `cube.json`: field `mtd`, the count for days 1 to D of the month, where D is the day of `data_through`. Filled for that calendar month in every year, null for other rows | Fair comparison of the current month (Q1) | A |
| `useSelection()`: add `areaKm2`, `place` (name or null), `dataThrough` | Q1, Q8, Q9 and traps 4 and 6 | B provides, C reads |
| Ranks, percentiles, critical-period band and outlook computed in the browser from `rows`, in one shared module `app/src/stats/` | Q1 to Q3. One implementation means every chart agrees | C owns (it drives the charts); B reviews |

## Build order

| When | Build | Person |
|---|---|---|
| Sat to 13:00 | B1 as written. Add `areaKm2` and `dataThrough` to the hook now, as nulls in mock data | B |
| Sat to 19:30 | Status sentence with rank and month-to-date (Q1); critical-period band (Q2); freshness line; unit wording; PNG and SVG export of each chart | C (charts and stats), A (`mtd`, `data_through`), B (freshness, area, export button) |
| Sat 19:30 checkpoint | Decide decision 29, including whether to build the S2 refresh, because the judging dates argue for it | All three |
| Sat night | Trend (Q5); calendar colour mode for difference from the average; outlook strip (Q3); per-year hotspot files and hotspot CSV; place search with districts (Q9); print summary (Q8) | C, C, C, A then B, B, B |
| Sun morning, if the checkpoint allows | S2 refresh if agreed; episode comparison for Chilecito (Q6) | A and B; A |

If time runs short, cut from the bottom up. Never cut Q1, Q4, Q5 or Q7, or
the downloads the challenge names (CSV and chart images).

## How we will know it works (not us judging ourselves)

- **Task test with strangers at the venue.** Three people who did not build it
  answer: "Was October 2025 unusual in Punjab and Haryana?" and "When is
  burning season in Córdoba?". Time each answer and note where they hesitate.
  The target is under 30 seconds with no help.
- **Five-second test.** Show the first screen for five seconds, hide it, and
  ask what the app does. If they cannot say, the top of the page is wrong.
- **The challenge text as a checklist.** Every row Q1 to Q9 that quotes it is
  either on screen or written down as a choice not to build it.
- **A domain person.** Ask a mentor or the Local Lead to try Q1 on a phone.
