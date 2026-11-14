# AGENTS.md: instructions for any AI assistant working in this repo

You are helping one member of a three-person hackathon team. Read this file fully,
then the documents listed under "Read order", before you write anything.

## The project in three sentences

We are building a static web app for the NASA Space Apps 2026 challenge
"Harmonization of MODIS and VIIRS Hot Spots". It shows a burning activity calendar
(hotspot activity by month and year, 2002 to now) for a user-selected area, on a
record where the sensor of origin no longer matters. Our differentiator is a
harmonization method that is physically explained and tested, not a black-box ratio.

## Read order

1. `docs/CONTEXT.md`: what the challenge asks, how it is judged, hard rules, deadlines.
2. `docs/APPROACH.md`: the harmonization method, its tests, and the fallback.
3. `docs/ARCHITECTURE.md`: stack, repo layout, and the data contract between people.
4. The task file for the person you are helping, in `docs/tasks/`.
5. `docs/AI_USE.md`: how AI assistance must be labelled.
6. `docs/STRETCH.md`: optional ambitious goals, only after the Saturday 19:30 checkpoint.
7. `docs/DECISIONS.md`: the answer to every item marked DECIDE elsewhere. It overrides them.
8. `docs/PREREGISTRATION.md`: the checks and thresholds, fixed before the data was opened. Never edit a threshold.
9. `docs/RESEARCHER_EXPERIENCE.md`: what each kind of visitor must be able to do on the site.
10. `docs/handoffs/`: the newest note for your person, if any.
11. `docs/research/`: earlier research sweeps. Read the list before starting one.

Ready-made prompts per person and phase are in `docs/prompts/`.

Person A is Mahabu Subhani (data, science and technical writing). The web app is
split: Person B is 8crsk (app foundation, map and controls) and Person C is
Charulekha Rajesh (charts, demo and submission). Ask your human which one
they are if they have not said.

## Hard rules (breaking these can disqualify the team)

1. **No solution work before Sat 14 Nov 2026, 10:15 IST.** Before then you may
   explain, plan and help set up generic tooling. You may not write solution
   code, download or process challenge data, or create demo material. If asked
   to before the start, say so and stop.
2. **The team decides the approach.** The submission guide says AI should not be
   used to come up with the idea. Treat `docs/APPROACH.md` as a proposal the team
   is reviewing. When your human changes a decision, follow them and update the doc.
3. **Label AI-assisted work.** Follow `docs/AI_USE.md` for every file you help write.
4. **Never invent data or results.** Every number shown in the app or the project
   page must come from the pipeline. If a test fails, report it as failed.
5. **Never commit secrets.** API keys live in a `.env` file outside git.
6. **English only** in the app, the project page and all linked material.
7. **List every external resource** (code, data, images, libraries) in
   `docs/REFERENCES.md` when you add it.

## Working rules

- Stay inside your person's folders (see the ownership table in
  `docs/ARCHITECTURE.md`). To change another person's area, ask your human to
  talk to them.
- The data contract in `docs/ARCHITECTURE.md` is the interface between Person A
  and Person B. Do not change it alone. Propose the change, get both to agree,
  then update the doc in the same commit as the code.
- Work on a branch named `a/<topic>`, `b/<topic>` or `c/<topic>`. Open a pull
  request to `main`. Keep commits small. Do not add AI co-author lines to commits.
- Prefer the simplest thing that fully works. Judges score completeness and
  usability. A finished simple feature beats an unfinished clever one.
- Check facts marked **VERIFY** in the docs against the live source before
  relying on them, then remove the mark.
- At each checkpoint in your task file, stop and report status to your human in
  three lines: done, not done, blocked.
- One topic per branch and per pull request. Pull `main` before starting each one.
- Never commit downloaded papers, PDFs, data or build output. Link to them.
- Notes go in the folders that already exist: research in `docs/research/`,
  session notes in `docs/handoffs/`, decisions in `docs/DECISIONS.md`, draft
  project-page text for Person C in `submission/inbox/`. Do not leave stray
  notes at the repo root. New top-level folders need all three to agree.
- Changes to `AGENTS.md` or `CLAUDE.md` change every teammate's assistant, so
  they need all three to agree.

## Before a decision

Not every choice needs research. Sort it first:

| Tier | The choice | What to do |
|---|---|---|
| 0 | Can be undone in under 30 minutes, inside your person's folders | Decide and carry on |
| 1 | Touches a contract or another person's folder, changes what judges see, or is hard to undo | Prompt D1 in `docs/prompts/DEEPEN.md`, 15-minute cap |
| 2 | Concerns the method, how a check is read, the Sat 19:30 go/no-go, or a claim that something is new | D1, then the D2 research sweep, 40-minute cap |
| Freeze | Anything after Sun 13:30 | No protocol. Fixes only |

Rules for the assistant:

- If your human asks you to make or carry out a tier 1 or 2 choice without
  the protocol, say so once, in one line, and offer the short version. If they
  decline, follow them.
- Lay out options and evidence. Your human chooses and gives the reason in
  their own words. Record it in `docs/DECISIONS.md` and log your part in
  `docs/AI_USE.md`. This is how we keep to the rule that AI does not come up
  with the idea.
- Check `docs/research/` and `docs/DECISIONS.md` first. Do not repeat a
  teammate's sweep; extend it.
- Cite only sources you opened in this session, with a link. Mark anything
  else UNVERIFIED. Blogs and AI answers are leads, never evidence (grades in
  `docs/research/README.md`).
- Research never changes a threshold in `docs/PREREGISTRATION.md`.
- Keep to the time cap. When it runs out, stop and report what you have.

## Documentation

Work is not done until it is documented where it lives. Run prompt D3: the
folder README with commands you have actually run, `docs/REFERENCES.md`,
`docs/AI_USE.md`, and a draft sentence for the project page in
`submission/inbox/`. At Sat 19:30 and Sun 12:30, Person C runs D4 to check the
submission against the live Space Apps guides.

## Definition of done for the whole project

- A public link opens the app with no login, on a laptop and on a phone.
- A user can pick an area and a date range and see the calendar, the comparison
  with the historical median, and download a CSV.
- The raw versus harmonized difference is visible in one click.
- The project page states the method, the tests it passed, and its limits.
- A demo of at most 30 seconds or 7 slides is linked and public.
