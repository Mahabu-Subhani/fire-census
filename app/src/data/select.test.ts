// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { bboxToPolygon, circlePolygon, countCellCentres, overlapsBBox, pointInPolygon, polygonAreaKm2, selectCells } from "./select";
import type { CubeRow } from "./types";

function row(lon: number, lat: number, ym: string, harm = 1): CubeRow {
  return {
    lon, lat, ym, raw_modis: 1, raw_viirs: 2, harm, harm_lo: harm, harm_hi: harm,
    small: 0, terra_only: false, mtd: null,
  };
}

const cube: CubeRow[] = [
  row(75.05, 30.05, "2010-10"),
  row(75.05, 30.05, "2020-10"),
  row(76.55, 31.55, "2020-11"),
  row(74.05, 28.05, "2026-11"),
];

describe("pointInPolygon", () => {
  const square = bboxToPolygon([75, 30, 76, 31]);
  it("finds a point inside", () => expect(pointInPolygon(75.5, 30.5, square)).toBe(true));
  it("rejects a point outside", () => expect(pointInPolygon(76.5, 30.5, square)).toBe(false));
});

describe("selectCells", () => {
  it("returns every row in range when there is no polygon", () => {
    expect(selectCells(cube, null, "2000-01", "2026-12")).toHaveLength(4);
  });
  it("filters by month, inclusive at both ends", () => {
    expect(selectCells(cube, null, "2020-10", "2020-11")).toHaveLength(2);
  });
  it("filters by polygon", () => {
    const rows = selectCells(cube, bboxToPolygon([75, 30, 76, 31]), "2000-01", "2026-12");
    expect(rows.map((r) => r.ym)).toEqual(["2010-10", "2020-10"]);
  });
  it("returns nothing for a polygon outside the region", () => {
    expect(selectCells(cube, bboxToPolygon([10, 10, 11, 11]), "2000-01", "2026-12")).toEqual([]);
  });
  it("returns nothing for an empty cube", () => {
    expect(selectCells([], null, "2000-01", "2026-12")).toEqual([]);
  });
  it("returns nothing when the range is reversed", () => {
    expect(selectCells(cube, null, "2026-12", "2000-01")).toEqual([]);
  });
});

describe("polygonAreaKm2", () => {
  it("measures a 1 degree square at the equator as about 12,390 km²", () => {
    expect(polygonAreaKm2(bboxToPolygon([0, -0.5, 1, 0.5]))).toBeCloseTo(12392, -2);
  });
  it("is smaller at 30 degrees latitude", () => {
    const area = polygonAreaKm2(bboxToPolygon([75, 29.5, 76, 30.5]));
    expect(area).toBeGreaterThan(10500);
    expect(area).toBeLessThan(10900);
  });
  it("is zero for fewer than three points", () => expect(polygonAreaKm2([[0, 0], [1, 1]])).toBe(0));
});

describe("overlapsBBox", () => {
  it("detects overlap", () => expect(overlapsBBox(bboxToPolygon([75.5, 30.5, 80, 35]), [73.8, 27.6, 77.6, 32.6])).toBe(true));
  it("detects no overlap", () => expect(overlapsBBox(bboxToPolygon([10, 10, 11, 11]), [73.8, 27.6, 77.6, 32.6])).toBe(false));
});

describe("circlePolygon", () => {
  it("has about the area of a circle", () => {
    const area = polygonAreaKm2(circlePolygon(75, 30, 20));
    expect(area).toBeGreaterThan(0.98 * Math.PI * 400);
    expect(area).toBeLessThan(Math.PI * 400);
  });
});

describe("countCellCentres", () => {
  const bbox: [number, number, number, number] = [73.8, 27.6, 77.6, 32.6];
  it("counts the cells of a 1 degree box as 100", () => {
    expect(countCellCentres(bboxToPolygon([74.8, 28.6, 75.8, 29.6]), bbox, 0.1)).toBe(100);
  });
  it("finds no cell in an area smaller than a cell between centres", () => {
    expect(countCellCentres(bboxToPolygon([74.81, 28.61, 74.84, 28.64]), bbox, 0.1)).toBe(0);
  });
  it("finds no cell outside the region", () => {
    expect(countCellCentres(bboxToPolygon([10, 10, 11, 11]), bbox, 0.1)).toBe(0);
  });
  it("counts the whole region", () => {
    expect(countCellCentres(bboxToPolygon(bbox), bbox, 0.1)).toBe(38 * 50);
  });
});
