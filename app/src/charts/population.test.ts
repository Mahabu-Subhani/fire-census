// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import type { CubeRow, Population } from "../data/types";
import { areaPopulation, atLeast, levelOf, peopleByLevel, populationIndex, shiftAtViirs, yearlyLevels, type YearLevels } from "./population";

const row = (lon: number, lat: number, ym: string, harm: number, raw: number): CubeRow => ({
  lon, lat, ym, raw_modis: raw, raw_viirs: 0, harm, harm_lo: harm, harm_hi: harm, small: 0, terra_only: false, mtd: null,
});

const pop: Population = {
  source: "s", population_year: 2020, square_deg: 0.1, method: "m", region_population: 1000,
  squares: [[75.05, 30.05, 100], [75.15, 30.05, 200], [75.25, 30.05, 300], [75.35, 30.05, 400]],
};
const index = populationIndex(pop);

describe("levelOf", () => {
  it("uses the cut-offs 1, 10 and 50 a year", () => {
    expect([0.5, 1, 9.9, 10, 49, 50].map(levelOf)).toEqual(["none", "light", "light", "moderate", "moderate", "heavy"]);
  });
});

describe("peopleByLevel", () => {
  const rows = [row(75.05, 30.05, "2020-01", 60, 60), row(75.15, 30.05, "2020-01", 12, 80), row(75.25, 30.05, "2020-02", 2, 2)];
  it("puts each square's people in its level, and the rest of the area in none", () => {
    expect(peopleByLevel(rows, "harmonized", index, 1000, 1)).toEqual({ heavy: 100, moderate: 200, light: 300, none: 400 });
    expect(peopleByLevel(rows, "raw", index, 1000, 1)).toEqual({ heavy: 300, moderate: 0, light: 300, none: 400 });
  });
  it("divides by the length of the period to get a yearly rate", () => {
    expect(peopleByLevel(rows, "harmonized", index, 1000, 6)).toEqual({ heavy: 0, moderate: 100, light: 200, none: 700 });
  });
  it("never divides by less than one year", () => {
    expect(peopleByLevel(rows, "harmonized", index, 1000, 0.25).heavy).toBe(100);
  });
});

describe("areaPopulation", () => {
  it("uses the region total without a shape and the squares inside a shape", () => {
    expect(areaPopulation(pop, null)).toBe(1000);
    expect(areaPopulation(pop, [[75.1, 30], [75.3, 30], [75.3, 30.1], [75.1, 30.1]])).toBe(500);
  });
});

describe("yearlyLevels", () => {
  it("starts at the first full harmonized year and drops the year still running", () => {
    const rows = [row(75.05, 30.05, "2002-08", 60, 60), row(75.05, 30.05, "2003-05", 60, 60), row(75.05, 30.05, "2026-10", 60, 60)];
    const ys = yearlyLevels(rows, index, 1000, "2002-07", "2026-11-10");
    expect(ys[0].year).toBe(2003);
    expect(ys[ys.length - 1].year).toBe(2025);
    expect(ys[0].harmonized.heavy).toBe(100);
    expect(ys[1].harmonized).toEqual({ heavy: 0, moderate: 0, light: 0, none: 1000 });
  });
});

describe("shiftAtViirs", () => {
  const year = (y: number, rawHeavy: number, harmHeavy: number): YearLevels => ({
    year: y,
    raw: { heavy: rawHeavy, moderate: 0, light: 0, none: 0 },
    harmonized: { heavy: harmHeavy, moderate: 50, light: 0, none: 0 },
  });
  it("compares the mean after 2012 with before, at the highest level 1 % of people live with", () => {
    const s = [2009, 2010, 2011, 2012, 2013, 2014].map((y) => year(y, y < 2012 ? 100 : 500, 100));
    const r = shiftAtViirs(s, 1000)!;
    expect(r.level).toBe("heavy");
    expect(r.before.raw).toBe(100);
    expect(r.after.raw).toBe(500);
    expect(r.after.harmonized).toBe(100);
  });
  it("drops to a lower level when almost nobody lives with heavy burning", () => {
    const s = [2009, 2010, 2011, 2012, 2013, 2014].map((y) => year(y, 0, 5));
    expect(shiftAtViirs(s, 1000)!.level).toBe("moderate");
    expect(atLeast(s[0].harmonized, "moderate")).toBe(55);
  });
  it("is null without three years on each side", () => {
    expect(shiftAtViirs([year(2011, 1, 1), year(2012, 1, 1)], 1000)).toBeNull();
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
