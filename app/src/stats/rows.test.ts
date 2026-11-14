// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { CubeRow, Meta } from "../data/types";
import { monthHistory, RAW_UNIT, toCalendar, unitLabel, value } from "./rows";

function row(ym: string, over: Partial<CubeRow> = {}): CubeRow {
  return {
    lon: 0, lat: 0, ym,
    raw_modis: 0, raw_viirs: 0,
    harm: 0, harm_lo: 0, harm_hi: 0,
    small: 0, terra_only: false, mtd: null,
    ...over,
  };
}

describe("value", () => {
  const r = row("2015-03", { raw_modis: 3, raw_viirs: 10, harm: 4.5, small: 7 });
  it("adds both sensors in raw mode", () => expect(value(r, "raw")).toBe(13));
  it("uses harm in harmonized mode, never adding the small-fire layer", () => expect(value(r, "harmonized")).toBe(4.5));
});

describe("unitLabel", () => {
  const meta = { unit: "Aqua-equivalent fire cells" } as Meta;
  it("takes the harmonized unit from meta", () => expect(unitLabel(meta, "harmonized")).toBe("Aqua-equivalent fire cells"));
  it("says so when meta has no unit", () => expect(unitLabel(null, "harmonized")).toMatch(/not stated/));
  it("takes the raw unit from meta.unit_raw", () =>
    expect(unitLabel({ ...meta, unit_raw: "FIRMS hotspot detections" } as Meta, "raw")).toBe("FIRMS hotspot detections"));
  it("falls back to a raw label, never the harmonized unit, when unit_raw is missing", () => expect(unitLabel(meta, "raw")).toBe(RAW_UNIT));
});

describe("toCalendar", () => {
  it("returns no years for an empty selection without a range", () => {
    expect(toCalendar([], "harmonized")).toEqual({ years: [], cells: [] });
  });

  it("fills zeros inside the range and nulls outside it for an empty selection", () => {
    const cal = toCalendar([], "harmonized", { from: "2020-11", to: "2021-02" });
    expect(cal.years).toEqual([2020, 2021]);
    expect(cal.cells[0].slice(9)).toEqual([null, 0, 0]);
    expect(cal.cells[1].slice(0, 3)).toEqual([0, 0, null]);
  });

  it("sums cells of the same month and treats a month with no rows as 0", () => {
    const rows = [
      row("2020-01", { harm: 1.5, raw_modis: 1 }),
      row("2020-01", { harm: 2, raw_viirs: 4 }),
      row("2020-03", { harm: 3 }),
    ];
    const cal = toCalendar(rows, "harmonized");
    expect(cal.years).toEqual([2020]);
    expect(cal.cells[0]).toEqual([3.5, 0, 3, null, null, null, null, null, null, null, null, null]);
    expect(toCalendar(rows, "raw").cells[0][0]).toBe(5);
  });

  it("ignores rows outside the range", () => {
    const cal = toCalendar([row("2019-12", { harm: 9 }), row("2020-01", { harm: 1 })], "harmonized", {
      from: "2020-01",
      to: "2020-01",
    });
    expect(cal.years).toEqual([2020]);
    expect(cal.cells[0][0]).toBe(1);
  });
});

describe("monthHistory", () => {
  const span = { first: "2018-01", last: "2020-11" };
  const rows = [
    row("2018-11", { harm: 10, raw_modis: 8, mtd: 2 }),
    row("2018-11", { harm: 5, raw_modis: 1, raw_viirs: 1, mtd: 1 }),
    // 2019 has no November rows at all.
    row("2019-10", { harm: 99 }),
    // The incomplete current month: data runs to 5 Nov 2020, so harm == mtd.
    row("2020-11", { harm: 4, raw_modis: 3, mtd: 4 }),
  ];

  it("gives every year in the span, with 0 for a year with no rows", () => {
    expect(monthHistory(rows, 11, "harmonized", false, span)).toEqual([
      { year: 2018, value: 15 },
      { year: 2019, value: 0 },
      { year: 2020, value: 4 },
    ]);
  });

  it("uses mtd for the incomplete month and the same month in earlier years", () => {
    expect(monthHistory(rows, 11, "harmonized", true, span)).toEqual([
      { year: 2018, value: 3 },
      { year: 2019, value: 0 },
      { year: 2020, value: 4 },
    ]);
  });

  it("sums the raw record without mtd", () => {
    expect(monthHistory(rows, 11, "raw", false, span).map((d) => d.value)).toEqual([10, 0, 3]);
  });

  it("returns null in raw mode with mtd, because mtd exists only for the harmonized record", () => {
    expect(monthHistory(rows, 11, "raw", true, span).map((d) => d.value)).toEqual([null, null, null]);
  });

  it("treats a null mtd as unknown, not zero", () => {
    const bad = [row("2018-11", { harm: 3, mtd: 3 }), row("2018-11", { harm: 2, mtd: null })];
    expect(monthHistory(bad, 11, "harmonized", true, span)[0]).toEqual({ year: 2018, value: null });
  });

  it("leaves out years whose month falls outside the span", () => {
    expect(monthHistory(rows, 12, "harmonized", false, span).map((d) => d.year)).toEqual([2018, 2019]);
  });

  it("returns nothing for an empty selection without a span", () => {
    expect(monthHistory([], 11, "harmonized", false)).toEqual([]);
  });

  it("returns zeros for an empty selection with a span", () => {
    expect(monthHistory([], 11, "harmonized", true, span).map((d) => d.value)).toEqual([0, 0, 0]);
  });
});
