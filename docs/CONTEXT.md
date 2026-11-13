# Context: the challenge, the judging and the rules

Sources: official challenge page, Participant FAQ, Judging & Awards Guide and
Project Submission Guide on spaceappschallenge.org, read 12 to 13 November 2026.

## What the challenge asks

Challenge page: https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/

Build a **web application** that harmonizes MODIS and VIIRS active fire hotspot
records into a **burning activity calendar**, so that emergency responders,
scientists and land managers can examine historical fire patterns, unusual
conditions and critical periods in a selected area of interest.

The statement describes two parts:

1. **Harmonization.** "By the end of that phase the sensor of origin no longer
   matters and the patterns, trends, and anomalies become the focus."
2. **Web application** that takes the harmonized hotspots as input. A user selects
   a region and a date range, then downloads analytics and visualizations.

Features the statement names (treat all as required unless the team decides otherwise):

| Feature | Statement wording |
|---|---|
| Calendar | Number of hotspots from the early 2000s to the present, by month and year |
| Area selection | Draw the area of interest on a map, or enter latitude and longitude |
| Date range | User selects a specific date range |
| Comparison | Current month against the historical median; anomalies against multi-year averages |
| Colour | Accessible colour ramps showing similarities and differences across months |
| Export | Downloadable CSV of hotspots detected during a search |

Target users named: early warning and emergency responders, scientists, land
managers, firefighters. The emergency manager is the primary user.

Why harmonization is needed (from the statement): MODIS on Terra and Aqua gives
20+ years of data but is near the end of its life and is being replaced by VIIRS.
The two differ in spatial resolution, sensitivity and observation schedule, so
their records cannot be compared directly.

Listed resource: NASA FIRMS, https://www.earthdata.nasa.gov/data/tools/firms

The challenge photo is credited to CONAE, Argentina's space agency, which
suggests CONAE authored it. CONAE runs its own hotspot viewer that shows MODIS
and VIIRS side by side without harmonizing them.

## How it is judged

Each criterion is scored 1 to 5. Most of the evaluation is based on the project
page; the demo mainly affects Presentation.

| Criterion | What earns a 5 |
|---|---|
| Impact | Addresses a significant problem; could benefit a large audience |
| Creativity | An approach "that has never been attempted before" or a meaningful improvement |
| Validity | Scientifically sound, technically feasible, fully developed, usable |
| Relevance | Directly addresses the challenge; NASA data is integral, not superficial |
| Presentation | Clear, well-structured, engaging story of the challenge, solution and significance |

Stages: local judges at Bangalore choose Global Nominees (announced 3 December
2026). Global judges choose Finalists (17 December). An executive panel from NASA
and partner agencies chooses ten Global Winners (26 January 2027), one per award.
The award we aim at is **Best Use of Science**: "the project that makes the best
and most valid use of the scientific method."

Competition: 718 teams were registered on this challenge on 12 November 2026.

## Hard rules

| Rule | Source |
|---|---|
| Teams may not begin working on the challenge before the hackathon | Participant FAQ |
| AI tools are allowed but should not be used to come up with the idea | Submission Guide |
| AI-generated code and data must be acknowledged in descriptive text and metadata | Submission Guide |
| AI-generated images and video need a visible watermark | Submission Guide |
| No NASA logos or branding in generated content | Submission Guide |
| Demo: video of 30 seconds or less, or at most 7 slides. Over the limit means ineligible | Both guides |
| Everything in English (a video may be in another language with English subtitles) | Both guides |
| All links public, no login or permission needed | Submission Guide |
| All external resources listed in the References field | Judging Guide |
| At least one NASA dataset must be used | Submission Guide |
| No images, video or audio of anyone under 18 | Submission Guide |

## Times (IST)

| When | What |
|---|---|
| Sat 14 Nov, 09:00 | Registration at venue; project page opens for editing |
| Sat 14 Nov, 10:15 | Hacking starts. **First moment solution work is allowed** |
| Sun 15 Nov, 16:30 | Valedictory at venue |
| Sun 15 Nov, 23:59 | Global submission deadline |

Local judging may close before 23:59. **VERIFY** the local deadline with the
Local Lead. Venue: School of Sciences, JAIN (Deemed-to-be University), JC Road,
Bengaluru.

## Project page fields to fill

Project name; high-level summary; link to demo; link to final project; detailed
description (what it does, how it works, benefits, goals, tools used); use of
AI; NASA data used; partner agency data and other references.

## Data citation

"We acknowledge the use of data from NASA's Fire Information for Resource
Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of NASA's
Earth Science Data and Information System (ESDIS)." **VERIFY** the current
wording on the FIRMS site before submission.

## What other teams are doing

Public repositories from other teams (read 12 November) share one pattern: put
both sensors on a grid, learn a MODIS-to-VIIRS conversion (a ratio or a machine
learning model), and show a calendar with a raw/harmonized toggle. One team has
a global pipeline with many extra modules. We do not compete on breadth. We
compete on a method that is explained by sensor physics and passes stated tests.
