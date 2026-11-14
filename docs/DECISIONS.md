# Decisions

This file settles every item marked DECIDE in the other documents. **Where
another document says DECIDE, the answer here applies.**

Status: these are defaults recommended by the AI assistant on 13 November 2026
and accepted by Mahabu so the team can start without delay. 8crsk and
Charulekha have not yet reviewed them. Any teammate can change one: edit the
row, add your name and the reason, and tell the others. Changes after Saturday
13:00 need all three to agree.

## Project

| # | Decision | Answer | Why |
|---|---|---|---|
| 1 | Name | **Fire Census** | A census counts the same way every time, whoever does the counting. That is the point of the project |
| 2 | Tagline | "One fire record, whichever satellite was watching." | States the outcome in the challenge's own terms: the sensor of origin no longer matters |
| 3 | Demo format | 30-second video, target 28 seconds | The switch from raw to harmonized is a moving image; slides cannot show it |

## Method

| # | Decision | Answer | Why |
|---|---|---|---|
| 4 | Core approach | The ladder in `APPROACH.md`: L0 raw, L1 fire cells, L2 common floor | Each step removes one named cause and is measured separately |
| 5 | Completeness curve (S0) | **Yes**, attempted after L2 has a test result. Ship it only if it does at least as well as L2 on T1 to T5 | Gives a range for free and one explanatory picture; L2 remains the fallback |
| 6 | Internal grid | 0.01 degree | Simple. Both regions are at low to middle latitudes; state the approximation |
| 7 | Overpass key | `satellite + acq_date + daynight` | `acq_time` varies within one pass |
| 8 | Confidence filter | Drop MODIS below 30 and VIIRS "low". Report how results change with the filter off | Matches common practice; the sensitivity check keeps it honest |
| 9 | Agreement tolerance for the floor | Ratio within 10 percent of 1 | A starting point; record the achieved value |
| 10 | Reference pair | Aqua MODIS and S-NPP VIIRS, calibration years 2012 to 2019. If VIIRS FRP shifts at 2015 (see ARCHITECTURE.md, verified facts), use 2016 to 2019 | Matched overpass time; ends before Aqua's orbit began to drift |
| 11 | Held-out years (T3) | 2020 to 2021 | After calibration, before the drift becomes large. **VERIFY** drift dates |
| 12 | Comparison labels | Below normal: under 0.5 x median. Near normal: 0.5 to 1.5. Above: 1.5 to 3. Far above: over 3 | Simple and explainable. Shown in the UI. Needs at least 5 earlier years, else "not enough history" |

## Regions

| # | Region | Bounding box (west, south, east, north) | Why |
|---|---|---|---|
| 13 | Punjab and Haryana, India | 73.8, 27.6, 77.6, 32.6 (approximate; **VERIFY**) | Small crop-residue fires, where the two sensors disagree most. Enables the Punjab season-shift check (S1). Meaningful to the Bangalore judges |
| 14 | Córdoba province, Argentina | -65.8, -35.0, -61.7, -29.5 (approximate; **VERIFY**) | Larger wildland fires, a contrasting fire regime for the held-out-region test (T4). Argentina's space agency, credited on the challenge page, has its space centre in Córdoba. **VERIFY** |

Region 13 is built first, end to end. Region 14 starts only after region 13
passes the Saturday 19:30 checkpoint.

## App

| # | Decision | Answer | Why |
|---|---|---|---|
| 15 | Framework | Vite + React + TypeScript | Two people share the app; typed interfaces prevent collisions |
| 16 | Display cell | 0.1 degree | Small files, fast on a phone |
| 17 | Cube format | JSON, gzip-served. Move to Parquet only if a cube exceeds 20 MB | No extra library in the browser |
| 18 | Map | MapLibre GL JS with free OpenStreetMap-based tiles | No key. **VERIFY** the tile provider's terms |
| 19 | Charts | Observable Plot | Quick heat maps and series |
| 20 | Colour ramp | Cividis | Designed for colour-vision deficiency; test in both themes |

## Stretch goals, in order

1. **S0** completeness curve (decision 5).
2. **S1** Punjab season-shift check.
3. **S2** daily self-updating record, only if both above are done by Sunday 09:30.

S3 (estimated small fires before 2012) is not planned.

## From the challenge author's video (added 14 November, before the start)

The author, from CONAE, speaks from its space centre in Córdoba. Her team does
early warning and emergency response. Points that change our plan:

| # | What she says | Decision |
|---|---|---|
| 21 | The calendar "shows you how many hotspots a particular month has across different years" | Months-across-years is the first view on screen |
| 22 | Without a method, "almost 10 years of historical information will be lost" | State on the project page that the record keeps the MODIS-only years (2002 to 2011) usable on today's scale |
| 23 | Combine MODIS's history with the "continuity and greater detail" of VIIRS | The small-fire layer is **core, not optional**. It is how VIIRS's detail is kept |
| 24 | "It doesn't matter if one hotspot came from one sensor or the other" | Checks C1 and C4 in PREREGISTRATION.md measure exactly this; lead with them |
| 25 | Use resources from "our agency and other agencies" | Cite CONAE's hotspot catalogue as context; ESA Fire_cci check (C6) for Córdoba |
| 26 | She shows a fire in "Chile Rio", Argentina, in July 2026 | Most likely **Chilecito, La Rioja**: news reports describe a fire of more than 900 hectares in the Famatina sierra (Guanchín, Chilecito department) starting about 27 July 2026 and declared out in early August. **VERIFY** in the data after the start. Chilecito is near 29.2 S, 67.5 W, which is **outside** the Córdoba box. Add a small third area, "Chilecito and Famatina, La Rioja" (approximate box -68.2, -29.8, -66.8, -28.4), as an event case study: show the event on the calendar and whether it is flagged as unusual. It is a demo example, not a calibration region |
| 27 | Demo lead | Córdoba leads the demo for global judging; Punjab and Haryana is shown second, for the local judges and the season-shift check. Both regions are processed; whichever passes its checks first is built into the app first |

## App vision (added 14 November, after the start)

| # | Decision | Answer | Why |
|---|---|---|---|
| 28 | App vision | `docs/APP_VISION.md` is the plan for what the app answers. Stack unchanged (decisions 15 to 20). Contract fields `mtd`, `data_through`, `nrt_from`, and hook fields `areaKm2`, `place`, `dataThrough` added to `docs/ARCHITECTURE.md` | Agreed by all three, reported by 8crsk. Reason in the team's own words: <to add> |
| 29 | First-principles additions | The section "First principles" in `docs/APP_VISION.md` (baseline window, downloads, hotspot CSV, trends, keeping the data current) | Agreed by all three, 14 November (reported by 8crsk, team lead) |

## After the Phase 2 results (14 November 2026)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 30 | Held-out check and what ships | Adopt the revised held-out check C3r (two-year total, at most 0.10) beside the original C3, as proposed in the dated note in `PREREGISTRATION.md`. Ship the **detection curve** for Córdoba and Chilecito and the **hard floor** for Punjab and Haryana. Both C3 and C3r verdicts are published | Decided by the AI assistant on Mahabu's instruction (14 Nov, about 17:30: "you only decide all the things"). Reason: in Córdoba the curve tracks Aqua about twice as steadily year to year as the ratio and is the only model whose error does not follow the mix of strong fires; the original C3 limit was below the noise between any two satellites. Both verdicts are published |
| 31 | Method changes from APPROACH.md | Matched detection instead of histogram ratio; cell FRP as the sum of detections; floor applied to VIIRS cells only; pre-2012 series is all Aqua fire cells | Built by the AI assistant during Phase 2; confirmed by the AI assistant on Mahabu's instruction (14 Nov). Reasons in `pipeline/NOTES_PHASE2.md` |

## Status sentence (14 November 2026)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 32 | Minimum activity for the status sentence | Say "too little activity to judge" when both the historical median and this month are below **5** (harmonized units, on the same days of the month). Below 5 earlier years, decision 12 still says "not enough history" | Charulekha, 14 Nov. Reason in her own words: **to be added by Charulekha**. The AI assistant laid out three options (this one, a share of active years, no minimum) with evidence from our data: Chilecito, 1 to 5 November, has 0 this year and a median of 0 over 24 years, which ranked as "joint 14th of 25" |
| 33 | Default baseline for comparisons | **All years** since harmonization (2002 onwards), matching the challenge's "historical median". "Last 10 years" is offered as a switch beside it | Charulekha, 14 Nov. Reason in her own words: **to be added by Charulekha**. Evidence shown: 1 to 5 November medians, all years against last 10, are 2,398 against 2,274 (Punjab and Haryana) and 16 against 12 (Córdoba) |

## User guidance (added 14 November)

| # | Decision | Answer | Why |
|---|---|---|---|
| 34 | Plain-language guidance for every audience in the challenge | A "not a live alert service" notice with a link to NASA's live FIRMS map for the area; a Start-here guide with three steps, a path per audience (emergency teams, firefighters, land managers, scientists) and example views; the meaning of Raw and Harmonized under the switch; a glossary; total and per-1,000 km² activity for the area; a fire-activity layer on the map; a For-researchers section (citation, whole files, data dictionary, Python and R); 44 px touch targets on phones | 8crsk (team lead), 14 Nov: the challenge names four audiences and the UI served mainly the analyst |

## Design (added 14 November)

| # | Decision | Answer | Why |
|---|---|---|---|
| 35 | Redesign for non-scientists, and a separate research view | Dark ember design (light theme on request); hero with the answer, four real numbers and the record as a dot grid; two views, Overview (calendar, this month against past years, outlook) and Data & methods (every chart, every check, glossary, data); charts titled as plain questions with a one-line how-to-read; a legend with words and exact values; every number exact (two decimals harmonized, whole numbers raw, ratios two decimals, shares one decimal, no "12K" shortening); the left panel scrolls on its own; scroll and touch animations that respect reduced motion | 8crsk (team lead), 14 Nov: the first screen was text-heavy, numbers were rounded, the legend was unreadable for non-experts and the left column could not be scrolled |
| 39 | Map-first retro UI | The overview becomes map first: NASA GIBS Blue Marble satellite base map filling the screen, one results panel with the answer always visible and sections that open one at a time, and a small toolbar (download, link, print, method). Retro look: near-black panels, square corners, fire colours for data only, **Arial everywhere**. The slogan hero is removed from the overview; the Data & methods view keeps its page. Replaces the overview layout of decision 35 | Charulekha, 14 Nov, asked for it to go straight to the live site; 8crsk to be told. Reason in her own words: **to be added by Charulekha**. Designed in a mockup with the AI assistant, inspired by NASA FIRMS's map without copying its identity |

## Stretch (added 14 November, about 16:30)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 36 | Fourth area for the local judges | "Bandipur, Nagarhole and BR Hills, Karnataka" (75.8 to 77.8 E, 11.4 to 13.0 N), calibrated on its own. Added after the start and not pre-registered; the same checks and shipping rule apply. Result: no model passes the held-out checks, so the constant ratio ships. Shown as a case study, not a validated region | Mahabu asked for stretch goals; the AI assistant proposed, built and decided it on his instruction. Reason: a place the local judges know; kept although its checks fail, labelled a case study, because removing a failing area would hide a result |
| 37 | Stretch analyses | `season.json` (season start, peak, end and trend), `drift.json` (overpass time and Aqua against the record), `episodes.json` (fire episodes ranked) written by `pipeline/stretch.py`. Contract rows proposed in ARCHITECTURE.md; B and C decide whether and how to show them | Decided by the AI assistant on Mahabu's instruction: show the season view and the episode comparison in the Data & methods view, and one line on the drift in the Method panel. Task for 8crsk and Charulekha: `docs/tasks/STRETCH_APP.md` |

## Comparing the satellites (added 14 November)

| # | Decision | Answer | Why |
|---|---|---|---|
| 38 | Rules for the "Do the satellites agree?" section | **Same fire:** same or neighbouring 0.01 degree square, same date, same half of the day (the pipeline's matching rule; decisions 6 to 8 for grid and confidence). **Two VIIRS satellites agree** when the absolute log ratio of their fire cells is at most **0.25**, judged only on at least **30** fire cells each. **A daytime pass has drifted** when its mean local solar time moved more than **30 minutes** from its first usable year. These are display rules for the app; they change no number in the harmonized record and no pre-registered threshold | 8crsk, 14 Nov, as team lead, asked the AI assistant to propose thresholds and build the section. Proposed by the assistant with this evidence: identical VIIRS sensors differ by 0.07 to 0.10 a month in our data (PREREGISTRATION.md, note on C3), so 0.25 is about three times normal scatter; 30 is the minimum sample already pre-registered; Aqua's measured drift is 131 minutes in Punjab, and every VIIRS satellite stays within 19 minutes in all three regions. Reason in 8crsk's own words: **to be added by 8crsk** |

## Closing the stretch list (14 November, about 17:00)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 40 | S2, a daily self-updating record | **Not built.** A manual refresh exists (`pipeline/refresh.py`, about ten minutes). A scheduled update would change the data after the submission deadline, which the rules may not allow, and the full pipeline needs 1.2 GB of raw files that are not in the repository | Decided by the AI assistant on Mahabu's instruction |
| 41 | S3, estimating small fires before 2012 | **Not built.** It would be a model, not an observation, and could not be validated in the time left; the review (docs/REVIEW.md) warns against adding unvalidated results | Same |
| 42 | Check C6 with ESA Fire_cci | **Run.** Córdoba fails (-0.440); Aqua alone, with no sensor change, gives -0.427, so the change is in burned area per detected fire, not a seam. Reported with that diagnosis | Same |
| 43 | Partner and Global Offer data | ESA Fire_cci (C6) and ESA WorldCover through the Microsoft Planetary Computer (land cover at fire cells). Other Global Offers (cloud credits, weather API, domain, collaboration tools) not used: the app is static and needs none, and a new domain this close to the deadline risks a broken link | Same |
| 44 | Land cover in the app | A chart "What is burning: crops or wild land?": every fire cell in the record gets the dominant ESA WorldCover 2021 class of its 1 km cell, grouped as cropland, forest, grass and shrub, other; by month and by year, for the MODIS-visible activity and the small-fire layer, whole region only. Extends decision 43 (Mahabu's one-year sample for the project page) to the full record. Limits stated on screen: one land-cover map for all years; shares of fire cells, not of the harmonized value | 8crsk, 14 Nov, as team lead, after the AI assistant proposed it from the Global Offer list. Short D1: the challenge text separates wildfires from agricultural burns, and no other view in the app does. Reason in 8crsk's own words: **to be added by 8crsk** |

## Areas fixed (14 November, about 21:30)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 44 | Punjab and Haryana area | Clipped to the exact outline of Punjab, Haryana and Chandigarh (94,490 km², from geoBoundaries districts; `pipeline/make_areas.py`). The old box was only 46% these states; 23% was Rajasthan, 15% Himachal Pradesh and 9.5% Pakistani Punjab, for which we had no data. Everything was rerun. Result: the hard floor now passes every pre-registered check that applies to it, including the original C3 | Decided by the AI assistant on Mahabu's instruction, after Mahabu reported he could not see the region properly |
| 45 | Córdoba area name | Renamed "Córdoba and neighbouring areas, Argentina". The box is 71% Córdoba province and holds 57% of its fires in the province; all of its data is present, so the method and numbers are unchanged | Same |
| 46 | Second burned-area reference | NASA MCD64A1 added as check C6m, after the results and labelled so. Córdoba fails (-0.392; Aqua alone -0.430), Punjab and Haryana passes (-0.036) | Mahabu asked for MCD64A1; the AI assistant ran it |
| 47 | Land cover period | Whole VIIRS record (2012 to 2025), not 2021 alone, after 8crsk's assistant showed 2021 was not typical for Karnataka | Same |

## People and live data (added 14 November, about 21:00)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 48 | Who lives near the fires | A chart "Who lives near the fires?": WorldPop 2020 people per 0.1 degree square (`population.json`, `app/scripts/make_population.py`) joined to the record. A square counts when it had **3 or more** fire detections in the period (MODIS-equivalent in Harmonized). Follows the drawn area, dates and the Raw / Harmonized switch; a yearly chart shows both records. Not pre-registered, exploratory. The threshold was chosen **after** looking at the data: counting any square with fire, or a 5 km buffer around 1 km fire cells, jumps in 2012 even with the harmonized class (a footprint is not harmonized). Result, mean 2012-2025 against 2003-2011: Punjab and Haryana raw +39 %, harmonized +3 % (inside the exact outline of decision 44; +99 % and -3 % with the old box, which took in Delhi); Chilecito raw +202 %, harmonized +6 %; Córdoba raw +257 %, harmonized +105 %; Karnataka raw +845 %, harmonized -50 %. The chart prints each area's own numbers and says to read the trend with care where the harmonized step stays large. Wording: exposure (living nearby), not harm or risk. Planetary Computer has no global population grid, so WorldPop was used | 8crsk, 14 Nov, as team lead; Mahabu agreed the team could do it without him. Reason in 8crsk's own words: "if theres fire risk in a higher no of people that would be helpful". The AI assistant proposed the method and the threshold and found the 2012 jump |
| 49 | Live NASA fires and playback on the map | (a) A map toggle "NASA live fires: Off / Today / Yesterday" draws every VIIRS detection (NOAA-20 and NOAA-21) of that UTC day from the NASA GIBS WMS (no key, CORS open). Labelled raw, not harmonized, not an alert service. Our own data does not change, so decision 40 still holds. GIBS vector tiles returned 404 and the FIRMS no-key CSVs send no CORS header, so the WMS images are used. (b) A Play button and slider step the map through the months of the date range on one fixed colour scale, with the month shown on the map | 8crsk, 14 Nov, as team lead. Reason in 8crsk's own words: "looks cool in a hackathon too like real time data". Options laid out by the AI assistant |

## Out-of-sample checks (added 14 November, about 22:30)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 50 | Answer the in-sample objection to C1, and put a range on the ranking | `pipeline/loyo.py`, added after results and labelled so. (a) Check **C1x**: fitted on Feb 2015 to Dec 2021 only, tested on the C1 window (Feb 2012 to Jan 2015). Córdoba detection curve +0.087, pass; the constant ratio fails the same test there (+0.143), the first held-out evidence that the curve beats a ratio. Punjab and Haryana hard floor +0.024, pass. (b) Leaving one year out (2012 to 2021): Córdoba curve 8 of 10 years within 0.10, Punjab floor 8 of 10. (c) The out-of-sample monthly scatter (`meta.month_log_sd`: Córdoba 0.244, Punjab 0.423) gives a 90 percent range on "Nth highest of N" in the answer line, treating errors in different years as independent | Mahabu asked for it after an outside review; the AI assistant wrote and ran it |


## Loading and the study areas (added 14 November, about 22:30)

| # | Decision | Answer | Who and why |
|---|---|---|---|
| 51 | Slow first load, and finding the other areas | (a) A loading bar with the share of the area's record received. Measured on the live site: the answer waits for `cube.json` (Punjab 14.5 MB, 1 MB gzipped), which took 15 to 27 s when GitHub Pages had not cached it (about 60 KB/s) and 3 s when it had; reading it takes about 0.1 s. Pages sends it gzipped, so the build records each cube's uncompressed size (`vite.config.ts`) to show a true percentage. The selection contract is unchanged (`cubeProgress` in `app/src/data/load.ts`). (b) One area is still loaded at a time, since loading all four would double the wait; the map now shows the other areas' outlines and name tags, a click on either switches area, and "Show all" zooms out to all four. A columnar cube (measured: Punjab 913 KB to 520 KB gzipped) is left for later: it changes the data contract with Person A | 8crsk, 14 Nov, as team lead: "why does it take a lot of time for it to load the data" and asked whether to keep one area at a time. The AI assistant measured the load and proposed both parts; 8crsk chose them |

## Change log

| Date | Who | Change | Reason |
|---|---|---|---|
| 13 Nov 2026 | Mahabu | Accepted the AI-recommended defaults above | To start on time; team to review |
| 14 Nov 2026 | All three | Decision 28: app vision and contract fields | See row 28 |
| 14 Nov 2026 | Charulekha | Decisions 32 and 33: minimum activity and default baseline for the status sentence | See rows 32 and 33 |
| 14 Nov 2026 | 8crsk | Decision 34: plain-language guidance per audience | See row 34 |
| 14 Nov 2026 | 8crsk | Decision 35: redesign and research view | See row 35 |
| 14 Nov 2026 | 8crsk | Decision 38: rules for comparing the satellites | See row 38 |
| 14 Nov 2026 | 8crsk | Decision 44: land cover in the app | See row 44 |
| 14 Nov 2026 | 8crsk | Decisions 48 and 49: people near fires; live NASA fires and playback on the map | See rows 48 and 49 |
| 14 Nov 2026 | 8crsk | Decision 51: loading bar and the study areas on the map | See row 51 |
| 14 Nov 2026 | Charulekha | Decision 39: map-first retro UI, Arial, satellite base map | See row 39 |
