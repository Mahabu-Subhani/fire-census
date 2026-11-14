// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Without WebGL (here: no browser at all) the map must show its fallback,
// not throw and blank the page.
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("maplibre-gl", () => ({ default: { Map: vi.fn(() => { throw new Error("must not be called"); }) } }));
vi.mock("../selection", () => ({ useSelection: () => ({ region: null }), useSelectionActions: () => ({ polygon: null, setPolygon: () => {} }) }));

const { default: MapView, webglSupported } = await import("./MapView");

describe("MapView without WebGL", () => {
  it("reports no WebGL", () => expect(webglSupported()).toBe(false));
  it("renders the fallback message instead of the map", () => {
    const html = renderToString(<MapView />);
    expect(html).toContain("The map cannot be shown in this browser");
    expect(html).toContain("WebGL is not available");
  });
});
