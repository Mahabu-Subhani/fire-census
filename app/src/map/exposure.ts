// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Population exposure on the map (decision 53): where fire and people overlap.
// Each 0.1 degree square with fire in the area and dates shown falls in one
// of three classes:
//   2  high fire, densely populated: top third of burning squares by fire
//      activity AND top third of the area's squares by population;
//   1  high fire, less populated: top third by fire activity only;
//   0  other burning squares.
// Thirds are relative to the area shown, so the classes mean "the most of
// this area", not a fixed danger level. A square burns when it reaches the
// "light" level or above of decision 52: at least 1 fire detection a year on
// average over the period (the count itself for a period under a year).
// Exposure means people living in a square with fire, not harm or risk.
import { pointInPolygon } from "../data/select";
import type { CubeRow, Mode, Polygon, Population } from "../data/types";
import { value } from "../stats";
import { levelOf } from "../charts/population";

export type ExposureClass = 0 | 1 | 2;

export interface ExposureMap {
  collection: GeoJSON.FeatureCollection<GeoJSON.Polygon, { c: ExposureClass; v: number; people: number }>;
  /** Burning squares (light level or above). */
  burning: number;
  /** People living in the top third of burning squares by fire activity. */
  highFirePeople: number;
  /** Of those, people in squares that are also in the area's densest third. */
  highDensePeople: number;
  /** People in the area. */
  areaPeople: number;
}

const key = (lon: number, lat: number) => `${lon.toFixed(2)},${lat.toFixed(2)}`;

/** The value at the start of the top third of a list (ties go up). */
export function topThirdCut(values: number[]): number {
  if (values.length === 0) return Infinity;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length * 2) / 3)];
}

/** `years` is the length of the period, as in peopleByLevel. */
export function exposureMap(rows: CubeRow[], mode: Mode, cellDeg: number, pop: Population, polygon: Polygon | null, years: number): ExposureMap {
  // Population of every square in the area (the file holds only the region's exact outline).
  const people = new Map<string, number>();
  for (const [lon, lat, n] of pop.squares) {
    if (!polygon || pointInPolygon(lon, lat, polygon)) people.set(key(lon, lat), n);
  }
  const areaPeople = [...people.values()].reduce((a, b) => a + b, 0);
  const denseCut = topThirdCut([...people.values()]);

  // Fire per square over the rows, which are already limited to the area and dates.
  const fire = new Map<string, { lon: number; lat: number; v: number }>();
  for (const r of rows) {
    const k = key(r.lon, r.lat);
    const cell = fire.get(k) ?? { lon: r.lon, lat: r.lat, v: 0 };
    cell.v += value(r, mode);
    fire.set(k, cell);
  }
  const div = Math.max(1, years);
  const burning = [...fire.entries()].filter(([, c]) => levelOf(c.v / div) !== "none");
  const fireCut = topThirdCut(burning.map(([, c]) => c.v));

  const h = cellDeg / 2;
  let highFirePeople = 0;
  let highDensePeople = 0;
  const features = burning.map(([k, { lon, lat, v }]) => {
    const n = people.get(k) ?? 0;
    const high = v >= fireCut;
    const dense = n > 0 && n >= denseCut;
    const c: ExposureClass = high ? (dense ? 2 : 1) : 0;
    if (high) highFirePeople += n;
    if (c === 2) highDensePeople += n;
    return {
      type: "Feature" as const,
      properties: { c, v, people: n },
      geometry: { type: "Polygon" as const, coordinates: [[[lon - h, lat - h], [lon + h, lat - h], [lon + h, lat + h], [lon - h, lat + h], [lon - h, lat - h]]] },
    };
  });
  return { collection: { type: "FeatureCollection", features }, burning: burning.length, highFirePeople, highDensePeople, areaPeople };
}
