// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// How every chart reads the cube rows. One implementation, so every chart
// agrees. Rules: docs/ARCHITECTURE.md, "How to read the rows".
import type { CubeRow, Meta, Mode } from "../data/types";

/** The value of one row: the naive sum in raw mode, `harm` in harmonized mode. */
export function value(row: CubeRow, mode: Mode): number {
  return mode === "raw" ? row.raw_modis + row.raw_viirs : row.harm;
}

/**
 * Label for raw mode. meta.json has no field for it (only `unit`, which
 * describes `harm`), so it is written here once, from the contract's
 * definitions of `raw_modis` and `raw_viirs`. Replace it with a meta field
 * if Person A adds one.
 */
export const RAW_UNIT = "hotspot detections (MODIS + VIIRS, not harmonized)";

/** The unit of what a chart shows. Harmonized mode always uses meta.unit. */
export function unitLabel(meta: Meta | null, mode: Mode): string {
  if (mode === "raw") return RAW_UNIT;
  return meta?.unit ?? "unit not stated in meta.json";
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface Calendar {
  /** Years in ascending order, one per calendar row. */
  years: number[];
  /** cells[i][m]: sum for years[i] and month m (0 = January). Null outside the range. */
  cells: (number | null)[][];
}

/** "YYYY-MM" to [year, month 1..12]. */
export function parseYm(ym: string): [number, number] {
  return [Number(ym.slice(0, 4)), Number(ym.slice(5, 7))];
}

function ymOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Year by month matrix of sums. Months inside the range with no rows are 0
 * (missing rows mean zero); months outside it are null. Without a range, the
 * range is the first to last month present in `rows`.
 */
export function toCalendar(rows: CubeRow[], mode: Mode, range?: { from: string; to: string }): Calendar {
  let from = range?.from;
  let to = range?.to;
  if (!from || !to) {
    if (rows.length === 0) return { years: [], cells: [] };
    from = to = rows[0].ym;
    for (const r of rows) {
      if (r.ym < from) from = r.ym;
      if (r.ym > to) to = r.ym;
    }
  }
  if (from > to) return { years: [], cells: [] };
  const [y0] = parseYm(from);
  const [y1] = parseYm(to);
  const years: number[] = [];
  const cells: (number | null)[][] = [];
  for (let y = y0; y <= y1; y++) {
    years.push(y);
    cells.push(MONTH_NAMES.map((_, m) => {
      const ym = ymOf(y, m + 1);
      return ym >= from! && ym <= to! ? 0 : null;
    }));
  }
  for (const r of rows) {
    if (r.ym < from || r.ym > to) continue;
    const [y, m] = parseYm(r.ym);
    const row = cells[y - y0];
    row[m - 1] = (row[m - 1] ?? 0) + value(r, mode);
  }
  return { years, cells };
}

export interface YearValue {
  year: number;
  /** Null when the value cannot be computed (see monthHistory). */
  value: number | null;
}

/**
 * The value of one calendar month (1..12) in every year of the span.
 *
 * With useMtd, each year counts `mtd` (days 1 to D, where D is the day of
 * dataThrough) instead of `harm`, so an incomplete current month is compared
 * with the same days of earlier years. `mtd` exists for the harmonized record
 * only, so in raw mode with useMtd every value is null. A row whose `mtd` is
 * null also makes that year null: it is unknown, not zero.
 *
 * Without a span, the span is the first to last month present in the rows.
 */
export function monthHistory(
  areaRows: CubeRow[],
  month: number,
  mode: Mode,
  useMtd: boolean,
  span?: { first: string; last: string },
): YearValue[] {
  let first = span?.first;
  let last = span?.last;
  if (!first || !last) {
    if (areaRows.length === 0) return [];
    first = last = areaRows[0].ym;
    for (const r of areaRows) {
      if (r.ym < first) first = r.ym;
      if (r.ym > last) last = r.ym;
    }
  }
  const sums = new Map<number, number | null>();
  for (let y = parseYm(first)[0]; y <= parseYm(last)[0]; y++) {
    const ym = ymOf(y, month);
    if (ym >= first && ym <= last) sums.set(y, useMtd && mode === "raw" ? null : 0);
  }
  for (const r of areaRows) {
    const [y, m] = parseYm(r.ym);
    if (m !== month || !sums.has(y)) continue;
    const prev = sums.get(y)!;
    if (prev === null) continue;
    const v = useMtd ? r.mtd : value(r, mode);
    sums.set(y, v === null ? null : prev + v);
  }
  return [...sums].map(([year, v]) => ({ year, value: v }));
}
