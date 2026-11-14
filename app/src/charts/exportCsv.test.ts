// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import type { Meta } from "../data/types";
import { chartCsv, slug } from "./exportCsv";

const meta = { sources: ["MODIS C6.1", "VIIRS 375 m"], data_version: "0.2.0", code_commit: "abc123", data_through: "2026-11-05" } as Meta;

describe("chartCsv", () => {
  const csv = chartCsv({
    title: "Burning calendar", meta, mode: "harmonized", unit: "fire cells", area: "Córdoba province, Argentina",
    from: "2002-07", to: "2026-11", columns: ["month", "value"], rows: [["2026-11", 1.23456789], ["2026-10", null], ['a "b", c', 2]],
    notes: ["Median: 4"], exportedAt: new Date("2026-11-14T12:00:00Z"),
  });
  const lines = csv.split("\r\n");

  it("starts with provenance comments", () => {
    expect(lines[0]).toBe("# Fire Census chart data: Burning calendar");
    expect(csv).toContain("# Mode: Harmonized. Unit: fire cells");
    expect(csv).toContain("# Median: 4");
    expect(csv).toContain("# Data version: 0.2.0. Code commit: abc123. Data through: 2026-11-05. Exported: 2026-11-14T12:00:00.000Z");
  });
  it("writes the header and rows, escaping and leaving nulls blank", () => {
    const start = lines.indexOf("month,value");
    expect(lines.slice(start, start + 4)).toEqual(["month,value", "2026-11,1.234568", "2026-10,", '"a ""b"", c",2']);
  });
  it("copes with missing meta", () => {
    expect(chartCsv({ title: "t", meta: null, mode: "raw", unit: "u", area: "a", from: "", to: "", columns: ["x"], rows: [] })).toContain(
      "# Sources: not stated",
    );
  });
});

describe("slug", () => {
  it("makes a safe file name", () => expect(slug("Córdoba province, Argentina")).toBe("cordoba-province-argentina"));
});
