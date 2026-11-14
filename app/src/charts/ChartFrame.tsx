// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The frame every chart sits in: a title, then one line stating the unit
// (from meta.unit, never typed by hand), the mode and the area; the chart;
// and a row for export buttons.
import type { ReactNode } from "react";
import { useSelection, useSelectionActions } from "../selection";
import { MONTH_NAMES, parseYm, unitLabel } from "../stats";
import "./charts.css";

export function formatMonth(ym: string): string {
  const [y, m] = parseYm(ym);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Place name, "Drawn area" or the region name, with its area in km². */
export function useAreaLabel(): string {
  const { place, region, areaKm2 } = useSelection();
  // Read only: whether an area is drawn. Charts never change the selection.
  const { polygon } = useSelectionActions();
  const name = place ?? (polygon ? "Drawn area" : region?.name ?? "No area");
  return areaKm2 === null ? name : `${name}, ${Math.round(areaKm2).toLocaleString("en")} km²`;
}

interface Props {
  title: string;
  children: ReactNode;
  /** Export buttons, added later. */
  actions?: ReactNode;
}

export default function ChartFrame({ title, children, actions }: Props) {
  const { meta, mode, from, to } = useSelection();
  const area = useAreaLabel();
  return (
    <figure className="cf">
      <figcaption className="cf-head">
        <h2 className="cf-title">{title}</h2>
        <p className="cf-sub">
          <span className={`cf-mode cf-mode-${mode}`}>{mode === "raw" ? "Raw" : "Harmonized"}</span>{" "}
          <span>{unitLabel(meta, mode)}</span>
          <br />
          <span>{area}</span>
          {from && to && (
            <span>
              {" "}
              · {formatMonth(from)} to {formatMonth(to)}
            </span>
          )}
        </p>
      </figcaption>
      <div className="cf-body">{children}</div>
      <div className="cf-actions">{actions}</div>
    </figure>
  );
}
