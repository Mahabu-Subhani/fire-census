// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Renders the panel with the real meta.json of each region and checks that
// every check appears with its verdict, failed ones included.
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CubeRow, DriftFile, Meta, Region } from "../data/types";

const files = import.meta.glob<{ default: unknown }>("../../public/data/**/{regions,meta,drift}.json", { eager: true });
const read = (path: string) => files[`../../public/data/${path}`].default;
const regions = read("regions.json") as Region[];
const current: { meta: Meta | null; region: Region | null; areaRows: CubeRow[]; drift: DriftFile | null } = { meta: null, region: null, areaRows: [], drift: null };

vi.mock("../selection", () => ({
  useSelection: () => current,
  useSelectionActions: () => ({ regions }),
}));

const { default: EvidencePanel, ChecksBadge } = await import("./EvidencePanel");

describe.each(regions.map((r) => [r.id, r]))("EvidencePanel with real data: %s", (_id, region) => {
  it("lists every check with its verdict and the shipped method", () => {
    current.region = region as Region;
    current.meta = read(`${(region as Region).id}/meta.json`) as Meta;
    current.drift = read(`${(region as Region).id}/drift.json`) as DriftFile;
    current.areaRows = [{ obs: 28 }, { obs: 30 }, { obs: null }] as CubeRow[];
    const html = renderToString(<EvidencePanel />);
    expect(html).toContain("Aqua MODIS orbital drift.");
    expect(html).toContain("Clear-view days.");
    for (const c of current.meta!.checks) {
      expect(html).toContain(`<strong>${c.id}<!-- -->. <!-- -->`);
    }
    const failed = current.meta!.checks.filter((c) => c.verdict === "fail").length;
    expect((html.match(/ev-check ev-fail/g) ?? []).length).toBe(failed);
    expect(html).toContain(current.meta!.level_name ?? current.meta!.level_shipped);
    expect(renderToString(<ChecksBadge />)).toContain("Checks:");
  });
});

describe("addedAfterNote", async () => {
  const { addedAfterNote } = await import("./EvidencePanel");
  it("calls only C3r a revision; C1x and C6m are additions that replace nothing", () => {
    expect(addedAfterNote("C3r")).toContain("revised version of C3");
    expect(addedAfterNote("C1x")).toContain("does not replace C1");
    expect(addedAfterNote("C6m")).toContain("does not replace C6");
    expect(addedAfterNote("C3x")).toContain("does not replace C3");
    for (const id of ["C1x", "C3x", "C6m", "X9"]) expect(addedAfterNote(id)).not.toMatch(/revised/i);
  });
  it("no rendered check says 'Revised limit' any more", () => {
    for (const r of regions) {
      current.region = r;
      current.meta = read(`${r.id}/meta.json`) as Meta;
      current.drift = read(`${r.id}/drift.json`) as DriftFile;
      expect(renderToString(<EvidencePanel />)).not.toContain("Revised limit");
    }
  });
});
