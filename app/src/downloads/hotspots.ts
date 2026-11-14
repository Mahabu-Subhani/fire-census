// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "A downloadable CSV file of hot spots detected during a search" (challenge
// text): individual FIRMS detections, not monthly totals. Person A publishes
// one gzipped file per region and year, app/public/data/<region>/hotspots/
// <YYYY>.csv.gz, with the original FIRMS columns plus harm_class (contract in
// docs/ARCHITECTURE.md). The app fetches only the years in the date range and
// keeps only the rows inside the area and the months chosen.
import { pointInPolygon } from "../data/select";
import type { Meta, Polygon, Region } from "../data/types";

/** Most yearly files one download may combine, so a phone does not run out of memory. */
export const MAX_YEARS = 5;

export function yearsInRange(from: string, to: string): number[] {
  const a = Number(from.slice(0, 4));
  const b = Number(to.slice(0, 4));
  return a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [];
}

/** Split one CSV line, allowing quoted fields with commas and doubled quotes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export interface Filtered {
  header: string;
  lines: string[];
}

/**
 * Keep the data lines of one yearly file whose detection is inside the polygon
 * (null: the whole region) and whose acq_date month is within [from, to].
 * Lines are passed through unchanged, so every original column survives.
 */
export function filterHotspots(text: string, polygon: Polygon | null, from: string, to: string): Filtered {
  const rows = text.split(/\r?\n/).filter((l) => l.trim() !== "" && !l.startsWith("#"));
  if (rows.length === 0) return { header: "", lines: [] };
  const header = rows[0];
  const cols = splitCsvLine(header).map((c) => c.trim().toLowerCase());
  const iLat = cols.indexOf("latitude");
  const iLon = cols.indexOf("longitude");
  const iDate = cols.indexOf("acq_date");
  if (iLat < 0 || iLon < 0 || iDate < 0) {
    throw new Error("The hotspot file has no latitude, longitude or acq_date column.");
  }
  const lines: string[] = [];
  for (let k = 1; k < rows.length; k++) {
    const line = rows[k];
    const f = line.includes('"') ? splitCsvLine(line) : line.split(",");
    const ym = (f[iDate] ?? "").slice(0, 7);
    if (ym < from || ym > to) continue;
    if (polygon) {
      const lat = Number(f[iLat]);
      const lon = Number(f[iLon]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !pointInPolygon(lon, lat, polygon)) continue;
    }
    lines.push(line);
  }
  return { header, lines };
}

/**
 * Some servers answer a missing file with the app's own HTML page and status
 * 200. A hotspot file is never HTML, so treat HTML as "not there".
 */
export function isHtml(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").includes("text/html");
}

/** Fetch one yearly file; null if it does not exist. Handles .gz in the browser. */
export async function fetchHotspotYear(baseUrl: string, regionId: string, year: number): Promise<string | null> {
  const response = await fetch(`${baseUrl}data/${regionId}/hotspots/${year}.csv.gz`);
  if (response.status === 404 || (response.ok && isHtml(response))) return null;
  if (!response.ok) throw new Error(`Could not load hotspots for ${year} (HTTP ${response.status})`);
  return gunzipText(await response.arrayBuffer());
}

/**
 * Unzip if the bytes are gzip (magic 1f 8b); otherwise read as text, because a
 * server may already have removed the compression.
 */
export async function gunzipText(bytes: ArrayBuffer): Promise<string> {
  const head = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

/** Is there at least one hotspot file for this region? (Checks the latest year.) */
export async function hotspotsAvailable(baseUrl: string, region: Region): Promise<boolean> {
  try {
    const year = Number(region.last_month.slice(0, 4));
    const response = await fetch(`${baseUrl}data/${region.id}/hotspots/${year}.csv.gz`, { method: "HEAD" });
    return response.ok && !isHtml(response);
  } catch {
    return false;
  }
}

/** Provenance lines for the top of the file, then the original header and rows. */
export function buildHotspotCsv(opts: {
  region: Region;
  meta: Meta;
  header: string;
  lines: string[];
  from: string;
  to: string;
  areaLabel: string;
  polygon: Polygon | null;
  missingYears: number[];
  exportedAt?: Date;
}): string {
  const { region, meta, header, lines, from, to, areaLabel, polygon, missingYears } = opts;
  const comments = [
    "Fire Census export: individual hotspot detections (NASA FIRMS), original columns plus harm_class",
    `Source products: ${meta.sources.join("; ")}`,
    `Region: ${region.name} (${region.id}). Area: ${areaLabel}`,
    polygon ? `Area polygon (lon lat): ${polygon.map(([lon, lat]) => `${lon.toFixed(4)} ${lat.toFixed(4)}`).join("; ")}` : "Area polygon: whole region",
    `Dates: ${from} to ${to} (acq_date, UTC)`,
    "harm_class: harmonized = counted in the harmonized record; small = small-fire layer; excluded = not counted (for example a static industrial source)",
    ...(missingYears.length ? [`No hotspot file for: ${missingYears.join(", ")}`] : []),
    `Data version: ${meta.data_version}. Code commit: ${meta.code_commit || "not stated"}. Exported: ${(opts.exportedAt ?? new Date()).toISOString()}`,
    "Cite: NASA FIRMS (https://earthdata.nasa.gov/firms), part of NASA's ESDIS. Tool: Fire Census, NASA Space Apps 2026",
  ];
  return [...comments.map((c) => `# ${c}`), header, ...lines].join("\r\n") + "\r\n";
}
