// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// What usually comes next (docs/APP_VISION.md, Q3) and the average of each
// calendar month (for the calendar's difference mode). History only: these
// describe past years and are not a forecast.
import type { CubeRow, Mode } from "../data/types";
import { monthHistory, parseYm, value } from "./rows";
import { median, p90 } from "./summary";
import { yearlyTotals } from "./trend";

export interface OutlookMonth {
  month: number;
  year: number;
  /** Typical value: median over complete harmonized years. */
  median: number;
  /** A bad year: 90th percentile. */
  p90: number;
  /** Share of a typical year's activity in this month, pooled over the years. */
  share: number;
}

export interface Outlook {
  months: OutlookMonth[];
  /** The month that was the year's busiest most often. */
  peak: { month: number; years: number; of: number } | null;
  firstYear: number;
  lastYear: number;
}

/** The `count` months after the month of dataThrough, from complete harmonized years. */
export function outlook(areaRows: CubeRow[], harmonizedFrom: string, dataThrough: string | null, count = 3): Outlook | null {
  const totals = yearlyTotals(areaRows, harmonizedFrom, dataThrough);
  if (totals.length === 0 || !dataThrough) return null;
  const firstYear = totals[0].year;
  const lastYear = totals[totals.length - 1].year;
  const byYear = new Map(totals.map((t) => [t.year, new Array(12).fill(0) as number[]]));
  for (const r of areaRows) {
    const [y, m] = parseYm(r.ym);
    const row = byYear.get(y);
    if (row) row[m - 1] += value(r, "harmonized");
  }
  const grand = totals.reduce((a, t) => a + t.total, 0);
  const [cy, cm] = parseYm(dataThrough.slice(0, 7));
  const months: OutlookMonth[] = [];
  for (let k = 1; k <= count; k++) {
    const m = ((cm - 1 + k) % 12) + 1;
    const year = cy + Math.floor((cm - 1 + k) / 12);
    const vals = [...byYear.values()].map((row) => row[m - 1]);
    const sum = vals.reduce((a, b) => a + b, 0);
    months.push({ month: m, year, median: median(vals)!, p90: p90(vals)!, share: grand > 0 ? sum / grand : 0 });
  }
  const peaks = new Array(12).fill(0);
  let active = 0;
  for (const row of byYear.values()) {
    const max = Math.max(...row);
    if (max <= 0) continue;
    active++;
    peaks[row.indexOf(max)]++;
  }
  const best = peaks.indexOf(Math.max(...peaks));
  return { months, peak: active ? { month: best + 1, years: peaks[best], of: active } : null, firstYear, lastYear };
}

/**
 * Average of each calendar month over earlier harmonized years, for the
 * calendar's difference mode. For the incomplete month of dataThrough it is
 * the average month-to-date (harmonized) or null (raw has no month to date).
 * Returns averages[m - 1] for full months and `partial` for the incomplete one.
 */
export function monthAverages(
  areaRows: CubeRow[],
  mode: Mode,
  harmonizedFrom: string,
  dataThrough: string | null,
): { full: (number | null)[]; partial: { ym: string; average: number | null } | null } {
  const totals = yearlyTotals(areaRows, harmonizedFrom, dataThrough);
  const full: (number | null)[] = new Array(12).fill(null);
  if (totals.length) {
    const first = totals[0].year;
    const last = totals[totals.length - 1].year;
    const sums = new Array(12).fill(0);
    for (const r of areaRows) {
      const [y, m] = parseYm(r.ym);
      if (y >= first && y <= last) sums[m - 1] += value(r, mode);
    }
    for (let m = 0; m < 12; m++) full[m] = sums[m] / totals.length;
  }
  let partial: { ym: string; average: number | null } | null = null;
  if (dataThrough) {
    const ym = dataThrough.slice(0, 7);
    const [cy, cm] = parseYm(ym);
    const d = Number(dataThrough.slice(8, 10));
    const dim = new Date(Date.UTC(cy, cm, 0)).getUTCDate();
    if (d < dim) {
      if (mode === "raw") partial = { ym, average: null };
      else {
        const earlier = monthHistory(areaRows, cm, mode, true, { first: harmonizedFrom, last: ym })
          .filter((h) => h.year < cy && h.value !== null)
          .map((h) => h.value as number);
        partial = { ym, average: earlier.length ? earlier.reduce((a, b) => a + b, 0) / earlier.length : null };
      }
    }
  }
  return { full, partial };
}
