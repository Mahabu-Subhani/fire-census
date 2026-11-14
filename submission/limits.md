<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# What the record cannot tell you (draft by Mahabu for the project page)

- **It counts what satellites detected, not every fire.** Fires under cloud or
  thick smoke, and fires that start and end between overpasses, are missed by
  all sensors. Zero detections does not prove there was no fire.
- **The unit is "Aqua-equivalent fire cells", not fires or hectares.** It is
  built so that 2005 and 2025 can be compared, not to measure absolute area.
- **Calibrated in two places only:** the Córdoba area (a box around the province, including parts of its neighbours) and Punjab and Haryana (the exact states), plus the
  Chilecito area, which borrows Córdoba's calibration because it has too few
  fires of its own. A fourth area, the forests of south Karnataka, was added
  late as a case study: no method passes its held-out checks, so the plain
  conversion ratio is used there and the app labels it.
- **Punjab's calibration is weak.** Crop-residue fires are small and last
  minutes, so two satellites passing minutes apart often see different fires.
  Its detection curve was too uncertain to ship (check C8), and its results move
  when settings change.
- **Month to month the record is noisier than year to year.** A single month can
  differ by about 20 percent from what MODIS would have reported. Compare years,
  or the same month across years, rather than reading one month alone.
- **Afternoon and night overpasses only.** Terra's morning pass is kept as a
  separate raw series and used only before July 2002, when Aqua was not yet
  flying. Those months are marked "Terra only, not harmonized".
- **The last three months are provisional.** Near-real-time data from August
  2026 onward will be replaced by final data, and non-fire heat sources there
  are removed with a mask built from older data.
- **Not every heat source is a fire.** Detections NASA flags as volcanoes,
  offshore sources or other static land sources (gas flares, industry) are
  excluded, as are near-real-time detections at places that the final data has
  repeatedly flagged that way. Agricultural, land-clearing and waste burning
  stay in, because they are burning activity.
- **Night values are uncertain.** The night detection curve rests on few
  fires (575 Aqua night fire cells in Córdoba's fitting years, 156 in Punjab
  and Haryana's) and would not pass our stability check on its own. Night is
  7.4 percent of Córdoba's reference record and 0.2 percent of Punjab and
  Haryana's.
- **Clear-view days (`obs`) are too high in January.** The first one to three
  days of each January were counted twice (and a few months had a file counted
  twice). Values are capped at the days in the month; January is still up to
  3 days high until `pipeline/obs.py`, now corrected, is rerun on the daily
  fire masks. `obs` is a data-quality note only and does not enter the record.
- **The PELT second opinion for C1b was not run.** The pre-registration says
  PELT would be reported beside the Pettitt test, not gated. It was never
  computed; only the Pettitt test is shown.
- **Chilecito has no rank range.** It has too few months to measure its own
  monthly error, so the "Nth highest" line has no range there.
- **Dates are in UTC,** so a night detection can fall on the previous local day.
- **Burned area per detected fire changed in Córdoba after 2012** (ESA Fire_cci, check C6). Aqua alone shows the same change, so it is not a seam, but it means fire-cell counts are not a fixed proxy for hectares burned.
