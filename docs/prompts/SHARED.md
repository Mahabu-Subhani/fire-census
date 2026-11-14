# Shared prompts (anyone, any time)

## Checkpoint report

Use at every sync point in `docs/GETTING_STARTED.md`.

```text
We are at a checkpoint. Look at my task file, the git log on my branch and the
current state of the files, and give me a status I can read out to my team in
under a minute:

1. Done: what is finished and merged, with evidence (a file, a test, a link).
2. Not done: what the checklist expected by now that is not finished, and how
   long each item realistically needs.
3. Blocked: anything waiting on a teammate, on data, or on a decision, and
   exactly what I should ask for.
4. Risk: the one thing most likely to hurt us before the next checkpoint.

Do not soften anything. If something I think is done is not actually working,
say so. Then tick the finished items in my task file.
```

## Adversarial review of my own work

Use before merging anything important, and before the Saturday 19:30 decision.

```text
Review what I have built in this session as a sceptical expert who wants to
find the flaw, not as its author. Read the actual files, do not rely on what
you remember writing.

Check, in this order:
1. Correctness: does it do what the task file and the contracts in
   docs/ARCHITECTURE.md say? Name any mismatch precisely.
2. Honesty: is every number traceable to the pipeline? Is anything hard-coded,
   rounded favourably, or described more confidently than the evidence allows?
3. Edge cases: empty selection, a month with no observations, a region with
   few fires, missing fields, a phone-width screen.
4. What a judge who knows this field would attack first.

List findings most serious first. For each: what is wrong, how you know, and
the smallest fix. Then fix the ones that are clearly bugs and ask me about the
ones that are judgement calls.
```

## I am stuck

```text
I have been stuck on this for a while: <describe the problem in one or two
sentences, and paste the exact error or the path of the file that shows it>.

Before proposing a fix, find the actual cause: read the relevant code and
reproduce the problem if you can. Tell me what you found. Then give me the
simplest fix that keeps us on schedule, and a fallback if that fix would take
more than 30 minutes. If the honest answer is "drop this feature", say so and
tell me what the cut order in docs/GETTING_STARTED.md says about it.
```

## Hand-off note (run before ending any session)

```text
I am about to end this session. Write a hand-off note to
docs/handoffs/<my letter>-<YYYYMMDD-HHMM>.md so that a fresh session, or a
teammate, can continue without this conversation. Include:

- What I was doing and which checklist item I am on.
- What is finished and merged, and what is finished but not merged (branch name).
- What is half-done, with file paths and exactly what remains.
- Decisions made in this session and why, especially anything that differs
  from the docs. Update docs/DECISIONS.md if a decision changed.
- Anything I am waiting on from a teammate.
- The exact next step.

Keep it under 40 lines. Then commit it and push my branch.
```

## Start a new session from a hand-off

```text
Read CLAUDE.md, then the newest file for me in docs/handoffs/, then my task
file. Tell me in five lines where things stand and what the next step is. Wait
for me to confirm before changing anything.
```

## Merge my work

```text
Get my branch ready to merge into main. Pull main and rebase or merge so there
are no conflicts; if a conflict is in a file another person owns (see the
ownership table in docs/ARCHITECTURE.md), stop and tell me. Run the tests and
the build. Check that no secret, no .env and nothing from data/ is staged, and
that each AI-assisted file has the header from docs/AI_USE.md. Then push and
open a pull request with a three-line description. Do not add any AI co-author
line to commits or to the pull request.
```
