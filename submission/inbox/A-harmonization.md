<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# For Charulekha: one-line versions for the project page

> **Superseded on 15 November by decision 57.** Every number in the list of
> corrections below was right for the record as it stood late on 14 November.
> The record was rebuilt on 15 November with one constant per calendar month,
> so use `submission/results.md`, `submission/limits.md` and
> `submission/inbox/A-judge-fixes.md` instead. Kept for the history.

Full drafts: `submission/method.md`, `results.md`, `limits.md`, `nasa_data.md`.
Figures: `submission/figures/`.

- **Summary line:** Fire Census turns 24 years of NASA MODIS and VIIRS hotspots
  into one burning calendar in which 2005 and 2025 mean the same thing, using a
  measured curve of what the older sensor can see.
- **Strongest evidence (Validity):** our curve, built only from where two
  satellites agreed, puts MODIS's daytime detection limit over Córdoba at 9.9
  MW; a 2026 physics paper's formula gives 10.4 MW for the same pixel sizes.
- **Creativity:** we treat the two sensors like telescopes of different
  sensitivity and correct for each one's completeness, instead of fitting one
  conversion factor; and we show that a conversion factor fails exactly when the
  mix of weak and strong fires changes.
- **Impact:** MODIS is ending and its orbit has drifted two hours since 2021.
  Our record keeps the first ten MODIS-only years usable and does not inherit
  the drift.
- **Honesty:** 10 checks were fixed before the data was opened, and three were added after and are labelled so (C3r, C1x, C6m). Of the 13 rows the app shows for Córdoba, 9 pass,
  3 fail (C3; C6 and C6m, where Aqua alone fails the same way) and 1 does not apply; in Punjab and Haryana the shipped method fails one (the original C3, 0.169 against 0.15) and passes the rest that apply to it. All are shown in the app.

Best figures, in order: `harmonized_cordoba.png` (the jump and its removal),
`detection_curve_cordoba.png`, `orbit_drift.png`, `ratio_stability_cordoba.png`.

## Corrections for the project page (Mahabu, 14 Nov, about 23:30)

**Read this first.** A second, independent read of the pipeline found an error
that changes Punjab and Haryana's record and one of its verdicts. Everything
was confirmed by rebuilding the record from the hotspot files in the
repository, then fixed, and all app data was regenerated. Details:
`pipeline/NOTES_PHASE3.md`, last section. `project_page.md` is your file, so
the changes below are proposals, with the exact new numbers.

### Must change (the page is wrong without these)

1. **"How we know it works", last paragraph on Punjab and Haryana.** It says the
   hard floor "passes every pre-registered check that applies to it, including
   the original month-by-month held-out check C3 (0.144 against 0.15), the 2012
   step (0.028)". Replace with:

   > In Punjab and Haryana (exactly the two states and Chandigarh, 94,490 km²)
   > the detection curve is too uncertain to use (C8: 62 percent against a
   > limit of 50), so the hard floor ships. It fails the same month-by-month
   > held-out check as Córdoba's curve (C3: 0.169 against 0.15) and passes the
   > rest that apply to it: the 2012 step (-0.016), the two-year held-out
   > total (C3r, -0.042), NOAA-20 agreement (slope 1.025, correlation 0.993)
   > and both burned-area checks (ESA -0.149, NASA -0.081). The record also
   > reproduces a documented change: a 2019 study reported that Punjab's peak
   > burning day moved later after 2009 groundwater laws delayed rice
   > planting, and across both sensors our median burning day moves 8.2 days
   > later (C7, p = 0.0009).

2. **"How it works", the ladder sentence:** "in Punjab and Haryana the hard
   floor, which we ship there, leaves 0.028" becomes "leaves -0.016".

3. **"One check failed" (C3).** It says the limit "could not be met by any real
   harmonization". In Córdoba the plain ratio meets it (0.120). Replace with:

   > **One check failed, in both areas.** Held-out years 2018 to 2019, compared
   > month by month (C3, limit 0.15): 0.207 for Córdoba's curve and 0.169 for
   > Punjab and Haryana's hard floor. A plain conversion ratio passes it in
   > Córdoba (0.120), so under our rule as first written the ratio would ship.
   > Month by month, two satellites passing at different times disagree by
   > about 20 percent, so we added a check on the two-year total (C3r, limit
   > 0.10; all three methods pass it in both areas), recorded the change in a
   > dated note, and ship under it. Both verdicts are shown side by side. We
   > prefer the curve in Córdoba because, fitted without the 2012 to 2014
   > years, the ratio leaves a step at 2012 (0.143) and the curve does not
   > (0.087), and because the ratio's error follows the mix of weak and strong
   > fires.

4. **"Why it matters", orbit drift:** "Since 2022 Aqua reports 6.2 percent more
   fire there than the harmonized record (2.2 percent less before)" becomes
   "about 11 percent more (2.3 percent more before)". (0.105 is a log ratio: about 11.1 percent; corrected 15 Nov.)

5. **"Who uses it" table, pollution-control boards:** "fell from 14,142 fire
   cells in 2020 to 737 in 2025" becomes "from 13,521 in 2020 to 706 in 2025".

6. **Numbers read from the live app** (Punjab's November rank and ratio, the
   trend sentences) must be read again after this branch is deployed: every
   Punjab and Haryana value from February 2012 on is 4.6 percent lower.

### Should add (one sentence each)

7. **We corrected ourselves.** "Late on 14 November an independent read of our
   code found that the hard floor's constant was fitted on a different rule
   from the one it was applied with; Punjab and Haryana's record was 4.6
   percent too high after 2012 and one check there had been reported as a
   pass that is a fail. We fixed it, reran everything and say so here."
   Judges reward this more than they punish it, and the old number was live.

8. **The out-of-sample step, both windows.** After "the step is 0.087, a pass"
   add: "on a shorter fit, 2016 to 2017 only, it is 0.106, just over".

9. **Anyone can check us (Validity).** "Every detection we used ships with the
   app, so the whole method can be rerun from the repository alone, with no
   NASA account: four commands, about 15 minutes (README). We did this from a
   fresh clone and every check value matched."

10. **Known answer (Validity), optional.** "We also tested the code on
    simulated fires where the right answer is known: it recovers a known
    detection curve, and when the mix of weak and strong fires changes the
    curve record stays within 5 percent while one constant ratio is off by
    more than 30 percent (`pipeline/tests/test_method.py`; a test of the
    logic, not evidence about real fires)."

11. **"Use of AI", the last paragraph.** It lists four decisions made by the AI on a team member's
    instruction (30, 31, 36, 37). There are now five: add 54 (how the hard-floor constant is
    fitted). Also true and worth one clause: the error was found by an AI review of the code,
    and confirmed by rerunning the pipeline.

### For 8crsk

- `meta.json`, `cube.json`, `season.json` and `drift.json` changed for Punjab
  and Haryana; `meta.json` (check notes, sources) and `cube.json` (ranges and
  `obs` only) for the other areas. No field was added or removed. `npm test`
  passes on the new files (215 tests).
- `meta.unit_note` now names the method that ships in each area (it said
  "detection curve" everywhere).
- Chilecito's C1b is now "not run" (4 usable months; the test cannot fail on
  so few), so the Checks panel shows one fewer pass there.
- 985 rows in the hotspot files changed from harmonized or small to excluded
  (S-NPP in months the record does not use it). `landcover.json` and
  `sources.json` were made from the old labels: rerunning
  `app/scripts/make_landcover.py` and `make_sources.py` is optional.
- Numbers quoted in `B-people-and-live.md`, `C-exposure.md` and decision 48
  ("harmonized +3 %") come from Punjab's `harm`: please read them again.
- `docs/ARCHITECTURE.md`: `curve` is filled in every area (the contract said
  "empty if the hard floor shipped", which was never true of the files).
