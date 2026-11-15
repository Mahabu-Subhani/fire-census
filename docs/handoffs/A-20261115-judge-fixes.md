<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending). -->

# Hand-off: Mahabu (A), 15 Nov: fixes after a mock judging

*Times corrected on 15 November. This heading said "about 01:00" and a later one "about 01:45"; both were
estimates from memory and wrong. The first part was written at about 00:40 (the note saved with it,
`submission/inbox/A-judge-fixes.md`, had the file time 00:39:59) and the second at 00:56 (this file's time
before the correction).*

Branch `a/what-we-show`, not committed when written. A second session
("C6 failures and diagnostic script") worked in the same folder at the same
time; its hand-off is `A-20261115-c6.md`. The two split the files: that
session took C6, C6m and everything the pipeline writes; this one took the
project page, the app's UI text and layout, and the references.

## Mock judging (local rubric, before these fixes)

Impact 7, Creativity 8, Validity 7, Relevance 9, Presentation 6: 36 of 50.
Main reasons: the project page still made the withdrawn Punjab claim and
quoted old numbers; no demo; the shipped method fails the original C3 in both
calibrated areas and the plain ratio passes it in Córdoba, which the page did
not say; "any area" overclaimed.

## What changed

- `submission/project_page.md` (Charulekha's file, on Mahabu's instruction):
  every Punjab number from the corrected data (C1 -0.016, C3 0.169 fail,
  C3r -0.042, C6 -0.149, C6m -0.081, C7 8.2 days; Aqua drift about 11 percent
  since 2022, about 2 before; season 13,521 to 706 fire cells, with the
  evening-burning caveat); "One check failed, in both areas" now says the
  ratio passes C3 in Córdoba and would ship under the rule as first written;
  the 2016–2017 refit (0.106); "We corrected ourselves" and "Anyone can check
  us"; the four study areas; the monthly error as a typical 20 percent with
  one standard deviation of 28 (Córdoba) and 53 percent (Punjab and Haryana);
  tools and references checked against the code (OpenFreeMap and cividis are
  no longer used and were removed); Use of AI filled from `DECISIONS.md`.
- App (8crsk's and Charulekha's folders, on Mahabu's instruction):
  - Answer line, hero and status panel: a below-normal month carries "Fewer
    fires were seen than usual … does not prove there was less burning"
    (`caveatFor` in `UnusualBanner.tsx`, test `charts/caveat.test.ts`).
  - Checks panel: each added-after check gets its own note
    (`addedAfterNote` in `EvidencePanel.tsx`); only C3r is called a revision.
  - Status detail: the harmonization error is named as one standard deviation.
  - Phones: the map layer controls are folded behind a "Map layers" button at
    the top right (`MapView.tsx`, `styles.css`); desktop is unchanged.
- `docs/REFERENCES.md`: OpenFreeMap, OpenStreetMap and cividis rows marked as
  no longer used.
- C6m for Punjab and Haryana rerun independently from a fresh clone of `main`
  (`from_hotspots.py`, `harmonize.py`, `mcd64.py`): -0.081, the same as the
  other session. Córdoba, Chilecito and Karnataka reproduced exactly.

## Checked

- App: `tsc --noEmit` clean; 259 tests pass; `vite build` succeeds. In the
  browser at desktop and 375 px: the caveat shows for Punjab and Haryana
  (below normal), the three added-after notes and the error wording render,
  the layer panel opens and folds, no console errors.
- Pipeline: 45 tests pass, 17 skipped (need the raw FIRMS files).

## Not done, for the team (as written at about 00:40; see the later sections)

- Not deployed: the live site shows the data of 14 November until this branch
  is merged to `main`.
- The demo video (excluded from this work).

## Added at 00:56: audit of the checks, and a decision waiting for Mahabu

`docs/research/20261115-checks-audit-seasonal-bias.md` has all of it.

- **C3 was catching a real seasonal bias.** After 2012 the record overstates
  Punjab and Haryana's May by about 50 to 75 percent and understates October
  by about 20 percent; Córdoba's summer is overstated, its winter understated.
  The pattern is the same in the fitting years and the held-out years.
- **A constant per calendar month** (`pipeline/seasonal.py`, settings written
  before the run, one run) removes most of it. Under the shipping rule as
  first written the hard floor then passes C0 to C3 in both calibrated areas.
  Not everything passes: 2020 to 2021 in Punjab and Haryana is 0.169, and
  Córdoba's curve fails C2 with seasonal constants.
- **Nothing that ships was changed.** Whether to ship seasonal constants is
  Mahabu's decision (proposed decision 57). It would change every value after
  January 2012 in every area and the model that ships in Córdoba, so every
  number on the project page and in the demo would have to be read again.
- Project page: "independent" burned-area records now say independent of
  VIIRS, not of MODIS. Use of AI: Mahabu's two lines filled; one bracket left
  for 8crsk and Charulekha.
- No threshold was changed, and none should be.

## Added at 01:44 (by `date`): decision 57 shipped, then frozen

**Done.**

- Decision 57 (Mahabu): one conversion constant per calendar month. Pipeline
  changed (`harmonize.py`, `validate.py`, `loyo.py`, `export.py`,
  `sensitivity.py`, `shipping.json`), rerun from the raw FIRMS files, app
  data, figures and walkthrough regenerated. By the rule as first written the
  hard floor ships in Córdoba, Chilecito and Punjab and Haryana, the ratio in
  Karnataka, the detection curve nowhere.
- `results.md`, `limits.md`, `method.md`, `method_panel.md`, `EXPLAINED.md`,
  the READMEs, the dated note in `PREREGISTRATION.md` and
  `pipeline/NOTES_PHASE3.md` say what got weaker: Córdoba within 0.10 of Aqua
  in 3 of 10 years leaving one out (largest miss 0.233, 2013; curve 9 of 10);
  Córdoba C2 -0.094 against 0.10; Punjab and Haryana at the limit (C3 0.148 on
  15 of 24 months, C3x 0.169, fail); C3 failing under three of five other
  settings in Córdoba and all five in Punjab and Haryana.
- Then, on Mahabu's instruction: method frozen; clock times corrected and
  marked; `project_page.md` touched only where false; everything changed in
  8crsk's and Charulekha's areas listed in `submission/inbox/A-judge-fixes.md`
  with the lines of `demo.md` and `submit_checklist.md` that are now wrong.
- Checked: pipeline tests with `FIRE_DATA` set, 70 pass, none skipped;
  `tsc --noEmit` clean; 260 app tests pass; `vite build` succeeds; the app in
  a browser at desktop and at 375 px, no console errors.
- The app's shaded range is wider, not narrower, than the year-by-year error
  (it adds up cell ranges); stated in `limits.md`. The export was not changed.

**Not done.**

- `app/src/` wording that still calls the cut-off what "MODIS could have
  detected", and "50% detection" (inbox note, section 6): 8crsk's files.
- A comment in `pipeline/validate.py` and a docstring in `harmonize.py` still
  say the 2020 to 2021 results had not been looked at and that the settings
  were fixed before the first run. Both files are frozen.
- `landcover.json` and `sources.json` not rerun for Córdoba and Chilecito.
- At 375 px the map showed the whole world for a few seconds before fitting
  to the area on one load; not investigated (app code).
- Not pushed, no pull request, not merged. The live site is unchanged.

## Added at 02:02 (by `date`): what the curve still does, and two findings made reproducible

- "The detection curve ships in no area" was too strong. It does not weight
  the harmonized count; it still sets the hard floor's cut-off and weights
  the small-fire layer in every area (`pipeline/export.py`). Wording corrected
  in Person A's documents, and in one sentence each of `project_page.md` and
  the root `README.md`.
- `pipeline/findings.py` (new; reads only) prints the two findings the
  documents quote: the constants against the midday sun's height (-0.99
  Córdoba, -0.78 Punjab and Haryana) and Aqua against the record by season.
  It reproduced the figures already in `results.md`. Test:
  `pipeline/tests/test_findings.py`.
- `docs/research/20261115-what-is-new-after-the-rebuild.md`: the evaluation
  after the rebuild. `submission/inbox/A-creativity.md`: proposed sentences
  and pitch lines for Charulekha and 8crsk; none is on the page.
- Nothing that ships changed: no model, threshold, verdict or app data file.

## Added at 10:09 (by `date`): decision 58, the detection curve ships in Córdoba and Chilecito

**This replaces what the sections above say about what ships in Córdoba.**

- **Decision 58 (Mahabu):** the detection curve, with the monthly constants,
  ships in Córdoba and in Chilecito, which borrows Córdoba's model. It **sets
  the pre-registered shipping rule aside in Córdoba**: the curve fails the
  2016 placebo (C2, -0.114 against 0.10) and C1x (0.100 against 0.10), and by
  the rule the hard floor would ship. The assistant recommended keeping the
  rule. The reason, in `docs/DECISIONS.md`, is left for Mahabu to write.
  Punjab and Haryana (hard floor) and Karnataka (ratio) are unchanged.
- **Shown before any file was written:** every verdict that flips. Córdoba:
  C2 and C1x pass to fail. Chilecito: C2 fail to pass, C6 pass to fail, C6m
  fail to pass.
- **Rebuilt, Córdoba and Chilecito only:** `meta.json`, `cube.json`,
  `season.json`, `drift.json`, `episodes.json`, 15 hotspot files each (row for
  row the ones committed before decision 57), three figures. Only
  `pipeline/shipping.json` changed in the pipeline. The rebuild ran in an
  isolated copy; a temporary link to the raw data folder was made for it and
  removed (`rmdir` of the link only; the raw files were checked afterwards).
- **Documents:** `results.md`, `limits.md`, `method.md`, `method_panel.md`,
  the root `README.md`, `docs/EXPLAINED.md`, the dated note in
  `PREREGISTRATION.md`, `pipeline/NOTES_PHASE3.md`, the research notes and the
  two inbox notes. A second session ("Values and questions overview") updated
  `submission/project_page.md`, the note at the top of `docs/FULL_MARKS.md`
  and regenerated `A-what-we-show.md`, with the same numbers.
- **Córdoba now, in one line:** C1 0.066, C3 0.072, C3x 0.125 pass; C2 -0.114
  and C1x 0.100 fail; 9 of 10 years within 0.10 of Aqua leaving one out;
  trend -49.2 percent of a typical year per decade, p = 0.004; 1 to 13
  November 2026 is 22nd of 25. Chilecito: July 2026 is 10.2 times the median,
  2nd of 25.
- **Not done:** the app wording listed for 8crsk in the inbox note;
  `landcover.json` and `sources.json` not rerun; a comment in `validate.py`
  and a docstring in `harmonize.py` that overstate what had not been looked
  at (frozen files); `submission/inbox/A-presenter-script.md`, written by a
  third session, says the project page still describes the hard floor, which
  is no longer true. Not pushed; the live site is unchanged.

## Start-time facts

From `git log` (author and committer dates agree for every commit listed) and
`pipeline/NOTES.md` only. Times are IST. No opinion is given here.

| When | What | Source |
|---|---|---|
| 12 Nov 22:28:13 | Initial commit | commit c897204 |
| 13 Nov 10:47:52 to 22:46:17 | Planning documents: context, approach, architecture, task files, roles, stretch goals, getting-started guide, default decisions, FIRMS facts read on the live site (nine commits) | `git log` |
| 13 Nov 22:54 (17:24 UTC) | The eight FIRMS archives were requested; "delivered within hours" | `pipeline/NOTES.md`, line 15 |
| 14 Nov 00:15:11 | Checks and thresholds committed ("Pre-register checks and thresholds before opening data") | commit 64ef07e |
| 14 Nov 00:22:34 and 00:23:36 | Decisions from the challenge author's video; the July 2026 fire identified as likely Chilecito | `git log` |
| 14 Nov 10:15 | Start (`docs/CONTEXT.md`) | not a commit |
| 14 Nov 10:33:14 | Prompts, `CLAUDE.md`, hand-off notes; meta contract extended | `git log` |
| 14 Nov 10:47:52 | Decision protocol and research template (8crsk) | `git log` |
| 14 Nov 10:51:27 | First pipeline commit: inventory, cleaning, raw-jump figures, data tests, first export for three areas | commit 10f20ee |
| 14 Nov 11:08:14 | Harmonization commit: fire cells, detection curve, floor and ratio models, checks | commit 87fcb84 |

The log shows the same times as the list Mahabu gave. It also shows two
commits at 00:22 and 00:23 on 14 November, before the start, that the list
did not name. Git cannot show when a data file was downloaded or opened.

Statements about timing elsewhere, checked against this table, are listed in
`submission/inbox/A-judge-fixes.md`, section 5c. One did not match and was
corrected and marked: `docs/PREREGISTRATION.md` said "about 00:30 IST" for the
00:15 commit. Times in some headings of `docs/DECISIONS.md` are later than
their commits; a correction table was added at the end of that file.

## How the team describes this if asked


