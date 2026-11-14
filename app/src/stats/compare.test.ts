// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { CubeRow } from "../data/types";
import { compareMonth, monthsBetween, seasonMonths, toSeries, verdictFor } from "./compare";

function row(ym: string, over: Partial<CubeRow> = {}): CubeRow {
  return {
    lon: 0, lat: 0, ym,
    raw_modis: 0, raw_viirs: 0,
    harm: 0, harm_lo: 0, harm_hi: 0,
    small: 0, terra_only: false, mtd: null,
    ...over,
  };
}

/** Novembers 2016 to 2025 with harm 10, 20, ..., 100 and mtd 1, 2, ..., 10; November 2026 so far: mtd 7.5. */
function novembers(now = 7.5): CubeRow[] {
  const rows: CubeRow[] = [];
  for (let i = 0; i < 10; i++) {
    rows.push(row(`${2016 + i}-11`, { harm: 10 * (i + 1), raw_modis: 10 * (i + 1), mtd: i + 1 }));
  }
  rows.push(row("2026-11", { harm: now, raw_modis: now, mtd: now }));
  return rows;
}

const base = { harmonizedFrom: "2016-01", dataThrough: "2026-11-05", baseline: "all" as const };

describe("verdictFor (decision 12)", () => {
  it("uses the agreed cut points", () => {
    expect(verdictFor(4, 10)).toBe("below");
    expect(verdictFor(5, 10)).toBe("near");
    expect(verdictFor(15, 10)).toBe("near");
    expect(verdictFor(16, 10)).toBe("above");
    expect(verdictFor(30, 10)).toBe("above");
    expect(verdictFor(31, 10)).toBe("far-above");
  });
  it("handles a zero median", () => {
    expect(verdictFor(3, 0)).toBe("far-above");
    expect(verdictFor(0, 0)).toBe("near");
  });
});

describe("compareMonth", () => {
  it("compares the incomplete current month month-to-date", () => {
    const c = compareMonth({ ...base, areaRows: novembers(), month: 11, mode: "harmonized" });
    expect(c.status).toBe("ok");
    expect(c.year).toBe(2026);
    expect(c.toDay).toBe(5);
    expect(c.value).toBe(7.5);
    expect(c.median).toBe(5.5); // mtd 1..10
    expect(c.rank).toEqual({ rank: 4, of: 11, tied: false });
    expect(c.ratio).toBeCloseTo(7.5 / 5.5);
    expect(c.verdict).toBe("near");
  });

  it("offers the last-10-years baseline", () => {
    const rows = [row("2010-11", { harm: 1000, mtd: 1000 }), ...novembers()];
    const from2010 = { ...base, harmonizedFrom: "2010-01" };
    const all = compareMonth({ ...from2010, areaRows: rows, month: 11, mode: "harmonized" });
    const last10 = compareMonth({ ...from2010, baseline: "last10", areaRows: rows, month: 11, mode: "harmonized" });
    expect(all.baselineYears).toHaveLength(16); // 2010 to 2025, empty years count as 0
    expect(last10.baselineYears).toEqual([2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
    expect(last10.median).toBe(5.5);
  });

  it("in raw mode, compares the last complete November, because raw has no month-to-date", () => {
    const c = compareMonth({ ...base, areaRows: novembers(), month: 11, mode: "raw" });
    expect(c.skippedIncomplete).toBe(true);
    expect(c.year).toBe(2025);
    expect(c.toDay).toBeNull();
    expect(c.value).toBe(100);
    expect(c.rank).toEqual({ rank: 1, of: 10, tied: false });
  });

  it("compares a complete month with full-month values", () => {
    const rows = [...novembers(), row("2026-10", { harm: 50 })];
    for (let y = 2016; y < 2026; y++) rows.push(row(`${y}-10`, { harm: 10 }));
    const c = compareMonth({ ...base, areaRows: rows, month: 10, mode: "harmonized" });
    expect(c.year).toBe(2026);
    expect(c.toDay).toBeNull();
    expect(c.median).toBe(10);
    expect(c.verdict).toBe("far-above");
  });

  it("compares an asked year's month with the years before it, on full months (decision 56)", () => {
    const c = compareMonth({ ...base, areaRows: novembers(), month: 11, year: 2023, mode: "harmonized" });
    expect(c.year).toBe(2023);
    expect(c.toDay).toBeNull();
    expect(c.value).toBe(80);
    expect(c.baselineYears).toEqual([2016, 2017, 2018, 2019, 2020, 2021, 2022]);
    expect(c.median).toBe(40);
    expect(c.rank).toEqual({ rank: 1, of: 8, tied: false });
    expect(c.years.every((d) => d.year <= 2023)).toBe(true);
  });

  it("an asked month that is the newest one is still month to date", () => {
    const c = compareMonth({ ...base, areaRows: novembers(), month: 11, year: 2026, mode: "harmonized" });
    expect(c.toDay).toBe(5);
    expect(c.value).toBe(7.5);
  });

  it("has no data for an asked month outside the harmonized record", () => {
    expect(compareMonth({ ...base, areaRows: novembers(), month: 11, year: 2010, mode: "harmonized" }).status).toBe("no-data");
    expect(compareMonth({ ...base, areaRows: novembers(), month: 12, year: 2026, mode: "harmonized" }).status).toBe("no-data");
  });

  it("uses last year for a month that has not come yet this year", () => {
    const c = compareMonth({ ...base, areaRows: [row("2025-12", { harm: 7 })], month: 12, mode: "harmonized" });
    expect(c.year).toBe(2025);
    expect(c.value).toBe(7);
  });

  it("says too little activity when the median and now are both below the minimum", () => {
    const rows = [row("2026-11", { harm: 2, mtd: 2 }), row("2020-11", { harm: 9, mtd: 3 })];
    const c = compareMonth({ ...base, areaRows: rows, month: 11, mode: "harmonized" });
    expect(c.status).toBe("too-little");
    expect(c.median).toBe(0);
    expect(c.verdict).toBeNull();
  });

  it("still judges a quiet history when now is busy", () => {
    const c = compareMonth({ ...base, areaRows: [row("2026-11", { harm: 40, mtd: 40 })], month: 11, mode: "harmonized" });
    expect(c.status).toBe("ok");
    expect(c.ratio).toBeNull();
    expect(c.verdict).toBe("far-above");
    expect(c.rank).toEqual({ rank: 1, of: 11, tied: false });
  });

  it("needs five earlier years", () => {
    const c = compareMonth({ ...base, harmonizedFrom: "2022-01", areaRows: novembers(), month: 11, mode: "harmonized" });
    expect(c.baselineYears).toEqual([2022, 2023, 2024, 2025]);
    expect(c.status).toBe("not-enough-history");
  });

  it("reports ties in rank", () => {
    const c = compareMonth({ ...base, areaRows: novembers(5), month: 11, mode: "harmonized" });
    expect(c.rank).toEqual({ rank: 6, of: 11, tied: true });
  });

  it("returns no data for an empty selection without dataThrough", () => {
    expect(compareMonth({ ...base, dataThrough: null, areaRows: [], month: 11, mode: "harmonized" }).status).toBe("no-data");
  });

  it("treats an empty selection with dataThrough as all zeros: too little to judge", () => {
    expect(compareMonth({ ...base, areaRows: [], month: 11, mode: "harmonized" }).status).toBe("too-little");
  });

  it("returns no data when this month's mtd is unknown", () => {
    const rows = [row("2026-11", { harm: 4, mtd: null })];
    expect(compareMonth({ ...base, areaRows: rows, month: 11, mode: "harmonized" }).status).toBe("no-data");
  });
});

describe("seasonMonths", () => {
  it("takes the busiest months until they hold half the activity, over complete years", () => {
    const rows = [
      row("2020-08", { harm: 50 }), row("2020-09", { harm: 30 }), row("2020-03", { harm: 20 }),
      row("2026-01", { harm: 999 }), // incomplete year: ignored
    ];
    expect(seasonMonths(rows, "2020-01", "2026-11-05")).toEqual({ months: [8], share: 0.5, firstYear: 2020, lastYear: 2025 });
    expect(seasonMonths(rows, "2020-01", "2026-11-05", 0.75)?.months).toEqual([8, 9]);
  });
  it("starts at the first complete harmonized year", () => {
    expect(seasonMonths([row("2002-08", { harm: 50 })], "2002-07", "2026-11-05")).toBeNull();
  });
  it("is null when there is too little activity", () => {
    expect(seasonMonths([row("2020-08", { harm: 2 })], "2020-01", "2026-11-05")).toBeNull();
    expect(seasonMonths([], "2020-01", null)).toBeNull();
  });
});

describe("monthsBetween and toSeries", () => {
  it("lists months across a year end", () => {
    expect(monthsBetween("2020-11", "2021-02")).toEqual(["2020-11", "2020-12", "2021-01", "2021-02"]);
  });
  it("fills empty months with zero and keeps small fires separate", () => {
    const rows = [row("2020-11", { harm: 2, harm_lo: 1, harm_hi: 3, small: 5, raw_viirs: 9 }), row("2021-01", { harm: 1, harm_lo: 1, harm_hi: 1 })];
    expect(toSeries(rows, "harmonized", "2020-11", "2021-01")).toEqual([
      { ym: "2020-11", value: 2, lo: 1, hi: 3, small: 5 },
      { ym: "2020-12", value: 0, lo: 0, hi: 0, small: 0 },
      { ym: "2021-01", value: 1, lo: 1, hi: 1, small: 0 },
    ]);
    expect(toSeries(rows, "raw", "2020-11", "2020-11")[0]).toEqual({ ym: "2020-11", value: 9, lo: 9, hi: 9, small: 5 });
  });
  it("is empty for an empty range", () => expect(toSeries([], "harmonized", "", "")).toEqual([]));
});
