// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// CSV of the rows behind the current view. The file starts with comment lines
// that say where every number came from (docs/RESEARCHER_EXPERIENCE.md).
import type { CubeRow, Meta, Mode, Region } from "../data/types";

export interface CsvInput {
  region: Region;
  meta: Meta;
  rows: CubeRow[];
  from: string;
  to: string;
  mode: Mode;
  areaLabel: string;
  areaKm2: number | null;
  polygon: [number, number][] | null;
  exportedAt?: Date;
}

const COLUMNS = ["lon", "lat", "month", "raw_modis", "raw_viirs", "raw_total", "harm", "harm_lo", "harm_hi", "small", "terra_only", "mtd"];

function cell(value: string | number | boolean | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function buildSelectionCsv(input: CsvInput): string {
  const { region, meta, rows, from, to, mode, areaLabel, areaKm2, polygon } = input;
  const exportedAt = (input.exportedAt ?? new Date()).toISOString();
  const comments = [
    "Fire Census export: hotspot activity per 0.1 degree cell and month",
    `Source products: ${meta.sources.join("; ")}`,
    `Region: ${region.name} (${region.id})`,
    `Area: ${areaLabel}${areaKm2 !== null ? `, ${Math.round(areaKm2)} km2` : ""}`,
    polygon ? `Area polygon (lon lat): ${polygon.map(([lon, lat]) => `${lon.toFixed(4)} ${lat.toFixed(4)}`).join("; ")}` : "Area polygon: whole region",
    `Date range: ${from} to ${to}`,
    `Mode shown in the app: ${mode === "raw" ? "Raw" : "Harmonized"}. Columns include both raw and harmonized values`,
    `Harmonized unit (harm, harm_lo, harm_hi, small, mtd): ${meta.unit ?? "not stated"}`,
    `Method level: ${meta.level_shipped}${meta.level_name ? ` (${meta.level_name})` : ""}`,
    `Data through: ${meta.data_through ?? "not stated"}. Near-real-time from: ${meta.nrt_from ?? "not stated"}`,
    `Data version: ${meta.data_version}. Code commit: ${meta.code_commit || "not stated"}. Processed: ${meta.generated_at}. Exported: ${exportedAt}`,
    "raw_total = raw_modis + raw_viirs. terra_only = month before harmonized_from (not harmonized). mtd = month to date, only for the month of data_through",
    "Missing cell-months had no detections. Zero detections does not prove there was no fire",
    "Cite: NASA FIRMS (https://earthdata.nasa.gov/firms), part of NASA's ESDIS. Tool: Fire Census, NASA Space Apps 2026",
  ];
  const lines = comments.map((c) => `# ${c}`);
  lines.push(COLUMNS.join(","));
  for (const r of rows) {
    lines.push(
      [r.lon, r.lat, r.ym, r.raw_modis, r.raw_viirs, r.raw_modis + r.raw_viirs, r.harm, r.harm_lo, r.harm_hi, r.small, r.terra_only, r.mtd]
        .map(cell)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

/** Ask the browser to save text as a file. */
export function saveText(text: string, filename: string, type = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
