# Getting started: what all three of us do

Read this once, top to bottom. Then open your own task file in `docs/tasks/`.
Tick the boxes as you go (edit the file, or copy the list somewhere you can tick).

## Part 1. Today, Friday 13 November (allowed prep only)

Nothing in this part is solution work. Do not write project code, download fire
data, or record anything today.

### Accounts and access

- [ ] You have a GitHub account. Send your username to Mahabu.
- [ ] You accepted the invite to `Mahabu-Subhani/fire-census` (check your email
      or https://github.com/notifications).
- [ ] You are logged in on https://www.spaceappschallenge.org and registered for
      the **Bangalore** local event, not waitlisted.
- [ ] Your name appears on the **Members** tab of the team "Sharmaji Ka
      Satellite". A project is not eligible for global judging if any teammate
      is missing from that tab or registered at a different event.
- [ ] If anyone on the team is under 18: they must not appear or be heard in the
      demo, and must be registered by a parent or guardian.

### Tools on your laptop

- [ ] Git installed. Check: `git --version`
- [ ] A code editor installed (VS Code is fine).
- [ ] Your AI assistant works and you are signed in.
- [ ] Person A also: Python 3.11 or newer. Check: `python --version`
- [ ] Person B also: Node.js LTS. Check: `node --version`

### Get the repo

```bash
git clone https://github.com/Mahabu-Subhani/fire-census.git
```

Clone into a short path such as `C:\code\fire-census`. Very long folder paths
cause Git errors on Windows.

### Read (about 40 minutes)

- [ ] `AGENTS.md`
- [ ] `docs/CONTEXT.md`
- [ ] `docs/APPROACH.md`
- [ ] `docs/ARCHITECTURE.md`
- [ ] Your own file in `docs/tasks/`
- [ ] `docs/STRETCH.md`

### Team meeting (one hour, all three)

The rules say the idea must be the team's own. This meeting is where that
happens. Go through each decision, agree, and write the outcome into the named
file. Mahabu commits the changes.

| # | Decision | Options | Write the answer in |
|---|---|---|---|
| 1 | Do we accept the ladder approach (fire cells, then common floor)? What do we change? | Accept, change, or replace | `docs/AI_USE.md`, "The team's own decisions" |
| 2 | Which two regions? | An Indian region (Punjab and Haryana, or Karnataka) and Argentina; or others | `docs/APPROACH.md`, "Regions" |
| 3 | Internal grid | 0.01 degree, or an equal-area grid | `docs/APPROACH.md` |
| 4 | Confidence filter | Drop MODIS below 30 and VIIRS "low"; or keep all | `docs/APPROACH.md` |
| 5 | Tolerance for "the sensors agree" | 10 percent to start; or another value | `docs/APPROACH.md` |
| 6 | App framework | Vite + React + TypeScript, or plain HTML and JavaScript | `docs/ARCHITECTURE.md` |
| 7 | Display cell size | 0.1 degree, or 0.05 degree | `docs/ARCHITECTURE.md` |
| 8 | Demo format | 30-second video, or 7 slides | `docs/tasks/PERSON_C_STORY.md` |
| 9 | Which stretch goals, if the core is done? | S1, S2, S3, at most two | `docs/STRETCH.md` |
| 10 | Project name and one-line tagline | Team's choice | `README.md` |

Also agree:

- [ ] One group chat for the weekend, and that blockers are posted there at once.
- [ ] Who brings what: chargers, an extension board, a phone hotspot as backup
      internet, water, ID for registration.
- [ ] Charulekha asks the Local Lead (contact is on the Bangalore event page):
      the exact local submission time, whether there is a live pitch, and
      whether teams may stay overnight.

## Part 2. Saturday morning before 10:15

- [ ] Arrive by 09:00 for registration.
- [ ] Laptop charged, internet tested, repo pulled: `git pull`
- [ ] Each person has their task file open at Phase 1.
- [ ] Do not start solution work until hacking is announced (10:15).

## Part 3. How we work during the hackathon

### Your branch

Each person works on their own branch and merges into `main` often.

```bash
git checkout main
git pull
git checkout -b a/pipeline      # Person B uses b/app, Person C uses c/story
```

Save work:

```bash
git add -A
git commit -m "Short description of what changed"
git push -u origin a/pipeline
```

Then open a pull request on GitHub and merge it. Merge small changes often;
do not sit on a large branch. Before you start each new piece of work:

```bash
git checkout main
git pull
```

Never commit: the `.env` file, anything in `data/`, or files over 50 MB.

### Using your AI assistant

1. Open the repo folder in your assistant.
2. Paste the prompt at the bottom of your task file.
3. Let it read the docs before it writes anything.
4. Review what it writes. You are responsible for it.
5. Each AI-assisted source file gets the header comment from `docs/AI_USE.md`.
6. Add a row to the log in `docs/AI_USE.md` for each kind of help you used.

### Sync points (all three, five minutes, standing)

Each person says: done, not done, blocked.

| Time | Purpose |
|---|---|
| Sat 13:00 | First real data is in the app |
| Sat 16:30 | Mid-afternoon check |
| Sat 19:30 | **Go or no-go** on the harmonization method |
| Sun 09:30 | Plan the last morning; decide stretch goals |
| Sun 12:30 | Feature complete; demo can be recorded |
| Sun 13:30 | **Freeze.** Fixes only from here |
| Sun 15:30 | **First submission** |

### If something goes wrong

| Problem | What to do |
|---|---|
| FIRMS archive files have not arrived | Person A uses the per-country yearly files meanwhile; Person B keeps building on mock data |
| The method fails its tests at 19:30 | Switch to the fallback in `docs/APPROACH.md` that night. Do not keep tuning |
| The app will not deploy | Fix this before any new feature. A working link matters more than any feature |
| Two people edited the same file | The owner in `docs/ARCHITECTURE.md` decides which version stays |
| Someone is stuck for 30 minutes | Say so in the chat. Do not stay stuck alone |
| Running out of time | Cut in this order: stretch goals, second region, small-fire layer, range display. Never cut: calendar, raw/harmonized toggle, area selection, CSV, method panel |

## Part 4. Sunday: submitting

Person C leads; everyone checks.

- [ ] Repository made public (Settings, General, Change visibility).
- [ ] App link opens in a private browser window, on a laptop and a phone.
- [ ] Demo link opens in a private window with no login. Video is 30 seconds or
      less, or slides are 7 or fewer.
- [ ] Every project page field is filled, in English.
- [ ] "Use of AI" field filled truthfully from `docs/AI_USE.md`.
- [ ] "NASA Data" names the exact FIRMS products used.
- [ ] "References" lists everything in `docs/REFERENCES.md`.
- [ ] Both agreement boxes ticked. **Submit for Judging** clicked by 15:30.
- [ ] Success banner seen and screenshotted.
- [ ] Any later edit is saved and resubmitted before 23:59 IST.
