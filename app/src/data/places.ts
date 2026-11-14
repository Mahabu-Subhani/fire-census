// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// District search. Districts come from app/public/data/<region>/districts.json,
// built by app/scripts/make_districts.py from geoBoundaries.
import type { BBox, Polygon } from "./types";

export interface District {
  name: string;
  province: string | null;
  country: string;
  /** Unique, readable: "Ludhiana, Punjab, India". */
  label: string;
  /** Outer outline, simplified to about 200 m. */
  ring: Polygon;
  bbox: BBox;
  /** Part of the district lies outside the processed region; only the part inside is counted. */
  partly_outside: boolean;
  /** Extra islands or exclaves left out of the outline. */
  parts_dropped: number;
  source: string;
  licence: string;
}

/** Lower case, accents removed: "Haryāna" and "haryana" match. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Districts matching the query: names that start with it first, then names
 * containing it, then matches on province or country.
 */
export function searchPlaces(districts: District[], query: string, limit = 8): District[] {
  const q = normalize(query);
  if (q.length === 0) return [];
  const scored: { d: District; score: number }[] = [];
  for (const d of districts) {
    const name = normalize(d.name);
    const rest = normalize(`${d.province ?? ""} ${d.country}`);
    const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : normalize(d.label).includes(q) || rest.includes(q) ? 2 : -1;
    if (score >= 0) scored.push({ d, score });
  }
  scored.sort((a, b) => a.score - b.score || a.d.label.localeCompare(b.d.label));
  return scored.slice(0, limit).map((s) => s.d);
}
