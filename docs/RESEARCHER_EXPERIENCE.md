# Who visits, and what the site must give them

Status: proposal for 8crsk and Charulekha. It adds no new science. It decides
what each visitor can do in their first minute and what they can take away.

## Three visitors

| Visitor | Their question | Time they will give us | What they must leave with |
|---|---|---|---|
| Emergency manager | "Is this month unusual here, and when is the dangerous period?" | 30 seconds | A plain answer and a calendar |
| PhD researcher | "Can I use this record in my study, and can I trust and cite it?" | 10 minutes, then hours if convinced | The data, the method, the limits and a citation |
| Judge | "Does it work, is it sound, is it new?" | 2 minutes | The raw-to-harmonized switch, and the checks with their verdicts |

One page serves all three by depth: the answer on top, the evidence one click
down, the raw material one click further.

## Layer 1: the answer (visible without scrolling)

- Region picker, map, and the burning calendar for the selected area.
- One sentence in words: "October 2026 was far above normal for this area
  (2.4 times the median of 22 earlier Octobers)." Numbers come from the data.
- The Raw / Harmonized switch.

## Layer 2: the evidence (one click)

- **Method panel:** the two causes, the detection curve drawn as a chart, the
  ladder table.
- **Checks panel:** every pre-registered check from `docs/PREREGISTRATION.md`
  with its threshold, its value and pass or fail. Failed checks are shown.
- **Limits:** what the record cannot tell you, in plain words.

## Layer 3: what a researcher takes away

This is where a PhD student decides whether to use the record.

| Need | What the site provides |
|---|---|
| The data behind any chart | A "Download data" button on every chart: CSV of exactly what is plotted, plus PNG and SVG of the chart |
| The whole record | Bulk download of the full cube per region (CSV and Parquet), not only the current selection |
| Their own area and period | Selection by drawing, by coordinates, or by uploading a GeoJSON polygon; date range to the month |
| Reproducing a view | A shareable link that restores region, area, dates and mode, so a figure in a paper can point to it |
| Comparing methods | A level selector (raw, fire cells, hard floor, detection curve) so they can see what each step does to their area |
| Uncertainty | Lower and upper values in every download, not only on the chart; a column saying how many valid observations each value rests on |
| Honesty about gaps | "No valid observation" is a different value from zero, in the charts and in the files |
| Understanding the columns | A data dictionary: every column, its unit, how it is computed |
| Provenance | Each download starts with comment lines: source products, processing date, code version (git commit), method level |
| Loading it quickly | Copy-paste snippets for Python and R that read the files directly from the site |
| Citing it | A "Cite this" box with a ready citation for the tool and the required NASA FIRMS acknowledgement |
| Checking our work | Link to the repository, the pre-registration file and the README that reproduces every figure |
| Raw material | Per-year hotspot files with each detection's class (counted, small-fire, excluded) and its detection weight |
| Knowing what changed | A dated changelog and a data version number shown in the footer |

## Details that make it feel professional

- Every chart title states the unit, the mode (raw or harmonized) and the area.
- Colour ramp readable with colour-vision deficiency; values on hover and tap.
- Works on a phone for the manager; dense tables are for the desktop researcher.
- No sign-in, no tracking, no key needed.
- Loads fast: the first view needs only the small monthly cube.
- The wording never says "fires" where it means "detected hotspots", and never
  says "wildfire" for crop burning.

## Build order (for the two app owners)

1. Layer 1 complete (required by the challenge).
2. Checks panel and per-chart CSV download (highest trust for least work).
3. Shareable link, bulk download, data dictionary, cite box.
4. Level selector, GeoJSON upload, code snippets, PNG and SVG export.

Items in step 4 are dropped first if time is short.
