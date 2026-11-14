// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The monthly series for the date range. In Raw mode the jump when VIIRS
// joins in 2012 is plain; in Harmonized mode it should be gone. The range
// harm_lo to harm_hi is shaded. With "small fires" on, the small-fire layer is
// its own line from 2012 (decision 23), never added into the main line.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import { useSelection } from "../selection";
import { fmtTick, fmtValue, toSeries, unitLabel } from "../stats";
import ChartFrame, { formatMonth } from "./ChartFrame";
import { usePlot } from "./usePlot";

const VIIRS_START = "2012-01";
const date = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1));

export default function ActivitySeries() {
  const { status, rows, mode, meta, from, to, showSmall, region } = useSelection();
  const unit = unitLabel(meta, mode);
  const exact = (v: number) => fmtValue(v, mode);
  const harmonizedFrom = region?.harmonized_from ?? null;

  const series = useMemo(() => toSeries(rows, mode, from, to).map((p) => ({ ...p, date: date(p.ym) })), [rows, mode, from, to]);
  const hasRange = mode === "harmonized" && series.some((p) => p.hi !== p.lo);
  const small = useMemo(() => (showSmall ? series.filter((p) => p.ym >= VIIRS_START) : []), [series, showSmall]);
  const mainLabel = mode === "raw" ? "MODIS + VIIRS detections" : "Harmonized";

  const describe = (p: (typeof series)[number]) =>
    [
      `${formatMonth(p.ym)}: ${exact(p.value)}`,
      hasRange && p.hi !== p.lo ? `range ${exact(p.lo)} to ${exact(p.hi)}` : null,
      showSmall && p.ym >= VIIRS_START ? `small fires ${exact(p.small)} (separate layer)` : null,
      unit,
      harmonizedFrom && p.ym < harmonizedFrom ? "Terra only, not harmonized" : null,
    ]
      .filter(Boolean)
      .join("\n");

  const plotRef = usePlot(
    (width) => {
      if (series.length === 0) return null;
      const narrow = width < 480;
      const first = series[0].date;
      const last = series[series.length - 1].date;
      const terraEnd = harmonizedFrom && from < harmonizedFrom ? date(harmonizedFrom < to ? harmonizedFrom : to) : null;
      const viirs = from <= VIIRS_START && to >= VIIRS_START ? date(VIIRS_START) : null;
      return Plot.plot({
        width,
        height: narrow ? 240 : 300,
        marginLeft: 64,
        marginRight: narrow ? 8 : 16,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { type: "utc", label: null, domain: [first, last] },
        y: { grid: true, label: null, zero: true, nice: true, tickFormat: fmtTick },
        marks: [
          terraEnd
            ? Plot.rectX([{ x1: first, x2: terraEnd }], { x1: "x1", x2: "x2", fill: "currentColor", fillOpacity: 0.07 })
            : null,
          terraEnd
            ? Plot.text([{ x: first }], { x: "x", frameAnchor: "top-left", dx: 4, dy: 4, text: () => "Terra only", fill: "currentColor", fillOpacity: 0.7 })
            : null,
          viirs ? Plot.ruleX([viirs], { stroke: "currentColor", strokeOpacity: 0.5, strokeDasharray: "3,3" }) : null,
          viirs
            ? Plot.text([viirs], { x: (d) => d, frameAnchor: "top", dy: 4, dx: 4, textAnchor: "start", text: () => "VIIRS joins", fill: "currentColor", fillOpacity: 0.7 })
            : null,
          hasRange ? Plot.areaY(series, { x: "date", y1: "lo", y2: "hi", fill: "var(--series-1)", fillOpacity: 0.25, curve: "step-after" }) : null,
          Plot.lineY(series, { x: "date", y: "value", stroke: "var(--series-1)", strokeWidth: 1.5 }),
          small.length ? Plot.lineY(small, { x: "date", y: "small", stroke: "var(--series-2)", strokeWidth: 1.5 }) : null,
          Plot.ruleY([0]),
          Plot.tip(
            series,
            Plot.pointerX({ x: "date", y: "value", title: describe, fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" }),
          ),
          Plot.dot(series, Plot.pointerX({ x: "date", y: "value", r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 })),
        ],
      });
    },
    [series, small, hasRange, unit, harmonizedFrom, from, to],
  );

  const notes = [
    ...(hasRange ? ["Shading: harm_lo to harm_hi."] : []),
    ...(small.length ? ["Small fires: VIIRS fires below the common floor, shown separately from 2012 and not added into the main line."] : []),
    ...(harmonizedFrom && from < harmonizedFrom ? [`Before ${harmonizedFrom}: Terra only, not harmonized.`] : []),
  ];

  return (
    <ChartFrame
      title="Month by month"
      lede={mode === "raw" ? "As the satellites reported. Watch the jump in 2012 when VIIRS joins." : "Every month on one consistent scale. The 2012 jump of the raw record is gone."}
      exportName="series"
      notes={notes}
      table={() => ({
        columns: ["month", "value", "range_lo", "range_hi", "small_fires", "terra_only"],
        rows: series.map((p) => [
          p.ym, p.value,
          mode === "harmonized" ? p.lo : "", mode === "harmonized" ? p.hi : "",
          showSmall ? p.small : "",
          harmonizedFrom !== null && p.ym < harmonizedFrom,
        ]),
        notes: [`Main line: ${mainLabel}`, ...notes],
      })}
    >
      {status === "loading" || status === "idle" ? (
        <p className="cf-empty">Loading…</p>
      ) : series.length === 0 ? (
        <p className="cf-empty">No months in this date range.</p>
      ) : (
        <>
          <div ref={plotRef} className="cal-plot" />
          {(small.length > 0 || hasRange) && (
            <div className="series-key">
              <span><i style={{ background: "var(--series-1)" }} />{mainLabel}{hasRange ? " (shading: range)" : ""}</span>
              {small.length > 0 && <span><i style={{ background: "var(--series-2)" }} />Small fires, separate layer (from 2012)</span>}
            </div>
          )}
        </>
      )}
    </ChartFrame>
  );
}
