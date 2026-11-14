// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "Population near fires". People (WorldPop 2020) per burning level, for the
// area and dates shown, and year by year in the record the switch shows.
// Every number comes from <region>/population.json and the cube; the rules are
// in ./population.ts (decisions 48 and 52). Exposure means living in a square
// where it burns, not harm or risk.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import { useSelection, useSelectionActions } from "../selection";
import { fmtShare, monthsBetween } from "../stats";
import { EMBER, useTheme } from "../theme";
import ChartFrame, { formatMonth } from "./ChartFrame";
import { areaPopulation, fmtPeople, LEVELS, peopleByLevel, populationIndex, shiftAtViirs, VIIRS_YEAR, yearlyLevels, type ByLevel, type Level } from "./population";
import { usePlot } from "./usePlot";

// Shared with the map's exposure layer, which must not load the chart library.
export { fmtPeople };

const RANGE: Record<Exclude<Level, "none">, string> = { heavy: "50 or more", moderate: "10 to 49", light: "1 to 9" };
const ADVERB: Record<Exclude<Level, "none">, "heavily" | "moderately or heavily" | "lightly or more"> = { heavy: "heavily", moderate: "moderately or heavily", light: "lightly or more" };
/** The headline counts a level and every level above it. */
const OR_MORE: Record<Exclude<Level, "none">, string> = { heavy: "50 or more", moderate: "10 or more", light: "1 or more" };

interface Bar {
  year: number;
  level: string;
  people: number;
}

export default function PeopleNearFire() {
  const { population: pop, region, rows, areaRows, mode, from, to, dataThrough } = useSelection();
  const { polygon } = useSelectionActions();
  const { theme } = useTheme();
  // Ember ramp, as on the map: more fire is brighter (dark theme) or darker (light theme).
  const ramp = EMBER[theme];
  const colour: Record<Level, string> = { heavy: ramp[5], moderate: ramp[3], light: ramp[1], none: "var(--surface-2)" };

  const index = useMemo(() => (pop ? populationIndex(pop) : null), [pop]);
  const people = useMemo(() => (pop ? areaPopulation(pop, polygon) : 0), [pop, polygon]);
  const years = from && to ? monthsBetween(from, to).length / 12 : 1;
  const now = useMemo<ByLevel | null>(() => (index ? peopleByLevel(rows, mode, index, people, years) : null), [rows, mode, index, people, years]);
  const series = useMemo(
    () => (index && region ? yearlyLevels(areaRows, index, people, region.harmonized_from, dataThrough) : []),
    [areaRows, index, people, region, dataThrough],
  );
  const shift = useMemo(() => shiftAtViirs(series, people), [series, people]);
  const bars = useMemo<Bar[]>(
    () => series.flatMap((y) => LEVELS.map((l) => ({ year: y.year, level: l.name, people: y[mode][l.id] }))),
    [series, mode],
  );

  const plotRef = usePlot(
    (width) => {
      if (bars.length === 0) return null;
      const narrow = width < 480;
      return Plot.plot({
        width,
        height: narrow ? 200 : 230,
        marginLeft: 44,
        style: { fontSize: narrow ? "10px" : "11.5px", fontFamily: "var(--font-sans)" },
        x: { label: null, tickFormat: (y: number) => (y % 5 === 0 ? String(y) : ""), padding: 0.12 },
        y: { label: null, grid: true, tickFormat: (v: number) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : String(v)) },
        color: { domain: LEVELS.map((l) => l.name), range: LEVELS.map((l) => colour[l.id]) },
        marks: [
          Plot.barY(bars, {
            x: "year", y: "people", fill: "level", order: LEVELS.map((l) => l.name),
            title: (d: Bar) => `${d.year} · ${d.level} burning\n${fmtPeople(d.people)} people`,
            tip: { fontSize: 13, fill: "var(--surface-2)", stroke: "var(--border)" },
          }),
          Plot.ruleX([VIIRS_YEAR], { stroke: "var(--muted)", strokeDasharray: "3,3", dx: -6 }),
          Plot.text([VIIRS_YEAR], { x: (d: number) => d, frameAnchor: "top", dx: -2, textAnchor: "start", text: () => "VIIRS starts", fill: "var(--muted)" }),
        ],
      });
    },
    [bars, theme],
  );

  if (!pop || !region || !now) return null;
  // Headline: the most intense level that, with the levels above it, covers a quarter of the people;
  // failing that, everyone with any burning (if at least 1 % of people).
  const upTo = (i: number) => LEVELS.slice(0, i + 1).reduce((s, l) => s + now[l.id], 0);
  const quarter = LEVELS.findIndex((_l, i) => upTo(i) >= 0.25 * people);
  const topIndex = quarter >= 0 ? quarter : upTo(LEVELS.length - 1) >= 0.01 * people ? LEVELS.length - 1 : -1;
  const top = topIndex >= 0 ? LEVELS[topIndex] : null;
  const topPeople = topIndex >= 0 ? upTo(topIndex) : 0;
  const period = from && to ? `${formatMonth(from)} to ${formatMonth(to)}` : "the period shown";
  const perYear = years >= 1 ? "a year" : "in the period";
  const headline = top
    ? top.id === "light"
      ? `${fmtPeople(topPeople)} people live where there is some burning every year`
      : `${fmtPeople(topPeople)} people live where it burns ${ADVERB[top.id]}`
    : "Almost nobody here lives where it burns";
  const sub = top
    ? `${fmtShare(people > 0 ? topPeople / people : 0)} of the ${fmtPeople(people)} people in this area: ${OR_MORE[top.id]} fire detections ${perYear} within about 11 km, ${years >= 1 ? "on average, " : ""}${period}${mode === "raw" ? ", raw counts" : ""}.`
    : `Fewer than 1 % of the ${fmtPeople(people)} people in this area live where there is even one fire detection ${perYear}, ${period}.`;

  const lvlName = shift ? LEVELS.find((l) => l.id === shift.level)!.name.toLowerCase() : "";
  const shiftText = shift
    ? `Raw satellite counts make it look as if the people living with ${lvlName} burning${shift.level === "heavy" ? "" : " or more"} went from ${fmtPeople(shift.before.raw)} a year before ${VIIRS_YEAR} to ${fmtPeople(shift.after.raw)} after, when the newer satellite arrived. ` +
      `The harmonized record: ${fmtPeople(shift.before.harmonized)} to ${fmtPeople(shift.after.harmonized)}.`
    : "";
  const harmChange = shift && shift.before.harmonized > 0 ? shift.after.harmonized / shift.before.harmonized - 1 : 0;
  const warn = shift && Math.abs(harmChange) > 0.5
    ? "Here the harmonized record also changes a lot across 2012, so read the trend with care (see the checks under Data)."
    : "";
  const method = "Each square is about 11 km across. Burning level = fire detections per year in the square: light 1 to 9, moderate 10 to 49, heavy 50 or more " +
    "(MODIS-equivalent in Harmonized; as reported in Raw). These cut-offs were chosen after looking at the data. " +
    `Population is the ${pop.population_year} map for every year, so changes show where fires burned, not population change. ` +
    "Living where it burns is exposure, not a measure of harm or risk.";
  const segments = [...LEVELS.map((l) => ({ id: l.id as Level, name: l.name, range: `${RANGE[l.id]} ${perYear}` })), { id: "none" as Level, name: "Little or none", range: `under 1 ${perYear}` }];

  return (
    <ChartFrame
      title="Population near fires"
      exportName="people-near-fire"
      notes={[`${headline}. ${sub}`, shiftText, method, pop.source]}
      table={() => ({
        columns: ["year", ...LEVELS.flatMap((l) => [`raw_${l.id}`, `harmonized_${l.id}`])],
        rows: series.map((y) => [y.year, ...LEVELS.flatMap((l) => [y.raw[l.id], y.harmonized[l.id]])]),
        notes: [method, pop.method, pop.source],
      })}
    >
      <p className="pnf-headline">{headline}</p>
      <p className="status-detail">{sub}</p>

      <div className="pnf-bar" role="img" aria-label={segments.map((s) => `${s.name}: ${fmtPeople(now[s.id])}`).join("; ")}>
        {segments.map((s) => {
          const share = people > 0 ? now[s.id] / people : 0;
          return share > 0 ? <span key={s.id} style={{ width: `${share * 100}%`, background: colour[s.id] }} title={`${s.name}: ${fmtPeople(now[s.id])}`} /> : null;
        })}
      </div>
      <ul className="pnf-key">
        {segments.map((s) => (
          <li key={s.id}>
            <i style={{ background: colour[s.id] }} />
            <span className="pnf-name">{s.name}</span>
            <span className="pnf-range">{s.range}</span>
            <span className="pnf-num">{fmtPeople(now[s.id])}</span>
            <span className="pnf-share">{fmtShare(people > 0 ? now[s.id] / people : 0)}</span>
          </li>
        ))}
      </ul>

      {series.length > 0 && (
        <>
          <p className="pnf-sub">People by burning level, each year · {mode === "raw" ? "Raw" : "Harmonized"} <span>(switch at the top)</span></p>
          <div ref={plotRef} className="cal-plot" />
        </>
      )}
      {shiftText && <p className="status-detail">{shiftText} {warn}</p>}

      <details className="src-details">
        <summary>How this is worked out</summary>
        <p className="status-detail">{method} {pop.source}.</p>
      </details>
      <details className="src-details">
        <summary>The same numbers as a table</summary>
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead>
              <tr><th>Year</th>{LEVELS.map((l) => <th key={l.id}>{l.name}</th>)}</tr>
            </thead>
            <tbody>
              {series.map((y) => (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  {LEVELS.map((l) => <td key={l.id}>{y[mode][l.id].toLocaleString("en-GB")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </ChartFrame>
  );
}
