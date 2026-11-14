// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "Who lives near the fires?" People (WorldPop 2020) in the 0.1 degree squares
// that had fire in the area and dates shown, and the same count per year in
// both records. Every number comes from <region>/population.json and the cube;
// the rule is in ./population.ts (decision 48). Exposure means living in a
// square with fire, not harm or risk.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import { useSelection, useSelectionActions } from "../selection";
import { fmtShare } from "../stats";
import ChartFrame, { formatMonth } from "./ChartFrame";
import { areaPopulation, exposure, fmtPeople, MIN_FIRE, populationIndex, stepAtViirs, VIIRS_YEAR, yearlyExposure, type YearExposure } from "./population";
import { usePlot } from "./usePlot";

export { fmtPeople } from "./population";

const signed = (s: number) => `${s >= 0 ? "+" : "−"}${fmtShare(Math.abs(s))}`;

interface Point {
  year: number;
  record: string;
  people: number;
}

export default function PeopleNearFire() {
  const { population: pop, region, rows, areaRows, mode, from, to, dataThrough } = useSelection();
  const { polygon } = useSelectionActions();
  const index = useMemo(() => (pop ? populationIndex(pop) : null), [pop]);
  const now = useMemo(() => (index ? exposure(rows, mode, index) : null), [rows, mode, index]);
  const inArea = useMemo(() => (pop ? areaPopulation(pop, polygon) : 0), [pop, polygon]);
  const series = useMemo<YearExposure[]>(
    () => (index && region ? yearlyExposure(areaRows, index, region.harmonized_from, dataThrough) : []),
    [areaRows, index, region, dataThrough],
  );
  const points = useMemo<Point[]>(
    () => series.flatMap((y) => [
      { year: y.year, record: "Raw", people: y.raw },
      { year: y.year, record: "Harmonized", people: y.harmonized },
    ]),
    [series],
  );

  const plotRef = usePlot(
    (width) => {
      if (points.length === 0) return null;
      const narrow = width < 480;
      const tip = (d: Point) => `${d.year} · ${d.record}\n${fmtPeople(d.people)} people`;
      return Plot.plot({
        width,
        height: narrow ? 220 : 260,
        marginLeft: 52,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { label: null, tickFormat: (y: number) => String(y), ticks: narrow ? 5 : 10 },
        y: { label: null, grid: true, zero: true, tickFormat: (v: number) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : String(v)) },
        color: { domain: ["Harmonized", "Raw"], range: ["var(--series-1)", "var(--bar-neutral)"] },
        marks: [
          Plot.ruleX([VIIRS_YEAR - 0.5], { stroke: "var(--border)", strokeDasharray: "3,3" }),
          Plot.text([VIIRS_YEAR - 0.5], { x: (d: number) => d, frameAnchor: "top", dy: 2, dx: 4, textAnchor: "start", text: () => "VIIRS starts", fill: "var(--muted)" }),
          Plot.lineY(points.filter((d) => d.record === "Raw"), { x: "year", y: "people", stroke: "var(--bar-neutral)", strokeWidth: 1.5, strokeDasharray: "4,3" }),
          Plot.lineY(points.filter((d) => d.record === "Harmonized"), { x: "year", y: "people", stroke: "var(--series-1)", strokeWidth: 2 }),
          Plot.dot(points, { x: "year", y: "people", fill: "record", r: 2.5 }),
          Plot.tip(points, Plot.pointer({ x: "year", y: "people", title: tip, fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" })),
        ],
      });
    },
    [points],
  );

  if (!pop || !region || !now) return null;
  const range = from && to ? `${formatMonth(from)} to ${formatMonth(to)}` : "the period shown";
  const unit = mode === "raw" ? "hotspot detections" : "fire detections (MODIS-equivalent)";
  const sentence = now.squares === 0
    ? `No square with ${MIN_FIRE} or more ${unit}, ${range}.`
    : `${fmtPeople(now.people)} people in ${now.squares.toLocaleString("en-GB")} squares with ${MIN_FIRE} or more ${unit}, ${range}${inArea > 0 ? ` (${fmtShare(now.people / inArea)} of ${fmtPeople(inArea)})` : ""}.`;
  const stepRaw = stepAtViirs(series, "raw");
  const stepHarm = stepAtViirs(series, "harmonized");
  const stepText = stepRaw !== null && stepHarm !== null
    ? `Mean from ${VIIRS_YEAR} against earlier years: raw ${signed(stepRaw)}, harmonized ${signed(stepHarm)}. ` +
      (Math.abs(stepHarm) < Math.abs(stepRaw) / 3
        ? "The raw increase reflects the sensor change."
        : "The harmonized record also changes; interpret with care.")
    : "";
  const caveat = `Square: 0.1° (about 11 km), counted at ${MIN_FIRE} or more fire detections in the period (per year in the chart); threshold set after data review. ` +
    `Population: ${pop.population_year} map for all years. Exposure, not harm or risk.`;

  return (
    <ChartFrame
      title="Population near fires"
      exportName="people-near-fire"
      notes={[sentence, stepText, caveat, pop.source]}
      table={() => ({
        columns: ["year", "people_raw", "people_harmonized", "min_detections"],
        rows: series.map((y) => [y.year, y.raw, y.harmonized, MIN_FIRE]),
        notes: [caveat, pop.method, pop.source],
      })}
    >
      <p className="status-sentence" style={{ fontSize: "1rem" }}>{sentence}</p>
      {stepText && <p className="status-detail">{stepText}</p>}
      <div ref={plotRef} className="cal-plot" />
      <div className="series-key">
        <span><i style={{ background: "var(--series-1)" }} />Harmonized</span>
        <span><i style={{ background: "var(--bar-neutral)" }} />Raw</span>
      </div>
      <details className="src-details">
        <summary>Table</summary>
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead><tr><th>Year</th><th>Raw</th><th>Harmonized</th></tr></thead>
            <tbody>
              {series.map((y) => (
                <tr key={y.year}><td>{y.year}</td><td>{y.raw.toLocaleString("en-GB")}</td><td>{y.harmonized.toLocaleString("en-GB")}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="status-detail">{caveat} {pop.source}.</p>
    </ChartFrame>
  );
}
