<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending). -->

# For Charulekha and 8crsk: what is new in the work, said truthfully

From Mahabu (Person A), with the AI assistant, 15 November, 02:02 IST. These
are proposals for your files. Nothing here was put on the page, in the demo
or in the app, except one sentence on the page that was not exact (below).

## A correction to what we told you earlier today

`A-judge-fixes.md` says "the detection curve ships in no area". That was too
strong. Exactly: **the curve does not weight the harmonized count in any
area. It still does two jobs in every area: its midpoint is the cut-off of the
hard floor, and it weights the small-fire layer** (each fire VIIRS sees adds
its chance of being missed by MODIS; `pipeline/export.py`). So the app still
shows something built from the curve whenever the small-fire switch is on.

On the page, "The curve itself weights fires in no area" was replaced by "The
curve does not weight that count; it weights the small-fire layer."

## Four things that are new, for the Creativity criterion

Every number is printed by the pipeline (`validate.py`, `findings.py`). Never
say "first ever".

1. **A measured detection curve.** Every VIIRS fire is matched to Aqua's pass
   on the same day; chance matches are measured by searching ten squares away
   and subtracted. The curve sets the record's cut-off and weights the
   small-fire layer.
2. **A ladder, not one number.** Each cause of the 2012 jump is removed in its
   own step, and the remaining error of all six variants is in the app.
3. **A failed check that became a finding.** Our pre-registered month-by-month
   check failed. Following it showed that the conversion between the sensors
   follows the season, and the twelve constants track the height of the midday
   sun in two hemispheres: rank correlation -0.99 in Córdoba, -0.78 in Punjab
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
> correlation with the height of the midday sun -0.99 and -0.78).

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
