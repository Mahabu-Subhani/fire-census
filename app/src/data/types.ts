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
  /** A number, or text when the pipeline reports several numbers (for example "slope 1.024, correlation 0.995"). */
  value: number | string | null;
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

/** One year of <region>/season.json: when the main burning season started, peaked and ended. */
export interface SeasonYear {
  year: number;
  /** "MM-DD" */
  start: string;
  peak: string;
  end: string;
  start_doy: number;
  peak_doy: number;
  end_doy: number;
  length_days: number;
  total: number;
  sensor: string;
}

export interface TrendRange {
  days_per_decade: number;
  lo: number;
  hi: number;
}

export interface Season {
  window: string;
  years: SeasonYear[];
  trend: { start: TrendRange; peak: TrendRange; end: TrendRange; length: TrendRange };
  method?: string;
  law_2009?: { mean_peak_before: number; mean_peak_after: number; shift_days: number; p_one_sided: number; note: string };
}

/** <region>/drift.json: overpass times and Aqua against the harmonized record, per year. */
export interface DriftFile {
  years: { year: number; overpass_local_time: Record<string, number>; aqua_over_harmonized?: number | null }[];
  note?: string;
}

export interface Episode {
  start: string;
  end: string;
  days: number;
  total: number;
  peak: number;
  peak_day: string;
  sensor: string;
  rank_total: number;
  rank_peak: number;
}

/** <region>/episodes.json: runs of consecutive days with fire, ranked. */
export interface Episodes {
  definition: string;
  count: number;
  largest: Episode[];
  latest: Episode[];
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
  /** True when the area is a shape (drawn, typed or searched); false for the whole region. */
  drawn: boolean;
  areaKm2: number | null;
  place: string | null;
  dataThrough: string | null;
  /** Whole-region analyses from the pipeline; null where the file does not exist. */
  season: Season | null;
  drift: DriftFile | null;
  episodes: Episodes | null;
}
