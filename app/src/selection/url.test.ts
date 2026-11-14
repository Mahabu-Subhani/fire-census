// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { buildUrlState, parseUrlState } from "./url";

describe("shareable link", () => {
  const state = {
    region: "punjab-haryana",
    polygon: [[75, 30], [76, 30], [76, 31]] as [number, number][],
    place: null,
    from: "2002-07",
    to: "2026-11",
    mode: "raw" as const,
    small: true,
  };

  it("round-trips the full state", () => {
    const parsed = parseUrlState(buildUrlState(state));
    expect(parsed).toEqual({ region: "punjab-haryana", polygon: state.polygon, from: "2002-07", to: "2026-11", mode: "raw", small: true });
  });

  it("leaves the area out when there is none", () => {
    const url = buildUrlState({ ...state, polygon: null });
    expect(url).not.toContain("a=");
    expect(parseUrlState(url).polygon).toBeUndefined();
  });

  it("ignores malformed values", () => {
    expect(parseUrlState("?a=1,2;3&from=2026-13&to=soon&m=fast")).toEqual({});
  });

  it("keeps the research view in the link, and leaves the overview out", () => {
    expect(parseUrlState(buildUrlState({ ...state, view: "research" })).view).toBe("research");
    expect(buildUrlState({ ...state, view: "overview" })).not.toContain("v=");
  });

  it("returns nothing for an empty query", () => {
    expect(parseUrlState("")).toEqual({});
  });
});
