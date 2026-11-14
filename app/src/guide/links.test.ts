// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { firmsLiveUrl, ringBBox } from "./links";

describe("firmsLiveUrl", () => {
  it("centres on the box and zooms in more for a smaller box", () => {
    const region = firmsLiveUrl([73.8, 27.6, 77.6, 32.6]);
    expect(region).toBe("https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@75.700,30.100,5.7z");
    const district = firmsLiveUrl([75.5, 30.7, 76.0, 31.0]);
    expect(Number(district.match(/,([\d.]+)z$/)![1])).toBeGreaterThan(5.7);
  });
  it("never zooms past street level for a tiny box", () => {
    expect(firmsLiveUrl([75, 30, 75.0001, 30.0001])).toMatch(/,(\d+\.\d)z$/);
    expect(Number(firmsLiveUrl([75, 30, 75.0001, 30.0001]).match(/,([\d.]+)z$/)![1])).toBeLessThanOrEqual(12);
  });
});

describe("ringBBox", () => {
  it("finds the box of a ring", () => expect(ringBBox([[1, 2], [3, -1], [0, 5]])).toEqual([0, -1, 3, 5]));
});
