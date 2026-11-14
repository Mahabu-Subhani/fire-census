# Prompts for Person C (Charulekha): charts, demo and submission

Paste one prompt per session. Your checklist is `docs/tasks/PERSON_C_STORY.md`.
Setup and usage tips: `docs/prompts/README.md`.

---

## Web app work (from Sat 11:30): these replace the chart steps in C1 to C3

The shell is on `main`. Use these three prompts for the app. Keep using C1 to
C4 for the project page, the demo and the submission. The split with 8crsk:

| | 8crsk (B) | Charulekha (C) |
|---|---|---|
| Folders | Everything in `app/` except the two on the right, including `App.tsx` and `package.json` | `app/src/charts/` and `app/src/stats/` |
| Builds | Map, controls, place search, downloads of the selection, share link, Checks and Method panels | Calendar, series, comparison, status sentence, season band, outlook, trend, per-chart export |
| Git | Pushes to `main` | Branch `c/charts`. Pull `main` before each piece; merge small and often |

Need a new field in `useSelection()` or a new library? Ask 8crsk in the team
chat. Do not edit files outside your two folders.

### CA1. Stats core and the calendar (now to Sat 13:00)

```text
I am Charulekha, Person C. 8crsk has merged the app shell. Run git pull on
main, then git checkout -b c/charts (or git merge main if the branch exists).
Read CLAUDE.md, docs/ARCHITECTURE.md ("Inside the app", especially "How to
read the rows" and "Working together in app/"), docs/APP_VISION.md and
app/README.md. Run npm install and npm test in app/ to check that everything works.

I own app/src/charts/ and app/src/stats/ only. Never edit App.tsx,
package.json or anything else in app/. The chart order on the page is the list
in app/src/charts/index.ts. Observable Plot 0.6.16 is installed.

Build, in this order:

1. app/src/stats/: pure functions with unit tests (vitest, *.test.ts next to
   the code), no React:
   - value(row, mode): raw_modis + raw_viirs in raw mode, harm in harmonized.
   - toCalendar(rows, mode): year by month matrix of sums. Missing rows are 0.
   - monthHistory(areaRows, month, mode, useMtd): the value of one calendar
     month in every year, using mtd instead of harm for the incomplete month
     of dataThrough and for the same month in earlier years.
   - median, rank ("2nd highest of 24") and the 90th percentile of a list.
   Tests must include an empty selection, a month with no rows, ties in rank,
   and the incomplete current month.
2. A ChartFrame component in app/src/charts/ that every chart uses: a title
   stating the unit (always from meta.unit, never typed by hand), the mode
   (Raw or Harmonized) and the area (place, or "Drawn area" or the region
   name, with km²); a slot for the chart; and a space for export buttons later.
3. BurningCalendar, inside ChartFrame: years as rows, months as columns
   (decision 21), cividis colour ramp with a legend, exact value on hover and
   tap, months before harmonized_from marked "Terra only, not harmonized".
   Reads rows from useSelection() and the maths from stats/.

Then set it as the first chart in app/src/charts/index.ts, run npm test and
npm run build, commit, and merge c/charts into main. Check it at 400 px wide.
Every file carries the AI-assisted header from docs/AI_USE.md.

At 13:00 stop and report: done, not done, blocked.
```

### CA2. The answer on top (Sat 14:30 to 19:30; Fable recommended)

```text
I am Charulekha, Person C. Pull main into c/charts. Read docs/APP_VISION.md
(questions Q1, Q2, Q7 and traps 1, 2, 3 and 10) and my newest hand-off note.

Build, in this order, with the maths in app/src/stats/ and tests for each:

1. UnusualBanner becomes the status sentence at the top. Rank first, ratio
   second, for the month of dataThrough using month-to-date: "November 2026 so
   far (1 to 5 Nov): 3rd highest of 25 Novembers, 2.1 times the median."
   Below a minimum amount of activity, say "too little activity to judge"
   instead. Before you code the minimum and the baseline, run prompt D1 from
   docs/prompts/DEEPEN.md on two questions: what the minimum should be, and
   whether the default baseline is all years or the last 10 years (trap 10).
   Record both answers in docs/DECISIONS.md. Offer both baselines in the UI.
2. MonthComparison: the selected month against the history of the same
   calendar month, as a small chart: every year's value, the median line, the
   90th percentile, and this year highlighted. Uses areaRows, not rows.
3. A season band on BurningCalendar: the months that historically hold most
   of the year's activity, computed from areaRows, plus a "you are here"
   marker on the month of dataThrough.
4. ActivitySeries: the monthly series. In Raw mode the 2012 jump is obvious;
   in Harmonized mode it should be gone. Shade harm_lo to harm_hi. When
   showSmall is true, draw `small` as a separate series from 2012 (decision 23).
5. Export on every chart through ChartFrame: CSV of exactly what is plotted
   (first lines are comments with the sources, data_version and code_commit
   from meta, the mode, the area and the range), PNG and SVG.

Numbers always come from the rows, never typed. Merge to main after each
item. Before 19:30, run the adversarial review prompt in docs/prompts/SHARED.md
on the charts and stats, then stop and report.
```

### CA3. Trends and the look ahead (Sat night; stop at Sun 12:30 freeze)

```text
I am Charulekha, Person C. Pull main into c/charts. Read docs/APP_VISION.md
(Q3, Q5 and the "First principles" table) and my newest hand-off note.

Build, in this order, stopping when time runs out:

1. Trend: yearly totals from areaRows with a trend line and its uncertainty
   (Sen's slope with a Mann-Kendall test, or "no clear trend"). Harmonized
   mode only. In Raw mode show "Trends are not shown on the raw record: its
   2012 jump would be counted as a trend."
2. A second colour mode for the calendar: difference from that calendar
   month's multi-year average, on a diverging colour-vision-safe ramp, with
   a legend in numbers.
3. An outlook strip for the next three months after dataThrough: the median
   and the 90th percentile from history, labelled "history, not a forecast".

Add each to app/src/charts/index.ts in a sensible order, with tests in stats/.
Merge after each item. At Sun 12:30 the app freezes: after that, fixes only,
and my time goes to the demo and the submission (prompts C3 and C4).
```

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
