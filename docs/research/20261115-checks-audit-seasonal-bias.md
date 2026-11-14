<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by Mahabu Subhani (pending). -->
# Are the pre-registered checks physically and statistically sound, and can the method be made to pass them honestly?

Asked by Mahabu, 15 November 2026, 00:45 IST (`date` read 00:44:58 when the
work began). For decision: 57, made by Mahabu later the same night. Time
spent: about 10 minutes to this note's first version (its file time was
00:55), inside the cap of 40. *Corrected on 15 November: this line first
said "about 50 minutes", an estimate from memory that was wrong.*

## Answer in three lines

1. Check C3 was not failing because its limit was badly chosen. It was
   catching a real flaw: the harmonization error follows the **season**, the
   same way in the fitting years and in the held-out years. One year-round
   constant overstates Punjab and Haryana's May by about 50 to 75 percent and
   understates its October by about 20 percent after 2012; Córdoba's summer is
   overstated and its winter understated.
2. A constant per calendar month, fitted on the same fitting years, removes
   most of it. Under the shipping rule **as first written** the hard floor then
   passes C0 to C3 in both calibrated areas (C3: Córdoba 0.117, Punjab and
   Haryana 0.148; limit 0.15). **Not everything passes:** on 2020 to 2021,
   whose monthly values had not been looked at (their yearly totals had, in
   the leave-one-year-out table of 14 November), Punjab and Haryana gives
   0.169 (over), and
   Córdoba's detection curve with seasonal constants fails the 2016 placebo
   (C2, -0.114 against 0.10).
3. No threshold can or should be changed. C6 cannot be made to pass: its
   premise (a fixed amount of burned area per detected fire) is not physics,
   and Aqua alone fails it.

## The experiment (hypothesis and settings written seconds before the first result)

The hypothesis file was saved at 00:50:03 IST and the first result at
00:50:09 IST: they were written in the same step, seconds before the first
result, not at leisure beforehand. *Corrected on 15 November: this paragraph
first said "about 01:05 IST", an estimate from memory.* By then the error
by calendar month had been seen for the three existing models; no result of
a seasonal model had been, and no monthly value for 2020 to 2021 (their
yearly totals were in the leave-one-year-out table of 14 November).

> Hypothesis: the MODIS-to-VIIRS relation changes with season (background
> temperature, sun, fire type), so one year-round constant leaves a seasonal
> bias. A constant fitted per calendar month removes it.
> Model: daytime k_m = (A_w + n0) / (V_w + n0 / k_annual), sums over the
> fitting months (2012-02 to 2017-12) whose calendar month is m-1, m or m+1;
> n0 = 50 Aqua cells; night keeps the annual constant. Nothing else changes.
> P1. C3 (2018 to 2019, limit 0.15) passes for the shipped model in both
> calibrated areas. P2. The same statistic on 2020 to 2021 is at most 0.15 in
> both. P3. C1, C1b, C2, C3r, C4 keep their pass. A failed prediction is
> reported as failed.

One run, no tuning (`pipeline/seasonal.py`, `WORK/seasonal.json`; rebuilt from
the repository with `from_hotspots.py` and `harmonize.py`, which reproduced
every published check value first).

| Area, model | C1 | C2 (2016) | C3, 2018 to 2019 | Same statistic, 2020 to 2021 | C3r | C4 slope |
|---|---|---|---|---|---|---|
| Córdoba, curve, annual (ships today) | 0.049 | -0.089 | **0.207 fail** | 0.125 | -0.072 | 0.951 |
| Córdoba, curve, seasonal | 0.066 | **-0.114 fail** | 0.072 | 0.125 | -0.062 | 0.951 |
| Córdoba, hard floor, annual | 0.062 | -0.071 | **0.292 fail** | 0.107 | -0.077 | 0.938 |
| Córdoba, hard floor, seasonal | 0.077 | -0.094 | 0.117 | 0.124 | -0.068 | 0.938 |
| Córdoba, ratio, annual | 0.035 | **-0.105 fail** | 0.120 | **0.296** | -0.064 | 0.982 |
| Córdoba, ratio, seasonal | 0.054 | **-0.132 fail** | **0.173 fail** | 0.134 | -0.047 | 0.980 |
| Punjab and Haryana, hard floor, annual (ships today) | -0.016 | -0.060 | **0.169 fail** | **0.223** | -0.042 | 1.025 |
| Punjab and Haryana, hard floor, seasonal | -0.020 | -0.059 | 0.148 | **0.169** | -0.081 | 1.026 |
| Punjab and Haryana, curve, seasonal | -0.022 | -0.050 | **0.208 fail** | **0.174** | -0.072 | 1.032 |
| Punjab and Haryana, ratio, seasonal | -0.028 | -0.034 | **0.176 fail** | **0.199** | -0.062 | 1.039 |

Verdicts on the predictions: **P1 held** (Punjab and Haryana only just:
0.148). **P2 held in Córdoba and failed in Punjab and Haryana** (0.169).
**P3 failed for Córdoba's curve** (C2) and held for the hard floor.

The error by calendar month, ln(record / Aqua), hard floor in Punjab and
Haryana: May +0.56 in the fitting years and +0.43 in 2018 to 2019; June +0.74
and +0.79; October -0.22 and -0.24; January -0.48 and -0.49. Detection curve
in Córdoba: January +0.16 and +0.15; July -0.19 and -0.19; August -0.20 and
-0.22; December +0.40 and +0.25. With seasonal constants: May +0.05 and -0.08,
October -0.14 and -0.17 in Punjab and Haryana; July -0.01 and -0.01 in
Córdoba.

A known weakness of the fixed settings: pooling three months is too coarse for
Punjab and Haryana's sharp seasons. April takes mostly May's constant and
moves from +0.05 to -0.43. It was not tuned, because tuning it now would use
the held-out years.

## Check by check

| Check | Sound? | What was found |
|---|---|---|
| C0 | Yes | Nothing to change |
| C1 | Partly | Means over 36 months cannot see a seasonal bias. Partly in-sample (known; C1x) |
| C1b | Weak | Before 2012 the ratio is exactly 1, so the test only sees a shift in the median after 2012, and only counts it if the estimated date falls in an 18-month window. Seasonal hard floor in Córdoba: p below 0.001 at October 2013, outside the window, so "pass". Always quote the p-value and date with the verdict |
| C2 | Partly | 2008 tests nothing (already noted). 2016 is negative in every area and model (-0.03 to -0.13): the VIIRS-based record falls 3 to 13 percent against Aqua between 2013 to 2015 and 2016 to 2018. That is a slow drift, not a seam. Cause not found (UNVERIFIED candidates: NOAA-20 entering the mean in 2018 explains under 1 percent) |
| C3 | Yes, and informative | Counting noise alone gives 0.065 (Córdoba) and 0.030 (Punjab and Haryana) for this statistic, far under the 0.15 limit (4,000 Poisson draws on the held-out months). The first note of 14 November says no model could be expected to pass; that is not supported. The failure is a seasonal bias |
| C3r | Hides the problem | A two-year total cancels a seasonal bias, so C3r passes while single calendar months are off by 20 to 75 percent. It answers "is the yearly total right", not "is each month right" |
| C4 | Modest | NOAA-20 and S-NPP are the same instrument design, so agreement is expected; it shows the model transfers between VIIRS satellites, not that it matches MODIS. A rank correlation of two strongly seasonal monthly series is high almost by construction; the slope is the informative part |
| C5 | Córdoba yes; Punjab and Haryana weak | Sofiev and Kouznetsov's table 1 (preprint) gives a daytime MODIS limit of 4.44 MW per km² times pixel area plus 0.52 MW: 10.4 MW at 2.23 km², against our 9.9 MW. But our midpoint is half of a plateau, not half of all fires: the plateau is 0.69 in Córdoba and 0.12 in Punjab and Haryana (the strongest VIIRS fire cells are matched by Aqua 12 percent of the time above chance). In Punjab and Haryana the midpoint is not a physical detection limit; with overpasses within 10 minutes it is 7.2 MW, not 4.8 |
| C6, C6m | Premise not physical | Burned area per detected fire is not a constant of nature; it changes with fire type and size, and Aqua alone fails identically. The check cannot isolate the seam, because after 2012 the record is calibrated to Aqua. Both burned-area products are built from MODIS reflectance guided by MODIS active fires, so they are independent of VIIRS and of the seam but not of MODIS |
| C7 | Yes, with a caveat | The early years are all MODIS and the late years mostly VIIRS, so the October-low, November-right seasonal bias pushes the weighted median day later. That may be part of the 0.8 day by which the record (8.2) exceeds Aqua alone (7.4). Aqua alone still passes |
| C8 | Yes | Read on the daytime curve (already noted) |

Physics the method leaves out, with its size: MODIS's detection limit grows
sevenfold across the swath (5.7 MW in the middle to about 42 MW at the edge by
day, Sofiev and Kouznetsov). In our data Aqua's median pixel area over
Córdoba runs from 1.0 to 6.7 km² through its 16-day repeat cycle, and from 1.0
to 8.1 km² over Punjab and Haryana. A month whose burning days fall on
edge-of-swath days is under-counted by Aqua. That is noise in the reference,
not in the record, and it bounds how low C3 can go; it was not modelled.

## What it changes for us

- The statement that C3's limit "could not be met by any real harmonization"
  (project page, `results.md`, the 14 November note) should be withdrawn
  whatever is decided.
- The shipped record has a seasonal bias across 2012 in the comparison the
  app is built for (this May against earlier Mays). Either ship seasonal
  constants or state the bias in the limits.
- "Two independent burned-area records" should say independent of VIIRS, not
  independent of MODIS.

## What it does not change

- No threshold, no definition, no verdict already published.
- C6 and C6m in Córdoba stay failed. Chilecito and Karnataka stay case studies.
- C1, C4, C7 and C8 verdicts.

## Draft dated note for PREREGISTRATION.md (not added; for Mahabu to decide)

> ### 15 November 2026: what C3's failure was (drafted by the AI assistant)
> No threshold and no definition is changed. C3's failure is a seasonal
> bias, not noise: split by calendar month, ln(H / R) is the same in the
> fitting years and in 2018 to 2019. Counting noise alone would give 0.03 to
> 0.07. The sentence of 14 November that no model could be expected to pass
> is withdrawn. With one constant per calendar month, fitted on the same
> years (settings fixed before the run), C3 is 0.117 for the hard floor in
> Córdoba and 0.148 in Punjab and Haryana, and the same statistic on 2020 to
> 2021 is 0.124 and 0.169. C3r stays reported beside C3; it cannot see a
> seasonal bias.

## Search log

| Where | Search string or method | Date | Results looked at |
|---|---|---|---|
| gmd.copernicus.org | Opened the article page from `docs/APPROACH.md` | 15 Nov | 1 |
| egusphere.copernicus.org | Preprint PDF of the same paper, text extracted for table 1 | 15 Nov | 1 |
| Web search | arXiv MODIS VIIRS active fire harmonization consistent long-term fire record detection probability | 15 Nov | 10 titles; no arXiv preprint on this found |
| Web search | Vadrevu Lasko 2018 intercomparison MODIS Aqua VIIRS I-band fires agricultural landscape Punjab ratio | 15 Nov | 10 titles |
| Web search | MODIS active fire detection probability scan angle pixel size omission small fires Freeborn Giglio VIIRS 375 m comparison | 15 Nov | 10 titles |
| Web search | Punjab stubble burning shifted later in afternoon evening after satellite overpass geostationary study 2025 | 15 Nov | 10 titles |
| Web search | FireCCI51 hybrid algorithm MODIS active fires; MCD64A1 uses 1 km MODIS active fire observations | 15 Nov | 20 titles |
| Web search | MODIS VIIRS active fire count ratio seasonal variation background temperature | 15 Nov | 10 titles; nothing direct |
| climate.esa.int | Opened the Fire_cci news page on the FireCCI51 algorithm | 15 Nov | 1 |

## Sources

| Title | Authors | Date | Link | Type | Grade | Read: full or abstract | What it says that matters to us |
|---|---|---|---|---|---|---|---|
| Observation operator and detection limits for MODIS and VIIRS Fire Radiative Power products | Sofiev, Kouznetsov | 26 Oct 2026 | https://gmd.copernicus.org/articles/19/10123/2026/ | Paper (GMD) | A | Article page, summarised by a tool; not line by line | Detection limit is linear in pixel area; MODIS 5.7 MW (day) and 3.7 MW (night) for the smallest pixels, about 42 and 39 MW at the swath edge; a 20 percent MODIS to VIIRS difference is put down to overpass time |
| Same, preprint | Sofiev, Kouznetsov | 9 Mar 2026 (file date) | https://egusphere.copernicus.org/preprints/2026/egusphere-2026-89/ | Preprint | B | Table 1 and nearby text | MODIS day: slope 4.44 MW per km², intercept 0.52 MW; night 4.43 and 1.01. Half of MODIS fires come from 1 to 1.2 km² pixels, which cover about a fifth of the swath |
| A spatio-temporal active-fire clustering approach for global burned area mapping at 250 m from MODIS data (ESA Fire_cci news page) | Lizundia-Loiola et al. | not stated on the page | https://climate.esa.int/en/projects/fire/news/spatio-temporal-active-fire-clustering-approach-for-global-burned-area-mapping-at-250-m-from-modis-data | Agency page on a paper | A for the quoted sentence | Page | FireCCI51 "combines MODIS highest resolution (250 m) near-infrared band and active fire information from thermal channels" |
| MCD64A1 product description | NASA LP DAAC | not read | https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf | Product guide | D as read here | Search snippet only; the PDF text could not be extracted | UNVERIFIED in full text: uses 500 m reflectance "coupled with 1 km MODIS active fire observations" |
| Intercomparison of MODIS AQUA and VIIRS I-Band Fires and Emissions in an Agricultural Landscape | Vadrevu, Lasko | 2018 | https://doi.org/10.3390/rs10070978 | Paper | D as read here | Search summary only; the page was blocked | Lead: in Punjab VIIRS found 4.8 times the fires of Terra and Aqua together |
| News reports of an ISRO study in Current Science (SEVIRI, peak burning moved from about 13:30 to about 17:00 IST) | various | Nov to Dec 2025 | https://www.tribuneindia.com/news/haryana/farmers-shift-stubble-burning-time-to-dodge-satellite-tracking-isro-study | News | D | Search summary only | Lead for the evening-burning caveat; the primary paper was not opened |

## Open questions and UNVERIFIED claims

- Why the relation is seasonal. Candidates, none tested: hotter and brighter
  backgrounds raise MODIS's limit more than VIIRS's (the same physics as the
  day and night difference, which the method already fits separately);
  different crops and fire sizes by season; overpass time against the daily
  burning cycle. UNVERIFIED.
- The slow drift behind C2 (2016).
- Whether a detection curve that depends on Aqua's pixel area on the day
  would cut C3 further. Not run.
- MCD64A1's use of active fires: read the user guide.
- Vadrevu and Lasko (2018) and the Current Science paper: read the full texts
  before citing either on the project page.

## After the decision (added 15 November, 01:44 IST by `date`)

Mahabu chose to ship the constants per calendar month (decision 57). The
record was rebuilt from the raw FIRMS files; the rebuild gave the same check
values as the one experimental run above. What the full run added to the
picture, all in `submission/results.md` and `limits.md`:

- **The C3 passes are not robust.** Under five other settings C3 fails in
  three of five in Córdoba (0.098 to 0.222) and in all five in Punjab and
  Haryana (0.154 to 0.242). Punjab and Haryana is at the limit: 0.148 against
  0.15 on 15 of 24 months, and C3x 0.169.
- **Córdoba got weaker year by year.** The rule ships the hard floor there
  (the curve fails C2, -0.114). Leaving one year out, the hard floor is within
  0.10 of Aqua in 3 of 10 years (largest miss 0.233, in 2013); the curve in 9
  of 10. Its error follows the mix of weak and strong fires (0.76, p = 0.011).
- **The detection curve ships in no area.**
- **A finding the monthly constants uncovered.** Since 2022 Aqua, whose pass
  has drifted to mid-afternoon, reports 48 percent more than the record in
  Punjab and Haryana's October and November and nothing more in April to June.
- Corrections to this note made on 15 November are marked in italics above:
  the times were estimates from memory, and "nobody had looked at 2020 to
  2021" was too strong (their yearly totals had been seen).
- Left as they are because the files are frozen: a comment in
  `pipeline/validate.py` ("two years no result had been looked at") and the
  docstring of `harmonize.seasonal_constants` ("fixed before the first run")
  say more than is true; read them with the corrections here.
