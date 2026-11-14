// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// People living where it burns: WorldPop 2020 people per 0.1 degree square
// (<region>/population.json) joined to the fire record's squares. Pure
// functions, so the numbers can be tested without the page.
//
// A square counts when it had at least MIN_FIRE fire detections in the
// period (MODIS-equivalent in Harmonized, detections in Raw). Counting any
// square with fire at all is a footprint, and footprints are not harmonized:
// VIIRS spreads the same fires over more squares, so that version jumped in
// 2012 in Punjab even with the harmonized value. With MIN_FIRE = 3 a year the
// harmonized series has no step at 2012 in Punjab (decision 48). The number
// was chosen after looking at the data; it is not pre-registered.
import { pointInPolygon } from "../data/select";
import type { CubeRow, Mode, Polygon, Population } from "../data/types";
import { value } from "../stats";

export const MIN_FIRE = 3;
/** First year with VIIRS: where a footprint jumps if it is not harmonized. */
export const VIIRS_YEAR = 2012;

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

export interface Exposure {
  /** People living in squares with at least MIN_FIRE detections. */
  people: number;
  /** How many such squares. */
  squares: number;
}

/** People in squares that had at least `min` fire activity over these rows (already limited to area and dates). */
export function exposure(rows: CubeRow[], mode: Mode, index: Map<string, number>, min = MIN_FIRE): Exposure {
  const sums = new Map<string, number>();
  for (const r of rows) {
    const k = key(r.lon, r.lat);
    sums.set(k, (sums.get(k) ?? 0) + value(r, mode));
  }
  let people = 0;
  let squares = 0;
  for (const [k, v] of sums) {
    if (v >= min) {
      people += index.get(k) ?? 0;
      squares += 1;
    }
  }
  return { people, squares };
}

export interface YearExposure {
  year: number;
  raw: number;
  harmonized: number;
}

/**
 * People near fire for each whole year from the first full harmonized year,
 * in both records. The year still running (data_through before December) is
 * left out, so it does not look like a drop.
 */
export function yearlyExposure(areaRows: CubeRow[], index: Map<string, number>, harmonizedFrom: string, dataThrough: string | null, min = MIN_FIRE): YearExposure[] {
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
  const out: YearExposure[] = [];
  for (let y = first; y <= last; y++) {
    const rows = byYear.get(y) ?? [];
    out.push({ year: y, raw: exposure(rows, "raw", index, min).people, harmonized: exposure(rows, "harmonized", index, min).people });
  }
  return out;
}

/** Mean after VIIRS against mean before, as a share: 0.6 means 60 % more. Null without years on both sides. */
export function stepAtViirs(series: YearExposure[], mode: Mode): number | null {
  const pick = (y: YearExposure) => (mode === "raw" ? y.raw : y.harmonized);
  const before = series.filter((y) => y.year < VIIRS_YEAR).map(pick);
  const after = series.filter((y) => y.year >= VIIRS_YEAR).map(pick);
  if (before.length < 3 || after.length < 3) return null;
  const mean = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length;
  const b = mean(before);
  return b > 0 ? mean(after) / b - 1 : null;
}
