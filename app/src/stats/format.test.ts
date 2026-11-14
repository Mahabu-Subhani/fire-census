// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { fmtDiff, fmtShare, fmtTick, fmtValue } from "./format";

describe("number formats", () => {
  it("shows harmonized values with exactly two decimals", () => {
    expect(fmtValue(131234.5678)).toBe("131,234.57");
    expect(fmtValue(44.1)).toBe("44.10");
    expect(fmtValue(0)).toBe("0.00");
  });
  it("shows raw counts as whole numbers", () => expect(fmtValue(5321, "raw")).toBe("5,321"));
  it("signs differences and never shortens them", () => {
    expect(fmtDiff(1234.5)).toBe("+1,234.50");
    expect(fmtDiff(-3.104)).toBe("−3.10");
    expect(fmtDiff(0)).toBe("0.00");
  });
  it("writes axis ticks in full", () => {
    expect(fmtTick(12000)).toBe("12,000");
    expect(fmtTick(0.25)).toBe("0.25");
  });
  it("writes shares with one decimal", () => expect(fmtShare(0.7843)).toBe("78.4%"));
});
