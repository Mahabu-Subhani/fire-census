// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "What is burning: crops or wild land?" The challenge separates wildfires in
// natural vegetation from agricultural burns; this splits the record by the
// land each fire cell burned on (ESA WorldCover 2021). Every number comes from
// <region>/landcover.json (app/scripts/make_landcover.py). Whole region only.
// Colours: three categorical hues validated with the dataviz palette checker
// in both themes (all pairs pass); "Other" is the neutral bar colour. Light
// mode needs relief for contrast, so the shares are also printed in a table.
import * as Plot from "@observablehq/plot";
import { useMemo, useState } from "react";
import type { LandCover as LandCoverFile } from "../data/types";
import { useSelection } from "../selection";
import { fmtShare, MONTH_NAMES } from "../stats";
import ChartFrame from "./ChartFrame";
import { usePlot } from "./usePlot";

export const GROUP_COLOR: Record<string, string> = {
  cropland: "var(--lc-crop)",
  forest: "var(--lc-forest)",
  grass_shrub: "var(--lc-grass)",
  other: "var(--bar-neutral)",
};

type By = "month" | "year";
type Layer = "harmonized" | "small";

export interface LcRow {
  x: number;
  group: string;
  name: string;
  n: number;
  share: number;
}

/** One row per bar segment: count and share of that bar. Bars with no fire cells are left out. */
export function landCoverRows(lc: LandCoverFile, by: By, layer: Layer): LcRow[] {
  const src = by === "month" ? lc.months.map((m) => ({ x: m.month, v: m[layer] })) : lc.years.map((y) => ({ x: y.year, v: y[layer] }));
  return src.flatMap(({ x, v }) => {
    const total = lc.groups.reduce((s, g) => s + (v[g.id] ?? 0), 0);
    if (total === 0) return [];
    return lc.groups.map((g) => ({ x, group: g.id, name: g.name, n: v[g.id] ?? 0, share: (v[g.id] ?? 0) / total }));
  });
}

/** Share of each group over all bars together. */
export function totals(rows: LcRow[], groups: { id: string }[]): Record<string, number> {
  const sum = rows.reduce((s, r) => s + r.n, 0);
  return Object.fromEntries(groups.map((g) => [g.id, sum ? rows.filter((r) => r.group === g.id).reduce((s, r) => s + r.n, 0) / sum : 0]));
}

const whole = (n: number) => n.toLocaleString("en-GB");

export default function LandCover() {
  const { landcover: lc, region } = useSelection();
  const [by, setBy] = useState<By>("month");
  const [layer, setLayer] = useState<Layer>("harmonized");
  const rows = useMemo(() => (lc ? landCoverRows(lc, by, layer) : []), [lc, by, layer]);
  const monthRows = useMemo(() => (lc ? landCoverRows(lc, "month", "harmonized") : []), [lc]);
  const xLabel = (x: number) => (by === "month" ? MONTH_NAMES[x - 1].slice(0, 3) : String(x));

  const plotRef = usePlot(
    (width) => {
      if (!lc || rows.length === 0) return null;
      const narrow = width < 480;
      const xs = [...new Set(rows.map((r) => r.x))];
      return Plot.plot({
        width,
        height: narrow ? 220 : 260,
        marginLeft: 44,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { domain: xs, label: null, tickFormat: (x: number) => (by === "year" && narrow && x % 5 ? "" : by === "year" && !narrow && x % 2 ? "" : xLabel(x)), padding: 0.15 },
        y: { label: null, domain: [0, 1], tickFormat: (v: number) => `${Math.round(v * 100)}%`, grid: true },
        marks: [
          Plot.barY(rows, {
            x: "x", y: "share", fill: (d: LcRow) => GROUP_COLOR[d.group], order: lc.groups.map((g) => g.id), z: "group",
            stroke: "var(--surface)", strokeWidth: 1, inset: 0.5,
            title: (d: LcRow) => `${xLabel(d.x)} · ${d.name}\n${fmtShare(d.share)} (${whole(d.n)} fire cells)`,
            tip: { fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" },
          }),
        ],
      });
    },
    [lc, rows, by],
  );

  if (!lc || !region || monthRows.length === 0) return null;
  const share = totals(monthRows, lc.groups);
  const ranked = lc.groups.filter((g) => g.id !== "other").sort((a, b) => share[b.id] - share[a.id]);
  const lead = ranked.filter((g) => share[g.id] >= 0.05);
  const parts = lead.map((g) => `${fmtShare(share[g.id])} on ${g.name.toLowerCase()}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0] ?? "";
  const since = `${MONTH_NAMES[Number(region.harmonized_from.slice(5)) - 1]} ${region.harmonized_from.slice(0, 4)}`;
  const sentence = `Since ${since}, fire activity here was ${list}.`;
  // The month each main group burns most, from the fire-cell counts.
  const peaks = lead
    .map((g) => {
      const best = monthRows.filter((r) => r.group === g.id).reduce((a, b) => (b.n > a.n ? b : a));
      return `${g.name.toLowerCase()} fires peak in ${MONTH_NAMES[best.x - 1]}`;
    })
    .join("; ");
  const smallRows = landCoverRows(lc, "month", "small");
  const smallShare = smallRows.length ? totals(smallRows, lc.groups) : null;
  const smallTop = smallShare ? [...lc.groups].sort((a, b) => smallShare[b.id] - smallShare[a.id])[0] : null;
  const smallText = smallShare && smallTop
    ? `The small fires only VIIRS sees (from 2012) were mostly on ${smallTop.name.toLowerCase()}: ${fmtShare(smallShare[smallTop.id])}.`
    : "";
  const xs = [...new Set(rows.map((r) => r.x))];

  return (
    <ChartFrame
      title="What is burning: crops or wild land?"
      lede="Each bar splits the fire activity of a month (or year) by the land it burned on."
      mode="harmonized"
      exportName="landcover"
      notes={[sentence, peaks ? `${peaks[0].toUpperCase()}${peaks.slice(1)}.` : "", smallText, lc.method, lc.source]}
      table={() => ({
        columns: ["by", by, "layer", "group", "fire_cells", "share"],
        rows: rows.map((r) => [by, r.x, layer, r.name, r.n, r.share]),
        notes: [lc.method, lc.source],
      })}
    >
      <p className="status-sentence" style={{ fontSize: "1rem" }}>{sentence}</p>
      {peaks && <p className="status-detail">{`${peaks[0].toUpperCase()}${peaks.slice(1)}.`} {smallText}</p>}
      <div className="chart-controls">
        <div className="seg" role="group" aria-label="Split by">
          <button type="button" aria-pressed={by === "month"} onClick={() => setBy("month")}>By month</button>
          <button type="button" aria-pressed={by === "year"} onClick={() => setBy("year")}>By year</button>
        </div>
        <div className="seg" role="group" aria-label="Which fires">
          <button type="button" aria-pressed={layer === "harmonized"} onClick={() => setLayer("harmonized")}>Fires MODIS would see</button>
          <button type="button" aria-pressed={layer === "small"} onClick={() => setLayer("small")}>Small fires (VIIRS)</button>
        </div>
      </div>
      <div ref={plotRef} className="cal-plot" />
      <div className="series-key">
        {lc.groups.map((g) => (
          <span key={g.id}><i style={{ background: GROUP_COLOR[g.id], height: 10 }} />{g.name}</span>
        ))}
      </div>
      <details className="src-details">
        <summary>The same numbers as a table</summary>
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead>
              <tr><th>{by === "month" ? "Month" : "Year"}</th>{lc.groups.map((g) => <th key={g.id}>{g.name}</th>)}</tr>
            </thead>
            <tbody>
              {xs.map((x) => (
                <tr key={x}>
                  <td>{xLabel(x)}</td>
                  {lc.groups.map((g) => {
                    const r = rows.find((q) => q.x === x && q.group === g.id);
                    return <td key={g.id}>{r ? `${fmtShare(r.share)} (${whole(r.n)})` : ""}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="status-detail">{lc.method} {lc.source}. Whole region, whatever area is drawn.</p>
    </ChartFrame>
  );
}
