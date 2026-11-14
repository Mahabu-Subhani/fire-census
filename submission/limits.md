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
- **Punjab's calibration is weak, and its result is at the limit.**
  Crop-residue fires are small and last minutes, so two satellites passing
  minutes apart often see different fires. The curve there is weak (daytime
  match rate 0.160, chance 0.091, plateau 0.118) and too uncertain to ship
  (check C8), so the hard floor's cut-off of 4.8 MW is a cut-off we use, not a
  measured detection limit. Month by month the record is at the limit: C3 is
  0.148 against 0.15 on 15 of 24 months, C3x on 2020 to 2021 is 0.169, a
  fail, and C3 fails under each of five other settings we tried.
- **The method was changed after a check failed.** With one conversion
  constant for the whole year the month-by-month check C3 failed, because the
  error followed the season. Since 15 November the constant is fitted per
  calendar month. C3 now passes, but that pass was reached after seeing the
  held-out years, and it is not robust to settings (in Córdoba it fails under
  three of five others). The check on two later years (C3x) is the cleaner
  one: only their yearly totals had been looked at before.
- **Single calendar months still carry a known error.** After the monthly
  constants, the record against Aqua in the held-out years is within about
  20 percent in the main burning months (Punjab and Haryana: May -8 percent,
  October -16, November -2; Córdoba: July -9, August -14, September -15). It
  is worse where few fires burn, and in Punjab and Haryana's April, which
  reads about 45 percent too low because it shares May's constant. Compare
  years, or the same month across years; do not read one off-season month.
- **In Córdoba the yearly totals got weaker.** The rule ships the hard floor
  there. Leaving one year out at a time, it is within 0.10 of Aqua in 3 of 10
  years (largest miss 0.233, in 2013), against 9 of 10 for the detection
  curve, which fails the 2016 placebo check and so does not ship. The hard
  floor's error follows the mix of weak and strong fires. **Yearly totals in
  Córdoba after 2012, and any yearly trend that includes them, carry this
  error.** The falling trend the app reports there is still clear (p = 0.007).
- **Thin margins.** Córdoba passes the 2016 placebo (C2) at -0.094 against
  0.10. Punjab and Haryana passes C3 at 0.148 against 0.15. Neither would
  survive a small change, and under other settings they do not.
- **The shaded range in the app is not a measured error.** It adds up each
  map cell's own range (counting noise and the spread of the constants), so
  for a whole area it is wide: about -65 to +75 percent for a year in
  Córdoba, -29 to +30 percent in Punjab and Haryana. That is wider, not
  narrower, than the year-by-year error measured by leaving one year out
  (largest 0.233 and 0.135), and it was not calibrated against it. Read it as
  a rough band.
- **The record drifts slowly against Aqua inside the VIIRS years.** The 2016
  placebo is negative in every area (3 to 13 percent between 2013 to 2015 and
  2016 to 2018). We have not found the cause.
- **In Punjab's rice season the record may now miss much of the burning.**
  The record after 2012 is what VIIRS sees at about 13:10. Since 2022, Aqua,
  whose pass has drifted to mid-afternoon, has reported 48 percent more than
  the record in October and November (1.6 to 1.8 times over 2024 and 2025),
  and no more in April to June. Burning later in the day would explain it.
  A low rank for a recent October or November is fewer fires seen at 13:10,
  not proof of less burning.
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
- **Burned area per detected fire changed in Córdoba after 2012** (checks C6
  and C6m). Aqua alone shows the same change, so it is not a seam, but it
  means fire-cell counts are not a fixed proxy for hectares burned. Both
  burned-area products are MODIS-based, so they are independent of VIIRS, not
  of MODIS.
