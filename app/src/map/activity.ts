// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Fire activity per grid cell for the map: where in the area it burns.
import type { CubeRow, Mode } from "../data/types";
import { value } from "../stats";

export interface ActivityCells {
  collection: GeoJSON.FeatureCollection<GeoJSON.Polygon, { v: number; t: number }>;
  /** Largest cell total, for the legend. */
  max: number;
  cells: number;
}

/**
 * Sums each cell over the rows (already limited to the area and date range)
 * and returns one square per cell with any activity. `t` is the square root
 * of the share of the maximum, so a few very active cells do not wash out
 * the rest.
 */
export function activityCells(rows: CubeRow[], mode: Mode, cellDeg: number, fixedMax?: number): ActivityCells {
  const sums = new Map<string, { lon: number; lat: number; v: number }>();
  for (const row of rows) {
    const key = `${row.lon},${row.lat}`;
    const cell = sums.get(key) ?? { lon: row.lon, lat: row.lat, v: 0 };
    cell.v += value(row, mode);
    sums.set(key, cell);
  }
  const cells = [...sums.values()].filter((c) => c.v > 0);
  // A fixed scale (playback) keeps one colour meaning the same amount in every frame.
  const max = fixedMax ?? cells.reduce((m, c) => Math.max(m, c.v), 0);
  const h = cellDeg / 2;
  return {
    max,
    cells: cells.length,
    collection: {
      type: "FeatureCollection",
      features: cells.map(({ lon, lat, v }) => ({
        type: "Feature",
        properties: { v, t: max > 0 ? Math.sqrt(Math.min(1, v / max)) : 0 },
        geometry: { type: "Polygon", coordinates: [[[lon - h, lat - h], [lon + h, lat - h], [lon + h, lat + h], [lon - h, lat + h], [lon - h, lat - h]]] },
      })),
    },
  };
}
