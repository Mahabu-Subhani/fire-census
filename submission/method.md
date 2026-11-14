<!-- AI-assisted: drafted with help from Claude (Anthropic) from pipeline results. Reviewed by: Mahabu Subhani. -->

# Method, for an emergency manager (draft by Mahabu for the project page)

**The problem.** Since 2012 a sharper satellite sensor, VIIRS, has counted
fires alongside the older MODIS. Add their counts together and fire activity
appears to jump about fivefold in 2012, in Punjab and in Córdoba alike. The
jump is the camera, not the fire.

**Three reasons the sensors disagree, and one fix for each.**

1. *The sharper camera counts one fire many times.* A fire that fills one
   MODIS pixel fills several VIIRS pixels. We lay a 1 km grid over the map and
   count each square once per satellite pass.
2. *The sharper camera sees weak fires the older one misses.* Where both
   satellites flew over the same place on the same day, we measured how often
   MODIS also reported a fire that VIIRS saw, at every fire strength. That gives
   MODIS's detection curve: weak fires are usually missed, strong ones almost
   always caught. The record counts the fires VIIRS sees at or above the
   midpoint of that curve (the hard floor), so 2025 is measured on the same
   scale as 2005. The curve does not weight that count. It weights the
   small-fire layer below. Where the curve is weak, as in Punjab and
   Haryana, the midpoint is a cut-off we use, not a measured detection
   limit.
3. *How much the older camera misses changes with the season.* In hot months
   and with different crops, MODIS misses a different share. So the count is
   scaled by a constant fitted for each calendar month, not one for the whole
   year. Our own held-out check found this: with one constant, Punjab and
   Haryana's May read about half too high and its October a fifth too low.

**What is kept.** The weak fires only VIIRS can see are not thrown away. They
form a separate small-fire layer, mostly crop burning: each fire VIIRS sees
adds its chance of being missed by MODIS, read from the curve.

**How we know it works.** Ten checks were written down before the data was
opened, and every result is shown, including the ones that failed.
