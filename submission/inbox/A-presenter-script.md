<!-- AI-assisted: written with help from Claude (Anthropic) from the team's documents and the app's data files. Reviewed by Mahabu Subhani (pending). -->

# Presenter's script: for a panel of physicists and astronomers

For whoever presents to the judges. Every number is copied from the app's data
as it is in the working copy now (`submission/inbox/A-what-we-show.md`,
regenerated from `app/public/data/`), from `work/findings.json`, or from
`season.json`. None is rounded in our favour. Lines in *[brackets]* are cues,
not speech.

## Before you go on: three things to settle

1. **This script assumes decision 58 is live** (the detection curve ships in
   Córdoba and Chilecito). It is committed on branch `a/what-we-show` and goes
   live only when that branch is merged into `main`. If the live app still
   shows the **hard floor** in Córdoba, use the box at the end ("If Córdoba
   still shows the hard floor").
2. **The project page and `docs/EXPLAINED.md` still describe the hard floor in
   Córdoba**, and quote Chilecito's July 2026 as 13.5 times a normal July.
   From the current data it is about **10 times** (50.8 against a median of
   5.0 fire cells, 2nd of 25 Julys). Read the figure off the app before you say it.
3. **Decision 58 has an empty reason.** Section 4 asks Mahabu to give it in
   Mahabu's own words. The panel will ask. Fill it before judging.

---

## 1. The main pitch (about 3 minutes)

### Open: the problem, in the panel's own language (30 s)

> "You know this problem from astronomy. Two telescopes survey the same sky.
> The newer one is deeper, so it finds faint sources the older one never could.
> Put the two catalogues end to end, and the universe seems to fill up with
> stars the night the new telescope switched on.
>
> NASA has been doing exactly this with fire. MODIS has counted fires from
> orbit since 2000. In 2012 VIIRS joined: pixels of 375 metres instead of
> 1 kilometre, and far more sensitive to small fires. Add the records up and,
> over Punjab and Haryana, fire activity jumps **5.3 times** in 2012. Over
> Córdoba in Argentina, **5.2 times**. Nothing happened on the ground. The
> camera changed."

*[SCREEN: the app, Punjab and Haryana, Data page, Monthly time series, switch on RAW.]*

> "Here are the yearly totals: 19,512 raw detections in 2011, **116,469 in
> 2012**. That is the seam."

### The method: we measured the selection function (60 s)

*[Flip the switch to HARMONIZED.]*

> "Now harmonized: 14,810 in 2011, 16,153 in 2012. The step against Aqua alone
> goes from a factor of 5.33 to **0.98**.
>
> We did not fit one fudge factor. The two sensors disagree for two physical
> reasons, and we fixed each one separately.
>
> **First, resolution.** One fire that fills one MODIS pixel fills several VIIRS
> pixels. So we lay a 1 km grid over the ground and count each square once per
> satellite pass. That alone takes the log step in Punjab from 1.674 to 1.528.
> Most of the problem is not there.
>
> **Second, sensitivity, and this is the astronomy.** We measured MODIS's
> completeness function. For every fire VIIRS saw from 2012 to 2017, we asked:
> did Aqua's MODIS, on the same day and the same half of the day, also see a
> fire within one grid square? We plot that fraction against the fire's
> radiative power, the fire's 'flux', in megawatts. To remove chance
> coincidences we ask the same question ten squares away and subtract it,
> exactly like an off-source background in a cross-match.
>
> That gives a detection curve: near zero for weak fires, a plateau for strong
> ones. Its 50 percent point is MODIS's detection limit. **Over Córdoba, by
> day, we measure 9.9 megawatts. An independent 2026 physics model of MODIS
> (Sofiev and Kouznetsov, Geoscientific Model Development) gives 10.4 megawatts
> for the same average pixel.** Our number came only from whether two
> satellites agreed. Theirs came from the instrument."

### Nothing is thrown away (15 s)

> "From 2012 the main record counts what Aqua *would* have reported, so 2005
> and 2025 are in the same units: Aqua-equivalent fire cells. The faint fires
> only VIIRS can see are not deleted. They become a separate small-fire layer.
> In Punjab, where crop fires are small, that layer is about 2.2 times the
> main record."

### Why you should believe it: we fixed the tests before opening the data (45 s)

*[SCREEN: Data page, Harmonization method, the checks table.]*

> "Before any data file was unzipped, we committed ten checks with numeric pass
> marks. The app shows every one, including the ones we failed.
>
> - The 2012 step must fall below 0.1 in log units: Punjab **-0.020**, Córdoba
>   **0.066**.
> - A different satellite, NOAA-20, never used for fitting, must reproduce the
>   record: slope **1.026**, correlation **0.989** in Punjab; **0.951** and
>   **0.988** in Córdoba. That matters now: Suomi NPP stopped sending data on
>   2 November.
> - The detection limit must agree with published physics within a factor of
>   two: it does in Punjab and Córdoba, and it **fails** in Karnataka, and we
>   say so.
> - And a placebo: a fake sensor change in 2016, when nothing changed. Punjab
>   passes, -0.059. **Córdoba fails, -0.114 against 0.10.** It is on the
>   screen in red."

### What the record found (30 s)

*[SCREEN: Overview, Fire season timing, Punjab and Haryana.]*

> "Once the seam is gone, the record can answer physical questions straight
> through 2012.
>
> Punjab's rice-residue burning peak moves later by **6.7 days per decade**
> (range 5.3 to 8.2), and the season does not get longer. A 2019 Nature
> Sustainability paper reported the peak moved later after 2009 groundwater
> laws delayed rice planting. Our record, across both sensors, finds the median
> burning day **8.2 days later, p = 0.0009**. That was a pre-registered check.
>
> And the conversion between the sensors follows the Sun. Our constants per
> calendar month correlate with the height of the midday Sun: **-0.92 in
> Córdoba, -0.78 in Punjab**, in opposite hemispheres, each in its own summer.
> A hotter, brighter background raises MODIS's threshold. That fits; it does
> not prove it."

### Close: why now (15 s)

*[SCREEN: Overview, Sensor agreement.]*

> "MODIS is ending: Terra's data in January 2027, Aqua's around September. And
> its orbit is already drifting: Aqua's afternoon pass over Punjab has moved
> from **13:18 in 2021 to 15:27 this year**. In 2026 so far Aqua reports
> **2.8 times** as much fire there as our record. A MODIS-only history is no
> longer measuring the same thing. Ours runs on VIIRS from 2012, calibrated
> before the drift began. Ten years of fire history stay usable, on today's
> scale, for anyone, with no login."

---

## 2. Features, if they ask "what does it do?" (60 s, shown live)

*[Start on the Overview of Punjab and Haryana.]*

| Feature | One line to say |
|---|---|
| Answer card | "Is this month unusual here? This month's rank against the same days of every earlier year, with a range that allows for our harmonization error." (Read rank and ratio live.) |
| Burning calendar | "Years down, months across, since 2002. Read down a column to compare the same month every year." |
| Any area | "A region, a district by name, a shape you draw, or typed coordinates." |
| Ask bar | "Type 'Sangrur October 2023'. Fixed rules in the browser, no AI model, nothing sent anywhere." |
| Raw / Harmonized switch | "One click shows the 2012 seam appear and disappear." |
| Small-fire layer | "Everything VIIRS sees, kept separate, never mixed into the long record." |
| Monthly comparison, three-month climatology | "This month against every earlier one; what usually comes next. History, not a forecast." |
| Season timing, trend | "Has the season moved? Is it getting worse? Sen's slope with Mann-Kendall." |
| Land cover | "Crops or wild land: Punjab's fires are 96 percent on cropland; Córdoba's 49 percent grassland." |
| Population near fires | "61 million people live in Punjab and Haryana's region. This is exposure, not risk." |
| Fire episodes | "Runs of consecutive fire days, ranked against every earlier one." |
| Sensor agreement | "Which satellites saw each fire, and how far each orbit has drifted." |
| Every check | "Value, limit, verdict, for every pre-registered check, failures included." |
| Downloads | "CSV of any view, every chart as PNG and SVG, and every single hotspot with what we did to it: harmonized, small, or excluded, and why." |

---

## 3. What is different, and why it is better

### Against the usual approaches

| Approach | What it does | Its weakness | What we do instead |
|---|---|---|---|
| Add the records | MODIS before 2012, VIIRS after | A fivefold fake jump | Seam removed: Punjab 5.33 times becomes 0.98 |
| Use VIIRS only (as Global Forest Watch does for its comparisons) | Starts in 2012 | Throws away ten years | One scale from 2002 |
| Show both side by side (CONAE's viewer, the FIRMS map) | No harmonization | The user must guess | One record, with its evidence one click away |
| One conversion ratio | Multiply VIIRS by a constant | Removes the 2012 step too, but its yearly error follows the mix of weak and strong fires (Córdoba: rank correlation -0.75, p = 0.013) and it fails the out-of-sample step in Córdoba (C1x 0.159) | A measured threshold from physics, a constant per calendar month |
| Machine-learning model | Learn the mapping | Hard to explain, hard to test | Every step named, its effect measured and published |

**Be fair, out loud:** "A plain ratio removes the 2012 step as well: 0.054 in
Córdoba. What separates the methods is what happens in years the model never
saw." That sentence earns more trust than any claim of superiority.

### Four things that are new in the work (do not say "first ever")

1. **A measured detection curve**, from same-day matching with a chance
   correction ten squares away, that agrees with an independent physics model
   in Córdoba (9.9 against 10.4 MW).
2. **A ladder, not one number.** Each cause of the jump is removed in its own
   step and the remaining error of all six variants is published.
3. **A failed check that became a finding.** Our held-out monthly check
   failed; following it showed the conversion follows the season and the Sun.
4. **MODIS's dying orbit used as an experiment.** Aqua now passes two hours
   later, and over Punjab it sees far more fire in the rice season than the
   record does, and no excess in the wheat season.

### Who benefits

| User | Their question | What they get |
|---|---|---|
| Early-warning teams (CONAE, who wrote the challenge) | Is this burning unusual? | Chilecito's July 2026 fire: about 10 times a normal July, 2nd of 25 (read it live) |
| Fire services | When should crews be ready? | Usual peak months, and how the season has moved |
| Pollution boards in north India | Is crop burning falling? | Detected rice-season burning: 14,584 fire cells in 2020, 1,729 in 2024, 762 in 2025 (detected at an early-afternoon pass; see the caution in section 6) |
| Researchers | Can I use 24 years without a fake step? | One record, every hotspot labelled, data dictionary, loaders, citation |

---

## 4. Challenges we faced (say these before they are asked)

Physicists respect a team that finds its own errors. Tell it as a story.

1. **The test that failed, and we were wrong about why.** Our held-out monthly
   check (C3, 2018 to 2019) failed with one conversion constant: 0.207 in
   Córdoba, 0.169 in Punjab, against 0.15. We first blamed the limit and added
   a check on the two-year total. That was wrong: counting noise alone gives
   0.03 to 0.07. The error followed the season, the same in the fitting years
   and the held-out years: Punjab's May read about 75 percent too high, October
   about 20 percent too low. One constant per calendar month fixed most of it.
   **But say the cost:** we changed the method after seeing the failure, so
   2018 to 2019 is no longer a clean test. On 2020 to 2021, whose months we had
   not looked at, Córdoba passes (0.125) and **Punjab fails (0.169)**.
2. **A bug we found ourselves.** Late on 14 November an independent read of the
   code found the hard floor's constant fitted on a different rule from the
   one it was applied with. Punjab's record was 4.6 percent too high after
   2012, and a check reported as a pass was a fail. We fixed it and said so.
3. **Punjab's crop fires are almost invisible to MODIS.** They are small and
   brief. The detection curve there is weak (plateau 0.118) and too uncertain
   to ship (bootstrap check C8: 62 percent against 50). So Punjab ships the
   simpler hard floor at 4.8 MW, and we call that a working cut-off, not a
   measured detection limit.
4. **Burned area disagreed, and the satellite was right.** Against ESA's
   burned-area record, Córdoba's fire per square kilometre burned drops after
   2012 (-0.446, a fail). But Aqua alone, which never changed sensor, gives
   -0.427, and NASA's own burned-area product gives the same picture. The
   seam can explain only -0.019 of it. The relationship between hotspots and
   hectares really changed there; our record follows Aqua.
5. **We departed from our own rule in Córdoba.** By our pre-registered rule
   the hard floor would ship there, because the detection curve fails the 2016
   placebo by 0.014 (-0.114 against 0.10) and the out-of-sample step (0.100
   against 0.10). We ship the curve anyway, because leaving one year out it
   tracks Aqua within 0.10 in **9 of 10 years**, against **3 of 10** for the
   hard floor, and its yearly error does not follow the fire mix (0.32,
   p = 0.37, against 0.76, p = 0.011 for the floor). Both verdicts are in the
   app. *[Mahabu: give the reason here in your own words, then say:]* "This
   is a judgement, made after seeing both results, and we label it that way."
6. **Karnataka did not transfer.** We added south Karnataka's forests late,
   without pre-registering them. No method passed its held-out checks, so the
   simple ratio ships there and the app calls it a case study.
7. **Satellites end mid-hackathon.** Suomi NPP stopped on 2 November 2026.
   NOAA-20 reproducing the record (C4) is what keeps it going.

---

## 5. Questions the panel will ask

**"Isn't this just Malmquist bias? Why not model the luminosity function?"**
"It is the same family of problem: a flux-limited sample. We chose not to
deconvolve a fire-size distribution, because it changes by place, season and
year. Instead we cut both catalogues at the same effective limit: from 2012
we count only what MODIS could have seen. It throws no information away,
because the faint part is kept as its own layer."

**"Your completeness is measured on the same fires you calibrate. Circular?"**
"Partly, and we say so. The 2012 check uses constants fitted on 2012 to 2017.
Fitted on 2015 to 2021 only, Punjab's step is 0.024, a pass; Córdoba's curve
is 0.100, just over. The independent evidence is NOAA-20, never used for
fitting, and in Córdoba the physics limit."

**"Detection depends on pixel size, which grows across the MODIS scan. Did you
model that?"** "No. Sofiev and Kouznetsov's limit grows with pixel area; we
compared at the average Aqua pixel over Córdoba (2.23 km²). Detection against
pixel size day by day is not tested. It is the obvious next refinement."

**"Night?"** "Our night midpoint in Córdoba is 6.9 MW. It agrees with the
published value at nadir, 3.7 MW, within a factor of 2, as the check is
defined, but not with the value at the mean pixel, 16.6. We disclose that."

**"How do you count chance coincidences?"** "The same match question ten grid
squares away, subtracted, like an off-source background."

**"Why should one constant per calendar month be physical?"** "Twelve daytime
constants against the midday Sun's height: -0.92 in Córdoba, -0.78 in Punjab,
in opposite hemispheres. Each constant pools three months, so they are not
independent, and season, crop and fire type change together. It is
consistent with background temperature raising MODIS's threshold, not a proof."

**"Is this the true number of fires?"** "No. It is a consistent count of what
an Aqua-like sensor would detect. Consistency over time is what a calendar
needs. Clouds, smoke and fires between passes are missed by every sensor."

**"What happens when MODIS stops?"** "Nothing changes: the record has run on
VIIRS since 2012."

**"Can anyone reproduce it?"** "Yes. Every detection ships with the app; the
pipeline reruns from the repository with no NASA account. A fresh clone
rebuilt everything: one value in 46,155 differed, by 0.01."

**"Did anything fail?"** "Yes. Punjab fails 2 of 14 checks, Córdoba 4 of 14,
Karnataka 6 of 14. Every one is on screen."

**"How did you use AI?"** "Heavily and openly. Claude wrote most of the code
and proposed candidate methods; we chose among them, fixed the checks before
opening the data, made it attack its own method, and logged every
contribution in the repository."

---

## 6. Do not say

- "Fire rose fivefold after 2012." That is the camera.
- "Passes every check," for any area.
- "Hectares." Our unit is Aqua-equivalent fire cells.
- "Forecast" for the climatology; "risk" for population; "AI" for the Ask bar.
- "Two independent burned-area records." Both are MODIS-based: say
  "independent of VIIRS".
- "The Sun causes it." Say "consistent with".
- "Punjab's crop burning fell 95 percent." Say "detected burning at an
  early-afternoon pass". Burning may have moved to the evening.
- "First ever", anywhere.

---

## 7. Where each number comes from

| Number | Source |
|---|---|
| Raw step 5.33 / 5.20; harmonized 0.98; yearly totals 2011 to 2012 | `A-what-we-show.md`, Monthly time series (from `meta.json`, `cube.json`) |
| Ladder 1.674 to 1.528 | `submission/project_page.md` (ladder; Punjab unchanged by decision 58) |
| Check values C1 to C8, scoreboard | `A-what-we-show.md`, section 3 |
| 9.9 against 10.4 MW; night 16.6 | `docs/research/20261115-what-is-new-after-the-rebuild.md`, `docs/EXPLAINED.md` section 7 |
| 9 of 10 against 3 of 10; 0.32 and 0.76 | `docs/DECISIONS.md` decision 58 |
| Ratio: -0.75, C1 0.054, C1x 0.159 | `docs/EXPLAINED.md` sections 6 and 7; `project_page.md` ladder |
| Sun: -0.92, -0.78 | `work/findings.json`, 15 Nov (Córdoba with the curve) |
| Peak 6.7 days per decade; 8.2 days, p = 0.0009 | `A-what-we-show.md` (season.json, C7) |
| 14,584 / 1,729 / 762 | `app/public/data/punjab-haryana/season.json` |
| 13:18 to 15:27; 2.8 times in 2026 so far | `A-what-we-show.md`, Sensor agreement (2.795) |
| Chilecito July 2026, about 10 times, 2nd of 25 | Summed from `app/public/data/chilecito/cube.json`, 15 Nov; read it live |
| Population, land cover | `A-what-we-show.md` |
| 46,155 values, 0.01 | `docs/EXPLAINED.md` section 7 |

Not quoted on purpose: the 48 percent rice-season excess of Aqua. Two runs of
`findings.py` disagree (log ratio 0.395 in the research note, 0.425 in
`work/findings.json`, which also gives a wheat-season value far from the
note's). Reconcile before using any seasonal percentage.

---

## If Córdoba still shows the hard floor

Use these instead (the committed state before decision 58): C1 **0.077**, C2
**-0.094** (pass, thin margin), C1x **0.072**, C3 **0.117**, C3x **0.124**, C4
slope **0.938**, correlation **0.977**; C6 **-0.403**, Aqua alone **-0.427**;
leaving one year out, **3 of 10** years within 0.10; Chilecito July 2026
**13.5 times**, 2nd of 25. Drop challenge 5 in section 4, and say instead: "By
our rule the hard floor ships. The detection curve tracks Aqua better year by
year, 9 of 10, but fails the 2016 placebo, so we did not ship it."
