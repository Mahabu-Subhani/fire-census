// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "Is it getting worse here?" (docs/APP_VISION.md, Q5). Yearly totals over
// complete harmonized years, Sen's slope with a 95% range, and the
// Mann-Kendall test with the correction for ties (Gilbert 1987, chapter 16).
import type { CubeRow } from "../data/types";
import { parseYm, value } from "./rows";
import { median } from "./summary";

/** Standard normal cumulative distribution (Abramowitz and Stegun 26.2.17, error below 7.5e-8). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export interface MannKendall {
  s: number;
  varS: number;
  z: number;
  /** Two-sided p-value. */
  p: number;
}

export function mannKendall(ys: number[]): MannKendall {
  const n = ys.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) s += Math.sign(ys[j] - ys[i]);
  const ties = new Map<number, number>();
  for (const y of ys) ties.set(y, (ties.get(y) ?? 0) + 1);
  let tieTerm = 0;
  for (const t of ties.values()) if (t > 1) tieTerm += t * (t - 1) * (2 * t + 5);
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  const z = varS === 0 ? 0 : s > 0 ? (s - 1) / Math.sqrt(varS) : s < 0 ? (s + 1) / Math.sqrt(varS) : 0;
  return { s, varS, z, p: z === 0 ? 1 : Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))) };
}

export interface SenSlope {
  slope: number;
  intercept: number;
  /** 95% range of the slope. */
  lo: number;
  hi: number;
}

export function senSlope(xs: number[], ys: number[], varS: number): SenSlope | null {
  const slopes: number[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = i + 1; j < xs.length; j++) if (xs[j] !== xs[i]) slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
  if (slopes.length === 0) return null;
  slopes.sort((a, b) => a - b);
  const slope = median(slopes)!;
  const intercept = median(xs.map((x, i) => ys[i] - slope * x))!;
  const c = 1.959964 * Math.sqrt(varS);
  const n = slopes.length;
  const m1 = Math.max(0, Math.min(n - 1, Math.round((n - c) / 2) - 1));
  const m2 = Math.max(0, Math.min(n - 1, Math.round((n + c) / 2)));
  return { slope, intercept, lo: slopes[m1], hi: slopes[m2] };
}

export interface YearTotal {
  year: number;
  total: number;
}

/** Totals of complete calendar years from the first complete harmonized year. Missing rows are 0. */
export function yearlyTotals(areaRows: CubeRow[], harmonizedFrom: string, dataThrough: string | null): YearTotal[] {
  let last = dataThrough?.slice(0, 7) ?? null;
  if (!last) for (const r of areaRows) if (last === null || r.ym > last) last = r.ym;
  if (!last) return [];
  const [hy, hm] = parseYm(harmonizedFrom);
  const [ly, lm] = parseYm(last);
  const dayDone = !dataThrough || Number(dataThrough.slice(8, 10)) >= 31;
  const first = hm === 1 ? hy : hy + 1;
  const end = lm === 12 && dayDone ? ly : ly - 1;
  const out: YearTotal[] = [];
  for (let y = first; y <= end; y++) out.push({ year: y, total: 0 });
  for (const r of areaRows) {
    const y = parseYm(r.ym)[0];
    if (y >= first && y <= end) out[y - first].total += value(r, "harmonized");
  }
  return out;
}

export const MIN_TREND_YEARS = 8;
export const TREND_ALPHA = 0.05;

export interface Trend {
  status: "ok" | "too-few-years" | "too-little";
  years: YearTotal[];
  mk: MannKendall | null;
  sen: SenSlope | null;
  /** True when p < TREND_ALPHA. */
  clear: boolean;
  /** Sen's slope over ten years as a share of the median yearly total. */
  perDecade: number | null;
}

/** Trend of yearly totals on the harmonized record only (raw has a false jump in 2012). */
export function trend(areaRows: CubeRow[], harmonizedFrom: string, dataThrough: string | null, minActivity = 5): Trend {
  const years = yearlyTotals(areaRows, harmonizedFrom, dataThrough);
  const none = { years, mk: null, sen: null, clear: false, perDecade: null };
  if (years.length < MIN_TREND_YEARS) return { ...none, status: "too-few-years" };
  const ys = years.map((d) => d.total);
  const med = median(ys)!;
  if (med < minActivity) return { ...none, status: "too-little" };
  const mk = mannKendall(ys);
  const sen = senSlope(years.map((d) => d.year), ys, mk.varS);
  return {
    status: "ok",
    years,
    mk,
    sen,
    clear: mk.p < TREND_ALPHA,
    perDecade: sen && med > 0 ? (sen.slope * 10) / med : null,
  };
}
