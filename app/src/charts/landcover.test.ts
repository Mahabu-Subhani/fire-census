// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { LandCover } from "../data/types";
import { landCoverRows, totals } from "./LandCover";

const groups = [
  { id: "cropland", name: "Cropland", classes: ["Cropland"] },
  { id: "forest", name: "Forest", classes: ["Tree cover"] },
  { id: "grass_shrub", name: "Grass and shrub", classes: ["Grassland"] },
  { id: "other", name: "Other", classes: ["Built-up"] },
];
const z = { cropland: 0, forest: 0, grass_shrub: 0, other: 0 };
const lc: LandCover = {
  source: "s", method: "m", groups, share_by_class: {}, unlabelled_fire_cells: 0,
  years: [
    { year: 2020, harmonized: { cropland: 30, forest: 10, grass_shrub: 0, other: 0 }, small: z },
    { year: 2021, harmonized: { cropland: 0, forest: 0, grass_shrub: 0, other: 0 }, small: z },
  ],
  months: [{ month: 11, harmonized: { cropland: 3, forest: 1, grass_shrub: 0, other: 0 }, small: { cropland: 5, forest: 0, grass_shrub: 0, other: 0 } }],
};

describe("landCoverRows", () => {
  it("gives each group its share of the bar, and drops empty bars", () => {
    const r = landCoverRows(lc, "year", "harmonized");
    expect(r).toHaveLength(4);
    expect(r.find((x) => x.group === "cropland")!.share).toBeCloseTo(0.75);
    expect(r.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });
  it("reads the small-fire layer separately", () => {
    expect(landCoverRows(lc, "month", "small").find((x) => x.group === "cropland")!.share).toBe(1);
  });
  it("totals across bars", () => {
    expect(totals(landCoverRows(lc, "year", "harmonized"), groups).forest).toBeCloseTo(0.25);
  });
});

const files = import.meta.glob<{ default: LandCover }>("../../public/data/*/landcover.json", { eager: true });
describe.each(Object.entries(files))("real land-cover file %s", (_p, f) => {
  it("has the four groups and no negative counts", () => {
    const d = f.default;
    expect(d.groups.map((g) => g.id)).toEqual(["cropland", "forest", "grass_shrub", "other"]);
    for (const y of d.years) for (const v of [...Object.values(y.harmonized), ...Object.values(y.small)]) expect(v).toBeGreaterThanOrEqual(0);
    expect(d.months.length).toBeGreaterThan(0);
  });
});
