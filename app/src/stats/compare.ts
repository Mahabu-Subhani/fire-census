// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "Is now unusual?" (docs/APP_VISION.md, Q1), the season band (Q2) and the
// monthly series. Comparisons use areaRows, so they do not change when the
// user narrows the date range.
import type { CubeRow, Mode } from "../data/types";
import { monthHistory, parseYm, value, ymOf, type YearValue } from "./rows";
import { median, p90, rank, rankRange, type Rank } from "./summary";

/** First month of the VIIRS-based record; earlier harmonized values are Aqua itself. */
export const VIIRS_FROM = "2012-02";

export type Baseline = "all" | "last10";

/** Decision 12: needs at least this many earlier years, else "not enough history". */
export const MIN_HISTORY_YEARS = 5;
/** Decision 32: below this, in both the median and this month, the answer is "too little activity to judge". */
export const MIN_ACTIVITY = 5;

export type Verdict = "below" | "near" | "above" | "far-above";

export const VERDICT_TEXT: Record<Verdict, string> = {
  below: "Below normal",
  near: "Near normal",
  above: "Above normal",
  "far-above": "Far above normal",
};

/**
 * Decision 12: below under 0.5 x median, near 0.5 to 1.5, above 1.5 to 3,
 * far above over 3. A median of 0 with activity now counts as far above.
 */
export function verdictFor(current: number, med: number): Verdict {
  if (med === 0) return current > 0 ? "far-above" : "near";
  const r = current / med;
  if (r < 0.5) return "below";
  if (r <= 1.5) return "near";
  if (r <= 3) return "above";
  return "far-above";
}

export type CompareStatus = "ok" | "too-little" | "not-enough-history" | "no-data";

export interface MonthCompare {
  status: CompareStatus;
  /** Calendar month compared, 1..12. */
  month: number;
  /** Year whose month is compared with the earlier years. */
  year: number | null;
  /** Day D when the comparison is month to date (days 1 to D), else null. */
  toDay: number | null;
  /** True when the newest month is incomplete and raw mode compared the last complete one instead. */
  skippedIncomplete: boolean;
  value: number | null;
  /** Every year's value of this month up to `year`, for plotting. */
  years: YearValue[];
  /** The earlier years in the baseline. */
  baselineYears: number[];
  median: number | null;
  p90: number | null;
  rank: Rank | null;
  /** 90% range of the rank allowing for the harmonization error; null when not computed. */
  rankRange: { lo: number; hi: number } | null;
  ratio: number | null;
  verdict: Verdict | null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function latestYm(rows: CubeRow[]): string | null {
  let last: string | null = null;
  for (const r of rows) if (last === null || r.ym > last) last = r.ym;
  return last;
}

/**
 * Compare one calendar month with the same month in earlier harmonized years.
 *
 * If `month` is the month of dataThrough and that month is incomplete, the
 * harmonized record compares days 1 to D of every year (`mtd`). The raw
 * record has no month-to-date field, so raw mode compares the last complete
 * year of that month instead and sets `skippedIncomplete`.
 */
export function compareMonth(opts: {
  areaRows: CubeRow[];
  month: number;
  mode: Mode;
  baseline: Baseline;
  harmonizedFrom: string;
  dataThrough: string | null;
  /** Out-of-sample monthly log scatter of the harmonized record (meta.month_log_sd). */
  sigma?: number | null;
}): MonthCompare {
  const { areaRows, month, mode, baseline, harmonizedFrom, dataThrough, sigma } = opts;
  const empty: MonthCompare = {
    status: "no-data", month, year: null, toDay: null, skippedIncomplete: false, value: null,
    years: [], baselineYears: [], median: null, p90: null, rank: null, rankRange: null, ratio: null, verdict: null,
  };
  const lastYm = dataThrough ? dataThrough.slice(0, 7) : latestYm(areaRows);
  if (!lastYm) return empty;
  const [ly, lm] = parseYm(lastYm);
  const day = dataThrough ? Number(dataThrough.slice(8, 10)) : null;
  const incomplete = day !== null && day < daysInMonth(ly, lm);

  let year = month < lm ? ly : month > lm ? ly - 1 : ly;
  let skippedIncomplete = false;
  const useMtd = month === lm && incomplete && mode === "harmonized";
  if (month === lm && incomplete && mode === "raw") {
    year = ly - 1;
    skippedIncomplete = true;
  }

  const years = monthHistory(areaRows, month, mode, useMtd, { first: harmonizedFrom, last: lastYm }).filter(
    (d) => d.year <= year,
  );
  const current = years.find((d) => d.year === year);
  const base = { ...empty, year, toDay: useMtd ? day : null, skippedIncomplete, years };
  if (!current || current.value === null) return base;

  let earlier = years.filter((d) => d.year < year && d.value !== null);
  if (baseline === "last10") earlier = earlier.slice(-10);
  const values = earlier.map((d) => d.value as number);
  const withValue = { ...base, value: current.value, baselineYears: earlier.map((d) => d.year) };
  if (values.length < MIN_HISTORY_YEARS) return { ...withValue, status: "not-enough-history" };

  const med = median(values)!;
  const result = {
    ...withValue,
    median: med,
    p90: p90(values),
    rank: rank(current.value, [...values, current.value]),
    rankRange:
      mode === "harmonized"
        ? rankRange(
            { value: current.value, uncertain: ymOf(year, month) >= VIIRS_FROM },
            earlier.map((d) => ({ value: d.value as number, uncertain: ymOf(d.year, month) >= VIIRS_FROM })),
            sigma,
          )
        : null,
  };
  if (med < MIN_ACTIVITY && current.value < MIN_ACTIVITY) return { ...result, status: "too-little" };
  return {
    ...result,
    status: "ok",
    ratio: med > 0 ? current.value / med : null,
    verdict: verdictFor(current.value, med),
  };
}

/**
 * The months that hold most of the year's activity: the busiest months,
 * taken in order, until they hold at least `share` of the total. Uses the
 * harmonized record over complete calendar years only. Empty if there is
 * too little activity (total below MIN_ACTIVITY).
 */
export function seasonMonths(
  areaRows: CubeRow[],
  harmonizedFrom: string,
  dataThrough: string | null,
  share = 0.5,
): { months: number[]; share: number; firstYear: number; lastYear: number } | null {
  const lastYm = dataThrough ? dataThrough.slice(0, 7) : latestYm(areaRows);
  if (!lastYm) return null;
  const [hy, hm] = parseYm(harmonizedFrom);
  const [ly, lm] = parseYm(lastYm);
  const day = dataThrough ? Number(dataThrough.slice(8, 10)) : null;
  const lastFullYearDone = lm === 12 && (day === null || day >= 31);
  const firstYear = hm === 1 ? hy : hy + 1;
  const lastYear = lastFullYearDone ? ly : ly - 1;
  if (lastYear < firstYear) return null;
  const sums = new Array(12).fill(0);
  for (const r of areaRows) {
    const [y, m] = parseYm(r.ym);
    if (y >= firstYear && y <= lastYear) sums[m - 1] += value(r, "harmonized");
  }
  const total = sums.reduce((a, b) => a + b, 0);
  if (total < MIN_ACTIVITY) return null;
  const order = sums.map((v, i) => [v, i + 1] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const months: number[] = [];
  let got = 0;
  for (const [v, m] of order) {
    if (got >= share * total) break;
    months.push(m);
    got += v;
  }
  return { months: months.sort((a, b) => a - b), share: got / total, firstYear, lastYear };
}

/** Every month from `from` to `to`, inclusive, as "YYYY-MM". */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = parseYm(from);
  const [y1, m1] = parseYm(to);
  while (y < y1 || (y === y1 && m <= m1)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export interface SeriesPoint {
  ym: string;
  value: number;
  /** harm_lo and harm_hi summed; equal to value in raw mode. */
  lo: number;
  hi: number;
  /** Small-fire layer, never added into value. */
  small: number;
}

/** One point per month from `from` to `to`; months with no rows are 0. */
export function toSeries(rows: CubeRow[], mode: Mode, from: string, to: string): SeriesPoint[] {
  if (!from || !to || from > to) return [];
  const index = new Map<string, SeriesPoint>();
  const out = monthsBetween(from, to).map((ym) => {
    const p = { ym, value: 0, lo: 0, hi: 0, small: 0 };
    index.set(ym, p);
    return p;
  });
  for (const r of rows) {
    const p = index.get(r.ym);
    if (!p) continue;
    const v = value(r, mode);
    p.value += v;
    p.lo += mode === "raw" ? v : r.harm_lo;
    p.hi += mode === "raw" ? v : r.harm_hi;
    p.small += r.small;
  }
  return out;
}
