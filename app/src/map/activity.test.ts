// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import type { CubeRow } from "../data/types";
import { activityCells } from "./activity";

const row = (lon: number, lat: number, ym: string, harm: number, raw = 0): CubeRow => ({
  lon, lat, ym, raw_modis: raw, raw_viirs: 0, harm, harm_lo: harm, harm_hi: harm, small: 0, terra_only: false, mtd: null,
});

describe("activityCells", () => {
  const rows = [row(75.05, 30.05, "2020-10", 3, 1), row(75.05, 30.05, "2021-10", 1, 9), row(75.15, 30.05, "2020-10", 1), row(75.25, 30.05, "2020-10", 0)];

  it("sums each cell over months and drops empty cells", () => {
    const a = activityCells(rows, "harmonized", 0.1);
    expect(a.cells).toBe(2);
    expect(a.max).toBe(4);
    expect(a.collection.features.map((f) => f.properties.v)).toEqual([4, 1]);
    expect(a.collection.features[1].properties.t).toBeCloseTo(0.5);
  });

  it("uses the raw value in raw mode", () => {
    expect(activityCells(rows, "raw", 0.1).max).toBe(10);
  });

  it("draws a square of one cell around the centre", () => {
    const ring = activityCells(rows, "harmonized", 0.1).collection.features[0].geometry.coordinates[0];
    expect(ring[0][0]).toBeCloseTo(75.0);
    expect(ring[2][1]).toBeCloseTo(30.1);
  });

  it("is empty for no rows", () => {
    expect(activityCells([], "harmonized", 0.1)).toMatchObject({ cells: 0, max: 0 });
  });
});
