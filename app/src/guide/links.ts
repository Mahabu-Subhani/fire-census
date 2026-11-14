// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import type { BBox, Polygon } from "../data/types";

/** Bounding box of a polygon ring. */
export function ringBBox(ring: Polygon): BBox {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/**
 * Link to NASA's live FIRMS Fire Map centred on the area, showing the last
 * 24 hours. Our record is history; this is where to look for fires burning now.
 * The URL pattern is the one FIRMS uses in its own address bar.
 */
export function firmsLiveUrl([w, s, e, n]: BBox): string {
  const lon = (w + e) / 2;
  const lat = (s + n) / 2;
  const span = Math.max(e - w, n - s, 0.05);
  const zoom = Math.min(12, Math.max(3, Math.log2(360 / span) - 0.5));
  return `https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${lon.toFixed(3)},${lat.toFixed(3)},${zoom.toFixed(1)}z`;
}
