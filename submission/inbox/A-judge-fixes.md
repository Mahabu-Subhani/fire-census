<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending). -->

# For Charulekha and 8crsk: what changed on 15 November, and what is now wrong in your files

From Mahabu (Person A), with the AI assistant. Branch `a/what-we-show`, not
pushed. Two things happened:

1. A mock judging, after which some of your files were edited directly on
   Mahabu's instruction. They are listed in section 1 so you can accept or undo
   each one. Since then nothing more is edited in `app/src/`, `demo.md`,
   `labels.md` or `submit_checklist.md`.
2. **The record was rebuilt** (decision 57): the conversion constant is now
   fitted per calendar month. Every harmonized value from February 2012
   changed in all four areas.
3. **Then Mahabu chose the detection curve for Córdoba** (decision 58), and
   so for Chilecito, which borrows Córdoba's model. This **sets our
   pre-registered shipping rule aside there**: the curve fails the 2016
   placebo (C2, -0.114 against 0.10), and by the rule the hard floor would
   ship. Córdoba's and Chilecito's data were rebuilt once more. The hard floor
   ships in Punjab and Haryana and the ratio in Karnataka, by the rule; their
   files did not change again.

**This replaces what this note said earlier in the day** (that the hard floor
ships in Córdoba and the curve nowhere). Sections 2 to 4 list what is wrong in
your files now. Numbers: `submission/results.md` and `limits.md`.

## 1. Files changed in your areas on this branch

They are committed by topic, so each topic can be reverted alone: the
below-normal caveat; the check notes and method wording; the map layers on
phones; the project page; the root README.

| File | Owner | What changed |
|---|---|---|
| `app/src/App.tsx` | 8crsk | Overview answer card shows a one-sentence caveat under "Below normal" |
| `app/src/layout/Hero.tsx` | 8crsk | The same caveat in the hero answer |
| `app/src/charts/UnusualBanner.tsx` | Charulekha | `caveatFor()` and the `caveat` field of the month status; the status detail says the monthly error is one standard deviation |
| `app/src/charts/caveat.test.ts` (new) | Charulekha | Test: only "below normal" carries the caveat |
| `app/src/evidence/EvidencePanel.tsx` | 8crsk | `addedAfterNote()`: each check added after results (C1x, C3r, C3x, C6m) has its own line; before, all said "Revised limit, added after results". The ladder's caption explains its two rows per method |
| `app/src/evidence/EvidencePanel.test.tsx` | 8crsk | Tests for those notes |
| `app/src/evidence/checks.ts` | 8crsk | `hasMonthlyConstants()`; `shortVersion()` adds one sentence when `meta.constants_by_month` is present, and words the ratio as fitted per calendar month |
| `app/src/evidence/checks.test.ts` | 8crsk | Test for that sentence |
| `app/src/map/MapView.tsx` | 8crsk | At 860 px and narrower the map layer controls start folded behind a "Map layers" button |
| `app/src/styles.css` | 8crsk | `.mf-caveat`, `.ml-toggle` and the folded state |
| `submission/project_page.md` | Charulekha | Before the rebuild: the corrections of 14 November, "four study areas", tools and references checked against the code, Use of AI filled from `DECISIONS.md` (one bracket left for you two). After the rebuild: only numbers and statements that had become false (list in section 2) |
| `README.md` (repository root; not in the ownership table) | none named | "How it works" and "How we tested it" rewritten to the rebuilt record; `pipeline/tests/test_docs_numbers.py` checks its numbers against `meta.json` |

Not changed by us: `demo.md`, `labels.md`, `submit_checklist.md`.

New optional fields in `meta.json` (`constants_by_month`, `year_round_constant`,
`error_by_calendar_month`), a new check row `C3x` and two ladder rows per
method: **proposed, awaiting 8crsk**, in `docs/ARCHITECTURE.md`. The app's 260
tests pass on the new files.

## 2. Charulekha: `submission/project_page.md`, as it stands after decision 58

Edited on Mahabu's instruction, only where a number or statement had become
false. What it now says:

- Summary: the record uses a measured curve of how often MODIS sees a fire of
  each strength, and a constant per calendar month.
- "What it does": Punjab and Haryana, 1 to 13 November, is **23rd of 25**,
  0.09 times the median, range 22nd to 25th. Córdoba's falling trend is
  p = 0.004, about half per decade.
- "How it works": the detection curve weights every fire in Córdoba; the hard
  floor is used in Punjab and Haryana, where the curve is weak.
- "How we know it works", Córdoba: C1 0.066; C3 0.072 and C3x 0.125, both
  passes; **C2 fails (-0.114) and C1x fails (0.100), and the page says our own
  rule would ship the hard floor there**. Punjab and Haryana is **at the
  limit** (C3 0.148 against 0.15; C3x 0.169, a fail).
- Chilecito: 10.2 times a normal July (was 8.8 on 14 November), 2nd of 25,
  9th of 230 episodes; it fails C1, C4 and C6.
- Punjab's season: 14,584 fire cells in 2020 to 762 in 2025. Aqua since 2022:
  29 percent more than the record (48 percent in October and November).
- Re-read the live numbers again on the day, from the deployed app.

## 3. Charulekha: `submission/demo.md`, lines that are now wrong

| Line | Says | Now |
|---|---|---|
| 33 (0:16 to 0:20) | "We measured what the older sensor can see, and the jump disappears." | True of the method. But the shot leads with Punjab and Haryana, where the curve is weak (plateau 0.118) and only its midpoint is used as a cut-off. If you want the line exact for the area on screen: "We count only fires above a measured cut-off, and the jump disappears." (12 words). If the shot is Córdoba, the line as written is exact |
| 34 (0:20 to 0:25) | answer card "24th highest of 25 Novembers" | "23rd highest of 25 Novembers" with data to 13 November; read the live wording on the day, as the line already says |
| 96 (local pitch) | "the detection limit agreeing with physics" | True for Córdoba's cut-off only (9.9 MW against 10.4 MW). Do not say it of Punjab and Haryana |
| 35 (0:25 to 0:28) | "Every check shown, pass or fail" | Still true. The Punjab and Haryana panel now shows C3 passed at 0.148 and C3x failed at 0.169; if asked, say "at the limit" |

Nothing else in the script quotes a number.

## 4. Charulekha: `submission/submit_checklist.md`, lines that are now wrong

| Line | Says | Now |
|---|---|---|
| 17 | NASA data: "FIRMS MODIS C6.1 and VIIRS C2; MYD14A1" | Also MCD64A1 (check C6m) |
| 22 | "Python libraries still missing" | They are in `docs/REFERENCES.md` since 14 November |
| 25 | "No work before 14 Nov 10:15: Git history starts work after the start: Done" | See section 5 |
| 30 to 32 | "our measured detection curve's [error] does not [follow the mix] (p = 0.33)" | True again for Córdoba, where the curve ships; the value is now p = 0.37 (rank correlation 0.32). The ratio's follows the mix (-0.75, p = 0.013). Add, if there is room: a single ratio is also wrong by season (in Punjab, May read about 75 percent too high) |
| 37 and 66 | "calibrated for three areas only" | Two calibrated areas (Córdoba, Punjab and Haryana) and two case studies (Chilecito, Karnataka) |
| 59 to 61 | "C3 fails in both main regions; we added C3r" | With one constant per calendar month C3 passes: Córdoba 0.072, Punjab and Haryana 0.148 against 0.15. Not cleanly: the method was changed after the failure, and C3x on 2020 to 2021 fails in Punjab and Haryana (0.169), where C3 also fails under five other settings |
| 62 to 63 | "Punjab's detection curve failed C8, so Punjab ships the hard floor" | Still true |
| new | (missing) | **Córdoba ships a model our own rule would not ship.** The curve fails the 2016 placebo (C2, -0.114 against 0.10) and C1x (0.100); by the rule the hard floor would ship there. Mahabu chose the curve after seeing both results (decision 58). A judge may call it picking the winner afterwards; both models' results are in the app |
| 64 | "Chilecito fails C1 and C4" | Still true, and it also fails C6 (+0.394) |
| 65 | "C6 (burned area) was not run anywhere" | Run in all four: Córdoba fails (-0.446; NASA's product -0.381; Aqua alone fails the same way), Punjab and Haryana passes (-0.148; -0.080), Chilecito fails C6 (+0.394) and passes C6m (-0.226), Karnataka fails both (+0.347; +0.438) |
| 67 | "a snapshot of 5 Nov 2026 data" | Data to 13 November 2026 |

## 5. Start-time wording: proposals, nothing edited in your files

Facts only, from `git log` and `pipeline/NOTES.md`; the full timeline is in
`docs/handoffs/A-20261115-judge-fixes.md`. How to describe it is for the
three of us.

**5a. `submission/submit_checklist.md`, line 25.** The row says "Git history
starts work after the start: Done". Proposed replacement:

| No work before 14 Nov 10:15 | Planning documents (12 to 13 Nov), the FIRMS data request (13 Nov) and the checks (14 Nov, 00:15) are dated before the start. The first pipeline code is dated 10:51, after it | Team to agree how to describe this |

**5b. `submission/project_page.md`, "Use of AI", line 330.** It says "Mahabu
requested the eight FIRMS archives from NASA and set up the data access."
Proposed addition of the date: "requested on 13 November, before the start,
and opened after it". **Mahabu to confirm this is exactly what happened.** It
is not on the page and should not go there until Mahabu confirms.

**5c. Other statements about timing, checked against the timeline.**

| Where | Says | Against the timeline |
|---|---|---|
| `project_page.md` lines 29, 113, 327, 347 | checks written, and thresholds accepted, "before the data was opened" | The checks were committed on 14 Nov at 00:15:11 and the first code that reads the data at 10:51:27. Git cannot show when a file was opened. No mismatch found; no change proposed |
| `project_page.md` line 313 | Gemini critiqued the method "before the hackathon" | `docs/AI_USE.md` dates it 12 to 13 Nov. Matches |
| `submit_checklist.md` line 25 | "Git history starts work after the start" | Says more than the history shows: see 5a |
| `docs/PREREGISTRATION.md` lines 3 to 4 (Mahabu's file) | "committed 14 November 2026, about 00:30 IST" | The commit is 00:15:11. Corrected there and marked |
| `results.md` line 18, `method.md` line 33, `method_panel.md` line 30, `README.md` line 56, `docs/EXPLAINED.md` lines 170 to 173 (Mahabu's files) | "before the data was opened" / "analysed"; "committed at 00:15" | No mismatch found; unchanged |

## 6. 8crsk: app text that the rebuild made inexact (not edited)

- `app/src/evidence/checks.ts` lines 90 to 91: "only VIIRS fire cells MODIS
  could have detected are counted (above X MW ...)". In Punjab and Haryana the
  cut-off is not a measured detection limit (the curve there has a plateau of
  0.118). Suggested: "only VIIRS fire cells at or above a measured strength
  cut-off are counted (X MW by day and Y MW by night)". `meta.unit_note` already
  says it this way.
- `app/src/evidence/EvidencePanel.tsx` line 158: "Daytime 50% detection at X
  MW". It is half of the curve's plateau, not half of all fires. Suggested:
  "Daytime midpoint X MW (dashed line): the cut-off the hard floor uses."
- The hotspot files' `harm_reason` still says "VIIRS fire cell MODIS would
  usually see / miss". That text comes from `pipeline/hotspots.py`; changing
  it means rewriting the hotspot files, which was not done.
- `landcover.json` and `sources.json`: Córdoba's and Chilecito's hotspot
  classes are back to the ones committed before decision 57 (the curve's),
  so decision 58 puts nothing new out of date. The earlier note still
  applies: 985 rows were relabelled on 14 November after these two files
  were made, so a rerun stays optional.
- Numbers quoted in `B-people-and-live.md`, `C-exposure.md`, `B-judges-pitch.md`
  and decisions 48 and 52 come from `harm`: read them again from the app.
