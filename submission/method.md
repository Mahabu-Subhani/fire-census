<!-- AI-assisted: drafted with help from Claude (Anthropic) from pipeline results. Reviewed by: Mahabu Subhani. -->

# Method, for an emergency manager (draft by Mahabu for the project page)

**The problem.** Since 2012 a sharper satellite sensor, VIIRS, has counted
fires alongside the older MODIS. Add their counts together and fire activity
appears to jump about fivefold in 2012, in Punjab and in Córdoba alike. The
jump is the camera, not the fire.

**Two reasons the sensors disagree, and one fix for each.**

1. *The sharper camera counts one fire many times.* A fire that fills one
   MODIS pixel fills several VIIRS pixels. We lay a 1 km grid over the map and
   count each square once per satellite pass.
2. *The sharper camera sees weak fires the older one misses.* Where both
   satellites flew over the same place on the same day, we measured how often
   MODIS also reported a fire that VIIRS saw, at every fire strength. That gives
   MODIS's detection curve: weak fires are usually missed, strong ones almost
   always caught. Each fire VIIRS sees today is counted by its chance of being
   seen by MODIS, so 2025 is measured on the same scale as 2005.

**What is kept.** The weak fires only VIIRS can see are not thrown away. They
form a separate small-fire layer, mostly crop burning.

**How we know it works.** Ten checks were written down before the data was
opened, and every result is shown, including the ones that failed.
