// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The hero picture is the data itself: one dot per month of the harmonized
// record for the selected area, glowing with fire activity. Years run down on
// wide screens and across on narrow ones, so it always fits. It lights up year
// by year on load. Click it to jump to the calendar.
import { useMemo } from "react";
import { useSelection } from "../selection";
import { fmtValue, MONTH_NAMES, toCalendar } from "../stats";
import { EMBER, useTheme } from "../theme";
import { rampColor } from "../charts/RampLegend";
import { useMedia } from "./useMedia";

const STEP = 14;

export default function EmberGrid() {
  const { areaRows, region, status, dataThrough } = useSelection();
  const { theme } = useTheme();
  const across = useMedia("(max-width: 980px)");
  const cal = useMemo(
    () => (region ? toCalendar(areaRows, "harmonized", { from: region.harmonized_from, to: region.last_month }) : null),
    [areaRows, region],
  );
  if (!region || !cal || cal.years.length === 0 || status === "loading") {
    return <div className={`ember-grid ember-grid-empty${across ? " across" : ""}`} aria-hidden="true" />;
  }
  const max = Math.max(1e-9, ...cal.cells.flat().map((v) => v ?? 0));
  const partial = dataThrough?.slice(0, 7);
  const n = cal.years.length;
  // Wide: months across, years down. Narrow: years across, months down.
  const cols = across ? n : 12;
  const rows = across ? 12 : n;
  const pad = across ? 14 : 4;
  const jump = () => document.getElementById("chart-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <button type="button" className="ember-grid" onClick={jump} aria-label="Open the burning calendar">
      <svg viewBox={`${-pad} -16 ${cols * STEP + pad + 4} ${rows * STEP + (across ? 32 : 20)}`} role="img" aria-hidden="true">
        {MONTH_NAMES.map((m, i) =>
          across ? (
            <text key={m} x={-4} y={i * STEP + STEP / 2 + 2} className="ember-month" textAnchor="end">{m[0]}</text>
          ) : (
            <text key={m} x={i * STEP + STEP / 2} y={-6} className="ember-month">{m[0]}</text>
          ),
        )}
        {across && (
          <>
            <text x={STEP / 2} y={rows * STEP + 12} className="ember-month" textAnchor="start">{cal.years[0]}</text>
            <text x={cols * STEP - STEP / 2} y={rows * STEP + 12} className="ember-month" textAnchor="end">{cal.years[n - 1]}</text>
          </>
        )}
        {cal.years.map((year, yi) => (
          <g key={year} className="ember-row" style={{ animationDelay: `${yi * 45}ms` }}>
            {cal.cells[yi].map((v, m) => {
              if (v === null) return null;
              const t = Math.sqrt(v / max);
              const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
              const col = across ? yi : m;
              const row = across ? m : yi;
              return (
                <circle
                  key={m}
                  cx={col * STEP + STEP / 2}
                  cy={row * STEP + STEP / 2}
                  r={1.6 + t * 4.4}
                  fill={rampColor(EMBER[theme], 0.12 + t * 0.88)}
                  className={ym === partial ? "ember-now" : undefined}
                >
                  <title>{`${MONTH_NAMES[m]} ${year}: ${fmtValue(v)}`}</title>
                </circle>
              );
            })}
          </g>
        ))}
      </svg>
      <span className="ember-caption">
        {cal.years[0]}–{cal.years[n - 1]}, one dot per month
      </span>
    </button>
  );
}
