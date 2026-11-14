// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Map with region outline and area drawing. Drawing works by tapping or
// clicking, so it behaves the same on a phone and a laptop:
//   rectangle: tap two opposite corners;
//   polygon: tap each corner, then tap the first point or press Finish.
import maplibregl, { type GeoJSONSource, type Map as MLMap, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { bboxToPolygon } from "../data/select";
import { useSelection, useSelectionActions, type Polygon } from "../selection";

// OpenFreeMap: free OpenStreetMap vector tiles, no key (see docs/REFERENCES.md).
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const CLOSE_PX = 14;

type Tool = "none" | "rectangle" | "polygon";

const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function polygonFeature(ring: Polygon): GeoJSON.Feature {
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] } };
}

function draftFeatures(points: Polygon, hover: [number, number] | null, tool: Tool): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = points.map((p) => ({
    type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p },
  }));
  if (tool === "rectangle" && points.length === 1 && hover) {
    features.push(polygonFeature(cornersToRing(points[0], hover)));
  } else if (points.length > 0) {
    const line = hover ? [...points, hover] : points;
    if (line.length > 1) features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } });
  }
  return { type: "FeatureCollection", features };
}

function cornersToRing(a: [number, number], b: [number, number]): Polygon {
  return bboxToPolygon([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]);
}

export default function MapView() {
  const { region } = useSelection();
  const { polygon, setPolygon } = useSelectionActions();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>("none");
  const [points, setPoints] = useState<Polygon>([]);

  // Handlers registered once read the latest state through this ref.
  const live = useRef({ tool, points, setPolygon });
  live.current = { tool, points, setPolygon };

  useEffect(() => {
    if (!container.current) return;
    // preserveDrawingBuffer lets the map appear in a printed summary.
    const map = new maplibregl.Map({ container: container.current, style: STYLE_URL, center: [0, 0], zoom: 1, preserveDrawingBuffer: true });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      for (const id of ["region", "selection", "draft"]) map.addSource(id, { type: "geojson", data: empty });
      map.addLayer({ id: "region-line", type: "line", source: "region", paint: { "line-color": "#6b7280", "line-width": 1.5, "line-dasharray": [2, 2] } });
      map.addLayer({ id: "selection-fill", type: "fill", source: "selection", paint: { "fill-color": "#d9480f", "fill-opacity": 0.12 } });
      map.addLayer({ id: "selection-line", type: "line", source: "selection", paint: { "line-color": "#d9480f", "line-width": 2.5 } });
      map.addLayer({ id: "draft-fill", type: "fill", source: "draft", filter: ["==", "$type", "Polygon"], paint: { "fill-color": "#1c7ed6", "fill-opacity": 0.1 } });
      map.addLayer({ id: "draft-line", type: "line", source: "draft", filter: ["!=", "$type", "Point"], paint: { "line-color": "#1c7ed6", "line-width": 2, "line-dasharray": [1, 1] } });
      map.addLayer({ id: "draft-points", type: "circle", source: "draft", filter: ["==", "$type", "Point"], paint: { "circle-radius": 5, "circle-color": "#1c7ed6", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      setReady(true);
    });

    const finish = (ring: Polygon) => {
      live.current.setPolygon(ring);
      setPoints([]);
      setTool("none");
    };

    map.on("click", (e: MapMouseEvent) => {
      const { tool: t, points: pts } = live.current;
      if (t === "none") return;
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (t === "rectangle") {
        if (pts.length === 0) setPoints([p]);
        else finish(cornersToRing(pts[0], p));
        return;
      }
      if (pts.length >= 3) {
        const first = map.project(pts[0]);
        if (Math.hypot(first.x - e.point.x, first.y - e.point.y) < CLOSE_PX) return finish(pts);
      }
      setPoints([...pts, p]);
    });

    map.on("mousemove", (e: MapMouseEvent) => {
      const { tool: t, points: pts } = live.current;
      if (t === "none" || pts.length === 0) return;
      (map.getSource("draft") as GeoJSONSource | undefined)?.setData(draftFeatures(pts, [e.lngLat.lng, e.lngLat.lat], t));
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // Region outline and view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !region) return;
    (map.getSource("region") as GeoJSONSource).setData({ type: "FeatureCollection", features: [polygonFeature(bboxToPolygon(region.bbox))] });
    const [w, s, e, n] = region.bbox;
    map.fitBounds([[w, s], [e, n]], { padding: 24, duration: 600 });
  }, [region, ready]);

  // Current selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("selection") as GeoJSONSource).setData(polygon ? { type: "FeatureCollection", features: [polygonFeature(polygon)] } : empty);
  }, [polygon, ready]);

  // Draft while drawing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("draft") as GeoJSONSource).setData(draftFeatures(points, null, tool));
    map.getCanvas().style.cursor = tool === "none" ? "" : "crosshair";
    if (tool === "none") map.doubleClickZoom.enable();
    else map.doubleClickZoom.disable();
  }, [points, tool, ready]);

  // Escape cancels drawing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTool("none");
        setPoints([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = (t: Tool) => {
    setPoints([]);
    setTool(t);
  };

  const hint =
    tool === "rectangle"
      ? points.length === 0 ? "Tap the first corner." : "Tap the opposite corner."
      : tool === "polygon"
        ? points.length < 3 ? "Tap each corner of the area." : "Tap the first point or press Finish."
        : polygon ? "Showing the drawn area." : "Showing the whole region. Draw to narrow it down.";

  return (
    <section className="map-panel" aria-label="Map and area selection">
      <div className="toolbar" role="toolbar" aria-label="Area drawing tools">
        <button type="button" aria-pressed={tool === "rectangle"} onClick={() => start("rectangle")}>Rectangle</button>
        <button type="button" aria-pressed={tool === "polygon"} onClick={() => start("polygon")}>Polygon</button>
        {tool === "polygon" && points.length >= 3 && (
          <button type="button" onClick={() => { setPolygon(points); setPoints([]); setTool("none"); }}>Finish</button>
        )}
        {tool !== "none" && <button type="button" onClick={() => start("none")}>Cancel</button>}
        {tool === "none" && polygon && <button type="button" onClick={() => setPolygon(null)}>Whole region</button>}
        <span className="hint" aria-live="polite">{hint}</span>
      </div>
      <div ref={container} className="map" />
    </section>
  );
}
