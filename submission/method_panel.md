<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. For 8crsk: text for the app's Method panel. Numbers in {braces} come from meta.json; do not type them. -->

# Text for the app's Method panel

## Heading
How we made two satellites agree

## Short version (always visible)
Newer VIIRS satellites see far more fire hotspots than the older MODIS, so a
simple count jumps in 2012. We express everything in what MODIS would have
seen, using a curve of how likely MODIS is to catch a fire of each strength.
Weaker fires only VIIRS can see are kept in the small-fire layer.

## Detail (expandable)
**Unit.** {meta.unit}. Before February 2012 the calendar counts what Aqua
MODIS reported. From February 2012 it counts what Aqua would have reported,
computed from VIIRS.

**Method shipped here:** {meta.level_name}. {meta.shipping_reason}

**The curve.** Where Aqua and Suomi NPP passed over the same place on the same
day ({meta.calibration.months}), we asked: did Aqua also report the fire VIIRS
saw? The answer, by fire strength, is the curve shown. Half of fires at
{meta.floor_mw.day} MW are caught by day.

**Checks.** Ten checks were written down before the data was opened. Each is
listed with its limit, its value and whether it passed. One check (C3r) was
added after the results, with the reason, and is shown next to the original.

**Limits.** Counts are detections, not every fire: cloud and smoke hide fires
from all satellites. One month on its own is noisy; compare the same month
across years. Recent months are provisional.

## Labels for the checks list
- pass: "Passed"
- fail: "Failed"
- not run: "Not run"
- Tooltip for C3r: "Added after we saw the results, because C3's limit was
  stricter than two satellites can agree month by month. Both are shown."
