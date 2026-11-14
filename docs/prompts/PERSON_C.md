# Prompts for Person C (Charulekha): charts, demo and submission

Paste one prompt per session. Your checklist is `docs/tasks/PERSON_C_STORY.md`.
Setup and usage tips: `docs/prompts/README.md`.

---

## C0. Orientation (allowed before the start; makes no changes)

```text
I am Charulekha, Person C on the Fire Census hackathon team. Read CLAUDE.md
and everything in its read order, then docs/DECISIONS.md,
docs/RESEARCHER_EXPERIENCE.md and my task file docs/tasks/PERSON_C_STORY.md.
Do not create or change any file, and do not write solution code or project
page text: the hackathon has not started.

Then tell me, briefly:
1. What we are building and who it is for, in three sentences a non-expert
   would understand.
2. Exactly what I own (the chart components, the demo, the project page) and
   what I must not touch.
3. The useSelection() interface I build against, restated in your own words,
   and what I can do before Person B delivers it at 11:30 on Saturday.
4. The harmonization method explained as I would say it aloud to a judge in
   30 seconds, with no jargon.
5. The five judging criteria and, for each, what in our project speaks to it.
6. The rules that could disqualify us that fall on me: the 30-second or
   7-slide limit, English only, public links, AI labelling, no one under 18
   in the demo.
7. Questions I should settle with my teammates before we start.
```

---

## C1. Phase 1: page drafts, storyboard, first calendar (Sat 10:15 to 13:00)

```text
I am Charulekha, Person C. The hackathon has started. Read CLAUDE.md,
docs/DECISIONS.md, docs/CONTEXT.md and docs/tasks/PERSON_C_STORY.md.

Until about 11:30 Person B is still building the app shell, so start with
writing. Save drafts in submission/ on a branch named c/charts.

1. Draft a first line for every project page field listed in docs/CONTEXT.md,
   in submission/project_page.md, so I can paste them into the Space Apps form
   and save. Do not state any result or number: we have none yet. Mark each
   place where a result will go as [RESULT FROM A].
2. Write three candidate one-sentence pitches: who it is for, what it does,
   why it can be trusted. I will choose with my team.
3. Write a 30-second demo storyboard against the official timing in my task
   file, shot by shot, with the words spoken in each shot and a word count.
   The centre of it is the raw record's jump at 2012 disappearing when the
   switch is flipped, shown on Córdoba (decision 27). Aim for 28 seconds:
   over 30 makes us ineligible.

When I tell you Person B has merged the shell (about 11:30), pull main and:

4. Build BurningCalendar in app/src/charts/, reading only from useSelection():
   years as rows, months as columns, one cell per month. This months-across-
   years view is what the challenge author describes, so it is the first thing
   on screen (decision 21).
5. Write toCalendar(rows, field) returning the year-by-month matrix of sums,
   with unit tests including an empty selection.

Rules: charts never load files themselves. Every file you write carries the
AI-assisted header from docs/AI_USE.md. Do not edit anything outside
app/src/charts/ and submission/.

At the 13:00 checkpoint, stop and report: done, not done, blocked.
```

---

## C2. Phase 2: the charts users read (Sat 14:30 to 19:30)

```text
I am Charulekha, Person C. Read CLAUDE.md, my newest hand-off note in
docs/handoffs/ if there is one, docs/tasks/PERSON_C_STORY.md and
docs/RESEARCHER_EXPERIENCE.md. Do Phase 2 on branch c/charts, pulling main first.

Build, in this order, all reading only from useSelection():

1. BurningCalendar, complete: the cividis colour ramp with a legend showing
   the value scale; the exact value on hover and on tap; row totals per year
   and column totals per calendar month; months before harmonized_from marked
   "Terra only, not harmonized"; months with no data drawn differently from
   months with zero; harmonized values in Harmonized mode and raw counts in
   Raw mode. Check it in a colour-vision-deficiency simulation and in both
   light and dark themes.
2. ActivitySeries: the monthly series under the calendar. In Raw mode the 2012
   jump must be obvious; in Harmonized mode it should be gone. The chart title
   states the unit, the mode and the area. When showSmall is on, draw the
   small-fire layer as a clearly separate series from 2012 (decision 23).
3. MonthComparison: for the latest month in the range, its value, the median
   of the same calendar month in earlier years, how many years that median
   rests on, and a label using the cut-offs in decision 12. If there are fewer
   than 5 earlier years, say "not enough history" instead of a label.
4. One plain sentence above the charts built from the data, for example
   "October 2026 was far above normal for this area (2.4 times the median of
   22 earlier Octobers)". The numbers must come from the rows, never be typed.
5. A "Download data" control on each chart that exports exactly what is
   plotted as CSV.

Also write, in submission/labels.md, the short texts Person B needs: the Raw /
Harmonized line, the small-fire line, the "zero detections" note, the
"no valid observation" note and the Terra-only note. Never say "fires" where
we mean detected hotspots, and never say "wildfire" for crop burning.

Before the 19:30 checkpoint, run the adversarial review prompt from
docs/prompts/SHARED.md on the charts. Then stop and report.
```

---

## C3. Phase 3: finish charts, then page and demo (Sat night to Sun 12:30)

```text
I am Charulekha, Person C. Read CLAUDE.md, my newest hand-off note,
docs/tasks/PERSON_C_STORY.md and docs/PREREGISTRATION.md. Pull main.

Part 1, charts, to finish by Sunday 10:00, on branch c/charts:

1. Range shading on ActivitySeries from harm_lo and harm_hi.
2. UnusualBanner: shown when the latest month is "far above normal".
3. A "critical period ahead" line from the harmonized history: for the coming
   weeks, the share of a typical year's burning that usually falls in them and
   when the peak usually arrives. Label it as a description of past years, not
   a forecast.
4. SeasonTiming, only if Person A confirms stretch goal S1 produced a result.
5. Use the deployed app at phone width as a first-time visitor. List what
   confuses you; fix what is in my folder and give me the rest for Person B.

Part 2, the project page. Person A's drafts are in submission/method.md,
results.md, limits.md and nasa_data.md; Person B's is submission/tools.md.
If any is missing, tell me which so I can ask for it; do not write results
yourself.

6. Assemble submission/project_page.md with every field from docs/CONTEXT.md,
   edited into one voice. Lead the summary with the user and the problem. Use
   the challenge author's own concerns where they are true of our work (the
   first ten MODIS-only years stay usable; the sensor of origin no longer
   matters; the greater detail of VIIRS is kept in the small-fire layer).
7. Make sure the text gives a judge clear material for Impact, Creativity,
   Validity and Relevance, one paragraph each, without using those words as
   headings. Do not claim the method is the first of its kind.
8. Fill "Use of AI" truthfully from docs/AI_USE.md and "References" from
   docs/REFERENCES.md. Report every check as it stands in results.md,
   including any that failed.
9. Check every number in the page against submission/results.md and list any
   that do not match.

Part 3, the demo, once the app is feature complete:

10. Turn the storyboard into a final script with timings. Tell me the word
    count and the estimated spoken length. It must come in under 30 seconds.
11. Give me a recording checklist: what to show on screen second by second,
    from the live app, no one under 18 visible or audible, no NASA logos, no
    copyrighted music, English narration or English subtitles.

Stop at the 12:30 checkpoint and report what is and is not finished.
```

---

## C4. Phase 4: submit (Sun 13:30 to 16:00)

```text
I am Charulekha, Person C. Read CLAUDE.md, my newest hand-off note and the
Phase 4 list in docs/tasks/PERSON_C_STORY.md. We submit by 15:30 and can
resubmit until 23:59; only the last saved submission is judged.

1. Read submission/project_page.md as a judge with no background who has two
   minutes. Tell me what is unclear, what is unsupported and what is missing,
   most serious first. Then tighten the text. Do not change any number.
2. Check the page against the eligibility list in docs/CONTEXT.md and
   docs/GETTING_STARTED.md Part 4, item by item, and tell me which items you
   cannot verify from the repository so I can check them by hand: public links
   that open in a private window, demo length, English only, both agreement
   boxes, all members on the team page.
3. Draft answers to the three questions a local judge is most likely to ask:
   how is this different from a simple conversion ratio; what does it not do;
   how was AI used. Keep each under 40 words and true.
4. After I submit, remind me to screenshot the success banner, post it to the
   team, and check again at 23:30 that the page shows as submitted.

Finish with a list of anything still weak that we are choosing to submit with.
```
