<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. For 8crsk: text for the app's Method panel. Numbers in {braces} come from meta.json; do not type them. -->

# Text for the app's Method panel

## Heading
How we made two satellites agree

## Short version (always visible)
Newer VIIRS satellites see far more fire hotspots than the older MODIS, so a
simple count jumps in 2012. We express everything in what MODIS would have
seen: from 2012 only VIIRS fire cells at or above a measured strength
cut-off are counted, scaled by a constant for each calendar month because
the two sensors' relation follows the season. Weaker fires only VIIRS can
see are kept in the small-fire layer.

## Detail (expandable)
**Unit.** {meta.unit}. Before February 2012 the calendar counts what Aqua
MODIS reported. From February 2012 it counts what Aqua would have reported,
computed from VIIRS.

**Method shipped here:** {meta.level_name}. {meta.shipping_reason}

**The curve.** Where Aqua and Suomi NPP passed over the same place on the same
day ({meta.calibration.months}), we asked: did Aqua also report the fire VIIRS
saw? The answer, by fire strength, is the curve shown. Its midpoint,
{meta.floor_mw.day} MW by day, is the cut-off the hard floor uses. The curve
does not weight the harmonized count; it weights the small-fire layer. Where it is weak (Punjab and Haryana: plateau
0.118) the cut-off is not a measured detection limit; do not call it one.

**Checks.** Ten checks were written down before the data was opened. Each is
listed with its limit, its value and whether it passed. Four checks (C1x,
C3r, C3x, C6m) were added after the results and are labelled so; none
replaces an original.

**Limits.** Counts are detections, not every fire: cloud and smoke hide fires
from all satellites. One month on its own is noisy; compare the same month
across years. Recent months are provisional.

## Labels for the checks list
- pass: "Passed"
- fail: "Failed"
- not run: "Not run"
- Note under C3r: "Added after results as a revised version of C3. C3 is
  shown with its original verdict." (The earlier wording, that C3's limit was
  stricter than two satellites can agree, is withdrawn: C3 was catching a
  seasonal error, corrected on 15 November.)
