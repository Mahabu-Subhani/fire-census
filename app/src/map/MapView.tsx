// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Map with region outline and area drawing. Drawing works by tapping or
// clicking, so it behaves the same on a phone and a laptop:
//   rectangle: tap two opposite corners;
//   polygon: tap each corner, then tap the first point or press Finish.
import maplibregl, { type GeoJSONSource, type Map as MLMap, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { bboxToPolygon } from "../data/select";
import { useSelection, useSelectionActions, type Polygon } from "../selection";
import { fmtValue, monthsBetween, MONTH_NAMES, unitLabel, value } from "../stats";
import { EMBER, useTheme, type Theme } from "../theme";
import { activityCells } from "./activity";

// NASA GIBS: Blue Marble satellite imagery as map tiles, free, no key
// (decision 39; see docs/REFERENCES.md). Dimmed a little in the dark theme so
// the fire colours stand out. Tiles exist to zoom 8; the map may zoom past it.
const GIBS_BLUE_MARBLE =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg";

// NASA GIBS WMS: the VIIRS active-fire detections of one UTC day (NOAA-20 and
// NOAA-21, 375 m), drawn by NASA as transparent images. Free, no key, CORS open.
// These are raw detections straight from NASA, updated through the day: not
// our harmonized record and not an alert service (decision 49).
const LIVE_LAYERS = "VIIRS_NOAA20_Thermal_Anomalies_375m_All,VIIRS_NOAA21_Thermal_Anomalies_375m_All";
export function liveTiles(day: string): string {
  return "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
    `&LAYERS=${LIVE_LAYERS}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&TIME=${day}`;
}
/** A UTC day as "YYYY-MM-DD", `back` days before today. */
export function utcDay(back: number, now = new Date()): string {
  return new Date(now.getTime() - back * 86400000).toISOString().slice(0, 10);
}
type Live = "off" | "today" | "yesterday";
/** Milliseconds per month during playback. */
const FRAME_MS = 220;

function satelliteStyle(theme: Theme): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [GIBS_BLUE_MARBLE],
        tileSize: 256,
        maxzoom: 8,
        attribution: "Imagery: NASA GIBS, Blue Marble",
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: { "raster-brightness-max": theme === "dark" ? 0.8 : 1, "raster-saturation": -0.1 },
      },
    ],
  };
}

/** Room to leave beside the region when framing it: the overview's results panel covers the right side. */
function framePadding(): maplibregl.PaddingOptions {
  const wide = typeof window !== "undefined" && window.innerWidth > 860 && document.querySelector(".mf-panel") !== null;
  return wide ? { top: 64, bottom: 96, left: 48, right: 440 } : { top: 24, bottom: 24, left: 24, right: 24 };
}
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

/** True if the browser can draw a WebGL map. Without it MapLibre throws. */
export function webglSupported(): boolean {
  try {
    if (typeof document === "undefined" || typeof window === "undefined" || !window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Shown instead of the map; every other way to choose an area still works. */
export function MapFallback({ reason }: { reason: string }) {
  return (
    <section className="map-panel" aria-label="Map unavailable">
      <div className="note map-fallback" role="status">
        <strong>The map cannot be shown in this browser</strong> ({reason}). Everything else works: pick a region,
        enter coordinates below, and the calendar and downloads use the whole region until you do.
      </div>
    </section>
  );
}

export default function MapView() {
  const [failure, setFailure] = useState<string | null>(() => (webglSupported() ? null : "WebGL is not available"));
  const { theme } = useTheme();
  if (failure) return <MapFallback reason={failure} />;
  // A new theme needs a new base style: rebuild the map (the selection is kept).
  return <MapCanvas key={theme} theme={theme} onFail={setFailure} />;
}

function MapCanvas({ onFail, theme }: { onFail: (reason: string) => void; theme: Theme }) {
  const ramp = EMBER[theme];
  const { region, rows, mode, meta } = useSelection();
  const { polygon, setPolygon, regions, setRegion } = useSelectionActions();
  const [liveDay, setLiveDay] = useState<Live>("off");
  // Playback: index into the months of the date range, or null when the map shows the whole range.
  const months = useMemo(() => (rows.length ? monthsBetween(rows.reduce((m, r) => (r.ym < m ? r.ym : m), rows[0].ym), rows.reduce((m, r) => (r.ym > m ? r.ym : m), rows[0].ym)) : []), [rows]);
  const [frame, setFrame] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  // One colour scale for every frame: the largest single cell-month in the range.
  const frameMax = useMemo(() => rows.reduce((m, r) => Math.max(m, value(r, mode)), 0), [rows, mode]);
  const activity = useMemo(() => {
    if (!region) return null;
    if (frame === null || !months[frame]) return activityCells(rows, mode, region.cell_deg);
    const ym = months[frame];
    return activityCells(rows.filter((r) => r.ym === ym), mode, region.cell_deg, frameMax);
  }, [rows, mode, region, frame, months, frameMax]);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>("none");
  const [points, setPoints] = useState<Polygon>([]);

  // Handlers registered once read the latest state through this ref.
  const live = useRef({ tool, points, setPolygon, setRegion });
  live.current = { tool, points, setPolygon, setRegion };

  useEffect(() => {
    if (!container.current) return;
    let map: MLMap;
    try {
      // preserveDrawingBuffer lets the map appear in a printed summary.
      map = new maplibregl.Map({ container: container.current, style: satelliteStyle(theme), center: [0, 0], zoom: 1, maxZoom: 11, preserveDrawingBuffer: true });
    } catch (e) {
      onFail(e instanceof Error ? e.message : "the map could not start");
      return;
    }
    // A lost WebGL context (common on phones under memory pressure) also ends the map.
    // Our own map.remove() (for example on a theme change) loses it too: ignore that one.
    let disposed = false;
    const onLost = () => {
      if (!disposed) onFail("the graphics context was lost");
    };
    map.getCanvas().addEventListener("webglcontextlost", onLost);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    // The dark base style names a few icons it does not ship; give it blanks
    // instead of filling the console with warnings.
    map.on("styleimagemissing", (e: { id: string }) => {
      if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });
    map.on("load", () => {
      for (const id of ["areas", "activity", "region", "selection", "draft"]) map.addSource(id, { type: "geojson", data: empty });
      // The other study areas: faint, and a click switches to one.
      map.addLayer({ id: "areas-fill", type: "fill", source: "areas", paint: { "fill-color": "#f86f1d", "fill-opacity": 0.1 } });
      map.addLayer({ id: "areas-line", type: "line", source: "areas", paint: { "line-color": "#f86f1d", "line-width": 1.2, "line-opacity": 0.7, "line-dasharray": [2, 2] } });
      map.addLayer({
        id: "activity-fill",
        type: "fill",
        source: "activity",
        paint: {
          "fill-color": ["interpolate", ["linear"], ["get", "t"], ...ramp.flatMap((c, i) => [i / (ramp.length - 1), c])],
          "fill-opacity": 0.82,
        },
      });
      map.addSource("live", { type: "raster", tiles: [liveTiles(utcDay(0))], tileSize: 256, attribution: "Live fires: NASA GIBS, VIIRS NOAA-20/21" });
      map.addLayer({ id: "live", type: "raster", source: "live", layout: { visibility: "none" } });
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

    map.on("click", "areas-fill", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (live.current.tool === "none" && typeof id === "string") live.current.setRegion(id);
    });
    map.on("mouseenter", "areas-fill", () => {
      if (live.current.tool === "none") map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "areas-fill", () => {
      if (live.current.tool === "none") map.getCanvas().style.cursor = "";
    });

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
    return () => {
      disposed = true;
      map.getCanvas().removeEventListener("webglcontextlost", onLost);
      map.remove();
    };
  }, []);

  // Region outline and view.
  // The view is fitted to the region when it is chosen, and fitted again whenever the map's
  // size changes (layout settling, window or pane resize, phone rotation), unless the user has
  // panned or zoomed since: a fit made at the wrong size left the map zoomed out on a continent.
  const userMoved = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !region) return;
    const rings = region.outline && region.outline.length > 0 ? region.outline : [bboxToPolygon(region.bbox)];
    (map.getSource("region") as GeoJSONSource).setData({ type: "FeatureCollection", features: rings.map((r) => polygonFeature(r)) });
    const [w, s, e, n] = region.bbox;
    const fit = (duration: number) => map.fitBounds([[w, s], [e, n]], { padding: framePadding(), duration });
    userMoved.current = false;
    fit(600);
    const onUser = (ev: { originalEvent?: unknown }) => { if (ev.originalEvent) userMoved.current = true; };
    map.on("dragstart", onUser);
    map.on("zoomstart", onUser);
    let last = "";
    const observer = new ResizeObserver(() => {
      const el = container.current;
      if (!el) return;
      const size = `${el.clientWidth}x${el.clientHeight}`;
      if (size === last) return;
      last = size;
      map.resize();
      if (!userMoved.current && el.clientWidth > 0 && el.clientHeight > 0) fit(0);
    });
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.off("dragstart", onUser);
      map.off("zoomstart", onUser);
    };
  }, [region, ready]);

  // Every other study area: its outline and a name tag that switches to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const others = regions.filter((r) => r.id !== region?.id);
    (map.getSource("areas") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: others.flatMap((r) =>
        (r.outline && r.outline.length > 0 ? r.outline : [bboxToPolygon(r.bbox)]).map((ring) => ({ ...polygonFeature(ring), properties: { id: r.id } })),
      ),
    });
    const markers = others.map((r) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "area-pin";
      el.textContent = r.name.split(",")[0];
      el.title = `Show ${r.name}`;
      el.setAttribute("aria-label", `Show ${r.name}`);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        live.current.setRegion(r.id);
      });
      const [w, s, e, n] = r.bbox;
      return new maplibregl.Marker({ element: el }).setLngLat([(w + e) / 2, (s + n) / 2]).addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [regions, region, ready]);

  /** Zoom out to every study area at once. */
  const showAll = () => {
    const map = mapRef.current;
    if (!map || regions.length === 0) return;
    const w = Math.min(...regions.map((r) => r.bbox[0]));
    const s = Math.min(...regions.map((r) => r.bbox[1]));
    const e = Math.max(...regions.map((r) => r.bbox[2]));
    const n = Math.max(...regions.map((r) => r.bbox[3]));
    // Extra room at the sides so the name tags, centred on each area, stay on screen.
    userMoved.current = true;
    const pad = framePadding();
    const wide = window.innerWidth > 860;
    map.fitBounds([[w, s], [e, n]], { padding: { ...pad, left: pad.left + (wide ? 160 : 70), right: pad.right + (wide ? 90 : 50) }, duration: 900, maxZoom: 4 });
  };

  // Fire activity per cell for the area and dates shown.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("activity") as GeoJSONSource).setData(activity ? activity.collection : empty);
  }, [activity, ready]);

  // Live NASA detections for one UTC day.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (liveDay !== "off") (map.getSource("live") as maplibregl.RasterTileSource).setTiles([liveTiles(utcDay(liveDay === "today" ? 0 : 1))]);
    map.setLayoutProperty("live", "visibility", liveDay === "off" ? "none" : "visible");
  }, [liveDay, ready]);

  // Playback: step one month per frame, stop at the end.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setFrame((f) => {
        const next = f === null ? 0 : f + 1;
        if (next >= months.length) {
          setPlaying(false);
          return months.length - 1;
        }
        return next;
      });
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [playing, months.length]);
  // A new area, record or range ends playback.
  useEffect(() => {
    setPlaying(false);
    setFrame(null);
  }, [months]);

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
      {frame !== null && months[frame] && (
        <div className="map-stamp" aria-live="off">
          {MONTH_NAMES[Number(months[frame].slice(5)) - 1]} {months[frame].slice(0, 4)}
        </div>
      )}
      <div className="map-layers" role="group" aria-label="Map layers">
        {regions.length > 1 && (
          <div className="ml-row">
            <span className="ml-label">{regions.length} study areas</span>
            <button type="button" onClick={showAll}>Show all</button>
            <span className="ml-hint">or click an orange outline</span>
          </div>
        )}
        {months.length > 1 && (
          <div className="ml-row">
            <button
              type="button"
              className="ml-play"
              aria-pressed={playing}
              onClick={() => {
                if (playing) return setPlaying(false);
                if (frame === null || frame >= months.length - 1) setFrame(0);
                setPlaying(true);
              }}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              min={0}
              max={months.length - 1}
              value={frame ?? months.length - 1}
              aria-label="Month shown on the map"
              onChange={(e) => {
                setPlaying(false);
                setFrame(Number(e.target.value));
              }}
            />
            {frame !== null && (
              <button type="button" onClick={() => { setPlaying(false); setFrame(null); }}>All</button>
            )}
          </div>
        )}
        <div className="ml-row">
          <span className="ml-label"><i className="ml-dot" aria-hidden="true" />NASA live fires</span>
          <div className="seg" role="group" aria-label="Live NASA fire detections">
            <button type="button" aria-pressed={liveDay === "off"} onClick={() => setLiveDay("off")}>Off</button>
            <button type="button" aria-pressed={liveDay === "today"} onClick={() => setLiveDay("today")}>Today</button>
            <button type="button" aria-pressed={liveDay === "yesterday"} onClick={() => setLiveDay("yesterday")}>Yesterday</button>
          </div>
        </div>
        {liveDay !== "off" && (
          <p className="ml-note">
            Red dots: every VIIRS fire detection (NOAA-20 and NOAA-21) on {utcDay(liveDay === "today" ? 0 : 1)} UTC
            {liveDay === "today" ? ", so far today" : ""}, from NASA GIBS. Raw detections, not harmonized; not an alert service.
          </p>
        )}
      </div>
      {activity && (
        <div className="map-legend">
          <p className="legend-title">Hotspot activity per cell <span>({unitLabel(meta, mode)})</span></p>
          {activity.max > 0 ? (
            <div className="legend-scale" role="img" aria-label={`Colour scale from 0 to ${fmtValue(activity.max, mode)}`}>
              <span className="legend-ramp" style={{ background: `linear-gradient(to right, ${ramp.join(", ")})` }} />
              <span className="legend-ends"><span>0</span><span>{fmtValue(activity.max, mode)}</span></span>
            </div>
          ) : (
            <p className="fine-print">No activity in this area and period.</p>
          )}
        </div>
      )}
    </section>
  );
}
