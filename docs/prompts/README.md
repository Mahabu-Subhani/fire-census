# Prompts: how to work with Claude this weekend

Each of us has a prompt file here with one prompt per phase. Copy the prompt
for the phase you are starting and paste it into Claude. The prompts assume
Claude can read the repository, so they point at the documents instead of
repeating them.

| You are | Your prompts |
|---|---|
| Mahabu (A) | [PERSON_A.md](PERSON_A.md) |
| 8crsk (B) | [PERSON_B.md](PERSON_B.md) |
| Charulekha (C) | [PERSON_C.md](PERSON_C.md) |
| Anyone, any time | [SHARED.md](SHARED.md): checkpoint report, review, stuck, hand-off |

## Setup (once)

1. Clone the repo to a short path, for example `C:\code\fire-census`.
2. Open that folder in Claude Code (the Code tab of the Claude desktop app, or
   `claude` in a terminal inside the folder). A chat window without file access
   will not work well: Claude needs to read the docs and edit files.
3. Choose the Fable 5.2 model.
4. Claude Code reads `CLAUDE.md` automatically, which pulls in `AGENTS.md`.
5. Paste your "Orientation" prompt first. It makes no changes; it checks that
   Claude has understood the project and your role.

## Making a Pro plan last the weekend

Usage limits reset on a rolling window, so pace yourself.

- **One session per phase.** Start a fresh session for each phase prompt. Long
  sessions resend their whole history and cost more with every message.
- **Before ending a session, run the hand-off prompt** in `SHARED.md`. It writes
  a short note to `docs/handoffs/` so the next session starts with context.
- **Ask for one thing at a time,** and let Claude finish before adding more.
- **Do not paste large files or logs.** Point to the file path instead.
- **Read what it writes.** Catching a wrong turn after five minutes is cheaper
  than after an hour.
- **If you hit the limit,** keep working by hand from your checklist and the
  hand-off note. The task files are written so a person can follow them.

## Rules every prompt assumes

- No solution work before Saturday 14 November, 10:15 IST. Only the Orientation
  prompt may be used before then.
- The team decides. `docs/DECISIONS.md` holds the current decisions. If you
  disagree with one, change it there and tell the others.
- AI-assisted files carry the header from `docs/AI_USE.md`, and each kind of
  help is logged there. No AI co-author lines on commits.
- Numbers come from the pipeline, never from memory or a guess.
