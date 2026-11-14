// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import type { CubeRow, Population } from "../data/types";
import { areaPopulation, exposure, populationIndex, stepAtViirs, yearlyExposure } from "./population";

const row = (lon: number, lat: number, ym: string, harm: number, raw: number): CubeRow => ({
  lon, lat, ym, raw_modis: raw, raw_viirs: 0, harm, harm_lo: harm, harm_hi: harm, small: 0, terra_only: false, mtd: null,
});

const pop: Population = {
  source: "s", population_year: 2020, square_deg: 0.1, method: "m", region_population: 600,
  squares: [[75.05, 30.05, 100], [75.15, 30.05, 200], [75.25, 30.05, 300]],
};
const index = populationIndex(pop);

describe("exposure", () => {
  it("counts people only in squares at or above the threshold, summed over the rows", () => {
    const rows = [row(75.05, 30.05, "2020-01", 2, 2), row(75.05, 30.05, "2020-02", 1, 1), row(75.15, 30.05, "2020-01", 2, 9)];
    expect(exposure(rows, "harmonized", index)).toEqual({ people: 100, squares: 1 });
    expect(exposure(rows, "raw", index)).toEqual({ people: 300, squares: 2 });
  });
  it("gives zero people for a square with fire but no population entry", () => {
    expect(exposure([row(80.05, 30.05, "2020-01", 9, 9)], "harmonized", index)).toEqual({ people: 0, squares: 1 });
  });
});

describe("areaPopulation", () => {
  it("uses the region total without a shape and the squares inside a shape", () => {
    expect(areaPopulation(pop, null)).toBe(600);
    expect(areaPopulation(pop, [[75.1, 30], [75.3, 30], [75.3, 30.1], [75.1, 30.1]])).toBe(500);
  });
});

describe("yearlyExposure", () => {
  it("starts at the first full harmonized year and drops the year still running", () => {
    const rows = [row(75.05, 30.05, "2002-08", 5, 5), row(75.05, 30.05, "2003-05", 5, 5), row(75.05, 30.05, "2026-10", 5, 5)];
    const ys = yearlyExposure(rows, index, "2002-07", "2026-11-10");
    expect(ys[0].year).toBe(2003);
    expect(ys[ys.length - 1].year).toBe(2025);
    expect(ys[0]).toEqual({ year: 2003, raw: 100, harmonized: 100 });
    expect(ys[1]).toEqual({ year: 2004, raw: 0, harmonized: 0 });
  });
});

describe("stepAtViirs", () => {
  it("compares the mean after 2012 with the mean before", () => {
    const s = [2009, 2010, 2011, 2012, 2013, 2014].map((year) => ({ year, raw: year < 2012 ? 100 : 160, harmonized: 100 }));
    expect(stepAtViirs(s, "raw")).toBeCloseTo(0.6);
    expect(stepAtViirs(s, "harmonized")).toBeCloseTo(0);
  });
  it("is null without three years on each side", () => {
    expect(stepAtViirs([{ year: 2011, raw: 1, harmonized: 1 }, { year: 2012, raw: 2, harmonized: 2 }], "raw")).toBeNull();
  });
});

const pops = import.meta.glob<{ default: Population }>("../../public/data/*/population.json", { eager: true });
describe.each(Object.entries(pops))("real population file %s", (_p, f) => {
  it("has positive whole people on the 0.1 degree grid, adding up to the region total", () => {
    const d = f.default;
    expect(d.squares.length).toBeGreaterThan(0);
    for (const [lon, lat, n] of d.squares) {
      expect(Number.isInteger(n) && n > 0).toBe(true);
      expect(Math.abs(lon * 100 - Math.round(lon * 100))).toBeLessThan(1e-6);
      expect(Math.abs(lat * 100 - Math.round(lat * 100))).toBeLessThan(1e-6);
    }
    const sum = d.squares.reduce((s, q) => s + q[2], 0);
    expect(Math.abs(sum - d.region_population) / d.region_population).toBeLessThan(0.001);
  });
});
