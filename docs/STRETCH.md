# Stretch goals: the ambitious layer

Status: **proposal for the team to accept, change or reject.** Nothing here
starts until the Saturday 19:30 checkpoint in `docs/APPROACH.md` has passed. A
working core with one finished stretch goal beats three unfinished ones.

Each goal uses the harmonized record to do something the raw records cannot.
They are ordered by value for effort. Pick at most two.

## S0. Completeness curve: treat the two sensors like two telescopes

**Where the idea comes from.** Astronomers have long merged star and galaxy
catalogues from telescopes of different sensitivity. They do not use a single
conversion factor. They measure each telescope's *completeness curve* (the
chance it detects an object of a given brightness) and work with the
*luminosity function* (how many objects exist at each brightness). MODIS and
VIIRS are two telescopes of different sensitivity looking at the same fires.

**What we build.** This replaces the hard floor of level L2 with a smooth curve.
The hard floor is the special case where the curve is a step.

1. In the overlap years, build the histogram of fire-cell FRP for Aqua and for
   S-NPP, per day/night (and land cover if time allows).
2. Their ratio, as a function of FRP, is MODIS's completeness relative to
   VIIRS: near 0 for weak fires, rising to a plateau for strong ones. Rescale
   so the plateau is 1 (this absorbs swath-coverage differences), and force
   the curve to be non-decreasing.
3. Harmonized VIIRS-era activity = the sum of the curve's value over all VIIRS
   fire cells. In words: the number of fire cells MODIS would be expected to
   see. Each cell counts as a fraction between 0 and 1, not as in or out.
4. The same sum gives an uncertainty for free: the variance is the sum of
   c x (1 - c) over the cells. This fills `harm_lo` and `harm_hi` without a
   bootstrap.
5. Show the curve in the app's method panel. It is the one picture that
   explains why the sensors disagree.

**Optional extra.** The slope of the FRP distribution above the plateau is a
sensor-independent measure of how intense an area's fires are. Tracking it by
year asks "are fires here getting stronger?", which raw counts cannot answer.

**Prior work (VERIFY before citing).** FRP frequency distributions have been
used to compare fire products, including an inverse-gamma fit whose "rollover"
marks where a sensor stops detecting weak fires. Detection limits for MODIS and
VIIRS are published. We have not found this used as the harmonization step of
a fire calendar, but we must not claim it is the first.

**Risks.** MODIS and VIIRS FRP for the same fire are not on exactly the same
scale, so the curve is empirical, in VIIRS-FRP units. Histograms need enough
fires per bin: pool months and use wide bins. It must pass the same tests T1
to T6 as the hard floor. If it does no better, ship the hard floor and report
the comparison.

**Owner:** A. **Cost:** about two hours on top of L2. **Order:** build L2
first; attempt S0 only after L2 has a test result.

## S1. The record finds a real event: Punjab's shifted burning season

**Claim to test:** a harmonized record should reproduce a change that is already
documented independently. In 2009 Punjab and Haryana passed groundwater laws
that delayed rice planting. A 2019 Nature Sustainability study reported that
the peak date of agricultural fires moved from about 24 October to about
4 November afterward. **VERIFY** the paper and its numbers before citing
(summary: https://phys.org/news/2019-07-groundwater-policies-air-pollution-northwest.pdf).

**What we build:** for a selected area, compute the fire season's start, peak
and end date for each year from the harmonized daily record, and plot them
against year. For Punjab and Haryana, check whether the peak date shifts after
2009.

**Why it matters:** 2009 is before VIIRS, so this result depends on the MODIS
half of the record being consistent with the VIIRS half. It is a real-world
validation, a discovery tool (season timing for any area), and a story that
matters to Indian judges. It also directly serves "critical periods", which the
challenge statement names.

**Owner:** A computes season dates; B adds a "season timing" chart; C tells the story.
**Needs:** daily (not only monthly) harmonized counts for that region.
**Honesty rule:** if the shift does not appear, report that and investigate why.

## S2. A living record: the calendar updates itself every day

**What we build:** a scheduled GitHub Action that fetches the latest FIRMS
near-real-time detections each day, runs the pipeline for the newest month, and
republishes the data files. The FIRMS key is stored as a repository secret.

**Why it matters:** judges open the link in December and see this week's
burning against the 24-year normal, not a snapshot from November. It turns a
hackathon demo into a working early-warning tool, which is what Validity's
"ready for real-world implementation" asks for.

**Owner:** A writes the incremental step; B shows "last updated" and the alert.
**Risks:** near-real-time files lack the `type` field (see ARCHITECTURE.md);
S-NPP may no longer be available, so the harmonized series must run on NOAA-20
and NOAA-21 alone and be tested for that.

## S3. Giving the past today's eyes: estimated small fires before 2012

**What we build:** from 2012 onward we know both the above-floor activity and
the small-fire layer. Learn how the small-fire share depends on land cover,
season and above-floor activity, then estimate the small-fire layer for
2002 to 2011, with a range. Shown as a clearly separate, hatched "estimated"
layer, never mixed into the observed record.

**Why it matters:** it answers "what would VIIRS have seen in 2005?" and gives
one full-detail series back to 2002.

**Owner:** A. **Risk:** this is a model, not an observation. It must be
validated by hiding known years and predicting them, and labelled as an estimate
everywhere it appears. Do this last.

## Not recommended

- **Going global.** The full archive is hundreds of millions of rows. It would
  consume the time needed for testing.
- **Adding weather, smoke or forecasting modules.** Other teams do this; it
  spreads effort and is not what the challenge asks.
