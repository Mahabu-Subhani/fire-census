<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# What the record cannot tell you (draft by Mahabu for the project page)

- **It counts what satellites detected, not every fire.** Fires under cloud or
  thick smoke, and fires that start and end between overpasses, are missed by
  all sensors. Zero detections does not prove there was no fire.
- **The unit is "Aqua-equivalent fire cells", not fires or hectares.** It is
  built so that 2005 and 2025 can be compared, not to measure absolute area.
- **Calibrated in three places only:** Córdoba, Punjab and Haryana, and the
  Chilecito area, which borrows Córdoba's calibration because it has too few
  fires of its own.
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
- **Dates are in UTC,** so a night detection can fall on the previous local day.
- **Not checked against burned-area maps** (check C6 was not run).
