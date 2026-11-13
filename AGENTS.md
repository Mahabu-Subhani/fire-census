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

Person A is Mahabu Subhani (data and science), Person B is 8crsk (web app),
Person C is Charulekha Rajesh (story and submission). Ask your human which one
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

## Definition of done for the whole project

- A public link opens the app with no login, on a laptop and on a phone.
- A user can pick an area and a date range and see the calendar, the comparison
  with the historical median, and download a CSV.
- The raw versus harmonized difference is visible in one click.
- The project page states the method, the tests it passed, and its limits.
- A demo of at most 30 seconds or 7 slides is linked and public.
