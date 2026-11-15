<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending). -->

# Submission checklist and judge questions

Global deadline Sun 15 Nov 2026, 23:59 IST. Only the last saved submission is
judged. The local deadline may be earlier: **ask the Local Lead.**

## Eligibility, item by item

| Item | Status from the repository | Who checks by hand |
|---|---|---|
| App link public, no login | https://mahabu-subhani.github.io/fire-census/ answered 200 on 14 Nov | Charulekha: open in a private window, laptop and phone |
| Code repository public | Not verifiable from here | 8crsk: open https://github.com/Mahabu-Subhani/fire-census logged out |
| Demo 30 seconds or less | Script is 68 words, about 27.5 s; not recorded yet | Charulekha: check the length in the player |
| Demo link public | Not recorded yet | Charulekha: private window |
| English only (app, page, linked material) | App and drafts are in English | All three: skim the final page |
| At least one NASA dataset | FIRMS MODIS C6.1 and VIIRS C2; MYD14A1; MCD64A1 (check C6m) | Done |
| AI use stated | "Use of AI" in project_page.md, from docs/AI_USE.md; file headers | Charulekha: paste the section |
| AI-generated images or video watermarked | The 10-second demo opener (decision 59) carries "AI-generated animation" on every frame | Charulekha: do not crop it out |
| No NASA logos in generated content | None in the app or figures (checked the app) | Charulekha: check the video |
| No one under 18 in images, video or audio | Not verifiable from here | Charulekha: at recording |
| All external resources in References | docs/REFERENCES.md, Python libraries included since 14 Nov | Done |
| Both agreement boxes ticked on the form | Not verifiable from here | Charulekha: on the form |
| All members on the team page | Not verifiable from here | Charulekha: on the team page |
| No work before 14 Nov 10:15 | Planning documents (12 to 13 Nov), the FIRMS data request (13 Nov) and the checks (14 Nov, 00:15) are dated before the start. The first pipeline code is dated 10:51, after it | Team to agree how to describe this |

## Three questions a local judge is likely to ask (each under 40 words)

**How is this different from a simple conversion ratio?**
A ratio assumes the mix of weak and strong fires never changes. In Córdoba its
yearly error follows that mix (p = 0.013); our measured detection curve's does
not (p = 0.37).
*(32 words; numbers from results.md)*

**What does it not do?**
It counts satellite detections, not fires or burned area, and misses fires
under cloud. It is calibrated for two areas, with two case studies. Single
months are noisy, and the outlook is history, not a forecast.
*(36 words)*

**How was AI used?**
Claude helped write code and drafts, and laid out options for our decisions;
we chose and recorded each decision ourselves. Every AI-assisted file is
labelled and logged with who reviewed it.
*(33 words)*

## On submission day

1. Re-read the numbers the page quotes from the live app (Punjab November, the
   Córdoba trend): they change as data updates. Edit the page to match.
2. Ask Mahabu to check every number on the page and in the demo against
   `submission/results.md`.
3. Paste each section of `submission/project_page.md`, click Save after each.
4. Submit. Screenshot the success banner and post it to the team.
5. At 23:30, open the project page again and confirm it shows as submitted.

## Still weak, and submitted as it stands

- **Córdoba ships a model our own rule would not ship.** The detection curve
  fails the 2016 placebo (C2, -0.114 against 0.10) and the out-of-sample step
  (C1x, 0.100); by the rule the hard floor would ship there. Mahabu chose the
  curve after seeing both results (decision 58). A judge may call it picking the
  winner afterwards; both models' results are in the app.
- C3 (month-by-month held-out check) now passes with one constant per calendar
  month (Córdoba 0.072; Punjab and Haryana 0.148 against 0.15), but not cleanly:
  the method was changed after the failure (decision 57), and the same check on
  2020 to 2021 (C3x) fails in Punjab and Haryana (0.169).
- Punjab's detection curve failed its stability check (C8), so Punjab ships the
  hard floor, and its results move when settings change.
- Chilecito fails C1, C4 and C6 (+0.394) on Córdoba's borrowed calibration.
- C6 (burned area) fails in Córdoba (-0.446; NASA's MCD64A1 -0.381; Aqua alone
  fails the same way) and in Karnataka (+0.347; +0.438); Punjab and Haryana
  passes (-0.148; -0.080).
- Two calibrated areas (Córdoba, Punjab and Haryana) and two case studies
  (Chilecito, Karnataka); anywhere else the app has no data.
- Numbers on the page from the live app are a snapshot of data to 13 Nov 2026.
