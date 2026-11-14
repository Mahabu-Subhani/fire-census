// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The shareable link: region, area, date range, mode and small-fire layer in
// the query string, so opening the link restores the same view.
import type { Mode, Polygon } from "../data/types";

/** Overview for everyone; research adds every chart, the method and the data; ask is the question bar alone. */
export type View = "overview" | "research" | "ask";

export interface UrlState {
  region?: string;
  polygon?: Polygon | null;
  place?: string | null;
  from?: string;
  to?: string;
  mode?: Mode;
  small?: boolean;
  view?: View;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function parsePolygon(text: string | null): Polygon | null {
  if (!text) return null;
  const points = text.split(";").map((pair) => pair.split(",").map(Number));
  if (points.length < 3 || points.some((p) => p.length !== 2 || p.some((v) => !Number.isFinite(v)))) return null;
  return points as Polygon;
}

export function parseUrlState(search: string): UrlState {
  const q = new URLSearchParams(search);
  const state: UrlState = {};
  const region = q.get("r");
  if (region) state.region = region;
  const polygon = parsePolygon(q.get("a"));
  if (polygon) state.polygon = polygon;
  const place = q.get("p");
  if (place && polygon) state.place = place;
  const from = q.get("from");
  const to = q.get("to");
  if (from && MONTH.test(from)) state.from = from;
  if (to && MONTH.test(to)) state.to = to;
  const mode = q.get("m");
  if (mode === "raw" || mode === "harmonized") state.mode = mode;
  if (q.get("s") === "1") state.small = true;
  const view = q.get("v");
  if (view === "research" || view === "ask") state.view = view;
  return state;
}

export function buildUrlState(state: Required<Omit<UrlState, "place" | "polygon" | "view">> & Pick<UrlState, "place" | "polygon" | "view">): string {
  const q = new URLSearchParams();
  q.set("r", state.region);
  if (state.polygon) {
    q.set("a", state.polygon.map(([lon, lat]) => `${lon.toFixed(4)},${lat.toFixed(4)}`).join(";"));
    if (state.place) q.set("p", state.place);
  }
  q.set("from", state.from);
  q.set("to", state.to);
  q.set("m", state.mode);
  if (state.small) q.set("s", "1");
  if (state.view === "research" || state.view === "ask") q.set("v", state.view);
  return `?${q.toString()}`;
}
