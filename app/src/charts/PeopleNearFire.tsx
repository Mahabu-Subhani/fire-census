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
import { areaPopulation, exposure, MIN_FIRE, populationIndex, stepAtViirs, VIIRS_YEAR, yearlyExposure, type YearExposure } from "./population";
import { usePlot } from "./usePlot";

export function fmtPeople(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("en-GB", { maximumFractionDigits: 1 })} million`;
  if (n >= 1e4) return `${Math.round(n / 1e3).toLocaleString("en-GB")} thousand`;
  return Math.round(n).toLocaleString("en-GB");
}

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
    ? `No square in this area had ${MIN_FIRE} or more ${unit} from ${range}.`
    : `About ${fmtPeople(now.people)} people live in the ${now.squares.toLocaleString("en-GB")} squares with ${MIN_FIRE} or more ${unit} from ${range}${inArea > 0 ? `: ${fmtShare(now.people / inArea)} of the ${fmtPeople(inArea)} people in this area` : ""}.`;
  const stepRaw = stepAtViirs(series, "raw");
  const stepHarm = stepAtViirs(series, "harmonized");
  const stepText = stepRaw !== null && stepHarm !== null
    ? `Average after ${VIIRS_YEAR} against before: raw ${signed(stepRaw)}, harmonized ${signed(stepHarm)}. ` +
      (Math.abs(stepHarm) < Math.abs(stepRaw) / 3
        ? "Most of the raw jump is the new satellite seeing more, not more people near fire."
        : "The harmonized record still changes a lot here; read the trend with care (see the checks in Data & methods).")
    : "";
  const caveat = `A square is about 11 km across; it counts when it had ${MIN_FIRE} or more fire detections in the period (or in the year, for the chart). ` +
    `The threshold was chosen after looking at the data, because counting every square with any fire jumps when VIIRS arrives. ` +
    `Population is the ${pop.population_year} map for every year. Living near fire is exposure, not a measure of harm or risk.`;

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
        <span><i style={{ background: "var(--bar-neutral)" }} />Raw (MODIS + VIIRS as detected)</span>
      </div>
      <details className="src-details">
        <summary>The same numbers as a table</summary>
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
