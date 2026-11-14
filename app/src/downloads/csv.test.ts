// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import type { CubeRow, Meta, Region } from "../data/types";
import { buildSelectionCsv } from "./csv";

const region: Region = {
  id: "punjab-haryana", name: "Punjab and Haryana, India", bbox: [73.8, 27.6, 77.6, 32.6],
  cell_deg: 0.1, first_month: "2000-11", last_month: "2026-11", harmonized_from: "2002-07",
};
const meta = {
  level_shipped: "L2", level_name: "Hard floor", unit: "Aqua-equivalent fire cells", ladder: [], checks: [],
  curve: { day: [], night: [] }, data_version: "0.2.0", code_commit: "abc123", generated_at: "2026-11-14T05:45:09Z",
  data_through: "2026-11-05", nrt_from: "2026-08", sources: ["MODIS C6.1", "VIIRS 375 m"],
} as Meta;
const rows: CubeRow[] = [
  { lon: 75.05, lat: 30.05, ym: "2026-11", raw_modis: 2, raw_viirs: 7, harm: 2.5, harm_lo: 2, harm_hi: 3, small: 4, terra_only: false, mtd: 2.5 },
  { lon: 75.15, lat: 30.05, ym: "2001-10", raw_modis: 1, raw_viirs: 0, harm: 1, harm_lo: 1, harm_hi: 1, small: 0, terra_only: true, mtd: null },
];

function build(r = rows) {
  return buildSelectionCsv({
    region, meta, rows: r, from: "2000-11", to: "2026-11", mode: "harmonized",
    areaLabel: "Whole region", areaKm2: 210000, polygon: null, exportedAt: new Date("2026-11-14T12:00:00Z"),
  });
}

describe("buildSelectionCsv", () => {
  it("starts with provenance comments, then the header and one line per row", () => {
    const lines = build().trim().split("\r\n");
    const header = lines.findIndex((l) => !l.startsWith("#"));
    expect(lines[header]).toBe("lon,lat,month,raw_modis,raw_viirs,raw_total,harm,harm_lo,harm_hi,small,terra_only,mtd");
    expect(lines.length - header - 1).toBe(2);
    const text = lines.slice(0, header).join("\n");
    expect(text).toContain("MODIS C6.1; VIIRS 375 m");
    expect(text).toContain("Code commit: abc123");
    expect(text).toContain("Data through: 2026-11-05");
    expect(text).toContain("Aqua-equivalent fire cells");
  });

  it("writes the raw total and leaves a missing mtd empty", () => {
    const lines = build().trim().split("\r\n");
    expect(lines.at(-2)).toBe("75.05,30.05,2026-11,2,7,9,2.5,2,3,4,false,2.5");
    expect(lines.at(-1)).toBe("75.15,30.05,2001-10,1,0,1,1,1,1,0,true,");
  });

  it("still writes the header for an empty selection", () => {
    const lines = build([]).trim().split("\r\n");
    expect(lines.at(-1)?.startsWith("lon,lat")).toBe(true);
  });
});
