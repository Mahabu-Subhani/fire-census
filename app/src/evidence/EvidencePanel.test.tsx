// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Renders the panel with the real meta.json of each region and checks that
// every check appears with its verdict, failed ones included.
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Meta, Region } from "../data/types";

const files = import.meta.glob<{ default: unknown }>("../../public/data/**/{regions,meta}.json", { eager: true });
const read = (path: string) => files[`../../public/data/${path}`].default;
const regions = read("regions.json") as Region[];
const current: { meta: Meta | null; region: Region | null } = { meta: null, region: null };

vi.mock("../selection", () => ({
  useSelection: () => current,
  useSelectionActions: () => ({ regions }),
}));

const { default: EvidencePanel, ChecksBadge } = await import("./EvidencePanel");

describe.each(regions.map((r) => [r.id, r]))("EvidencePanel with real data: %s", (_id, region) => {
  it("lists every check with its verdict and the shipped method", () => {
    current.region = region as Region;
    current.meta = read(`${(region as Region).id}/meta.json`) as Meta;
    const html = renderToString(<EvidencePanel />);
    for (const c of current.meta!.checks) {
      expect(html).toContain(`<strong>${c.id}<!-- -->. <!-- -->`);
    }
    const failed = current.meta!.checks.filter((c) => c.verdict === "fail").length;
    expect((html.match(/ev-check ev-fail/g) ?? []).length).toBe(failed);
    expect(html).toContain(current.meta!.level_name ?? current.meta!.level_shipped);
    expect(renderToString(<ChecksBadge />)).toContain("Checks:");
  });
});
