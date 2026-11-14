// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "What usually comes next?" (docs/APP_VISION.md, Q3; critical period ahead):
// for the three months after dataThrough, the typical value (median) and a bad
// year (90th percentile) from the harmonized history, each month's share of a
// typical year, and when the peak usually comes. History, not a forecast.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import { useSelection } from "../selection";
import { MONTH_NAMES, outlook, unitLabel } from "../stats";
import ChartFrame from "./ChartFrame";
import { MONTH_FULL } from "./UnusualBanner";
import { usePlot } from "./usePlot";

const num = (v: number) => v.toLocaleString("en", { maximumFractionDigits: v < 10 ? 1 : 0 });

export default function OutlookStrip() {
  const { status, areaRows, region, dataThrough, meta } = useSelection();
  const unit = unitLabel(meta, "harmonized");
  const o = useMemo(
    () => (region ? outlook(areaRows, region.harmonized_from, dataThrough) : null),
    [areaRows, region, dataThrough],
  );
  const data = useMemo(() => (o ? o.months.map((m) => ({ ...m, label: `${MONTH_NAMES[m.month - 1]} ${m.year}` })) : []), [o]);

  const plotRef = usePlot(
    (width) => {
      if (data.length === 0 || data.every((d) => d.p90 === 0)) return null;
      const narrow = width < 480;
      return Plot.plot({
        width,
        height: narrow ? 180 : 200,
        marginLeft: 48,
        marginTop: 20,
        style: { fontSize: narrow ? "9px" : "10px" },
        x: { domain: data.map((d) => d.label), label: null, tickSize: 0, padding: 0.35 },
        y: { grid: true, label: null, zero: true, nice: true, tickFormat: (v: number) => v.toLocaleString("en", { notation: "compact" }) },
        marks: [
          Plot.barY(data, {
            x: "label", y: "median", fill: "var(--series-1)",
            title: (d) => `${d.label}, history\nTypical (median): ${num(d.median)}\nBad year (90th percentile): ${num(d.p90)}\n${Math.round(d.share * 100)}% of a typical year's activity\n${unit}`,
            tip: { fontSize: 12, fill: "var(--surface)", stroke: "var(--border)" },
          }),
          Plot.tickY(data, { x: "label", y: "p90", stroke: "currentColor", strokeWidth: 2, strokeDasharray: "4,3" }),
          Plot.text(data, { x: "label", y: "p90", text: (d) => `bad year ${num(d.p90)}`, dy: -7, fill: "currentColor" }),
          Plot.text(data, { x: "label", y: "median", text: (d) => `typical ${num(d.median)}`, dy: -7, fill: "currentColor", filter: (d) => d.p90 - d.median > 0 }),
          Plot.ruleY([0]),
        ],
      });
    },
    [data, unit],
  );

  const coming = data.reduce((a, d) => a + d.share, 0);
  const span = o ? `${o.firstYear} to ${o.lastYear}` : "";
  const peak = o?.peak ? `${MONTH_FULL[o.peak.month - 1]} is usually the busiest month (in ${o.peak.years} of ${o.peak.of} years).` : "";
  const sentence = data.length
    ? `In past years, ${data.map((d) => MONTH_NAMES[d.month - 1]).join(" to ")} held ${Math.round(coming * 100)}% of a typical year's activity. ${peak}`
    : "";
  const notes = [`History, not a forecast: what happened in these months in ${span} (harmonized, complete years).`, sentence].filter(Boolean);

  return (
    <ChartFrame
      title="What usually comes next"
      mode="harmonized"
      exportName="outlook"
      notes={notes}
      table={() => ({
        columns: ["month", "year", "typical_median", "bad_year_p90", "share_of_typical_year"],
        rows: data.map((d) => [d.month, d.year, d.median, d.p90, d.share]),
        notes,
      })}
    >
      {status === "loading" || status === "idle" ? (
        <p className="cf-empty">Loading…</p>
      ) : !o || data.length === 0 ? (
        <p className="cf-empty">Not enough history in this area.</p>
      ) : (
        <>
          <p className="status-detail"><strong>History, not a forecast.</strong> Each bar is the typical amount for that month in {span}; the dashed mark is a bad year (the 90th percentile).</p>
          <div ref={plotRef} className="cal-plot" />
          {data.every((d) => d.p90 === 0) && <p className="cf-empty">These months had no activity here in past years.</p>}
          <p className="status-detail">{sentence}</p>
        </>
      )}
    </ChartFrame>
  );
}
