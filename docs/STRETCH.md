# Stretch goals: the ambitious layer

Status: **proposal for the team to accept, change or reject.** Nothing here
starts until the Saturday 19:30 checkpoint in `docs/APPROACH.md` has passed. A
working core with one finished stretch goal beats three unfinished ones.

Each goal uses the harmonized record to do something the raw records cannot.
They are ordered by value for effort. Pick at most two.

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
