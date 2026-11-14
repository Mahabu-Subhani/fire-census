// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// CSV of exactly what a chart plots. The first lines are comments saying
// where every number came from. Pure: no DOM, so it is unit-tested.
import type { Meta, Mode } from "../data/types";

export type CsvValue = string | number | boolean | null | undefined;

export interface ChartTable {
  columns: string[];
  rows: CsvValue[][];
  /** Extra comment lines, for example the median and the baseline. */
  notes?: string[];
}

export interface ChartCsvInput extends ChartTable {
  title: string;
  meta: Meta | null;
  mode: Mode;
  unit: string;
  area: string;
  from: string;
  to: string;
  exportedAt?: Date;
}

function cell(v: CsvValue): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(Math.round(v * 1e6) / 1e6) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function chartCsv(input: ChartCsvInput): string {
  const { title, meta, mode, unit, area, from, to, columns, rows, notes = [] } = input;
  const comments = [
    `Fire Census chart data: ${title}`,
    `Area: ${area}`,
    `Date range in the app: ${from} to ${to}`,
    `Mode: ${mode === "raw" ? "Raw" : "Harmonized"}. Unit: ${unit}`,
    ...notes,
    `Sources: ${meta?.sources?.join("; ") ?? "not stated"}`,
    `Data version: ${meta?.data_version ?? "not stated"}. Code commit: ${meta?.code_commit || "not stated"}. ` +
      `Data through: ${meta?.data_through ?? "not stated"}. Exported: ${(input.exportedAt ?? new Date()).toISOString()}`,
    "Zero detections does not prove there was no fire",
    "Cite: NASA FIRMS (https://earthdata.nasa.gov/firms), part of NASA's ESDIS. Tool: Fire Census, NASA Space Apps 2026",
  ];
  const lines = comments.map((c) => `# ${c.replace(/[\r\n]+/g, " ")}`);
  lines.push(columns.map(cell).join(","));
  for (const r of rows) lines.push(r.map(cell).join(","));
  return lines.join("\r\n") + "\r\n";
}

/** "Córdoba province, Argentina" to "cordoba-province-argentina". */
export function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
