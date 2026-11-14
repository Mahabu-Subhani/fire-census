// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { CubeRow, Population } from "../data/types";
import { exposureMap, topThirdCut } from "./exposure";

const row = (lon: number, lat: number, harm: number): CubeRow =>
  ({ lon, lat, ym: "2025-11", raw_modis: harm, raw_viirs: 0, harm, harm_lo: harm, harm_hi: harm, small: 0, terra_only: false, mtd: null }) as CubeRow;

const pop = (squares: [number, number, number][]): Population =>
  ({ source: "test", population_year: 2020, square_deg: 0.1, method: "", region_population: squares.reduce((a, s) => a + s[2], 0), squares }) as Population;

describe("topThirdCut", () => {
  it("starts the top third of a list", () => {
    expect(topThirdCut([1, 2, 3, 4, 5, 6])).toBe(5);
    expect(topThirdCut([7])).toBe(7);
    expect(topThirdCut([])).toBe(Infinity);
  });
});

describe("exposureMap", () => {
  // Six burning squares, fire 10..60; population 100..600 in the same order, except the hottest is empty.
  const rows = [10, 20, 30, 40, 50, 60].map((v, i) => row(75 + i * 0.1, 30, v)).concat([row(76, 31, 1)]);
  const people = pop([[75, 30, 100], [75.1, 30, 200], [75.2, 30, 300], [75.3, 30, 400], [75.4, 30, 600], [80, 30, 500]]);

  it("classes squares by the area's top thirds of fire and population", () => {
    const e = exposureMap(rows, "harmonized", 0.1, people, null);
    // The square with fire 1 is below the minimum and is left out.
    expect(e.burning).toBe(6);
    const byFire = new Map(e.collection.features.map((f) => [f.properties.v, f.properties.c]));
    // Top third by fire: 50 and 60. Densest third of six squares: 500 and 600.
    expect(byFire.get(50)).toBe(2);
    expect(byFire.get(60)).toBe(1);
    expect(byFire.get(40)).toBe(0);
    expect(e.highFirePeople).toBe(600);
    expect(e.highDensePeople).toBe(600);
    expect(e.areaPeople).toBe(2100);
  });

  it("counts only the drawn area's people", () => {
    const box: [number, number][] = [[74.95, 29.9], [75.25, 29.9], [75.25, 30.1], [74.95, 30.1]];
    const inBox = rows.filter((r) => r.lon < 75.25);
    const e = exposureMap(inBox, "harmonized", 0.1, people, box);
    expect(e.areaPeople).toBe(600);
    expect(e.burning).toBe(3);
  });

  it("is empty without fire", () => {
    const e = exposureMap([], "harmonized", 0.1, people, null);
    expect(e.burning).toBe(0);
    expect(e.collection.features).toHaveLength(0);
  });
});
