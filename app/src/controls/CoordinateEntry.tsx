// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Area by typed coordinates, as an alternative to drawing on the map.
import { useState, type FormEvent } from "react";
import { bboxToPolygon, circlePolygon, countCellCentres, overlapsBBox } from "../data/select";
import type { Polygon } from "../data/types";
import { useSelection, useSelectionActions } from "../selection";

type Kind = "point" | "box";

const num = (text: string) => (text.trim() === "" ? NaN : Number(text));

export default function CoordinateEntry() {
  const { region } = useSelection();
  const { setPolygon } = useSelectionActions();
  const [kind, setKind] = useState<Kind>("point");
  const [values, setValues] = useState({ lat: "", lon: "", radius: "25", west: "", south: "", east: "", north: "" });
  const [message, setMessage] = useState<string | null>(null);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!region) return;
    let ring: Polygon;
    let label: string;
    if (kind === "point") {
      const lat = num(values.lat), lon = num(values.lon), radius = num(values.radius);
      if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) return setMessage("Enter a latitude from -90 to 90 and a longitude from -180 to 180, in decimal degrees.");
      if (!(radius > 0 && radius <= 500)) return setMessage("Enter a radius from 1 to 500 km.");
      ring = circlePolygon(lon, lat, radius);
      label = `${radius} km around ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    } else {
      const w = num(values.west), s = num(values.south), ea = num(values.east), n = num(values.north);
      if ([w, s, ea, n].some((v) => !Number.isFinite(v))) return setMessage("Enter all four edges in decimal degrees.");
      if (!(w < ea && s < n)) return setMessage("West must be less than east, and south less than north.");
      ring = bboxToPolygon([w, s, ea, n]);
      label = `Box ${w}, ${s} to ${ea}, ${n}`;
    }
    if (!overlapsBBox(ring, region.bbox)) {
      const [w, s, ea, n] = region.bbox;
      return setMessage(`That area is outside ${region.name}, which covers longitude ${w} to ${ea} and latitude ${s} to ${n}.`);
    }
    if (countCellCentres(ring, region.bbox, region.cell_deg) === 0) {
      return setMessage(`That area is too small: it contains no grid cell (cells are ${region.cell_deg} degree, about ${Math.round(region.cell_deg * 111)} km). Make it larger.`);
    }
    setMessage(null);
    setPolygon(ring, label);
  };

  return (
    <details className="coords">
      <summary>Enter coordinates instead</summary>
      <form onSubmit={submit} noValidate>
        <div className="switch" role="group" aria-label="Kind of area">
          <button type="button" aria-pressed={kind === "point"} onClick={() => setKind("point")}>Point and radius</button>
          <button type="button" aria-pressed={kind === "box"} onClick={() => setKind("box")}>Box</button>
        </div>
        {kind === "point" ? (
          <div className="fields">
            <label>Latitude<input inputMode="decimal" value={values.lat} onChange={set("lat")} placeholder="30.9" /></label>
            <label>Longitude<input inputMode="decimal" value={values.lon} onChange={set("lon")} placeholder="75.85" /></label>
            <label>Radius, km<input inputMode="decimal" value={values.radius} onChange={set("radius")} /></label>
          </div>
        ) : (
          <div className="fields">
            <label>West<input inputMode="decimal" value={values.west} onChange={set("west")} placeholder="74.5" /></label>
            <label>South<input inputMode="decimal" value={values.south} onChange={set("south")} placeholder="30.0" /></label>
            <label>East<input inputMode="decimal" value={values.east} onChange={set("east")} placeholder="76.0" /></label>
            <label>North<input inputMode="decimal" value={values.north} onChange={set("north")} placeholder="31.5" /></label>
          </div>
        )}
        <button type="submit">Show this area</button>
        {message && <p className="note error" role="alert">{message}</p>}
      </form>
    </details>
  );
}
