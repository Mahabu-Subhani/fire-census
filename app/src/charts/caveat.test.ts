// AI-assisted: written with help from Claude (Anthropic). Reviewed by: Mahabu Subhani (pending).
// A "below normal" month is fewer fires *seen*: the answer line says so, and no other verdict carries the caveat.
import { describe, expect, it, vi } from "vitest";

vi.mock("../selection", () => ({ useSelection: () => ({}), useSelectionActions: () => ({}) }));
const { caveatFor, BELOW_NORMAL_CAVEAT } = await import("./UnusualBanner");

describe("caveatFor", () => {
  it("adds the detection caveat to below normal only", () => {
    expect(caveatFor("below")).toBe(BELOW_NORMAL_CAVEAT);
    expect(BELOW_NORMAL_CAVEAT).toContain("does not prove there was less burning");
    for (const v of ["near", "above", "far-above", null, undefined]) expect(caveatFor(v)).toBe("");
  });
});
