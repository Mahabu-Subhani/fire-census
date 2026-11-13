# Approach: how we harmonize, how we test it, what we fall back to

Status: **proposal under team review.** The team owns these decisions. Sections
marked DECIDE need a human choice before or at the start of the hackathon.

## The problem in numbers

VIIRS (375 m pixels) reports several times more hotspots than MODIS (1 km pixels)
for the same burning, for two separate reasons:

1. **Resolution.** One fire front that fills one MODIS pixel fills several VIIRS
   pixels. Same fire, more rows.
2. **Sensitivity.** VIIRS detects small, cool fires that MODIS cannot see at all.

A raw count series therefore jumps when VIIRS data begins (2012). The jump is an
instrument artefact. Most teams remove it with one learned conversion factor.
That hides the two causes and cannot be explained to a fire manager.

## Our idea: remove each cause with its own step, and show the effect of each

We build the record as a ladder. Each level removes one cause. We measure the
remaining 2012 step after each level and ship the **lowest level that passes the
tests**. The ladder itself, shown as a table, is the scientific result.

| Level | What it does | Cause removed |
|---|---|---|
| L0 | Raw hotspot counts per sensor | None (baseline) |
| L1 | **Fire cells.** Snap detections to a common grid. Count a cell once per satellite, date and day/night flag, however many pixels fall in it | Resolution |
| L2 | **Common floor.** Keep only fire cells whose cell FRP is above the level where MODIS and VIIRS agree. Weaker cells go to a separate *small-fire layer* | Sensitivity |
| L3 | **Scan-aware floor.** Let the floor grow with pixel area (`scan * track`), because a sensor's detection limit rises toward the swath edge | Sensitivity varying across the swath |

Definitions:

- **Grid for L1 to L3:** about 1 km (0.01 degree). DECIDE: 0.01 degree is simple;
  an equal-area grid is more correct away from the equator. For India and
  Argentina the error of 0.01 degree is acceptable if stated.
- **Overpass key:** `satellite + acq_date + daynight`. Do not group on `acq_time`.
- **Cell FRP:** mean FRP of the detections in the cell for that overpass key.
  Mean, not sum, so swath-edge duplicates do not inflate it. VIIRS 375 m FRP is
  derived from the coarser M13 band, so per-pixel values are approximate; this is
  why we work at cell level. State this limit on the project page.
- **Reference pair for the floor:** Aqua MODIS and S-NPP VIIRS. Both crossed the
  equator near 13:30 and 01:30 local time during the overlap, so time of day is
  matched. Fit the floor separately for day and night, and per broad land cover
  if time allows.
- **Finding the floor:** for candidate floors F, count Aqua fire cells and S-NPP
  fire cells with cell FRP >= F, per month, over the calibration years. Choose
  the smallest F where the ratio is within a set tolerance of 1 (DECIDE the
  tolerance; start at 10 percent) and stays there for larger F.
- **Several VIIRS satellites:** from 2018 NOAA-20 and from 2023 NOAA-21 also fly.
  Average across the VIIRS satellites present. More satellites must never mean
  more fire.
- **Full swath is kept.** Do not filter to near-nadir pixels: it would leave
  multi-day gaps and miss short agricultural burns.

## What the harmonized record is, and is not

- It is a **common-denominator record**: the fire activity both sensor families
  can see. It contains no invented fires.
- It runs from **July 2002** (Aqua launch) to now. November 2000 to June 2002 is
  Terra only, at a morning overpass time. Show it, clearly marked as "Terra only,
  not harmonized".
- The **small-fire layer** shows what VIIRS adds below the floor, from 2012. In
  croplands this is mostly small agricultural burns. It is a feature for users,
  not a correction.
- Terra detections (10:30 and 22:30) are shown as a separate raw series. They are
  not mixed into the harmonized series, because fire activity changes through
  the day.

## Tests (the method must pass these; report each as pass or fail)

| # | Test | Pass condition (DECIDE thresholds) |
|---|---|---|
| T1 | Step at 2012 | In the harmonized series, the ratio of mean 2012 to 2014 over mean 2009 to 2011 matches the same ratio in Aqua-only data within tolerance |
| T2 | Overlap agreement | Monthly harmonized VIIRS versus harmonized Aqua, 2012 onward: slope near 1, high correlation |
| T3 | Held-out years | Fit the floor on some overlap years, check T2 on years not used |
| T4 | Held-out region | Fit on region 1, check T2 on region 2 without refitting |
| T5 | Placebo seam | Repeat T1 at a date with no sensor change (e.g. 2007). It should show no step either. This shows T1 is not passing by accident |
| T6 | Ladder table | Remaining step after L0, L1, L2, L3. Each level should reduce it |

Supporting evidence, if time allows: S-NPP and NOAA-20 see the same place about
50 minutes apart with different pixel sizes. Where one detects a fire cell and
the other does not, plot the miss rate against pixel area. This shows directly
that detection falls as pixels grow, which is the physical reason for L3.

## Fallback (decide at Sat 19:30)

If T1 or T2 fails at every level by Saturday 19:30: ship L1 fire cells plus a
per-cell-group monthly MODIS-to-VIIRS ratio fitted on the overlap, with a
bootstrap range. This is the method most teams use. Keep the ladder table as an
honest result showing what the physical steps achieved.

## Known limits (state these on the project page)

- Aqua's orbit has drifted to later crossing times since about 2022. **VERIFY**
  dates. This affects the newest Aqua data used as reference.
- Cloud and smoke hide fires from all sensors. Zero detections is not proof of
  no fire. FIRMS point files carry no cloud mask.
- Hotspots include non-fire heat sources. The archive `type` field marks them;
  near-real-time files do not, so recent months need a mask built from archive
  cells that are persistently non-vegetation.
- Confidence scales differ (MODIS 0 to 100, VIIRS low/nominal/high). DECIDE the
  filter; proposal: drop MODIS below 30 and VIIRS "low", and report sensitivity
  to that choice.
- The record covers the regions we processed, not the globe.

## Prior work to cite and distinguish from

**VERIFY each reference before citing.** Scan-angle effects on MODIS fire
detection (Freeborn et al.); the VIIRS 375 m active fire product (Schroeder et
al. 2014); MODIS Collection 6 active fire algorithm (Giglio et al. 2016);
detection limits for MODIS and VIIRS FRP (GMD 2026,
https://gmd.copernicus.org/articles/19/10123/2026/); FRP missed by MODIS in
Africa (https://www.mdpi.com/2072-4292/12/10/1561). Our contribution is not new
sensor physics. It is using that physics as an explicit, testable harmonization
ladder inside a tool for fire managers.

## Regions

DECIDE two regions. Proposal: one in India for the local judges (for example
Punjab and Haryana crop residue burning, or Karnataka forest fires) and
Argentina for the challenge author. A third only if the pipeline is fast.
