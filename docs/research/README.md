<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk (pending team review). -->

# Research notes

One file per question, named `<YYYYMMDD>-<topic>.md`, written with prompt D2 in
`docs/prompts/DEEPEN.md`. Anyone may add a file. To add to someone else's file,
append a dated section with your name. Do not rewrite their text.

Read the list below before you start a new sweep.

## Evidence grades

| Grade | Source | May support |
|---|---|---|
| A | Official product documentation (user guides, ATBDs, FIRMS pages); peer-reviewed papers | A claim on the project page |
| B | Preprints (arXiv, EarthArXiv, ESS Open Archive); Copernicus Discussions papers | A claim, labelled "preprint" |
| C | Open-source code with tests; datasets with documentation | "We used" or "we compared with" |
| D | Blogs (Substack, Medium), forums, AI answers, abstracts read without the full text | Nothing. A lead to trace to grade A to C |

## Template

```markdown
<!-- AI-assisted: written with help from <tool>. Reviewed by <name>. -->
# <The question>

Asked by <name>, <date, time IST>. For decision: <DECISIONS.md row, or "new">.
Time spent: <minutes>.

## Answer in three lines

## What it changes for us

## What it does not change

## Search log

| Where | Search string or method | Date | Results looked at |
|---|---|---|---|

## Sources

| Title | Authors | Date | Link | Type | Grade | Read: full or abstract | What it says that matters to us |
|---|---|---|---|---|---|---|---|

## Open questions and UNVERIFIED claims
```

## Notes so far

| File | Question | By | Date |
|---|---|---|---|
| `20261115-checks-audit-seasonal-bias.md` | Are the pre-registered checks sound, and can the method pass them honestly? Finds a seasonal bias behind C3 and tests constants per calendar month | Mahabu, with the AI assistant | 15 Nov 2026 |
| `20261115-what-is-new-after-the-rebuild.md` | After the rebuild: is the record sound, and what in the work is new? Where the curve is still used; the constants follow the sun; Aqua by season | Mahabu, with the AI assistant | 15 Nov 2026 |
