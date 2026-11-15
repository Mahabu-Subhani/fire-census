// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import type { Check, Meta, Region } from "../data/types";
import { calibrationText, formatValue, isAddedAfter, shortVersion, summarizeChecks, summaryText } from "./checks";

const check = (id: string, verdict: Check["verdict"], note = ""): Check => ({ id, name: id, value: null, threshold: "", verdict, note });

const checks = [
  check("C0", "pass"), check("C1", "pass"), check("C3", "fail"),
  check("C3r", "pass", "revised held-out check, added after results"), check("C6", "not run"),
];

describe("summarizeChecks", () => {
  it("counts verdicts and separates the check added after results", () => {
    expect(summarizeChecks(checks)).toEqual({ pass: 3, fail: 1, notRun: 1, preRegistered: 4, addedAfter: 1 });
    expect(isAddedAfter(checks[3])).toBe(true);
  });
  it("writes a summary that leaves out zero counts", () => {
    expect(summaryText(checks)).toBe("3 passed, 1 failed, 1 not run");
    expect(summaryText([check("C0", "pass")])).toBe("1 passed");
    expect(summaryText([])).toBe("no checks");
  });
});

describe("formatValue", () => {
  it("keeps text, rounds long numbers and names missing values", () => {
    expect(formatValue("slope 1.024, correlation 0.995")).toBe("slope 1.024, correlation 0.995");
    expect(formatValue(-0.00412)).toBe("-0.004");
    expect(formatValue(103)).toBe("103");
    expect(formatValue(null)).toBe("none");
  });
});

const base = { ladder: [], checks: [], curve: { day: [], night: [] }, data_version: "", code_commit: "", generated_at: "", sources: [] };

describe("shortVersion", () => {
  it("states the floor from meta for the hard floor", () => {
    const text = shortVersion({ ...base, level_shipped: "L2", floor_mw: { day: 4.95, night: 3.81 } } as Meta);
    expect(text).toContain("above 4.95 MW by day and 3.81 MW by night");
  });
  it("mentions the curve for the detection curve", () => {
    expect(shortVersion({ ...base, level_shipped: "S0" } as Meta)).toContain("curve");
  });
  it("states the ratio for the constant-ratio fallback", () => {
    expect(shortVersion({ ...base, level_shipped: "L1r", constants: { day: 0.3888, night: 0.1599 } } as Meta)).toContain("0.3888 by day");
  });
  it("says the constant is fitted per calendar month when the data has twelve of them (decision 57)", () => {
    const monthly = { constants_by_month: { day: Array.from({ length: 12 }, () => 0.4) } };
    const floor = shortVersion({ ...base, ...monthly, level_shipped: "L2", floor_mw: { day: 4.78, night: 4.17 } } as Meta);
    expect(floor).toContain("above 4.78 MW by day");
    expect(floor).toContain("constant fitted for each calendar month");
    const ratio = shortVersion({ ...base, ...monthly, level_shipped: "L1r", constants: { day: 0.17, night: 0.02 } } as Meta);
    expect(ratio).toContain("fitted for each calendar month");
    expect(ratio).not.toContain("constant ratio");
    // Older data without the field keeps the old wording.
    expect(shortVersion({ ...base, level_shipped: "L2" } as Meta)).not.toContain("calendar month");
  });
});

describe("calibrationText", () => {
  const cordoba = { id: "cordoba", name: "Córdoba province, Argentina" } as Region;
  const chilecito = { id: "chilecito", name: "Chilecito" } as Region;
  const meta = { ...base, level_shipped: "S0", calibration: { months: ["2012-02", "2017-12"], reference_pair: "Aqua MODIS and S-NPP VIIRS", area: "cordoba" } } as Meta;
  it("says when an area borrows another region's calibration", () => {
    expect(calibrationText(meta, chilecito, [cordoba, chilecito])).toBe(
      "This area has too few fires of its own, so it uses the calibration of Córdoba province, Argentina: Aqua MODIS and S-NPP VIIRS, February 2012 to December 2017.",
    );
  });
  it("describes its own calibration otherwise", () => {
    expect(calibrationText(meta, cordoba, [cordoba])).toBe("Calibrated on this region: Aqua MODIS and S-NPP VIIRS, February 2012 to December 2017.");
  });
});
