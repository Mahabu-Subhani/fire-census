<!-- AI-assisted: drafted with help from Claude (Anthropic). Reviewed by: Mahabu Subhani. -->

# For Charulekha: one-line versions for the project page

Full drafts: `submission/method.md`, `results.md`, `limits.md`, `nasa_data.md`.
Figures: `submission/figures/`.

- **Summary line:** Fire Census turns 24 years of NASA MODIS and VIIRS hotspots
  into one burning calendar in which 2005 and 2025 mean the same thing, using a
  measured curve of what the older sensor can see.
- **Strongest evidence (Validity):** our curve, built only from where two
  satellites agreed, puts MODIS's daytime detection limit over Córdoba at 9.9
  MW; a 2026 physics paper's formula gives 10.4 MW for the same pixel sizes.
- **Creativity:** we treat the two sensors like telescopes of different
  sensitivity and correct for each one's completeness, instead of fitting one
  conversion factor; and we show that a conversion factor fails exactly when the
  mix of weak and strong fires changes.
- **Impact:** MODIS is ending and its orbit has drifted two hours since 2021.
  Our record keeps the first ten MODIS-only years usable and does not inherit
  the drift.
- **Honesty:** 10 checks were fixed before the data was opened (plus one added after, shown beside it); in Córdoba 8 pass,
  1 fails and 2 were not run or do not apply, and all are shown in the app.

Best figures, in order: `harmonized_cordoba.png` (the jump and its removal),
`detection_curve_cordoba.png`, `orbit_drift.png`, `ratio_stability_cordoba.png`.
