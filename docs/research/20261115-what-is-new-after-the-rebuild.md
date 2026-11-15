<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by Mahabu Subhani (pending). -->
# After the rebuild: is the record sound, and what in the work is new?

Asked by Mahabu, 15 November 2026. Written at 02:02 IST (`date`). For
decision: none; the method is frozen. This note changes nothing that ships.

## Answer in three lines

1. The values reproduce, and in Córdoba by day the physics holds; elsewhere it
   is weaker, as `submission/limits.md` already says.
2. The detection curve is still in the product: it sets the hard floor's
   cut-off and weights the small-fire layer in every area. Only the harmonized
   count stopped using it as a weight.
3. Two findings came out of the failed check, both now printed by
   `pipeline/findings.py`: the conversion constants follow the sun in two
   hemispheres, and Aqua's drifting orbit shows Punjab's rice-season burning
   being seen far more by a later pass.

## What it changes for us

- How we describe the work. "The curve ships in no area" was too strong. The
  documents in Person A's folders now say what it does and does not do.
- The Creativity argument rests on four things that are true and checkable
  (section 11 of `docs/EXPLAINED.md`, "What is new here?"), not on the curve
  weighting the count.

## What it does not change

- What ships, any threshold, any verdict, any value in the app.
- The weaknesses: Córdoba's yearly error, thin margins, passes that do not hold
  under other settings, Punjab and Haryana at the limit.

## The two findings

**The constants follow the sun.** Rank correlation of the twelve daytime
constants of the shipped model with the height of the midday sun: Córdoba
-0.99 (lowest in January, highest in June), Punjab and Haryana -0.78 (lowest
in June, highest in January), Karnataka -0.22 (no pattern). Each constant
pools three months, so the twelve values are not independent and no p-value
is quoted. Season, crop and fire type change together; this fits a hotter,
brighter background raising MODIS's limit, and does not prove it.

**Aqua against the record, by season** (log ratios; `findings.py`). Punjab and
Haryana, October and November: +0.032 in 2012 to 2021 and +0.395 in 2022 to
2026. April to June: -0.000 and -0.041. All months: +0.028 and +0.258.
Córdoba, all months: -0.011 and +0.025. The excess is in the rice season only,
so it is not the orbit alone.

## A check against official counts (a lead, not evidence)

Rice-season activity relative to 2020, our record for Punjab and Haryana
(`season.json`): 2021 1.09, 2022 0.65, 2023 0.45, 2024 0.12, 2025 0.05.
Punjab's official farm-fire counts as reported in the press (76,590 in 2020;
71,304; 49,922; 36,663; 10,909; 5,114) give 0.93, 0.65, 0.48, 0.14, 0.07. The
official counts are satellite-based and cover Punjab only, so this tests the
pipeline, not the satellites. **Not for the project page:** the figures come
from news reports, not from the agency's tables.

## Physics, where it holds

| Area | Our cut-off | Sofiev and Kouznetsov at the mean Aqua pixel | Holds? |
|---|---|---|---|
| Córdoba, day | 9.9 MW | 10.4 MW | Yes |
| Córdoba, night | 6.9 MW | 16.6 MW (3.7 at nadir) | Only against the nadir value, as C5 is defined |
| Punjab and Haryana, day | 4.8 MW | 7.8 MW | No; the curve is weak (plateau 0.118) |
| Karnataka, day | 17.5 MW | 8.9 MW | No (C5 fails) |

Not tested: whether detection falls with Aqua's pixel size from day to day.

## A mock score (the assistant's, for finding gaps; not a prediction)

Local rubric, 10 each. Impact 7, Creativity 8 when the work is described as
in "What is new here?" (7 if it is described as a detection-curve record,
which it no longer is), Validity 7, Relevance 9, Presentation 6 until the
branch is live and the demo exists, 8 after.

## Search log

| Where | Search string or method | Date | Results looked at |
|---|---|---|---|
| Web search | Punjab farm fire count paddy season official PRSC 2020 to 2025 | 15 Nov | 18 titles, summary only |

## Sources

| Title | Authors | Date | Link | Type | Grade | Read: full or abstract | What it says that matters to us |
|---|---|---|---|---|---|---|---|
| Punjab records 2,721 farm fires, least in 2 years | The Tribune | 2022 to 2025 (several reports) | https://www.tribuneindia.com/news/punjab/punjab-records-2-721-farm-fires-least-in-2-years-443191 | News | D | Search summary | Yearly official counts for Punjab |
| Stubble burning cases cross 3,000 mark in Punjab | PTI, in The Week | 7 Nov 2026 | https://www.theweek.in/wire-updates/national/2026/11/07/stubble-burning-cases-cross-3-000-mark-in-punjab-tarn-taran-tops-list.html | News | D | Search summary | Counts for 2024 and 2025 |

## Open questions and UNVERIFIED claims

- The official counts above: read the agency's own tables before quoting.
- Why the constants follow the sun: background temperature is a candidate,
  not a result.

## After decision 58 (added 15 November, 10:08 IST by `date`)

Mahabu chose to ship the detection curve in Córdoba and Chilecito, setting
the shipping rule aside there. What that changes in this note:

- "Only the harmonized count stopped using it as a weight" is no longer true
  of Córdoba and Chilecito: there the curve weights the count again.
- The constants of the shipped model against the midday sun: Córdoba is now
  -0.92 (lowest in January, highest in July); Punjab and Haryana -0.78.
- Aqua against the record in Córdoba: +0.015 before 2022, +0.064 since.
- The mock score. Creativity: the curve ships in the area where it is strong.
  Validity: the record that ships in Córdoba is closer to Aqua month by month
  and year by year, but it fails a check its own pre-registered rule names,
  and the choice was made after both results were seen. The assistant had
  recommended keeping the rule.
