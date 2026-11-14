<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# Local judging: honest self-score and what raises it

The Bangalore panel scores 10 points each for Impact, Creativity, Validity
(scientific principles and technical), Relevance (use of data) and
Presentation: 50 in all. Scored on 14 November, about 17:00, updated about 21:30 after the areas were fixed, against what is
on `main` and the live app. This is our own estimate, written to find the
gaps, not a prediction.

| Criterion | Now | Why | Realistic after the actions below |
|---|---|---|---|
| Impact | 7 | Solves a real, dated problem (MODIS ending; the author's own agency needs it); works for four audiences; but only four areas are processed, and it is not a live alert service | 8 |
| Creativity | 8 | Detection-curve harmonization where others fit one ratio; the orbit-drift finding; every hotspot labelled with what harmonization did to it; checks fixed before the data was opened | 9 |
| Validity | 8 | Pre-registered checks with failures shown; physics agreement; two independent burned-area records (ESA and NASA); reproduced from a fresh clone; areas now match their names. In Punjab and Haryana the shipped method passes every check that applies to it. Against: C3 needed a revision in Córdoba, both burned-area checks fail there (Aqua alone fails them identically), Karnataka fails its held-out checks | 9 |
| Relevance (data) | 9 | All five MODIS and VIIRS satellites from FIRMS, Aqua daily fire masks, the FIRMS live API; every feature the challenge names is in the app | 9 |
| Presentation | 7 | Polished app with plain-question charts and exact numbers; project page drafted; but no demo video yet and the pitch is not rehearsed | 9 |
| **Total** | **39 / 50** | | **43 to 44** |

## The actions, in order of points per hour

1. **Record the 30-second demo** (Charulekha; script in `submission/demo.md`).
   Without it, Presentation cannot go above 7.
2. **Rehearse a 3-minute local pitch, led by Punjab.** The local judges know
   the stubble-burning season. Open on the raw record jumping fivefold in 2012,
   flip to harmonized, then show `season_punjab-haryana.png`: the season has
   moved about a week later per decade, straight through the sensor change.
   Close on the orbit-drift figure: "MODIS is dying, and since 2022 it no longer
   sees the same afternoon; our record does not depend on it."
3. **Prepare answers to the three hardest questions** (all three of us):
   - "You changed a check after seeing results." Answer: we kept the original
     result, published both, and the revision does not favour our method; all
     three methods pass it equally (`docs/PREREGISTRATION.md`).
   - "How is this different from Global Forest Watch?" Ten more years (from
     2002, not 2012), both sensors on one scale, and published checks.
   - "Why trust the curve?" It puts MODIS's detection limit over Córdoba at
     9.9 MW; a 2026 physics paper's formula gives 10.4 MW for the same pixels.
4. **Show the new analyses in the app** if 8crsk and Charulekha agree
   (`season.json`, `drift.json`, `episodes.json`; contract in
   `docs/ARCHITECTURE.md`, decision 37). The season view is the strongest
   single image for local judges.
5. **Say plainly what is not done:** four areas only, not an alert service,
   C6 fails in Córdoba (Aqua alone fails it the same way). Judges reward stated limits more than they punish them.

## What not to do now

- Do not add more regions before judging. Karnataka showed that a new area
  without its own pre-registration costs credibility if its checks fail.
- Do not claim "first ever" anywhere.
- Do not round numbers in the pitch in a flattering direction.
