# Person C (Charulekha Rajesh): charts, demo and submission

The web app is shared between two people. 8crsk (Person B) builds the
foundation: deployment, map, controls and data loading. You build the
**charts**, which are what the user actually reads, and you lead the **demo and
the project page**. Mahabu (Person A) writes the technical text for the page so
that your load stays manageable.

You own: `app/src/charts/`, `submission/`, and the demo. The interface between
your charts and 8crsk's shell is in `docs/ARCHITECTURE.md`, "Inside the app".

Read first: `docs/GETTING_STARTED.md`, `AGENTS.md`, `docs/CONTEXT.md` (judging
criteria, rules, page fields), `docs/ARCHITECTURE.md` (both contracts,
accessibility), `docs/APPROACH.md` (so you can explain the method plainly).

Your job in one line: make the burning calendar clear at a glance, and make a
judge with no background understand and believe the project.

---

## Before the start (Friday; allowed prep only)

- [ ] Do everything in `docs/GETTING_STARTED.md` Part 1, including Node.js.
- [ ] Ask the Local Lead: exact local submission time; whether there is a live
      pitch and its length; whether teams may stay overnight. Write the answers
      into `docs/CONTEXT.md` under "Times".
- [ ] Watch the demos of at least three past Global Winners (each team's Project
      tab on spaceappschallenge.org). Note what the first 5 seconds do.
- [ ] Look at calendar heat map examples and colour-blind-safe sequential colour
      ramps (viridis, cividis), and at the chart library the team will use.
- [ ] In the team meeting: settle video or slides, the project name, and agree
      the "Inside the app" interface with 8crsk.
- [ ] Do **not** write chart code, page text, slides or scripts today.

---

## Phase 1. Sat 10:15 to 13:00: page drafts, then the calendar

### 1.1 Open the project page (first 30 minutes, while 8crsk scaffolds)

- [ ] Team page, Project tab, Edit. Turn the edit lock on while you work.
- [ ] Put a rough first line in **every** field and click Save Progress.
- [ ] Write the one-sentence pitch: who it is for, what it does, why it can be
      trusted. Get both teammates to agree to the wording.

### 1.2 Demo storyboard (30 minutes)

Official timing from the Submission Guide:

| Time | Content |
|---|---|
| 0:00 | Your name and the team name |
| 0:02 | The challenge and why we chose it |
| 0:05 | Project name and tagline |
| 0:10 | How it works: show the app, name the NASA data |
| 0:20 to 0:30 | What it could do for people in the future |

- [ ] Sketch each shot. The strongest image is the raw record's jump at 2012
      disappearing when the switch is flipped.
- [ ] If slides: at most 7 including title and intro, showing team name, member
      names and the challenge.

### 1.3 Start the calendar (from about 11:30, once 8crsk has merged the shell)

- [ ] Branch from the updated `main`: `git checkout -b c/charts`
- [ ] Build `BurningCalendar` in `app/src/charts/` against the mock rows from
      `useSelection()`: years as rows, months as columns, one coloured cell each.
- [ ] `toCalendar(rows, field)`: year by month matrix of sums. Unit test it,
      including an empty selection.

**Checkpoint 13:00.** Every project page field has a saved draft; storyboard
agreed; a first calendar renders inside 8crsk's layout.

---

## Phase 2. Sat 14:30 to 19:30: the charts users read

### 2.1 Burning calendar, complete

- [ ] Accessible colour ramp with a legend showing the value scale. Test it with
      a colour-blindness simulator.
- [ ] Exact value on hover and on tap. Do not rely on colour alone.
- [ ] Row totals (per year) and column totals (per calendar month), so "which
      years and which months burn most" is answered at a glance.
- [ ] Months before `harmonized_from` visibly marked "Terra only, not harmonized".
- [ ] Months with no data shown differently from months with zero fires.
- [ ] Shows `harm` in Harmonized mode and raw counts in Raw mode.

### 2.2 Time series

- [ ] `ActivitySeries`: monthly line or bars under the calendar.
- [ ] In Raw mode the 2012 jump is obvious; in Harmonized mode it is gone.
- [ ] Unit and mode stated in the chart title.

### 2.3 Historical comparison

- [ ] `MonthComparison`: for the latest month in the range, its value, the
      median of the same calendar month in earlier years, and the difference.
- [ ] A plain label: below normal, near normal, above normal, far above normal.
      Agree the cut-offs with Mahabu and state them in the UI.
- [ ] State how many earlier years the median is based on.

### 2.4 Words in the app

- [ ] Write the short labels 8crsk needs: the Raw / Harmonized line, the
      small-fire line, the "zero detections" note, the Terra-only note.

**Checkpoint 19:30.** Calendar, time series and comparison all work on real
data and respond to the Raw / Harmonized switch. You can explain the approach
aloud in 30 seconds without notes.

---

## Phase 3. Sat night to Sun 12:30: finish charts, then demo and page

### 3.1 Charts (finish by Sun 10:00)

- [ ] Small-fire layer drawn on the time series when `showSmall` is on.
- [ ] Range shading from `harm_lo` and `harm_hi`.
- [ ] "Unusual month" banner when the latest month is far above its median.
- [ ] Season timing chart, if stretch goal S1 is chosen.
- [ ] Be a first-time user on your phone. List what confuses you; fix your
      parts and give the rest to 8crsk.

### 3.2 Project page (text for the technical fields comes from Mahabu)

| Field | Who drafts | What goes in |
|---|---|---|
| Project Name | You | The name the team chose |
| High-Level Summary | You | What we built, how it addresses the challenge, why it matters. About 150 words. Lead with the user and the problem |
| Link to Project Demo | You | Public link to the video or slides |
| Link to Final Project | You | The live app link; mention the repo in the description |
| Detailed Description | Mahabu drafts method, tests and limits; 8crsk drafts tools; you edit into one voice | What it does, how it works, benefits, goals, tools |
| Use of AI | You, from `docs/AI_USE.md` | Which tools, for what, and what the team decided itself. Truthful and specific |
| NASA Data | Mahabu | FIRMS, exact product names and satellites |
| Partner Data and References | You, from `docs/REFERENCES.md` | Everything listed there |

- [ ] Each field complete, read aloud once, and saved.
- [ ] The content covers Impact, Creativity, Validity and Relevance, one clear
      paragraph each.
- [ ] Add images (up to 10 MB each): the raw jump, the calendar, the ladder table.

### 3.3 The demo (record after the 12:30 checkpoint if the app is not ready earlier)

- [ ] Record from the live app, not a mock-up.
- [ ] Time it. A video over 30 seconds makes the project ineligible. Aim for 28.
- [ ] English narration, or English subtitles if spoken in another language.
- [ ] No one under 18 visible or audible. No NASA logos. No copyrighted music.
- [ ] Any AI-generated image or clip carries a visible watermark.
- [ ] Upload to a public host. Open the link in a private window to confirm.

### 3.4 If there is a live local pitch

- [ ] Same story at the right length: problem, the switch, the evidence, the
      limits, the future. Rehearse twice with the team.
- [ ] Decide who answers which question: method (Mahabu), app (8crsk), users
      and impact (you).

**Checkpoint Sun 12:30.** Charts complete; page text complete; demo recorded or
ready to record.

---

## Phase 4. Sun 13:30 to 16:00: submit

- [ ] Ask Mahabu to check every number on the page and in the demo.
- [ ] Open every link in a private window: demo, app, repo.
- [ ] All fields complete and in English.
- [ ] Tick "Terms and Conditions" and "Confirm All Work is Original".
- [ ] Click **Submit for Judging** by 15:30.
- [ ] Confirm the success banner. Screenshot it and post it in the team chat.
- [ ] Polish wording until the deadline; after each edit, save and resubmit.
      Only the last saved submission is judged.
- [ ] Final check at 23:30: the page shows as submitted.

---

## Rules for your work

- Charts read only from `useSelection()`. They never load files themselves.
- Every chart states its unit and whether it is raw or harmonized.
- Every number on the page comes from Person A's `meta.json`. Do not round in a
  way that flatters the result.
- Do not claim the method is the first of its kind. Say what it does and how it
  was tested.
- AI-assisted header on each chart file; log updated in `docs/AI_USE.md`.

## Hand-offs

| Direction | What | When |
|---|---|---|
| B to you | Deployed app on `main`, `useSelection()`, chart placeholders | Sat 11:30 |
| A to you | `raw_jump.png` for the page | Sat 13:00 |
| You to B | Wording for labels and explanations | Sat afternoon |
| A to you | Test results in plain sentences; cut-offs for the comparison labels | Sat 19:30 |
| A to you | Draft text: method, tests, limits, NASA data | Sun 10:00 |
| B to you | Tools paragraph | Sun 13:30 |

## Prompt to give your AI assistant at the start

> You are helping Person C on the fire-census hackathon project. Read
> `AGENTS.md`, then `docs/CONTEXT.md`, `docs/ARCHITECTURE.md`,
> `docs/APPROACH.md` and `docs/tasks/PERSON_C_STORY.md`. The hackathon has
> started. I build the chart components in `app/src/charts/` and lead the demo
> and project page; another person builds the rest of the app, which you must
> not edit. Charts read only from `useSelection()`. Begin Phase 1. Do not state
> any result or number until I give it to you from the pipeline. Work on branch
> `c/charts`. Follow the checklist in order and stop and report at each checkpoint.
