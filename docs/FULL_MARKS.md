<!-- AI-assisted: written by Claude (Anthropic) at Mahabu's request. Reviewed by: Mahabu Subhani. -->

# What a 10 needs on each criterion, and where we stand

> **Read this first (added 15 November, after decision 57).** Written on 14
> November and not redone. No longer true below: the Chilecito fire is now
> 13.5 times a normal July (not 8.8), still the 2nd highest of 25; "a measured
> detection curve instead of a fitted ratio" should read "a measured strength
> cut-off and a constant per calendar month", because the detection curve
> ships in no area; and "the two failed checks and C3r" is replaced by what
> section 6 of `docs/EXPLAINED.md` now says about C3, C3x and Córdoba's yearly
> error.

Local judging gives 10 points each for Impact, Creativity, Validity,
Relevance and Presentation. No project is guaranteed 50; this is the list of
everything within our control that a judge's 10 would require, with its state.
Wording of what earns a 5 (top score in the official guide) is quoted from the
Judging and Awards Guide.

## Impact: "addressing a significant problem ... benefits a large audience, or could change the world"

| A 10 needs | State |
|---|---|
| A real, dated problem | Done: MODIS is ending (Terra's data collection planned to end January 2027, Aqua around September 2027, per Copernicus CAMS); Suomi NPP stopped on 2 November 2026 |
| Named users with a decision the tool changes | Done on the page: "Who uses it, for what" table (emergency teams, fire services, pollution boards, forest departments, researchers) |
| Evidence it works on a real event | Done: the author's own Chilecito fire flagged at 8.8 times a normal July; the Punjab season shift reproduced |
| Reach beyond our four areas | Stated as next step, honestly: the method needs only FIRMS data and about 30 minutes per new area |
| Said aloud in the pitch | **To do: rehearse** the one-sentence impact line (below) |

**Impact line for the pitch:** "When MODIS switches off next year, every fire
manager loses the first ten years of their history. Fire Census keeps them, so
a district officer can ask in ten seconds whether this month is unusual
compared with 2005, not only with 2015."

## Creativity: "a groundbreaking approach that has never been attempted before"

| A 10 needs | State |
|---|---|
| An idea others did not have | Done: a measured detection curve (the telescope-completeness idea) instead of a fitted ratio; every hotspot labelled with what harmonization did to it |
| A surprising finding | Done: MODIS's orbit drift measured from the detections themselves; the season shift seen across the sensor change |
| Not overclaimed | Done: "a new combination, tested", never "first ever" |

## Validity: "scientifically sound ... fully developed ... highly usable"

| A 10 needs | State |
|---|---|
| Tests fixed in advance, with failures shown | Done: 10 pre-registered checks; failures and the one revision are on the page and in the app |
| Independent evidence | Done: NOAA-20 (never fitted), a 2026 physics paper (C5), ESA Fire_cci (C6) and NASA MCD64A1 (C6m), with Aqua-only diagnostics |
| Areas that are what they are called | **Fixed 14 Nov evening:** Punjab is now clipped to Punjab, Haryana and Chandigarh; Córdoba renamed "Córdoba and neighbouring areas" |
| Reproducible | Done: fresh-clone rebuild; `pipeline/README.md` |
| Usable | Done by 8crsk and Charulekha: phone layout, plain-question charts, district search |
| Defended in person | **To do:** each of us can explain the two failed checks and C3r without notes (`docs/EXPLAINED.md`, section 6) |

## Relevance: "NASA data is integral ... deeply connected to the intended goals"

| A 10 needs | State |
|---|---|
| Every feature the challenge names | Done: calendar, area and dates, current month against the median, accessible colours, CSV of hotspots, downloads of charts |
| NASA data as the core | Done: FIRMS (five satellites), FIRMS live API, MYD14A1, MCD64A1 |
| Partner agency data | Done: ESA Fire_cci and ESA WorldCover; CONAE cited and its city leads |

## Presentation: "well-structured and compelling ... polished"

| A 10 needs | State |
|---|---|
| A demo of 30 seconds or less | **To do (Charulekha):** record from `submission/demo.md` |
| A project page a stranger understands in two minutes | Done; numbers checked against the data on 14 Nov |
| A live pitch with one strong image | **To do:** lead with the raw jump disappearing, then `season_punjab-haryana.png` |
| No dead links | **To do on the day:** open app, repo and video in a private window |
| Honest AI disclosure | **To do:** paste the honest "Use of AI" text |

## The three things that still decide the score

1. The demo video.
2. A rehearsed three-minute pitch with the impact line above.
3. Calm, exact answers to "you changed a check after the results" and
   "why are your numbers lower than FIRMS" (`docs/EXPLAINED.md`, section 11).
