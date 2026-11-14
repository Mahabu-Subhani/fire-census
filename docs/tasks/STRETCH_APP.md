<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# Task for 8crsk and Charulekha: show the stretch analyses (decision 37)

The data files are on `main` (`pipeline/stretch.py`). Contract:
`docs/ARCHITECTURE.md`, "Stretch files". Show each view only when the whole
region is selected and its file exists; otherwise hide it. Stop at the Sunday
13:30 freeze even if unfinished: these are extras.

**Status, 14 November evening:** all six items below are built and live
(done by 8crsk as team lead, including the two charts in Charulekha's folder;
Charulekha to review `SeasonTiming.tsx` and `FireEpisodes.tsx`).

## Charulekha (`app/src/charts/`, `app/src/stats/`)

1. **"Has the burning season moved?"** (`season.json`; Punjab, Córdoba,
   Karnataka). One bar per year from `start_doy` to `end_doy`, a dot at
   `peak_doy`, coloured by `sensor`, and the peak trend line from
   `trend.peak` with its range in the caption: "+6.7 days per decade (5.7 to
   8.3)". For Punjab, mark 2009 ("groundwater laws"). Reference image:
   `submission/figures/season_punjab-haryana.png`. Place it in Data &
   methods; for Punjab it is worth a link from Overview.
2. **"How does this fire compare with earlier ones?"** (`episodes.json`;
   Chilecito, Córdoba, Karnataka). A short ranked table: the latest episodes
   with their rank out of `count`, and the five largest. Caption from
   `definition`. Chilecito's July 2026 fire is 11th of 238.

## 8crsk (everything else in `app/`)

3. Load the three files with the region's other data and pass them to the
   charts (add them to `useSelection()` as nullable fields, and update the
   interface section of ARCHITECTURE.md).
4. One line in the Method panel from `drift.json`: "Since 2022 MODIS's orbits
   have drifted (Aqua's afternoon pass is now about two hours later), so a
   MODIS-only calendar would drift too. This record uses VIIRS from 2012."
5. Show `meta.unit_note` in the Method panel, and `obs` as a data-quality note
   (it is nearly always 24 to 31 days).
6. Karnataka has no `districts.json` yet; hide the search there or build it.
   Label the region "case study" next to its name (its held-out checks fail).

## Prompt to paste into Claude

> Read CLAUDE.md, docs/ARCHITECTURE.md ("Stretch files") and
> docs/tasks/STRETCH_APP.md. I am <8crsk / Charulekha>. Do my items in order,
> in my own folders only, reading every number from the data files. Stop and
> report before the Sunday 13:30 freeze.
