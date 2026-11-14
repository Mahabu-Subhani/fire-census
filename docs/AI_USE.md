# Use of AI tools

The Space Apps Project Submission Guide requires teams to state where and how
AI tools were used, and says AI should accelerate the work, not come up with the
idea of how to solve the challenge. This file is the team's honest log. Person C
uses it to fill the "Use of AI" field on the project page.

## Labelling rules

| Kind of output | Required label |
|---|---|
| Code and data | Acknowledge in descriptive text and metadata. In this repo: a header comment at the top of each AI-assisted file, and an entry in the log below |
| Images and video | A visible watermark stating it is AI-generated |
| Audio | Acknowledged in descriptive text and metadata |

Header comment to use in AI-assisted source files:

```
AI-assisted: written with help from <tool>. Reviewed by <team member>.
```

No AI-generated content may use NASA logos, flags or mission identifiers.

## Log

Add a row whenever an AI tool contributes. Be specific and truthful.

| Date | Tool | What it did | Reviewed by |
|---|---|---|---|
| 12–13 Nov 2026 | Claude (Anthropic) | Read the challenge page and official guides; surveyed public repositories of other teams; proposed and critiqued candidate harmonization approaches; drafted these planning documents | Team, pending |
| 12–13 Nov 2026 | Gemini (Google) | Critiqued the proposed method and architecture | Team, pending |
| 14 Nov 2026 | Claude (Anthropic) | Decision 52: redesigned the Population near fires section (burning levels, headline, people-by-level bar, yearly chart following the switch), rewrote population.ts and its tests, fixed the false 2012 warning; checked six views in headless Edge | 8crsk (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Decision 51: measured the live site's load in headless Edge (cube.json is the wait), added the loading bar (streamed read, sizes from vite.config.ts) and the other study areas on the map with Show all; tested at a throttled 1.2 MB/s | 8crsk (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Fixed make_population.py after the Punjab outline clip (decision 44): squares snap to the 0.1 degree grid and only population pixels inside the outline count; reran population.json and updated the Punjab numbers in decision 48 and the project-page draft | 8crsk (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Validated the colour ramps (replaced the difference ramp, whose above-average arm had no lightness change), split the bundle so the first load is 66 KB, built the hotspot CSV download with tests and an end-to-end check, updated app/README.md | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Decisions 48 and 49, at 8crsk's instruction: searched for a population source (Planetary Computer has none; used WorldPop), wrote app/scripts/make_population.py and population.json for four areas, found that a fire footprint jumps in 2012 even when harmonized and proposed the 3-detection threshold, wrote the PeopleNearFire chart (in Person C's folder) and population.ts with tests; tested NASA GIBS and FIRMS live sources and added the live fires toggle and month playback to the map; checked it in headless Edge at desktop and phone widths | 8crsk (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Reviewed the Space Apps Global Offers and recommended what to use; wrote app/scripts/make_landcover.py, landcover.json for four areas and the LandCover chart (in Person C's folder) with tests; chose and validated its colours | 8crsk (pending); Charulekha to review the chart |
| 14 Nov 2026 | Claude (Anthropic) | docs/tasks/STRETCH_APP.md, all six items, at 8crsk's instruction as team lead: season and episode charts (in Person C's folder), the three files in useSelection(), unit note, clear-view days and the MODIS-drift line in the Method panel, Karnataka district search and case-study label | 8crsk (pending); Charulekha to review the two charts |
| 14 Nov 2026 | Claude (Anthropic) | Proposed the rules in decision 38 and built the "Do the satellites agree?" section (app/src/sources/, app/scripts/make_sources.py, sources.json) with tests; drafted submission/inbox/B-judges-pitch.md | 8crsk (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Redesigned the app (decision 35): theme, hero and dot grid, two views, scroll and touch motion, exact number formatting across all charts, readable calendar legend, plain-question chart titles, map fixes; edited Person C's chart files for this at 8crsk's request; checked in headless Chrome at 1440 px and 390 px, dark and light | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Reviewed the app against the four audiences in the challenge and wrote the guidance it lacked: live-data notice with a FIRMS link, Start-here guide and examples, glossary, researcher section, map activity layer, area totals, touch sizes | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Added the drawn field, the no-WebGL fallback and error boundaries; wrote make_districts.py (from geoBoundaries) and the district search | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Wrote the app controls (coordinates, date range, small-fire switch, CSV download, shareable link) and the Checks and Method panel built from meta.json, with tests that render it from the real data | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Wrote the first app shell in app/ (data loading, selectCells and its tests, the useSelection() hook, map with area drawing, layout, placeholder charts) and the Pages deploy workflow | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Drafted docs/APP_VISION.md (user questions, gaps against existing tools, a first-principles reading of the challenge text) and the contract fields it needs. The team chose to adopt it (decision 28); the first-principles additions await a team decision (29) | 8crsk, team |
| 14 Nov 2026 | Claude (Anthropic) | Phase 1 and 2 pipeline code (inventory, cleaning, harmonization, checks, export, figures) and the notes in pipeline/; proposed the revised check C3r and recommended shipping the detection curve. Mahabu chose (DECISIONS.md, 30) | Mahabu |
| 14 Nov 2026 | Claude (Anthropic) | Turned 8crsk's draft request into the decision protocol (AGENTS.md, "Before a decision"), the prompts in docs/prompts/DEEPEN.md and the research-note template in docs/research/ | 8crsk, team pending |
| 14 Nov 2026 | Claude (Anthropic) | Wrote app/src/stats/ (value, toCalendar, monthHistory with month-to-date, median, rank, 90th percentile, with tests), ChartFrame, the usePlot helper and the BurningCalendar chart, and checked it at 400 px and 1280 px in headless Chrome | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Added the `unit_raw` label to pipeline/export.py, the three meta.json files and the contract in docs/ARCHITECTURE.md, at Mahabu's request | Mahabu (pending) |
| 14 Nov 2026 | Claude (Anthropic) | CA2 for Person C: status sentence (rank, ratio, month to date, baseline switch), MonthComparison, season band and you-are-here marker on the calendar, ActivitySeries, CSV/PNG/SVG export through ChartFrame, the stats behind them with tests, and an adversarial self-review. Laid out options and evidence for decisions 32 and 33; Charulekha chose | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | CA3 for Person C: trend (Sen's slope, Mann-Kendall), outlook strip, calendar difference mode and month totals, with tests. Assembled submission/project_page.md from the team's drafts; drafted the demo script, pitch candidates, recording and submission checklists, judge answers and app labels | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Phase 3 pipeline: verified check C5 against the published paper; sensitivity runs; tests of reviewer objections (fire-mix test, orbit drift measured from the data); Aqua daily fire-mask download and processing (`obs`); per-year hotspot files with harmonization class; FIRMS near-real-time refresh; pipeline README and a reproduction test from a fresh clone; drafts in submission/ (method, results, limits, NASA data, Method panel text). Gemini was unavailable (disabled by the Composio administrator), so no second model reviewed this phase | Mahabu |
| 14 Nov 2026 | Claude (Anthropic) | Stretch analyses (season, drift, episodes), the Karnataka case-study area, a self-score against the local rubric and a hostile self-review (docs/REVIEW.md; Gemini was unavailable, so the review is not independent). On Mahabu's instruction the assistant also made decisions 30, 31, 36 and 37 | Mahabu |
| 14 Nov 2026 | Claude (Anthropic) | Designed the map-first retro UI with Charulekha in a design mockup (FIRMS as inspiration), rendered the satellite globe and map pictures from our data, then built it into the app: map-first overview, Arial, NASA GIBS satellite base map, square corners (decision 39) | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Put 8crsk's 'Do the satellites agree?' section into the Overview panel, marked case-study areas in the answer line, and stopped wide sections from stretching the panel (decision 39 UI) | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Found that the Punjab box was mostly other states and partly Pakistan; built the exact state outline and reran everything; added the NASA MCD64A1 burned-area check and whole-record land cover; updated every document to the new numbers; small app change to draw the outline and use its true area (in 8crsk's folder, with his task list's agreement for the deadline). Gemini still unavailable | Mahabu |
| 14 Nov 2026 | Claude (Anthropic) | Discussed showing population as a danger rating with Charulekha and advised against it (no vulnerability data; Punjab's main harm is smoke far away); built the exposure colouring on the map and the exposure classes with their tests (`app/src/map/exposure.ts`); also built a NASA haze layer that was removed on review, validated the colours for colour-vision deficiency, (decision 53; the population chart wording was superseded by 8crsk's burning levels, decision 52) | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Audit of Mahabu's data and writing against the five judging criteria, in two passes. First: corrected statements that had fallen behind the data or overstated it, and added tests that need no downloaded data. Second: a separate AI read of the pipeline code (given the code, not our conclusions) returned nine findings; the assistant wrote `from_hotspots.py` to rebuild the record from the shipped hotspot files, confirmed each finding on the data, fixed them, regenerated the app's data and figures, and updated the documents. The main one: the hard floor's constant was fitted on a different rule from the one applied, so Punjab and Haryana's record was 4.6 percent too high and check C3 there is a fail (0.169), not a pass (0.144). No threshold was changed. Ran prompt D1 on how to fix it (three options measured on the data); on Mahabu's instruction the assistant then made decision 54 itself, and it is recorded that way | Mahabu (pending) |
| 14 Nov 2026 | Claude (Anthropic) | For Mahabu's idea of a plain-words question bar (decision 55): ran prompt D1 and laid out three options with costs and risks, advising against a language model on a server; Mahabu chose the typed, rule-based bar. Then wrote it: the parser and its 38 tests (`app/src/ask/parse.ts`), the Ask page with the coloured text (`AskLanding.tsx`, `ask.css`), an `apply()` action in `src/selection/`, the `ask` view in the link, and the Ask tab in the top bar. The bar itself contains no AI | Mahabu Subhani (pending); 8crsk for the files in his folders (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Reported that the answer line ignored the dates asked for in the question bar; on Mahabu's instruction made a one-month period the month that is judged (decision 56): an optional `year` in `compareMonth` with three tests, and its use in the answer line and the Monthly comparison chart. Checked the Ask page in the light theme | Mahabu Subhani (pending); Charulekha Rajesh for the files in her folders (pending) |
| 15 Nov 2026 | Claude (Anthropic) | At Mahabu's request, fixed the phone layout in `app/src/styles.css` (CSS only): the top bar in two rows (views and theme, then a full-width Harmonized / Raw switch), and on screens up to 860 px the map's drawing tools above the map and its layer controls and legend below it, so nothing covers the map; the map reaches the screen edges at tablet width. Checked by measuring the page at 320, 375, 800 and 1280 px; desktop unchanged | Mahabu Subhani (pending); 8crsk for his folder (pending) |

## The team's own decisions

Record here, in the team's own words, which approach the team chose and why,
and what the team changed from any AI suggestion. Fill this in after the team
discussion.

- 13 Nov 2026: the defaults in `docs/DECISIONS.md` (name, regions, thresholds,
  framework, stretch order) were recommended by the AI assistant and accepted by
  Mahabu. They are not yet team decisions. Record below what the team confirms,
  changes or rejects.
- Decision 1:
- Decision 2:
