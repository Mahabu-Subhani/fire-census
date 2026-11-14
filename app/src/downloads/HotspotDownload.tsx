// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "Download hotspots": the individual detections for the area and dates shown.
// The button appears only for a region whose hotspot files are published.
import { useEffect, useState } from "react";
import { useSelection, useSelectionActions } from "../selection";
import { saveText } from "./csv";
import { buildHotspotCsv, fetchHotspotYear, filterHotspots, hotspotsAvailable, MAX_YEARS, yearsInRange } from "./hotspots";

const base = import.meta.env.BASE_URL;

export default function HotspotDownload() {
  const { region, meta, from, to, place } = useSelection();
  const { polygon } = useSelectionActions();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(false);
    setMessage(null);
    let live = true;
    if (region) hotspotsAvailable(base, region).then((ok) => live && setAvailable(ok));
    return () => {
      live = false;
    };
  }, [region]);

  if (!available || !region || !meta) return null;
  const years = yearsInRange(from, to);
  const tooMany = years.length > MAX_YEARS;

  const run = async () => {
    setMessage(null);
    let header = "";
    const lines: string[] = [];
    const missing: number[] = [];
    try {
      for (const [i, year] of years.entries()) {
        setBusy(`Reading ${year} (${i + 1} of ${years.length})…`);
        const text = await fetchHotspotYear(base, region.id, year);
        if (text === null) {
          missing.push(year);
          continue;
        }
        const r = filterHotspots(text, polygon, from, to);
        header ||= r.header;
        for (const l of r.lines) lines.push(l);
      }
      if (!header) {
        setMessage("No hotspot files for these years.");
        return;
      }
      const areaLabel = place ?? (polygon ? "Drawn area" : "Whole region");
      const csv = buildHotspotCsv({ region, meta, header, lines, from, to, areaLabel, polygon, missingYears: missing });
      saveText(csv, `fire-census-hotspots_${region.id}_${from}_${to}${polygon ? "_area" : ""}.csv`);
      setMessage(`${lines.length.toLocaleString("en-GB")} hotspots saved.${missing.length ? ` No file for ${missing.join(", ")}.` : ""}`);
    } catch (e) {
      setMessage(`Download failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="hotspot-download">
      <button type="button" className="btn" onClick={run} disabled={busy !== null || tooMany} aria-describedby="hotspot-note">
        {busy ?? "Download hotspots"}
      </button>
      <p id="hotspot-note" className="fine-print" role="status">
        {tooMany
          ? `Individual hotspots: choose at most ${MAX_YEARS} years (now ${years.length}).`
          : message ?? "Every detection in this area and these dates, with its class."}
      </p>
    </div>
  );
}
