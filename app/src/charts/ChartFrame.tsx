// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The frame every chart sits in: a title; the chart; and CSV, PNG and SVG export. The unit, mode and area are
// shown once above all charts (the context bar), not repeated per chart; they
// are still written into every exported file. A chart that always shows one
// record whatever the switch says gets a small badge saying so.
import { useRef, useState, type ReactNode } from "react";
import { saveText } from "../downloads/csv";
import type { Mode } from "../data/types";
import { useSelection } from "../selection";
import { MONTH_NAMES, parseYm, unitLabel } from "../stats";
import { chartCsv, slug, type ChartTable } from "./exportCsv";
import { composeSvg, savePng, saveSvg } from "./exportImage";
import "./charts.css";

export function formatMonth(ym: string): string {
  const [y, m] = parseYm(ym);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Place name, "Drawn area" or the region name, with its area in km². */
export function useAreaLabel(): string {
  const { place, region, areaKm2, drawn } = useSelection();
  const name = place ?? (drawn ? "Drawn area" : region?.name ?? "No area");
  return areaKm2 === null ? name : `${name}, ${areaKm2.toLocaleString("en-GB", { maximumFractionDigits: 2 })} km²`;
}

interface Props {
  title: string;
  children: ReactNode;
  /** Set when the chart always shows one record whatever the switch says. */
  mode?: Mode;
  /** Short file name for downloads; no export buttons without it. */
  exportName?: string;
  /** The rows behind the chart, built when the user downloads. */
  table?: () => ChartTable;
  /** Footnotes written under the chart in PNG and SVG files. */
  notes?: string[];
}

export default function ChartFrame({ title, children, mode: forcedMode, exportName, table, notes = [] }: Props) {
  const sel = useSelection();
  const { meta, from, to, region } = sel;
  const mode = forcedMode ?? sel.mode;
  const area = useAreaLabel();
  const unit = unitLabel(meta, mode);
  const modeText = mode === "raw" ? "Raw" : "Harmonized";
  const range = from && to ? `${formatMonth(from)} to ${formatMonth(to)}` : "";
  const ref = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  const stem = `fire-census-${exportName}-${slug(region?.id ?? "area")}-${mode}`;
  const head = { title, lines: [`${modeText}: ${unit}`, [area, range].filter(Boolean).join(" · ")] };
  const footer = [
    ...notes,
    `Source: NASA FIRMS (MODIS and VIIRS). Fire Census, data version ${meta?.data_version ?? "?"}, data to ${meta?.data_through ?? "?"}.`,
  ];

  const image = (kind: "png" | "svg") => {
    if (!ref.current) return;
    setError(null);
    try {
      const svg = composeSvg(ref.current, head, footer);
      if (kind === "svg") saveSvg(svg, `${stem}.svg`);
      else savePng(svg, `${stem}.png`).catch((e: Error) => setError(e.message));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const csv = () => {
    if (!table) return;
    const t = table();
    saveText(chartCsv({ ...t, title, meta, mode, unit, area, from, to }), `${stem}.csv`);
  };

  return (
    <figure className="cf" ref={ref}>
      <figcaption className="cf-head">
        <h2 className="cf-title">
          {title}
          {forcedMode && forcedMode !== sel.mode && <span className={`cf-mode cf-mode-${forcedMode}`}>{modeText} only</span>}
        </h2>
      </figcaption>
      <div className="cf-body">{children}</div>
      {exportName && (
        <div className="cf-actions" role="group" aria-label={`Download ${title}`}>
          <span className="cf-actions-label">Download</span>
          {table && (
            <button type="button" onClick={csv} aria-label={`Download ${title} data as CSV`}>
              CSV
            </button>
          )}
          <button type="button" onClick={() => image("png")} aria-label={`Download ${title} as PNG image`}>
            PNG
          </button>
          <button type="button" onClick={() => image("svg")} aria-label={`Download ${title} as SVG image`}>
            SVG
          </button>
          {error && <span className="cf-error">Download failed: {error}</span>}
        </div>
      )}
    </figure>
  );
}
