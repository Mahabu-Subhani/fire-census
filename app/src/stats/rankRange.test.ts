// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import { formatRankRange, rankRange } from "./summary";

const sure = (v: number) => ({ value: v, uncertain: false });
const unsure = (v: number) => ({ value: v, uncertain: true });

describe("rankRange", () => {
  it("is null without a usable sigma", () => {
    expect(rankRange(unsure(5), [unsure(4)], null)).toBeNull();
    expect(rankRange(unsure(5), [unsure(4)], 0)).toBeNull();
  });

  it("collapses to the exact rank when nothing is uncertain", () => {
    expect(rankRange(sure(5), [sure(9), sure(1), sure(3)], 0.3)).toEqual({ lo: 2, hi: 2 });
  });

  it("stays put when the gaps are far larger than the error", () => {
    expect(rankRange(unsure(10), [sure(1000), sure(1), unsure(0.01)], 0.2)).toEqual({ lo: 2, hi: 2 });
  });

  it("widens when neighbours are close", () => {
    const r = rankRange(unsure(10), [unsure(10.5), unsure(9.5), sure(100)], 0.25)!;
    expect(r.lo).toBe(2);
    expect(r.hi).toBe(4);
  });

  it("is reproducible", () => {
    const others = [unsure(11), unsure(9), unsure(12)];
    expect(rankRange(unsure(10), others, 0.3)).toEqual(rankRange(unsure(10), others, 0.3));
  });
});

describe("formatRankRange", () => {
  it("writes a span", () => expect(formatRankRange({ lo: 21, hi: 24 })).toBe("21st to 24th"));
  it("is empty for one place or none", () => {
    expect(formatRankRange({ lo: 3, hi: 3 })).toBe("");
    expect(formatRankRange(null)).toBe("");
  });
});
