// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "When is the critical period, and has it moved?" One bar per year from the
// day the season started to the day it ended, a dot at its peak, and the trend
// of the peak. Every number comes from <region>/season.json (pipeline/stretch.py).
// Whole region only: the file is computed for the whole region.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import type { TrendRange } from "../data/types";
import { useSelection } from "../selection";
import { median } from "../stats";
import ChartFrame from "./ChartFrame";
import { usePlot } from "./usePlot";

const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Day of the year (non-leap) as "5 Nov". */
export function doyLabel(doy: number): string {
  const d = new Date(Date.UTC(2001, 0, Math.round(doy)));
  return `${d.getUTCDate()} ${SHORT[d.getUTCMonth()]}`;
}

/** "MM-DD" as "5 Nov". */
export function mdLabel(md: string): string {
  const [m, d] = md.split("-").map(Number);
  return `${d} ${SHORT[m - 1]}`;
}

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const rangeText = (t: TrendRange) => `${signed(t.days_per_decade)} days per decade (90% range ${signed(t.lo)} to ${signed(t.hi)})`;
/** A trend is clear when its whole range is on one side of zero. */
export const isClear = (t: TrendRange) => t.lo > 0 || t.hi < 0;

const SENSOR_COLOR: Record<string, string> = { "MODIS (Aqua)": "var(--bar-neutral)", "VIIRS, harmonized": "var(--series-2)" };

export default function SeasonTiming() {
  const { season, region } = useSelection();
  const years = useMemo(() => season?.years ?? [], [season]);

  const peakLine = useMemo(() => {
    if (!season || years.length < 2) return [];
    const slope = season.trend.peak.days_per_decade / 10;
    const intercept = median(years.map((y) => y.peak_doy - slope * y.year))!;
    return [years[0], years[years.length - 1]].map((y) => ({ year: y.year, doy: intercept + slope * y.year }));
  }, [season, years]);

  const plotRef = usePlot(
    (width) => {
      if (!season || years.length === 0) return null;
      const narrow = width < 480;
      const lo = Math.min(...years.map((y) => y.start_doy)) - 6;
      const hi = Math.max(...years.map((y) => y.end_doy)) + 6;
      const allYears = Array.from({ length: years[years.length - 1].year - years[0].year + 1 }, (_, i) => years[0].year + i);
      const tip = { fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" };
      return Plot.plot({
        width,
        height: allYears.length * (narrow ? 13 : 15) + 44,
        marginLeft: 44,
        marginRight: narrow ? 10 : 18,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { domain: [lo, hi], label: null, grid: true, ticks: MONTH_STARTS.filter((d) => d >= lo && d <= hi), tickFormat: (d: number) => doyLabel(d) },
        y: { domain: allYears, label: null, tickFormat: (y: number) => (narrow && y % 2 ? "" : String(y)), padding: 0.25 },
        marks: [
          season.law_2009 ? Plot.ruleY([2009], { stroke: "var(--muted)", strokeDasharray: "3,3" }) : null,
          season.law_2009
            ? Plot.text([2009], { y: (d: number) => d, x: () => hi, text: () => "2009: groundwater laws", textAnchor: "end", dy: -9, fill: "var(--muted)", fontSize: 10 })
            : null,
          Plot.barX(years, {
            y: "year", x1: "start_doy", x2: "end_doy", rx: 3,
            fill: (d) => SENSOR_COLOR[d.sensor] ?? "var(--series-2)",
            title: (d) => `${d.year}: ${mdLabel(d.start)} to ${mdLabel(d.end)} (${d.length_days} days), peak ${mdLabel(d.peak)}\n${d.sensor}`,
            tip,
          }),
          peakLine.length ? Plot.line(peakLine, { x: "doy", y: "year", stroke: "var(--text)", strokeWidth: 1.5, strokeDasharray: isClear(season.trend.peak) ? undefined : "5,4" }) : null,
          Plot.dot(years, { y: "year", x: "peak_doy", r: 3.5, fill: "var(--text)", stroke: "var(--surface)", strokeWidth: 1.5 }),
        ],
      });
    },
    [season, years, peakLine],
  );

  if (!season || years.length === 0 || !region) return null;
  const last = years[years.length - 1];
  const peak = season.trend.peak;
  const sentence = isClear(peak)
    ? `The peak of the season now comes ${Math.abs(peak.days_per_decade).toFixed(1)} days ${peak.days_per_decade > 0 ? "later" : "earlier"} each decade.`
    : "The peak of the season has not clearly moved.";
  const latest = `In ${last.year} the season ran from ${mdLabel(last.start)} to ${mdLabel(last.end)} (${last.length_days} days) and peaked on ${mdLabel(last.peak)}.`;
  const law = season.law_2009
    ? `Before the 2009 groundwater laws the peak fell on ${doyLabel(season.law_2009.mean_peak_before)} on average; after them on ${doyLabel(season.law_2009.mean_peak_after)}: ${season.law_2009.shift_days.toFixed(1)} days later (p = ${season.law_2009.p_one_sided < 0.001 ? "below 0.001" : season.law_2009.p_one_sided.toFixed(3)}). ${season.law_2009.note}.`
    : "";
  const detail = `Season: ${season.window}. Peak ${rangeText(peak)}; start ${rangeText(season.trend.start)}; end ${rangeText(season.trend.end)}; length ${rangeText(season.trend.length)}. ${season.method ?? ""}`;
  const sensors = [...new Set(years.map((y) => y.sensor))];

  return (
    <ChartFrame
      title="When is the critical period, and has it moved?"
      lede="Each bar is one year's season, from the day it started to the day it ended. The dot is its peak; the line is the trend of the peak."
      mode="harmonized"
      exportName="season"
      notes={[sentence, latest, law, detail].filter(Boolean)}
      table={() => ({
        columns: ["year", "start", "peak", "end", "start_day_of_year", "peak_day_of_year", "end_day_of_year", "length_days", "total", "sensor"],
        rows: years.map((y) => [y.year, y.start, y.peak, y.end, y.start_doy, y.peak_doy, y.end_doy, y.length_days, y.total, y.sensor]),
        notes: [sentence, law, detail].filter(Boolean),
      })}
    >
      <p className="status-sentence" style={{ fontSize: "1rem" }}>{sentence} {latest}</p>
      <div ref={plotRef} className="cal-plot" />
      <div className="series-key">
        {sensors.map((s) => (
          <span key={s}><i style={{ background: SENSOR_COLOR[s] ?? "var(--series-2)", height: 8 }} />{s}</span>
        ))}
        <span><i style={{ background: "var(--text)" }} />Peak and its trend{isClear(peak) ? "" : " (dashed: not clear)"}</span>
      </div>
      {law && <p className="status-detail">{law}</p>}
      <p className="status-detail">{detail} Whole region, whatever area is drawn.</p>
    </ChartFrame>
  );
}
