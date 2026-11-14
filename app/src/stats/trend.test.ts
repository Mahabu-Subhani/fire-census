// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { CubeRow } from "../data/types";
import { monthAverages, outlook } from "./outlook";
import { mannKendall, normalCdf, senSlope, trend, yearlyTotals } from "./trend";

function row(ym: string, harm: number, over: Partial<CubeRow> = {}): CubeRow {
  return { lon: 0, lat: 0, ym, raw_modis: 0, raw_viirs: 0, harm, harm_lo: harm, harm_hi: harm, small: 0, terra_only: false, mtd: null, ...over };
}

describe("normalCdf", () => {
  it("matches known values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 5);
    expect(normalCdf(-1)).toBeCloseTo(0.158655, 5);
  });
});

describe("mannKendall", () => {
  it("matches the hand calculation for 1..5", () => {
    // S = 10, Var(S) = 5*4*15/18 = 16.667, Z = 9 / 4.0825 = 2.2045, p = 0.0275
    const r = mannKendall([1, 2, 3, 4, 5]);
    expect(r.s).toBe(10);
    expect(r.varS).toBeCloseTo(16.6667, 3);
    expect(r.z).toBeCloseTo(2.2045, 3);
    expect(r.p).toBeCloseTo(0.0275, 3);
  });
  it("corrects the variance for ties", () => {
    // S = 2, Var(S) = (66 - 18) / 18 = 2.667, Z = 1 / 1.633 = 0.612
    const r = mannKendall([1, 1, 2]);
    expect(r.s).toBe(2);
    expect(r.varS).toBeCloseTo(2.6667, 3);
    expect(r.z).toBeCloseTo(0.6124, 3);
  });
  it("gives p = 1 for a flat series", () => expect(mannKendall([3, 3, 3, 3]).p).toBe(1));
  it("is symmetric for a falling series", () => expect(mannKendall([5, 4, 3, 2, 1]).z).toBeCloseTo(-2.2045, 3));
});

describe("senSlope", () => {
  it("recovers a straight line", () => {
    const xs = [2000, 2001, 2002, 2003, 2004];
    const s = senSlope(xs, [10, 12, 14, 16, 18], mannKendall([10, 12, 14, 16, 18]).varS)!;
    expect(s.slope).toBe(2);
    expect(s.intercept).toBe(-3990);
    expect(s.lo).toBeLessThanOrEqual(2);
    expect(s.hi).toBeGreaterThanOrEqual(2);
  });
  it("ignores one outlier", () => {
    const ys = [10, 11, 100, 13, 14, 15];
    expect(senSlope([0, 1, 2, 3, 4, 5], ys, mannKendall(ys).varS)!.slope).toBe(1);
  });
});

describe("yearlyTotals", () => {
  it("keeps complete harmonized years only and fills empty years with 0", () => {
    const rows = [row("2002-08", 5), row("2003-01", 2), row("2003-12", 3), row("2026-01", 9)];
    const t = yearlyTotals(rows, "2002-07", "2026-11-05");
    expect(t[0]).toEqual({ year: 2003, total: 5 });
    expect(t[1]).toEqual({ year: 2004, total: 0 });
    expect(t[t.length - 1].year).toBe(2025);
  });
  it("is empty for an empty selection without dataThrough", () => expect(yearlyTotals([], "2002-07", null)).toEqual([]));
});

describe("trend", () => {
  const rising = Array.from({ length: 20 }, (_, i) => row(`${2003 + i}-08`, 100 + 10 * i));
  it("finds a clear rising trend", () => {
    const t = trend(rising, "2002-07", "2023-01-10");
    expect(t.status).toBe("ok");
    expect(t.sen!.slope).toBe(10);
    expect(t.clear).toBe(true);
    expect(t.perDecade).toBeCloseTo(100 / 195, 3); // slope*10 / median(100..290)
  });
  it("finds no clear trend in noise", () => {
    const flat = [5, 9, 6, 8, 7, 6, 9, 5, 8, 7].map((v, i) => row(`${2003 + i}-08`, v * 10));
    expect(trend(flat, "2002-07", "2013-01-10").clear).toBe(false);
  });
  it("needs eight years", () => expect(trend(rising, "2002-07", "2010-01-10").status).toBe("too-few-years"));
  it("refuses an area with too little activity", () => expect(trend([], "2002-07", "2026-11-05").status).toBe("too-little"));
});

describe("outlook", () => {
  const rows: CubeRow[] = [];
  for (let y = 2003; y <= 2025; y++) {
    rows.push(row(`${y}-12`, y % 2 ? 10 : 30), row(`${y}-01`, 10), row(`${y}-09`, 60));
  }
  it("gives the next three months with median, 90th percentile and share", () => {
    const o = outlook(rows, "2002-07", "2026-11-05")!;
    expect(o.months.map((m) => [m.year, m.month])).toEqual([[2026, 12], [2027, 1], [2027, 2]]);
    expect(o.months[0].median).toBe(10); // 12 odd years at 10, 11 even at 30
    expect(o.months[0].p90).toBe(30);
    expect(o.months[2].share).toBe(0);
    expect(o.peak).toEqual({ month: 9, years: 23, of: 23 });
  });
  it("is null without dataThrough", () => expect(outlook(rows, "2002-07", null)).toBeNull());
});

describe("monthAverages", () => {
  it("averages full months over complete years and the incomplete month month-to-date", () => {
    const rows = [row("2024-11", 20, { mtd: 4 }), row("2025-11", 40, { mtd: 6 }), row("2026-11", 3, { mtd: 3 })];
    const a = monthAverages(rows, "harmonized", "2024-01", "2026-11-05");
    expect(a.full[10]).toBe(30);
    expect(a.full[0]).toBe(0);
    expect(a.partial).toEqual({ ym: "2026-11", average: 5 });
    expect(monthAverages(rows, "raw", "2024-01", "2026-11-05").partial).toEqual({ ym: "2026-11", average: null });
  });
});
