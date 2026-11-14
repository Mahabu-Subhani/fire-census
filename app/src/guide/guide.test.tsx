// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The glossary and researcher sections render with the real meta.json, and the unit always
// comes from meta.json.
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Meta, Region } from "../data/types";

const files = import.meta.glob<{ default: unknown }>("../../public/data/**/{regions,meta}.json", { eager: true });
const regions = files["../../public/data/regions.json"].default as Region[];
const region = regions.find((r) => r.id === "punjab-haryana")!;
const meta = files["../../public/data/punjab-haryana/meta.json"].default as Meta;

vi.mock("../selection", () => ({
  useSelection: () => ({ region, meta, dataThrough: meta.data_through ?? null }),
  useSelectionActions: () => ({ polygon: null }),
}));

const { default: Glossary } = await import("./Glossary");
const { default: ForResearchers } = await import("./ForResearchers");

describe("guide sections with real data", () => {
  it("uses meta.unit in the glossary and the data dictionary", () => {
    expect(renderToString(<Glossary />)).toContain(meta.unit!);
    const html = renderToString(<ForResearchers />);
    expect(html).toContain(meta.unit!);
    expect(html).toContain(`Data version ${meta.data_version}`);
    expect(html).toContain("data/punjab-haryana/cube.json");
  });
});
