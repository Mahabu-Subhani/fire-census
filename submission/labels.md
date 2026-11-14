<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending). -->

# Short texts for the app (for 8crsk)

Wording rules: say "hotspots" or "detections" for what satellites report, and
"burning" for activity in general. Never say "fires" when we mean detected
hotspots, and never say "wildfire" for crop burning. Take the unit from
`meta.unit` and `meta.unit_raw`; never type it.

| Where | Text |
|---|---|
| Raw / Harmonized switch | **Harmonized:** one record from 2002 to now, counted the same way whichever satellite was watching. **Raw:** MODIS and VIIRS detections added as they are; VIIRS sees more small fires, so the record jumps in 2012. |
| Small-fire switch | Small fires: weak fires only VIIRS can see, from 2012. Shown as their own layer, never added into the harmonized record. |
| Zero detections | No hotspots were detected here in this period. Zero detections does not prove there was no fire: cloud, smoke and fires between satellite passes are missed. |
| No valid observation | No clear view: the satellite could not see the ground here this month (cloud or smoke), so we cannot say whether there was burning. |
| Terra only | Before July 2002 only Terra was flying. These months are shown as recorded and are not harmonized. |
| MODIS continuity (APP_VISION first principles) | When MODIS ends, the record continues on VIIRS in the same units. |
| Excluded sources (APP_VISION first principles) | Gas flares, volcanoes and other static hot sources are excluded, because they are not burning of vegetation. |
| Near-real-time | The latest months use near-real-time data and may change when final data arrives. |
| Outlook | History, not a forecast. |
