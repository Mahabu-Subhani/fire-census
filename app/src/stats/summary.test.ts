// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
import { describe, expect, it } from "vitest";
import { formatRank, formatRatio, median, ordinal, p90, quantile, rank } from "./summary";

describe("median", () => {
  it("is null for an empty list", () => expect(median([])).toBeNull());
  it("takes the middle of an odd list", () => expect(median([5, 1, 3])).toBe(3));
  it("averages the middle two of an even list", () => expect(median([4, 1, 3, 2])).toBe(2.5));
  it("is 0 when most values are 0", () => expect(median([0, 0, 0, 7])).toBe(0));
  it("does not reorder the input", () => {
    const list = [3, 1, 2];
    median(list);
    expect(list).toEqual([3, 1, 2]);
  });
});

describe("p90", () => {
  it("is null for an empty list", () => expect(p90([])).toBeNull());
  it("is the value itself for one value", () => expect(p90([7])).toBe(7));
  it("interpolates between ranks", () => expect(p90([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBeCloseTo(10));
  it("matches numpy's default on 0..9", () => expect(quantile([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0.9)).toBeCloseTo(8.1));
});

describe("rank", () => {
  it("ranks from the top", () => expect(rank(8, [3, 9, 8, 1])).toEqual({ rank: 2, of: 4, tied: false }));
  it("gives tied values the same best rank", () => {
    expect(rank(5, [9, 5, 5, 1])).toEqual({ rank: 2, of: 4, tied: true });
    expect(rank(1, [9, 5, 5, 1])).toEqual({ rank: 4, of: 4, tied: false });
  });
  it("marks a tie for highest", () => expect(rank(0, [0, 0, 0])).toEqual({ rank: 1, of: 3, tied: true }));
  it("is null when the value is not in the list", () => expect(rank(4, [1, 2])).toBeNull());
  it("is null for an empty list", () => expect(rank(0, [])).toBeNull());
});

describe("formatRank", () => {
  it("writes the plain case", () => expect(formatRank({ rank: 2, of: 24, tied: false })).toBe("2nd highest of 24"));
  it("writes the top case", () => expect(formatRank({ rank: 1, of: 24, tied: false })).toBe("highest of 24"));
  it("says lowest for an untied last place", () => expect(formatRank({ rank: 25, of: 25, tied: false })).toBe("lowest of 25"));
  it("keeps the rank for a tied last place", () => expect(formatRank({ rank: 24, of: 25, tied: true })).toBe("joint 24th highest of 25"));
  it("writes ties", () => expect(formatRank({ rank: 3, of: 25, tied: true })).toBe("joint 3rd highest of 25"));
  it("handles 11th to 13th", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "111th",
    ]);
  });
});

describe("formatRatio", () => {
  it("keeps two decimals below 1", () => expect(formatRatio(138 / 2398)).toBe("0.06"));
  it("keeps one decimal from 1", () => expect(formatRatio(2.44)).toBe("2.4"));
});
