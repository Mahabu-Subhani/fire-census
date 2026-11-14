<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk (pending team review). -->

# Deepen before deciding: decisions, research and documentation

Four prompts any of us can run. The rule that says when to use them is in
`AGENTS.md`, "Before a decision". In short:

| The choice | Example | Run | Time cap |
|---|---|---|---|
| Can be undone in under 30 minutes, inside your own folders | A button label, a chart margin | Nothing. Decide and carry on | 0 |
| Touches a contract or another person's folder, changes what judges see, or is hard to undo | Cube format, colour ramp, wording of the Checks panel | **D1** | 15 min |
| Concerns the method, how a check is read, the Sat 19:30 go/no-go, or a claim that something is new | Completeness curve or hard floor; "never attempted before" | **D1**, then **D2** | 40 min |
| Comes after the Sun 13:30 freeze | Anything | Nothing. Fixes only | |

Before you run anything, look in `docs/research/` and `docs/DECISIONS.md`: a
teammate may already have done it. Then copy the prompt, fill in the `<...>`
parts and paste it into a fresh session.

---

## D1. Deepen before a decision

```text
I am <name>, Person <A/B/C>. I have to decide: <the decision in one sentence>.
My current leaning: <option, or "none">. It must be decided by: <time>.
Time cap for this prompt: <15 or 40> minutes.

First read CLAUDE.md, docs/DECISIONS.md, docs/PREREGISTRATION.md and anything in
docs/research/ that touches this question. If it is already decided or
researched, tell me where and stop.

Do not decide for me and do not change any file. The Space Apps rules say AI
must not come up with the idea, so the team decides. Your job is to make my
decision better informed. Answer briefly, in this order:

1. The real question. Restate what I am deciding and what depends on it: the
   data contract, the useSelection() interface, a teammate's work, what judges
   see, a pre-registered check. Tell me if I am asking the wrong question.
2. What a top professional would do here that I am not asking for. Name the
   role (for example a fire remote-sensing scientist, a data-visualisation
   lead, a Space Apps judge). At most three things, each tied to a judging
   criterion in docs/CONTEXT.md.
3. The rawest material. What they would start from instead of what has already
   been digested for me (blog posts, AI summaries, our own docs). Name the exact
   primary source: a product user guide or ATBD, a Level-2 granule, a paper's
   own data or code, the live Space Apps guide page. Say whether we can get it
   within the time cap.
4. Methods and tools. The specific ones they would use (command, library, site
   or statistical test), and roughly how long each would take us.
5. What would show the result is right, other than you or me: an independent
   dataset, a pre-registered check by its number, a person (a mentor, the Local
   Lead, a teammate who did not build it), or a test a stranger can run. Say
   which result would prove us wrong.
6. Options. Two or three, always including the simplest thing that fully
   works. For each: hours it costs, what it risks, how hard it is to undo, and
   what it does to the schedule in docs/GETTING_STARTED.md. Then one line,
   clearly marked as your suggestion, saying which you would pick and why.
7. What I am not saying. The assumptions in my request that I have not stated,
   and anything that conflicts with AGENTS.md, the pre-registration or the
   schedule.

Then rewrite my request as a prompt that asks for exactly the deeper version
within the time cap, and stop. I will choose, then run it myself.

Rules: every fact you use comes either from a file in this repo or from a
source you opened in this session, with its link. Anything else is marked
UNVERIFIED. If you have no web tool, say so and give me links and search
strings to open myself. Do not answer from memory.
```

### After you have chosen

```text
I have chosen <option> because <my reason, in my own words>. Record it: update
or add the row in docs/DECISIONS.md with my name, the date and my reason, and
add a line to its change log. Add a row to the log in docs/AI_USE.md saying what
you contributed (options and evidence) and that I made the choice. If the
choice changes the data contract or the useSelection() interface, do not edit
them: draft the change for <teammate> to agree to. Then do the work.
```

---

## D2. Research sweep: papers, preprints, blogs and open-source projects

```text
I am <name>, Person <A/B/C>. Research question: <one sentence, tied to a
decision or to a claim we want to make on the project page>.
Time cap: <30> minutes. Read at most 15 sources in full. Work in this session
and do not start parallel agents unless I ask.

Read docs/research/ first. If a teammate has swept this, extend their note with
a dated section instead of starting again.

Search in this order and log every search string and where you ran it:

1. Primary documentation: NASA FIRMS pages and FAQ; the MODIS Collection 6.1
   and VIIRS 375 m active fire user guides and ATBDs; the LAADS DAAC product
   pages. If the question is about the app or the submission, use that field's
   primary sources instead (library docs, WCAG, the Space Apps guides).
2. Papers and preprints, newest first, at least the last 24 months. Earth
   science preprints are mostly not on arXiv: search EarthArXiv, ESS Open
   Archive and the Copernicus "Discussions" journals (GMD, ACP, NHESS, ESSD) as
   well as arXiv (physics.ao-ph, cs.CV, eess.IV). Follow citations forward
   ("cited by" in Semantic Scholar, OpenAlex or Google Scholar) from the anchor
   papers in docs/APPROACH.md, "Prior work".
3. Open-source projects building something adjacent: GitHub topic and code
   search (for example MODIS VIIRS harmonization, FIRMS, active fire, fire
   calendar), and datasets that ship code (for example GFED, ESA Fire_cci,
   GWIS). For each project give its licence, the date of its last commit and
   whether it has tests.
4. Practitioner writing: Substack, Medium, agency blogs, the NASA Earthdata
   blog. These are leads, not evidence. Trace each claim back to its primary
   source, or drop it.

Other teams' repositories for this year's challenge: note what they do, for
positioning only. Never copy their code or text.

Write docs/research/<YYYYMMDD>-<topic>.md from the template in
docs/research/README.md, and add it to the list there. Grade every source as
the README says, and say whether you read the full text or only the abstract.
If you found nothing new, say so: that is a result.

Then tell me in five lines what should change, if anything, and which row of
docs/DECISIONS.md or which check in docs/PREREGISTRATION.md it touches. Never
edit a threshold. If the research suggests one is wrong, draft the dated note
that PREREGISTRATION.md asks for and show it to me.

Link papers; do not download them into the repo. Add anything we actually use
(code, data, a paper we cite) to docs/REFERENCES.md with its licence.
```

---

## D3. Document what I just finished

Run this before you call a piece of work done.

```text
I am <name>, Person <A/B/C>. I have just finished <the piece of work>. Document
it so that a judge, a teammate or a researcher in December can understand and
reproduce it without me. Read the actual files and the git log for this work,
not what you remember writing. Then, only inside my own folders:

1. Update the README of the folder the work lives in (pipeline/, app/ or
   submission/): what it does; how to run it, with exact commands that you
   have run just now; inputs and outputs with their paths; how long it takes;
   known limits. Write "untested" next to anything you did not run.
2. Check that docs/DECISIONS.md has a row for every decision this work
   involved. If one is missing, ask me for the reason. Do not invent it.
3. Add every library, dataset, tile source or paper it uses to
   docs/REFERENCES.md, with its licence.
4. Add the AI-assisted header to each file you helped write, and a row to the
   log in docs/AI_USE.md.
5. Name the project page field (docs/CONTEXT.md, "Project page fields to
   fill") that this work feeds. Draft one or two plain sentences for it and save
   them as submission/inbox/<letter>-<topic>.md for Person C.

Describe only what the code does today. If a check failed, write that it failed.
```

---

## D4. Audit the submission against the live Space Apps documentation

Person C owns the result. Run at Sat 19:30 and again at Sun 12:30.

```text
Open the live Space Apps 2026 pages: the Project Submission Guide, the Judging
and Awards Guide, the Participant FAQ and our challenge page (links in
docs/CONTEXT.md). Compare them with docs/CONTEXT.md and list anything that has
changed or that we have missed, quoting the exact wording with its link.

Then build a table with one row per project page field and per judging
criterion: what the guide asks for, which file in this repo supplies it
(including submission/inbox/), its state (missing, draft or final) and who owns
it. Flag first anything that could make us ineligible: demo over 30 seconds or
over 7 slides, a link that needs a login, a missing AI disclosure, NASA
branding in generated media, text not in English, missing references.

If I am Person C, save the table as submission/CHECKLIST.md. Otherwise show it
to me and do not save it.
```

---

## What the original request left unsaid, and where these prompts cover it

| Left unsaid | Covered by |
|---|---|
| Which decisions deserve this, and how long it may take | Tier table and time caps above; `AGENTS.md` |
| The rule that AI must not come up with the idea | D1 gives options and evidence; the human chooses and records the reason in their own words |
| Thresholds were fixed before the data was opened | D2 never edits a threshold; it drafts a dated note instead |
| Models invent citations | Only sources opened in the session, with links; anything else is UNVERIFIED |
| This field's preprints are mostly not on arXiv | D2 adds EarthArXiv, ESS Open Archive, Copernicus Discussions and forward citation search |
| Blogs are not evidence | Evidence grades in `docs/research/README.md`; blogs are leads only |
| Open-source code has licences, and other teams are competitors | Licence check, `REFERENCES.md`, no copying from other teams |
| Three people may research the same thing three times | Check `docs/research/` and `DECISIONS.md` first; extend notes instead of repeating them |
| An ambitious prompt keeps going | D1 stops after the rewrite; D2 has a source limit and a time cap |
| "Nothing new" is a valid answer | Stated in D2 |
| Teammates have different tools | Without a web tool, the assistant gives search strings instead of answering from memory |
| Judges score mainly the project page | D3 sends draft text to `submission/inbox/`; D4 maps every field to a file |
| "Right" must be shown by something other than us | D1 step 5: an independent dataset, a pre-registered check, a person, a stranger's test |
