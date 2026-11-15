<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending). -->

# For Charulekha and 8crsk: what is new in the work, said truthfully

From Mahabu (Person A), with the AI assistant, 15 November, 02:02 IST. These
are proposals for your files. Nothing here was put on the page, in the demo
or in the app, except one sentence on the page that was not exact (below).

## What the curve does now (after decision 58)

- **Córdoba and Chilecito:** the detection curve weights every fire in the
  record (each VIIRS fire counts as its chance of being seen by MODIS). It
  ships there by Mahabu's decision, against our own shipping rule, because it
  fails the 2016 placebo. Say that whenever you say the curve ships.
- **Punjab and Haryana:** the curve is weak, so only its midpoint is used, as
  the cut-off of the hard floor.
- **Every area:** the curve weights the small-fire layer (each fire VIIRS
  sees adds its chance of being missed by MODIS).

Earlier today this note and `A-judge-fixes.md` said the curve weighted the
count in no area. That was true between decisions 57 and 58 and is not now.

## Four things that are new, for the Creativity criterion

Every number is printed by the pipeline (`validate.py`, `findings.py`). Never
say "first ever".

1. **A measured detection curve.** Every VIIRS fire is matched to Aqua's pass
   on the same day; chance matches are measured by searching ten squares away
   and subtracted. It weights the record in Córdoba, sets the cut-off in
   Punjab and Haryana, and weights the small-fire layer everywhere.
2. **A ladder, not one number.** Each cause of the 2012 jump is removed in its
   own step, and the remaining error of all six variants is in the app.
3. **A failed check that became a finding.** Our pre-registered month-by-month
   check failed. Following it showed that the conversion between the sensors
   follows the season, and the twelve constants track the height of the midday
   sun in two hemispheres: rank correlation -0.92 in Córdoba, -0.78 in Punjab
   and Haryana. (Say with it: the twelve values are not independent, and
   season, crop and fire type change together.)
4. **MODIS's dying orbit used as an experiment.** Aqua now passes two hours
   later. Since 2022 it has seen 48 percent more than our 13:10 record in
   Punjab's October and November, and nothing more in April to June. That fits
   burning having moved later in the day.

## Proposed sentences for `project_page.md` (Charulekha to decide)

For "How we know it works" or "Why it matters", one of:

> The failed check taught us something. The conversion between the two
> sensors follows the season: the twelve monthly constants are lowest in each
> area's own summer, January in Córdoba and June in Punjab and Haryana (rank
> correlation with the height of the midday sun -0.92 and -0.78).

> MODIS's drifting orbit works as an experiment. In Punjab's rice season Aqua,
> now passing two hours later, has reported 48 percent more than our record
> since 2022, and no more in the wheat season: the burning is being seen
> later in the day.

Not for the page: the comparison with Punjab's official farm-fire counts in
`docs/research/20261115-what-is-new-after-the-rebuild.md`. Its figures come
from news reports.

## Proposed lines for a live pitch (Charulekha, 8crsk)

- "Our own test failed, and it was right. Following it, we found the two
  satellites disagree by season, in step with the sun, on two continents."
- "MODIS is drifting. We used that: its later pass now sees half as much again
  of Punjab's rice fires as the 1 pm satellites do."

## 8crsk: nothing to change in the app for this

The small-fire layer and the detection-curve chart already show the curve.
If you reword the method summary (section 6 of `A-judge-fixes.md`), it can say
"the curve sets the cut-off and weights the small-fire layer".
