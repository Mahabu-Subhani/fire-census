<!-- AI-assisted: written by Claude (Anthropic) at Mahabu's request. Reviewed by: Mahabu Subhani. -->

# Hostile review of everything so far (14 November, about 17:30)

Mahabu asked for an independent critique by Gemini 3.1 Pro. Composio had
Gemini disabled by its administrator all day, so this review is written by the
same AI assistant that did most of the work. It is not independent. Every
criticism that could be tested was tested on the data before being written down.

## Scientific and method flaws, most serious first

1. **The headline "no jump at 2012" is partly in-sample.** The constant k is
   fitted on 2012 to 2017 totals, and the check's after-window (Feb 2012 to Jan
   2015) lies inside that period, so any method with a fitted constant passes it
   easily: even the plain ratio does. Out of sample, fitted on 2016 to 2017 only,
   the step is 0.106 for Córdoba's curve (just over the 0.10 limit), 0.090 for
   the hard floor, 0.105 for the ratio; Punjab -0.011, -0.014, -0.031.
   *Fixed by disclosure* in `submission/results.md`. The stronger evidence is
   out of sample anyway: NOAA-20 (C4), the 2018-19 totals (C3r) and the
   physics agreement (C5).
2. **The shipping choice rests on a check added after the results (C3r).**
   Under the pre-registered rule, the plain ratio would ship everywhere. The
   revision is argued (the original limit was below the noise between any two
   satellites), both verdicts are published, and C3r does not favour our method,
   but a judge can still call it moving the goalposts. *Cannot be undone;
   disclose first, before anyone asks.*
3. **Punjab's curve is mostly noise.** Even the strongest VIIRS fire cells are
   matched by Aqua only 12 percent above chance, and chance matches are 9
   percent. Its midpoint fails C8, the floor that ships moves with settings, and
   the physics comparison does not agree there (5.0 against 7.8 MW). *Disclosed.*
   Lead with Córdoba for the method; use Punjab for the season story, which
   depends on timing, not on the curve's level.
4. **Night curves are thin.** 575 Aqua night fire cells in Córdoba, 350 in
   Punjab, 38 in Karnataka. The Córdoba night midpoint disagrees with physics by
   a factor of 2.4. *Disclosed.*
5. **Karnataka was added late, without pre-registration, and fails its
   held-out checks.** It shows the method does not transfer to every fire
   regime without work. *Kept as a labelled case study* (decision 36): it is
   honest and it is the place local judges know.

## Things that held up when attacked

- Episode ranking: across nine definitions (minimum 0.5 to 2 fire cells a day,
  gaps of 1 to 3 days) the Chilecito July 2026 fire ranks 11th or 12th.
- Punjab's season shift: 6.7 to 6.8 days per decade for three different season
  windows (1 Sep to 31 Dec; 15 Sep to 15 Dec; 1 Oct to 30 Nov).
- Córdoba: every verdict unchanged under five changes of settings.
- Reproduction from a fresh clone: one cell-month off by 0.01.
- The constant ratio's error follows the yearly mix of strong fires; the
  curve's does not (Córdoba, p = 0.011 against 0.33).

## Process and integrity

- **AI did most of the work**, including proposing the idea. The rules say AI
  should not come up with the idea. The project page must say so plainly in
  "Use of AI"; `docs/AI_USE.md` logs it. Do not understate it.
- **Decisions 30, 31, 36 and 37 were made by the AI assistant** on Mahabu's
  instruction, and are recorded that way.
- **Gemini critiqued the method on 13 November only.** Later phases had no
  second model.
- **Claims to avoid:** "first ever", "validated in four regions",
  "predicts fires", "all checks passed".

## What a local judge will attack first

"Your MODIS-equivalent numbers are much lower than what NASA FIRMS shows for
the same place. Why should a fire officer trust a number that hides most of the
hotspots?" Answer in one breath: the harmonized line is for comparing years;
the small-fire layer and the Raw switch show everything VIIRS sees, and the
hotspot download lists every detection with the reason it was or was not counted.

## Score this review gives (out of 50)

Impact 7, Creativity 8, Validity 7 (one lower than `LOCAL_JUDGING.md`,
because of flaws 1 and 2), Relevance 9, Presentation 7 until the demo exists:
**38**. The demo video and a rehearsed answer to flaws 1 and 2 are worth more
than any further analysis.

## Single highest-value change before Sunday 15:30

Record the demo, and put one honest "Limits and how we tested" box on the
project page that states flaws 1 to 3 in plain words with the numbers above.
