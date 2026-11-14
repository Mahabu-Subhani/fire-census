// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// One calendar month against the same month in every earlier year: a bar per
// year, the median and 90th percentile as labelled lines, the compared year
// highlighted. Uses areaRows, so narrowing the date range does not change it.
import * as Plot from "@observablehq/plot";
import { useMemo, useState } from "react";
import { useSelection } from "../selection";
import { compareMonth, fmtTick, fmtValue, formatRank, parseYm, unitLabel } from "../stats";
import { BASELINE_TEXT, useBaseline } from "./baseline";
import ChartFrame from "./ChartFrame";
import { BaselineSwitch, MONTH_FULL } from "./UnusualBanner";
import { usePlot } from "./usePlot";

export default function MonthComparison() {
  const { status, areaRows, region, dataThrough, mode, meta } = useSelection();
  const baseline = useBaseline();
  const latest = dataThrough ? parseYm(dataThrough.slice(0, 7))[1] : 12;
  const [chosen, setChosen] = useState<number | null>(null);
  const month = chosen ?? latest;
  const name = MONTH_FULL[month - 1];
  const unit = unitLabel(meta, mode);
  const num = (v: number) => fmtValue(v, mode);

  const c = useMemo(
    () =>
      region ? compareMonth({ areaRows, month, mode, baseline, harmonizedFrom: region.harmonized_from, dataThrough }) : null,
    [areaRows, month, mode, baseline, region, dataThrough],
  );

  const bars = useMemo(() => {
    if (!c) return [];
    const inBase = new Set(c.baselineYears);
    return c.years
      .filter((d) => d.value !== null)
      .map((d) => ({ year: d.year, value: d.value as number, current: d.year === c.year, inBase: inBase.has(d.year) }));
  }, [c]);

  const toDayText = c?.toDay ? ` (days 1 to ${c.toDay})` : "";
  const describe = (d: (typeof bars)[number]) =>
    `${name} ${d.year}${toDayText}: ${num(d.value)}\n${unit}${d.current ? "\nCompared year" : d.inBase ? "" : "\nNot in the baseline"}`;

  const plotRef = usePlot(
    (width) => {
      if (!c || bars.length === 0) return null;
      const narrow = width < 480;
      const lines = [
        c.median !== null ? { y: c.median, label: `median ${num(c.median)}`, dash: null } : null,
        c.p90 !== null ? { y: c.p90, label: `90th percentile ${num(c.p90)}`, dash: "4,3" } : null,
      ].filter((l): l is { y: number; label: string; dash: string | null } => l !== null);
      return Plot.plot({
        width,
        height: narrow ? 220 : 260,
        marginLeft: 64,
        marginRight: narrow ? 8 : 16,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: {
          type: "band", label: null, tickSize: 0, padding: 0.2,
          // Every fifth year and the compared year, skipping a fifth year that would collide with it.
          tickFormat: (y: number) => (y === c.year || (y % 5 === 0 && Math.abs(y - (c.year ?? 0)) > 2) ? String(y) : ""),
        },
        y: { grid: true, label: null, nice: true, zero: true, tickFormat: fmtTick },
        marks: [
          Plot.barY(bars, {
            x: "year", y: "value", rx: 3,
            fill: (d) => (d.current ? "var(--accent)" : "var(--bar-neutral)"),
            fillOpacity: (d) => (d.current || d.inBase ? 1 : 0.35),
            title: describe,
            tip: { fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" },
          }),
          Plot.ruleY([0]),
          ...lines.map((l) =>
            Plot.ruleY([l.y], { stroke: "currentColor", strokeWidth: 1.5, strokeDasharray: l.dash ?? undefined }),
          ),
          ...lines.map((l) =>
            Plot.text([l], { y: "y", text: "label", frameAnchor: "left", dy: -7, dx: 4, textAnchor: "start", fill: "currentColor", stroke: "var(--surface)", strokeWidth: 4, paintOrder: "stroke", fontWeight: 600 }),
          ),
        ],
      });
    },
    [bars, c, unit, name],
  );

  const ready = status !== "loading" && status !== "idle";
  const summary =
    c && c.value !== null && c.rank
      ? `${name} ${c.year}${toDayText}: ${num(c.value)}, ${formatRank(c.rank)} ${name}s. Median ${num(c.median!)}, 90th percentile ${num(c.p90!)}.`
      : c?.status === "not-enough-history"
        ? "Not enough earlier years to compare."
        : null;

  const notes = [
    `${name}${toDayText} in each year. Baseline: ${BASELINE_TEXT[baseline]}${c && c.baselineYears.length ? ` (${c.baselineYears[0]} to ${c.baselineYears[c.baselineYears.length - 1]})` : ""}.`,
    ...(summary ? [summary] : []),
    ...(c?.skippedIncomplete ? [`${name} ${(c.year ?? 0) + 1} is not complete and the raw record has no month-to-date count, so ${name} ${c.year} is compared.`] : []),
  ];

  return (
    <ChartFrame
      title={`Monthly comparison: ${name}`}
      exportName={`month-${String(month).padStart(2, "0")}`}
      notes={notes}
      table={() => ({
        columns: ["year", "month", "value", "month_to_date_days", "in_baseline", "compared_year"],
        rows: bars.map((d) => [d.year, month, d.value, c?.toDay ?? "", d.inBase, d.current]),
        notes: notes.concat(c?.median != null ? [`Median ${c.median}. 90th percentile ${c.p90}`] : []),
      })}
    >
      <div className="chart-controls">
        <label>
          Month{" "}
          <select value={month} onChange={(e) => setChosen(Number(e.target.value))}>
            {MONTH_FULL.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
                {i + 1 === latest && dataThrough ? " (latest)" : ""}
              </option>
            ))}
          </select>
        </label>
        <BaselineSwitch />
      </div>
      {!ready ? (
        <p className="cf-empty">Loading…</p>
      ) : bars.length === 0 ? (
        <p className="cf-empty">No data for this month in this area.</p>
      ) : (
        <>
          <div ref={plotRef} className="cal-plot" />
          <div className="series-key">
            <span><i style={{ background: "var(--accent)" }} />{name} {c?.year}{toDayText}</span>
            <span><i style={{ background: "var(--bar-neutral)" }} />Earlier years in the baseline</span>
            {bars.some((d) => !d.inBase && !d.current) && (
              <span><i style={{ background: "var(--bar-neutral)", opacity: 0.35 }} />Outside the baseline</span>
            )}
          </div>
          {summary && <p className="status-detail">{summary}</p>}
          {c?.skippedIncomplete && <p className="status-detail">{notes[notes.length - 1]} Switch to Harmonized for month to date.</p>}
          <details className="data-table">
            <summary>Every value as a table</summary>
            <div className="data-table-scroll">
              <table>
                <thead>
                  <tr><th scope="col">Year</th><th scope="col">{name}{toDayText}</th><th scope="col">In baseline</th></tr>
                </thead>
                <tbody>
                  {bars.map((d) => (
                    <tr key={d.year}>
                      <th scope="row">{d.year}{d.current ? " (compared)" : ""}</th>
                      <td>{num(d.value)}</td>
                      <td>{d.inBase ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </ChartFrame>
  );
}
