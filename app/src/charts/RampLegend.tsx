// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// A colour legend people can read: words at the ends, exact values under the
// bar, and the same colour function the chart uses, so they always match.
import "./charts.css";

export interface LegendStop {
  /** Position along the bar, 0 to 1. */
  t: number;
  label: string;
}

interface Props {
  /** Colour at a position 0 to 1 (the chart's own scale). */
  color: (t: number) => string;
  stops: LegendStop[];
  low: string;
  high: string;
  /** Optional word for the middle (for example "Average"). */
  middle?: string;
  label: string;
}

export default function RampLegend({ color, stops, low, high, middle, label }: Props) {
  const gradient = Array.from({ length: 11 }, (_, i) => `${color(i / 10)} ${i * 10}%`).join(", ");
  return (
    <div className="ramp-legend" role="img" aria-label={`${label}: from ${low} to ${high}; ${stops.map((s) => s.label).join(", ")}`}>
      <div className="ramp-words">
        <span>{low}</span>
        {middle && <span>{middle}</span>}
        <span>{high}</span>
      </div>
      <div className="ramp-bar" style={{ background: `linear-gradient(to right, ${gradient})` }} />
      <div className="ramp-ticks">
        {stops.map((s) => (
          <span key={s.t} style={{ left: `${s.t * 100}%` }} className={s.t === 0 ? "first" : s.t === 1 ? "last" : undefined}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Piecewise-linear colour between evenly spaced hex stops. */
export function rampColor(colors: string[], t: number): string {
  const u = Math.min(1, Math.max(0, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(u));
  const f = u - i;
  const a = hexRgb(colors[i]);
  const b = hexRgb(colors[i + 1]);
  return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * f)).join(",")})`;
}

function hexRgb(hex: string): number[] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
