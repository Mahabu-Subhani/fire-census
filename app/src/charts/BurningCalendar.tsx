// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Burning calendar: years as rows, months as columns (decision 21), each
// year's total on the right. Two colour modes: amount (ember ramp) and
// difference from that calendar month's average (purple, grey, orange; colour-
// vision safe). Exact values with two decimals on hover and tap, in the legend
// and in the table: nothing is rounded. Months before harmonized_from are
// hatched "Terra only, not harmonized". Season band and "you are here" from stats/.
import * as Plot from "@observablehq/plot";
import { useId, useMemo, useState } from "react";
import { useSelection } from "../selection";
import { fmtDiff, fmtShare, fmtValue, MONTH_NAMES, monthAverages, seasonMonths, toCalendar, unitLabel } from "../stats";
import { EMBER, useTheme } from "../theme";
import ChartFrame from "./ChartFrame";
import RampLegend, { rampColor } from "./RampLegend";
import { usePlot } from "./usePlot";

const TERRA_NOTE = "Terra only, not harmonized";
type ColourMode = "counts" | "difference";

interface Cell {
  year: number;
  month: string;
  ym: string;
  v: number;
  /** Difference from the month's average; null if there is no fair average. */
  diff: number | null;
  avg: number | null;
  terra: boolean;
  partial: boolean;
}

/** Diagonal stripes: visible on every colour of both ramps. */
function hatch(id: string): string {
  return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="1.5" height="6" fill="#000" fill-opacity="0.55"/>
    <rect x="1.5" width="1.5" height="6" fill="#fff" fill-opacity="0.55"/>
  </pattern>`;
}

/** Below average purple, average grey, above average orange (ColorBrewer PuOr poles, grey middle). */
const DIVERGING = ["#5e3c99", "#8c8c8c", "#e66101"];

export default function BurningCalendar() {
  const { status, rows, areaRows, mode, meta, region, from, to, dataThrough } = useSelection();
  const { theme } = useTheme();
  const [colourMode, setColourMode] = useState<ColourMode>("counts");
  const diffMode = colourMode === "difference";
  const patternId = `terra-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unit = unitLabel(meta, mode);
  const fmt = (v: number) => fmtValue(v, mode);
  const harmonizedFrom = region?.harmonized_from ?? null;
  const partialYm = dataThrough ? dataThrough.slice(0, 7) : null;
  const partialDay = dataThrough ? Number(dataThrough.slice(8, 10)) : null;

  // Season band and averages come from the whole history of the area, not the date range.
  const season = useMemo(
    () => (region ? seasonMonths(areaRows, region.harmonized_from, dataThrough) : null),
    [areaRows, region, dataThrough],
  );
  const seasonNames = season ? season.months.map((m) => MONTH_NAMES[m - 1]) : [];
  const averages = useMemo(
    () => (region ? monthAverages(areaRows, mode, region.harmonized_from, dataThrough) : null),
    [areaRows, mode, region, dataThrough],
  );

  const cal = useMemo(() => toCalendar(rows, mode, from && to ? { from, to } : undefined), [rows, mode, from, to]);

  const { cells, totals, monthTotals, max, maxDiff } = useMemo(() => {
    const cells: Cell[] = [];
    const totals: { year: number; total: number; complete: boolean }[] = [];
    const monthSums = new Array(12).fill(0);
    let max = 0;
    let maxDiff = 0;
    cal.years.forEach((year, i) => {
      let total = 0;
      let complete = true;
      cal.cells[i].forEach((v, m) => {
        const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
        if (v === null || ym === partialYm) complete = false;
        if (v === null) return;
        total += v;
        monthSums[m] += v;
        max = Math.max(max, v);
        const partial = ym === partialYm;
        const avg = partial ? averages?.partial?.average ?? null : averages?.full[m] ?? null;
        const diff = avg === null ? null : v - avg;
        if (diff !== null) maxDiff = Math.max(maxDiff, Math.abs(diff));
        cells.push({ year, month: MONTH_NAMES[m], ym, v, diff, avg, terra: harmonizedFrom !== null && ym < harmonizedFrom, partial });
      });
      totals.push({ year, total, complete });
    });
    const monthTotals = MONTH_NAMES.map((month, m) => ({ month, total: monthSums[m] }));
    return { cells, totals, monthTotals, max: Math.max(max, 1e-9), maxDiff: Math.max(maxDiff, 1e-9) };
  }, [cal, harmonizedFrom, partialYm, averages]);

  // One colour function for the chart and the legend. Square-root scale so a
  // few very busy months do not wash out the rest; the legend shows where values sit.
  const ember = EMBER[theme];
  const amountT = (v: number) => Math.sqrt(Math.max(0, v) / max);
  const diffT = (d: number) => 0.5 + 0.5 * Math.sign(d) * Math.sqrt(Math.abs(d) / maxDiff);
  const amountColor = (t: number) => rampColor(ember, t);
  const diffColor = (t: number) => rampColor(DIVERGING, t);

  const describe = (d: Cell) =>
    [
      `${d.month} ${d.year}: ${fmt(d.v)}`,
      d.avg !== null ? `${d.partial ? `Average of days 1 to ${partialDay}` : `Average ${d.month}`}: ${fmt(d.avg)}` : null,
      d.diff !== null ? `Difference: ${fmtDiff(d.diff, mode)}` : null,
      d.partial ? `You are here: 1 to ${partialDay} ${d.month} only` : null,
      seasonNames.includes(d.month) ? "Usual burning season" : null,
      d.terra ? TERRA_NOTE : null,
    ]
      .filter(Boolean)
      .join("\n");

  const plotRef = usePlot(
    (width) => {
      if (cells.length === 0) return null;
      const narrow = width < 560;
      const rowH = narrow ? 16 : 20;
      const shown = diffMode ? cells.filter((d) => d.diff !== null) : cells;
      const svg = Plot.plot({
        width,
        height: cal.years.length * rowH + 30,
        marginTop: 26,
        marginBottom: 4,
        marginLeft: 40,
        // Year totals sit in their own column on the right, written in full.
        marginRight: narrow ? 4 : 104,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { domain: MONTH_NAMES, axis: "top", label: null, tickSize: 0, padding: 0.08, tickFormat: (m: string) => (narrow ? m[0] : m) },
        y: { domain: cal.years, label: null, tickSize: 0, padding: 0.1, tickFormat: (y: number) => String(y) },
        marks: [
          Plot.cell(shown, {
            x: "month", y: "year", rx: 3,
            fill: (d: Cell) => (diffMode ? diffColor(diffT(d.diff!)) : amountColor(amountT(d.v))),
            title: describe,
            tip: { fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" },
          }),
          diffMode
            ? Plot.cell(cells.filter((d) => d.diff === null), { x: "month", y: "year", rx: 3, fill: "none", stroke: "currentColor", strokeOpacity: 0.35, inset: 2, title: describe })
            : null,
          Plot.cell(cells.filter((d) => d.terra), { x: "month", y: "year", rx: 3, fill: `url(#${patternId})` }),
          Plot.cell(seasonNames, { x: (d) => d, fill: "none", stroke: "var(--text)", strokeOpacity: 0.7, strokeWidth: 1.5, strokeDasharray: "3,3", rx: 4, inset: -1 }),
          Plot.cell(cells.filter((d) => d.partial), { x: "month", y: "year", rx: 3, fill: "none", stroke: "var(--text)", strokeWidth: 2.5, inset: -1 }),
          narrow
            ? null
            : Plot.text(totals, {
                y: "year", frameAnchor: "right", textAnchor: "start", dx: 12, fill: "currentColor", fontFamily: "var(--font-mono)", fontSize: 11,
                text: (d) => `${fmt(d.total)}${d.complete ? "" : "*"}`,
                title: (d) => `${d.year} total: ${fmt(d.total)}${d.complete ? "" : "\nPart of the year only"}`,
              }),
          narrow
            ? null
            : Plot.text([0], { frameAnchor: "top-right", textAnchor: "start", dx: 12, dy: -18, text: () => "Year total", fill: "currentColor", fillOpacity: 0.7 }),
        ],
      });
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = hatch(patternId);
      svg.prepend(defs);
      svg.setAttribute("aria-label", `Burning calendar, ${cal.years[0]} to ${cal.years[cal.years.length - 1]}, ${unit}`);
      return svg;
    },
    [cells, totals, mode, unit, patternId, seasonNames, diffMode, maxDiff, max, theme],
  );

  const hasTerra = cells.some((d) => d.terra);
  const hasPartial = cells.some((d) => d.partial);
  const hasIncompleteYear = totals.some((d) => !d.complete);
  const noFairAverage = diffMode && cells.some((d) => d.diff === null);
  const avgYears = season ? `${season.firstYear} to ${season.lastYear}` : "complete harmonized years";
  const seasonText = season && seasonNames.length
    ? `Usual burning season: ${seasonNames.join(", ")} (${fmtShare(season.share)} of activity, ${season.firstYear} to ${season.lastYear})`
    : null;
  const notes = [
    ...(diffMode ? [`Colour: difference from the average of that calendar month over ${avgYears}.`] : []),
    ...(seasonText ? [`Dashed columns. ${seasonText}.`] : []),
    ...(hasPartial ? [`Outlined month: you are here (data to ${dataThrough}, month not complete).`] : []),
    ...(hasTerra ? [`Hatched: ${TERRA_NOTE} (before ${harmonizedFrom}).`] : []),
    ...(hasIncompleteYear ? ["* Total of the months shown, not a full year."] : []),
  ];

  const legend = diffMode ? (
    <RampLegend
      label="Difference from the month's average"
      color={diffColor}
      low="Below average"
      middle="Average"
      high="Above average"
      stops={[
        { t: 0, label: fmtDiff(-maxDiff, mode) },
        { t: 0.5, label: fmtDiff(0, mode) },
        { t: 1, label: fmtDiff(maxDiff, mode) },
      ]}
    />
  ) : (
    <RampLegend
      label="Fire activity per month"
      color={amountColor}
      low="Less fire"
      high="More fire"
      stops={[
        { t: 0, label: fmt(0) },
        { t: 0.5, label: fmt(max * 0.25) },
        { t: 1, label: fmt(max) },
      ]}
    />
  );

  return (
    <ChartFrame
      title="When does it burn?"
      lede={diffMode
        ? "Each square is one month. Orange: more than that month's average. Purple: less."
        : "Each square is one month, each row a year. Brighter means more fire."}
      exportName={diffMode ? "calendar-difference" : "calendar"}
      notes={notes}
      table={() => ({
        columns: ["year", "month", "value", "month_average", "difference", "terra_only", "month_incomplete", "in_season"],
        rows: cells.map((d) => [d.year, d.ym.slice(5), d.v, d.avg, d.diff, d.terra, d.partial, seasonNames.includes(d.month)]),
        notes,
      })}
    >
      <div className="chart-controls">
        <div className="switch" role="group" aria-label="Calendar colour">
          <button type="button" aria-pressed={!diffMode} onClick={() => setColourMode("counts")}>Amount</button>
          <button type="button" aria-pressed={diffMode} onClick={() => setColourMode("difference")}>Compared with average</button>
        </div>
      </div>
      {status === "loading" || status === "idle" ? (
        <div className="skeleton" style={{ height: 320 }} aria-label="Loading" />
      ) : cells.length === 0 ? (
        <p className="cf-empty">No months to show for this area and date range.</p>
      ) : (
        <>
          <div ref={plotRef} className="cal-plot" />
          {legend}
          <div className="cal-key">
            {seasonText && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <rect x="4" y="0.75" width="10" height="10.5" rx="2" fill="none" stroke="var(--text)" strokeWidth="1.5" strokeDasharray="3,3" />
                </svg>
                {seasonText}
              </span>
            )}
            {hasPartial && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="15" height="9" rx="2" fill="none" stroke="var(--text)" strokeWidth="2.5" />
                </svg>
                You are here: data to {dataThrough}
              </span>
            )}
            {hasTerra && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <defs dangerouslySetInnerHTML={{ __html: hatch(`${patternId}-key`) }} />
                  <rect width="18" height="12" fill="#7c7b78" />
                  <rect width="18" height="12" fill={`url(#${patternId}-key)`} />
                </svg>
                {TERRA_NOTE}
              </span>
            )}
            {hasIncompleteYear && <span>* Part of the year only</span>}
            {noFairAverage && <span>Outlined, uncoloured: no fair average in Raw mode</span>}
          </div>
          <details className="cal-table">
            <summary>Every value as a table</summary>
            <div className="cal-table-scroll">
              <table>
                <caption>{unit}. Italic: {TERRA_NOTE.toLowerCase()}.</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    {MONTH_NAMES.map((m) => <th key={m} scope="col">{m}</th>)}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cal.years.map((year, i) => (
                    <tr key={year}>
                      <th scope="row">{year}</th>
                      {cal.cells[i].map((v, m) => {
                        const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
                        const terra = harmonizedFrom !== null && ym < harmonizedFrom;
                        return <td key={m} className={terra ? "terra" : undefined}>{v === null ? "" : fmt(v)}</td>;
                      })}
                      <td>{fmt(totals[i].total)}{totals[i].complete ? "" : "*"}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Total</th>
                    {monthTotals.map((d) => <td key={d.month}>{fmt(d.total)}</td>)}
                    <td>{fmt(totals.reduce((a, t) => a + t.total, 0))}</td>
                  </tr>
                  {averages && (
                    <tr>
                      <th scope="row">Average</th>
                      {averages.full.map((a, m) => <td key={m}>{a === null ? "" : fmt(a)}</td>)}
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </ChartFrame>
  );
}
