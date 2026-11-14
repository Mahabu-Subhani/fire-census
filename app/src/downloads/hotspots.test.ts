// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { bboxToPolygon } from "../data/select";
import type { Meta, Region } from "../data/types";
import { buildHotspotCsv, filterHotspots, gunzipText, isHtml, splitCsvLine, yearsInRange } from "./hotspots";

const FILE = [
  "latitude,longitude,bright_ti4,acq_date,acq_time,satellite,instrument,confidence,frp,daynight,harm_class",
  "30.50,75.50,330.1,2020-10-15,0812,N,VIIRS,n,4.2,D,harmonized",
  "30.60,75.60,315.0,2020-11-02,0812,N,VIIRS,l,1.1,D,small",
  "31.90,77.40,340.0,2020-10-20,0812,N,VIIRS,h,9.9,D,harmonized",
  "30.40,75.40,320.0,2020-12-01,2030,N,VIIRS,n,3.0,N,excluded",
  "",
].join("\n");

describe("yearsInRange", () => {
  it("lists every year in the range", () => expect(yearsInRange("2019-11", "2021-02")).toEqual([2019, 2020, 2021]));
  it("is empty for a reversed range", () => expect(yearsInRange("2021-01", "2019-01")).toEqual([]));
});

describe("splitCsvLine", () => {
  it("keeps commas and doubled quotes inside quotes", () => {
    expect(splitCsvLine('a,"b, c","say ""hi""",d')).toEqual(["a", "b, c", 'say "hi"', "d"]);
  });
});

describe("filterHotspots", () => {
  it("keeps the header and passes rows through unchanged", () => {
    const r = filterHotspots(FILE, null, "2020-01", "2020-12");
    expect(r.header.startsWith("latitude,longitude")).toBe(true);
    expect(r.lines).toHaveLength(4);
    expect(r.lines[0]).toBe("30.50,75.50,330.1,2020-10-15,0812,N,VIIRS,n,4.2,D,harmonized");
  });
  it("filters by month, inclusive at both ends", () => {
    expect(filterHotspots(FILE, null, "2020-10", "2020-11").lines).toHaveLength(3);
    expect(filterHotspots(FILE, null, "2020-11", "2020-11").lines).toHaveLength(1);
  });
  it("filters by the drawn area", () => {
    const r = filterHotspots(FILE, bboxToPolygon([75, 30, 76, 31]), "2020-01", "2020-12");
    expect(r.lines.map((l) => l.split(",")[3])).toEqual(["2020-10-15", "2020-11-02", "2020-12-01"]);
  });
  it("returns nothing for an area with no detections", () => {
    expect(filterHotspots(FILE, bboxToPolygon([10, 10, 11, 11]), "2020-01", "2020-12").lines).toEqual([]);
  });
  it("refuses a file without the needed columns", () => {
    expect(() => filterHotspots("a,b,c\n1,2,3", null, "2020-01", "2020-12")).toThrow(/latitude/);
  });
  it("handles Windows line endings and an empty file", () => {
    expect(filterHotspots(FILE.replace(/\n/g, "\r\n"), null, "2020-01", "2020-12").lines).toHaveLength(4);
    expect(filterHotspots("", null, "2020-01", "2020-12")).toEqual({ header: "", lines: [] });
  });
});

describe("gunzipText", () => {
  it("unzips gzip bytes", async () => {
    const zipped = await new Response(new Blob([FILE]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    expect(await gunzipText(zipped)).toBe(FILE);
  });
  it("reads plain text when the server already removed the compression", async () => {
    expect(await gunzipText(new TextEncoder().encode(FILE).buffer)).toBe(FILE);
  });
});

describe("buildHotspotCsv", () => {
  const region = { id: "punjab-haryana", name: "Punjab and Haryana, India" } as Region;
  const meta = { sources: ["MODIS C6.1", "VIIRS 375 m"], data_version: "0.2.0", code_commit: "abc123" } as Meta;
  it("puts provenance first, then the original header and rows, and names missing years", () => {
    const { header, lines } = filterHotspots(FILE, null, "2020-10", "2020-10");
    const csv = buildHotspotCsv({ region, meta, header, lines, from: "2020-10", to: "2020-10", areaLabel: "Whole region", polygon: null, missingYears: [2019], exportedAt: new Date("2026-11-14T12:00:00Z") });
    const out = csv.trim().split("\r\n");
    const h = out.findIndex((l) => !l.startsWith("#"));
    expect(out[h]).toBe(header);
    expect(out.length - h - 1).toBe(2);
    expect(out.slice(0, h).join("\n")).toContain("No hotspot file for: 2019");
    expect(out.slice(0, h).join("\n")).toContain("Code commit: abc123");
  });
});

describe("isHtml", () => {
  it("spots a server's fallback page answering for a missing file", () => {
    expect(isHtml(new Response("<!doctype html>", { headers: { "content-type": "text/html; charset=utf-8" } }))).toBe(true);
    expect(isHtml(new Response("x", { headers: { "content-type": "application/gzip" } }))).toBe(false);
  });
});
