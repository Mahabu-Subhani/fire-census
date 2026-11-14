# Use of AI tools

The Space Apps Project Submission Guide requires teams to state where and how
AI tools were used, and says AI should accelerate the work, not come up with the
idea of how to solve the challenge. This file is the team's honest log. Person C
uses it to fill the "Use of AI" field on the project page.

## Labelling rules

| Kind of output | Required label |
|---|---|
| Code and data | Acknowledge in descriptive text and metadata. In this repo: a header comment at the top of each AI-assisted file, and an entry in the log below |
| Images and video | A visible watermark stating it is AI-generated |
| Audio | Acknowledged in descriptive text and metadata |

Header comment to use in AI-assisted source files:

```
AI-assisted: written with help from <tool>. Reviewed by <team member>.
```

No AI-generated content may use NASA logos, flags or mission identifiers.

## Log

Add a row whenever an AI tool contributes. Be specific and truthful.

| Date | Tool | What it did | Reviewed by |
|---|---|---|---|
| 12–13 Nov 2026 | Claude (Anthropic) | Read the challenge page and official guides; surveyed public repositories of other teams; proposed and critiqued candidate harmonization approaches; drafted these planning documents | Team, pending |
| 12–13 Nov 2026 | Gemini (Google) | Critiqued the proposed method and architecture | Team, pending |
| 14 Nov 2026 | Claude (Anthropic) | Wrote the app controls (coordinates, date range, small-fire switch, CSV download, shareable link) and the Checks and Method panel built from meta.json, with tests that render it from the real data | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Wrote the first app shell in app/ (data loading, selectCells and its tests, the useSelection() hook, map with area drawing, layout, placeholder charts) and the Pages deploy workflow | 8crsk |
| 14 Nov 2026 | Claude (Anthropic) | Drafted docs/APP_VISION.md (user questions, gaps against existing tools, a first-principles reading of the challenge text) and the contract fields it needs. The team chose to adopt it (decision 28); the first-principles additions await a team decision (29) | 8crsk, team |
| 14 Nov 2026 | Claude (Anthropic) | Phase 1 and 2 pipeline code (inventory, cleaning, harmonization, checks, export, figures) and the notes in pipeline/; proposed the revised check C3r and recommended shipping the detection curve. Mahabu chose (DECISIONS.md, 30) | Mahabu |
| 14 Nov 2026 | Claude (Anthropic) | Turned 8crsk's draft request into the decision protocol (AGENTS.md, "Before a decision"), the prompts in docs/prompts/DEEPEN.md and the research-note template in docs/research/ | 8crsk, team pending |
| 14 Nov 2026 | Claude (Anthropic) | Wrote app/src/stats/ (value, toCalendar, monthHistory with month-to-date, median, rank, 90th percentile, with tests), ChartFrame, the usePlot helper and the BurningCalendar chart, and checked it at 400 px and 1280 px in headless Chrome | Charulekha Rajesh (pending) |
| 14 Nov 2026 | Claude (Anthropic) | Added the `unit_raw` label to pipeline/export.py, the three meta.json files and the contract in docs/ARCHITECTURE.md, at Mahabu's request | Mahabu (pending) |
| 14 Nov 2026 | Claude (Anthropic) | CA2 for Person C: status sentence (rank, ratio, month to date, baseline switch), MonthComparison, season band and you-are-here marker on the calendar, ActivitySeries, CSV/PNG/SVG export through ChartFrame, the stats behind them with tests, and an adversarial self-review. Laid out options and evidence for decisions 32 and 33; Charulekha chose | Charulekha Rajesh (pending) |

## The team's own decisions

Record here, in the team's own words, which approach the team chose and why,
and what the team changed from any AI suggestion. Fill this in after the team
discussion.

- 13 Nov 2026: the defaults in `docs/DECISIONS.md` (name, regions, thresholds,
  framework, stretch order) were recommended by the AI assistant and accepted by
  Mahabu. They are not yet team decisions. Record below what the team confirms,
  changes or rejects.
- Decision 1:
- Decision 2:
