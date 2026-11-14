// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// People living where it burns: WorldPop 2020 people per 0.1 degree square
// (<region>/population.json) joined to the fire record's squares. Pure
// functions, so the numbers can be tested without the page.
//
// Each square gets a burning level from its fire detections per year
// (MODIS-equivalent in Harmonized, detections as reported in Raw): light 1 to
// 9, moderate 10 to 49, heavy 50 or more. Levels, not "any fire": over many
// years nearly every square in a farming area has some fire, so a yes/no
// count says 100 % everywhere. The cut-offs were chosen after looking at the
// data (decision 52). In the harmonized record the people per level do not
// jump when VIIRS arrives in 2012; in the raw record they do.
import { pointInPolygon } from "../data/select";
import type { CubeRow, Mode, Polygon, Population } from "../data/types";
import { value } from "../stats";

export type Level = "none" | "light" | "moderate" | "heavy";
/** Lowest detections per year (per ~11 km square) for each level, most burning first. */
export const LEVELS: { id: Exclude<Level, "none">; name: string; min: number }[] = [
  { id: "heavy", name: "Heavy", min: 50 },
  { id: "moderate", name: "Moderate", min: 10 },
  { id: "light", name: "Light", min: 1 },
];
/** First year with VIIRS: where a raw record jumps. */
export const VIIRS_YEAR = 2012;

export function levelOf(perYear: number): Level {
  for (const l of LEVELS) if (perYear >= l.min) return l.id;
  return "none";
}

/** "61.2 million", "540 thousand", "8,412". */
export function fmtPeople(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("en-GB", { maximumFractionDigits: 1 })} million`;
  if (n >= 1e4) return `${Math.round(n / 1e3).toLocaleString("en-GB")} thousand`;
  return Math.round(n).toLocaleString("en-GB");
}

const key = (lon: number, lat: number) => `${lon.toFixed(2)},${lat.toFixed(2)}`;

/** Square centre -> people. */
export function populationIndex(pop: Population): Map<string, number> {
  return new Map(pop.squares.map(([lon, lat, n]) => [key(lon, lat), n]));
}

/** People in the area: squares whose centre is inside the drawn shape, or the whole region. */
export function areaPopulation(pop: Population, polygon: Polygon | null): number {
  if (!polygon) return pop.region_population;
  return pop.squares.reduce((s, [lon, lat, n]) => (pointInPolygon(lon, lat, polygon) ? s + n : s), 0);
}

export type ByLevel = Record<Level, number>;
const zero = (): ByLevel => ({ none: 0, light: 0, moderate: 0, heavy: 0 });

/**
 * People per burning level over these rows (already limited to area and
 * dates). `years` is the length of the period: detections are divided by it
 * to get a yearly rate; for a period under a year the count is used as it is.
 * People in squares with no fire are "none", from the area total.
 */
export function peopleByLevel(rows: CubeRow[], mode: Mode, index: Map<string, number>, areaPeople: number, years: number): ByLevel {
  const sums = new Map<string, number>();
  for (const r of rows) {
    const k = key(r.lon, r.lat);
    sums.set(k, (sums.get(k) ?? 0) + value(r, mode));
  }
  const out = zero();
  const div = Math.max(1, years);
  let counted = 0;
  for (const [k, v] of sums) {
    const n = index.get(k) ?? 0;
    const lvl = levelOf(v / div);
    if (lvl !== "none") {
      out[lvl] += n;
      counted += n;
    }
  }
  out.none = Math.max(0, areaPeople - counted);
  return out;
}

export interface YearLevels {
  year: number;
  raw: ByLevel;
  harmonized: ByLevel;
}

/**
 * People per level for each whole year from the first full harmonized year,
 * in both records. The year still running (data_through before 31 December)
 * is left out, so it does not look like a drop.
 */
export function yearlyLevels(areaRows: CubeRow[], index: Map<string, number>, areaPeople: number, harmonizedFrom: string, dataThrough: string | null): YearLevels[] {
  const first = Number(harmonizedFrom.slice(0, 4)) + (harmonizedFrom.slice(5) === "01" ? 0 : 1);
  let last = -Infinity;
  for (const r of areaRows) last = Math.max(last, Number(r.ym.slice(0, 4)));
  if (dataThrough && dataThrough.slice(5, 10) !== "12-31") last = Math.min(last, Number(dataThrough.slice(0, 4)) - 1);
  const byYear = new Map<number, CubeRow[]>();
  for (const r of areaRows) {
    const y = Number(r.ym.slice(0, 4));
    if (y < first || y > last) continue;
    const list = byYear.get(y);
    if (list) list.push(r);
    else byYear.set(y, [r]);
  }
  const out: YearLevels[] = [];
  for (let y = first; y <= last; y++) {
    const rows = byYear.get(y) ?? [];
    out.push({ year: y, raw: peopleByLevel(rows, "raw", index, areaPeople, 1), harmonized: peopleByLevel(rows, "harmonized", index, areaPeople, 1) });
  }
  return out;
}

/** People at `level` or above. */
export function atLeast(b: ByLevel, level: Exclude<Level, "none">): number {
  const i = LEVELS.findIndex((l) => l.id === level);
  return LEVELS.slice(0, i + 1).reduce((s, l) => s + b[l.id], 0);
}

export interface Shift {
  level: Exclude<Level, "none">;
  before: { raw: number; harmonized: number };
  after: { raw: number; harmonized: number };
}

/**
 * Mean people at a level or above, before VIIRS (to 2011) and after (2012 on),
 * in both records. The level is the highest one that at least 1 % of the
 * area's people live with in the harmonized record before 2012, so the
 * sentence talks about burning people here actually live with. Null without
 * three years on each side or with nobody near fire.
 */
export function shiftAtViirs(series: YearLevels[], areaPeople: number): Shift | null {
  const before = series.filter((y) => y.year < VIIRS_YEAR);
  const after = series.filter((y) => y.year >= VIIRS_YEAR);
  if (before.length < 3 || after.length < 3 || areaPeople <= 0) return null;
  const mean = (list: YearLevels[], mode: Mode, lvl: Exclude<Level, "none">) =>
    list.reduce((s, y) => s + atLeast(y[mode], lvl), 0) / list.length;
  const level = LEVELS.find((l) => mean(before, "harmonized", l.id) >= 0.01 * areaPeople)?.id;
  if (!level) return null;
  return {
    level,
    before: { raw: mean(before, "raw", level), harmonized: mean(before, "harmonized", level) },
    after: { raw: mean(after, "raw", level), harmonized: mean(after, "harmonized", level) },
  };
}
