// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Pure functions that turn the cube into the rows behind the current view.
import type { BBox, CubeRow, Polygon } from "./types";

const KM_PER_DEG = 111.32;

/** Ray-casting test: is the point inside the polygon ring? */
export function pointInPolygon(lon: number, lat: number, ring: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** A rectangle as a polygon ring. */
export function bboxToPolygon([w, s, e, n]: BBox): Polygon {
  return [
    [w, s],
    [e, s],
    [e, n],
    [w, n],
  ];
}

/**
 * Area of a polygon in km². Uses a local equirectangular projection, which is
 * accurate to well under 1 percent for areas the size of a province.
 */
export function polygonAreaKm2(ring: Polygon): number {
  if (ring.length < 3) return 0;
  const meanLat = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;
  const kx = KM_PER_DEG * Math.cos((meanLat * Math.PI) / 180);
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    twice += ring[j][0] * kx * (ring[i][1] * KM_PER_DEG) - ring[i][0] * kx * (ring[j][1] * KM_PER_DEG);
  }
  return Math.abs(twice) / 2;
}

/**
 * Rows whose cell centre is inside the polygon and whose month is in
 * [fromMonth, toMonth]. A null polygon means the whole region.
 * Months are "YYYY-MM", so string comparison orders them correctly.
 */
export function selectCells(
  cube: CubeRow[],
  polygon: Polygon | null,
  fromMonth: string,
  toMonth: string,
): CubeRow[] {
  // The cube repeats each cell once per month, so test each cell only once.
  const insideCache = new Map<string, boolean>();
  const isInside = (row: CubeRow): boolean => {
    if (!polygon) return true;
    const key = `${row.lon},${row.lat}`;
    let inside = insideCache.get(key);
    if (inside === undefined) {
      inside = pointInPolygon(row.lon, row.lat, polygon);
      insideCache.set(key, inside);
    }
    return inside;
  };
  return cube.filter((row) => row.ym >= fromMonth && row.ym <= toMonth && isInside(row));
}

/** True if any part of the polygon's bounding box overlaps the region box. */
export function overlapsBBox(ring: Polygon, [w, s, e, n]: BBox): boolean {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return Math.max(...lons) >= w && Math.min(...lons) <= e && Math.max(...lats) >= s && Math.min(...lats) <= n;
}

/** A circle of the given radius as a polygon ring (n vertices). */
export function circlePolygon(lon: number, lat: number, radiusKm: number, n = 48): Polygon {
  const dLat = radiusKm / KM_PER_DEG;
  const dLon = radiusKm / (KM_PER_DEG * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)] as [number, number];
  });
}

/**
 * Number of grid-cell centres of the region inside the polygon. Zero means the
 * area is too small (or misplaced) to contain any cell, which is different
 * from an area that contains cells with no detections.
 */
export function countCellCentres(ring: Polygon, bbox: BBox, cellDeg: number): number {
  const [w, s, e, n] = bbox;
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  const x0 = Math.max(w, Math.min(...lons));
  const x1 = Math.min(e, Math.max(...lons));
  const y0 = Math.max(s, Math.min(...lats));
  const y1 = Math.min(n, Math.max(...lats));
  if (x0 > x1 || y0 > y1) return 0;
  // Cell centres sit at w + (i + 0.5) * cellDeg.
  const i0 = Math.max(0, Math.ceil((x0 - w) / cellDeg - 0.5));
  const i1 = Math.floor((x1 - w) / cellDeg - 0.5);
  const j0 = Math.max(0, Math.ceil((y0 - s) / cellDeg - 0.5));
  const j1 = Math.floor((y1 - s) / cellDeg - 0.5);
  let count = 0;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      if (pointInPolygon(w + (i + 0.5) * cellDeg, s + (j + 0.5) * cellDeg, ring)) count++;
    }
  }
  return count;
}
