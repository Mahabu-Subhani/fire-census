// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Types for the data contract in docs/ARCHITECTURE.md. Change them only
// together with that document.

export type Mode = "raw" | "harmonized";

/** [west, south, east, north] in degrees. */
export type BBox = [number, number, number, number];

export interface Region {
  id: string;
  name: string;
  bbox: BBox;
  cell_deg: number;
  first_month: string; // "YYYY-MM"
  last_month: string;
  harmonized_from: string;
}

/** One cell and month; same fields as cube.json. */
export interface CubeRow {
  lon: number;
  lat: number;
  ym: string;
  raw_modis: number;
  raw_viirs: number;
  harm: number;
  harm_lo: number;
  harm_hi: number;
  small: number;
  terra_only: boolean;
  /** Month-to-date count (days 1 to D of the data_through month); null elsewhere. */
  mtd: number | null;
  /** Valid observations, present only if the observation-aware step shipped. Null or missing means unknown, never zero. */
  obs?: number | null;
}

export type Verdict = "pass" | "fail" | "not run";

export interface Check {
  id: string;
  name: string;
  value: number | null;
  threshold: string;
  verdict: Verdict;
  note: string;
}

export interface CurvePoint {
  frp: number | null;
  p: number | null;
  p_lo: number | null;
  p_hi: number | null;
}

export interface Meta {
  level_shipped: string;
  level_name?: string;
  shipping_reason?: string;
  /** Label for the harmonized unit. Use this everywhere; never type it by hand. */
  unit?: string;
  ladder: Array<Record<string, unknown>>;
  checks: Check[];
  curve: { day: CurvePoint[]; night: CurvePoint[] };
  data_version: string;
  code_commit: string;
  generated_at: string;
  /** Last date with data, "YYYY-MM-DD". */
  data_through?: string | null;
  /** First month built from near-real-time rows, "YYYY-MM". */
  nrt_from?: string | null;
  sources: string[];
  [key: string]: unknown;
}

/** A closed ring of [lon, lat] points. The last point need not repeat the first. */
export type Polygon = [number, number][];

/** What every chart reads through useSelection(). See docs/ARCHITECTURE.md. */
export interface Selection {
  region: Region | null;
  meta: Meta | null;
  /** Rows inside the area and the date range: what the calendar and series show. */
  rows: CubeRow[];
  /** Rows inside the area for every month, ignoring the date range: the history that comparisons need. */
  areaRows: CubeRow[];
  from: string;
  to: string;
  mode: Mode;
  showSmall: boolean;
  status: "idle" | "loading" | "ready" | "empty" | "error";
  areaKm2: number | null;
  place: string | null;
  dataThrough: string | null;
}
