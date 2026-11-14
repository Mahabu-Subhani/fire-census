// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Burning calendar: years as rows, months as columns (decision 21), with
// totals per year and per calendar month. Two colour modes: counts (cividis)
// and difference from that calendar month's average (purple to grey to
// orange, colour-vision safe). Exact value on hover and tap, and as a table.
// Months before harmonized_from are hatched "Terra only, not harmonized".
// The season band and "you are here" come from stats/. All sums from stats/.
import * as Plot from "@observablehq/plot";
import { useId, useMemo, useState } from "react";
import { useSelection } from "../selection";
import { MONTH_NAMES, monthAverages, seasonMonths, toCalendar, unitLabel } from "../stats";
import ChartFrame from "./ChartFrame";
import { usePlot } from "./usePlot";

const TERRA_NOTE = "Terra only, not harmonized";
const TOTAL = "Total";
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

const exact = (v: number) => v.toLocaleString("en", { maximumFractionDigits: 2 });
const compact = (v: number) =>
  Math.abs(v) < 1000 ? Math.round(v).toLocaleString("en") : v.toLocaleString("en", { notation: "compact", maximumFractionDigits: 1 });
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${compact(Math.abs(v))}`;

/** Diagonal black and white stripes: visible on every colour of both ramps. */
function hatch(id: string): string {
  return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="1.5" height="6" fill="#000" fill-opacity="0.55"/>
    <rect x="1.5" width="1.5" height="6" fill="#fff" fill-opacity="0.55"/>
  </pattern>`;
}

/** Below average purple, average grey, above average orange (ColorBrewer PuOr poles, grey middle). */
const LOW = [94, 60, 153];
const MID = [140, 140, 140];
const HIGH = [230, 97, 1];
function diverging(t: number): string {
  const [a, b, u] = t < 0.5 ? [LOW, MID, t * 2] : [MID, HIGH, (t - 0.5) * 2];
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * u)).join(",")})`;
}

export default function BurningCalendar() {
  const { status, rows, areaRows, mode, meta, region, from, to, dataThrough } = useSelection();
  const [colourMode, setColourMode] = useState<ColourMode>("counts");
  const diffMode = colourMode === "difference";
  const patternId = `terra-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unit = unitLabel(meta, mode);
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
    return { cells, totals, monthTotals, max, maxDiff };
  }, [cal, harmonizedFrom, partialYm, averages]);

  const describe = (d: Cell) =>
    [
      `${d.month} ${d.year}: ${exact(d.v)}`,
      d.avg !== null ? `${d.partial ? `Average of days 1 to ${partialDay}` : `Average ${d.month}`}: ${exact(d.avg)}; difference ${signed(d.diff!)}` : null,
      unit,
      d.partial ? `You are here. Month not complete: 1 to ${partialDay} ${d.month} only` : null,
      seasonNames.includes(d.month) ? "In the usual burning season" : null,
      d.terra ? TERRA_NOTE : null,
    ]
      .filter(Boolean)
      .join("\n");

  const color = diffMode
    ? { type: "diverging-sqrt" as const, pivot: 0, symmetric: true, interpolate: diverging, domain: [-Math.max(maxDiff, 1), Math.max(maxDiff, 1)] }
    : { type: "sqrt" as const, scheme: "cividis" as const, domain: [0, Math.max(max, 1)] };

  const plotRef = usePlot(
    (width) => {
      if (cells.length === 0) return null;
      const narrow = width < 480;
      const rowH = narrow ? 15 : 18;
      const shown = diffMode ? cells.filter((d) => d.diff !== null) : cells;
      const svg = Plot.plot({
        width,
        height: (cal.years.length + 1) * rowH + 34,
        marginTop: 24,
        marginBottom: 6,
        marginLeft: 36,
        marginRight: 4,
        style: { fontSize: narrow ? "9px" : "10px" },
        x: { domain: [...MONTH_NAMES, TOTAL], axis: "top", label: null, tickSize: 0, padding: 0.06,
             tickFormat: (m: string) => (narrow && m !== TOTAL ? m[0] : m) },
        y: { domain: [...cal.years, TOTAL], label: null, tickSize: 0, padding: 0.08, tickFormat: (y: number | string) => String(y) },
        color,
        marks: [
          Plot.cell(shown, {
            x: "month", y: "year", fill: diffMode ? "diff" : "v", title: describe,
            tip: { fontSize: 12, fill: "var(--surface)", stroke: "var(--border)" },
          }),
          diffMode
            ? Plot.cell(cells.filter((d) => d.diff === null), { x: "month", y: "year", fill: "none", stroke: "currentColor", strokeOpacity: 0.4, inset: 2, title: describe })
            : null,
          Plot.cell(cells.filter((d) => d.terra), { x: "month", y: "year", fill: `url(#${patternId})` }),
          Plot.cell(seasonNames, { x: (d) => d, fill: "none", stroke: "var(--accent)", strokeWidth: 2, inset: -1 }),
          Plot.cell(cells.filter((d) => d.partial), { x: "month", y: "year", stroke: "var(--accent)", strokeWidth: 2.5, inset: -1 }),
          Plot.text(totals, {
            x: () => TOTAL, y: "year", fill: "currentColor",
            text: (d) => `${compact(d.total)}${d.complete ? "" : "*"}`,
            title: (d) => `${d.year} total: ${exact(d.total)}\n${unit}${d.complete ? "" : "\nPart of the year only"}`,
          }),
          Plot.text(monthTotals, {
            x: "month", y: () => TOTAL, fill: "currentColor", fontWeight: 600, fontSize: narrow ? 7 : undefined,
            // At phone width, whole thousands so neighbouring totals do not run together.
            text: (d) => (narrow && d.total >= 1000 ? d.total.toLocaleString("en", { notation: "compact", maximumFractionDigits: 0 }) : compact(d.total)),
            title: (d) => `All ${d.month} months shown: ${exact(d.total)}\n${unit}`,
          }),
        ],
      });
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = hatch(patternId);
      svg.prepend(defs);
      svg.setAttribute("aria-label", `Burning calendar, ${cal.years[0]} to ${cal.years[cal.years.length - 1]}, ${unit}`);
      return svg;
    },
    [cells, totals, monthTotals, mode, unit, patternId, seasonNames, diffMode, maxDiff, max],
  );

  const legendRef = usePlot(
    (width) =>
      cells.length === 0
        ? null
        : Plot.legend({
            color: { ...color, label: diffMode ? "Below ← average → above" : null },
            width: Math.min(width, 300),
            tickFormat: diffMode ? signed : compact,
          }),
    [cells, max, maxDiff, diffMode],
  );

  const hasTerra = cells.some((d) => d.terra);
  const hasPartial = cells.some((d) => d.partial);
  const hasIncompleteYear = totals.some((d) => !d.complete);
  const noFairAverage = diffMode && cells.some((d) => d.diff === null);
  const avgYears = season ? `${season.firstYear} to ${season.lastYear}` : "complete harmonized years";
  const seasonText = season && seasonNames.length
    ? `Usual burning season: ${seasonNames.join(", ")} hold ${Math.round(season.share * 100)}% of activity (${season.firstYear} to ${season.lastYear}, harmonized)`
    : null;
  const notes = [
    ...(diffMode ? [`Colour: difference from the average of that calendar month over ${avgYears}. The incomplete month is compared with the average of the same days.`] : []),
    ...(noFairAverage ? ["Outlined without colour: no fair average (the raw record has no month-to-date count)."] : []),
    ...(seasonText ? [`Outlined columns. ${seasonText}.`] : []),
    ...(hasPartial ? [`You are here: data to ${dataThrough}; the month is not complete.`] : []),
    ...(hasTerra ? [`Hatched: ${TERRA_NOTE} (before ${harmonizedFrom}).`] : []),
    ...(hasIncompleteYear ? ["* Total of the months shown, not a full year."] : []),
  ];

  return (
    <ChartFrame
      title="Burning calendar"
      exportName={diffMode ? "calendar-difference" : "calendar"}
      notes={notes}
      table={() => ({
        columns: ["year", "month", "value", "month_average", "difference", "terra_only", "month_incomplete", "in_season"],
        rows: cells.map((d) => [d.year, d.ym.slice(5), d.v, d.avg, d.diff, d.terra, d.partial, seasonNames.includes(d.month)]),
        notes,
      })}
    >
      <div className="chart-controls">
        <span>Colour</span>
        <div className="switch" role="group" aria-label="Calendar colour">
          <button type="button" aria-pressed={!diffMode} onClick={() => setColourMode("counts")}>Amount</button>
          <button type="button" aria-pressed={diffMode} onClick={() => setColourMode("difference")}>Difference from average</button>
        </div>
      </div>
      {status === "loading" || status === "idle" ? (
        <p className="cf-empty">Loading…</p>
      ) : cells.length === 0 ? (
        <p className="cf-empty">No months to show for this area and date range.</p>
      ) : (
        <>
          <div ref={plotRef} className="cal-plot" />
          <div className="cal-legend">
            <div ref={legendRef} style={{ flex: "1 1 220px", minWidth: 0 }} />
            {hasTerra && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <defs dangerouslySetInnerHTML={{ __html: hatch(`${patternId}-key`) }} />
                  <rect width="18" height="12" fill="#7c7b78" />
                  <rect width="18" height="12" fill={`url(#${patternId}-key)`} />
                </svg>
                {TERRA_NOTE} (before {harmonizedFrom})
              </span>
            )}
            {hasPartial && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="15" height="9" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                </svg>
                You are here (data to {dataThrough}, month not complete)
              </span>
            )}
            {seasonText && (
              <span className="cal-legend-item">
                <svg className="cal-swatch" viewBox="0 0 18 12" aria-hidden="true">
                  <rect x="4" y="0.5" width="10" height="11" fill="none" stroke="var(--accent)" strokeWidth="2" />
                </svg>
                {seasonText}
              </span>
            )}
            {hasIncompleteYear && <span>* Total of the months shown, not a full year</span>}
            {diffMode && <span>Colour: difference from that calendar month's average over {avgYears}{noFairAverage ? ". Outlined, uncoloured: no fair average in Raw mode" : ""}</span>}
          </div>
          <details className="cal-table">
            <summary>Show the values as a table</summary>
            <div className="cal-table-scroll">
              <table>
                <caption className="cf-sub" style={{ textAlign: "left" }}>{unit}. Italic: {TERRA_NOTE.toLowerCase()}.</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    {MONTH_NAMES.map((m) => <th key={m} scope="col">{m}</th>)}
                    <th scope="col">{TOTAL}</th>
                  </tr>
                </thead>
                <tbody>
                  {cal.years.map((year, i) => (
                    <tr key={year}>
                      <th scope="row">{year}</th>
                      {cal.cells[i].map((v, m) => {
                        const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
                        const terra = harmonizedFrom !== null && ym < harmonizedFrom;
                        return <td key={m} className={terra ? "terra" : undefined}>{v === null ? "" : exact(v)}</td>;
                      })}
                      <td>{exact(totals[i].total)}{totals[i].complete ? "" : "*"}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">{TOTAL}</th>
                    {monthTotals.map((d) => <td key={d.month}>{exact(d.total)}</td>)}
                    <td>{exact(totals.reduce((a, t) => a + t.total, 0))}</td>
                  </tr>
                  {averages && (
                    <tr>
                      <th scope="row">Average</th>
                      {averages.full.map((a, m) => <td key={m}>{a === null ? "" : exact(a)}</td>)}
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
