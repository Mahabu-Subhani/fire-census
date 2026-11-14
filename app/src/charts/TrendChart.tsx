// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "Is it getting worse here?" (docs/APP_VISION.md, Q5): yearly totals of
// complete harmonized years, Sen's slope with its 95% range, and the
// Mann-Kendall test. Harmonized record only. Uses areaRows.
import * as Plot from "@observablehq/plot";
import { useMemo } from "react";
import { useSelection } from "../selection";
import { MIN_ACTIVITY, MIN_TREND_YEARS, TREND_ALPHA, median, trend, unitLabel } from "../stats";
import ChartFrame from "./ChartFrame";
import { usePlot } from "./usePlot";

const num = (v: number) => v.toLocaleString("en", { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 });
const pText = (p: number) => (p < 0.001 ? "below 0.001" : p.toFixed(3));

export default function TrendChart() {
  const { status, areaRows, region, dataThrough, mode, meta } = useSelection();
  const unit = unitLabel(meta, "harmonized");
  const t = useMemo(
    () => (region ? trend(areaRows, region.harmonized_from, dataThrough, MIN_ACTIVITY) : null),
    [areaRows, region, dataThrough],
  );
  const raw = mode === "raw";

  const fit = useMemo(() => {
    if (!t?.sen || t.years.length === 0) return null;
    const xs = t.years.map((d) => d.year);
    const x0 = xs[0];
    const x1 = xs[xs.length - 1];
    const xm = median(xs)!;
    const ym = t.sen.intercept + t.sen.slope * xm;
    const line = (s: number, x: number) => ym + s * (x - xm);
    return {
      line: [x0, x1].map((x) => ({ x, y: t.sen!.intercept + t.sen!.slope * x })),
      band: xs.map((x) => ({ x, lo: Math.min(line(t.sen!.lo, x), line(t.sen!.hi, x)), hi: Math.max(line(t.sen!.lo, x), line(t.sen!.hi, x)) })),
    };
  }, [t]);

  const plotRef = usePlot(
    (width) => {
      if (!t || raw || t.years.length === 0) return null;
      const narrow = width < 480;
      return Plot.plot({
        width,
        height: narrow ? 200 : 240,
        marginLeft: 48,
        marginRight: narrow ? 18 : 20,
        style: { fontSize: narrow ? "9px" : "10px" },
        x: { label: null, tickFormat: (y: number) => String(y), ticks: narrow ? 5 : 10 },
        y: { grid: true, label: null, zero: true, nice: true, tickFormat: (v: number) => v.toLocaleString("en", { notation: "compact" }) },
        marks: [
          fit ? Plot.areaY(fit.band, { x: "x", y1: "lo", y2: "hi", fill: "var(--series-2)", fillOpacity: 0.18 }) : null,
          Plot.lineY(t.years, { x: "year", y: "total", stroke: "var(--series-1)", strokeWidth: 1, strokeOpacity: 0.6 }),
          Plot.dot(t.years, {
            x: "year", y: "total", r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2,
            title: (d) => `${d.year}: ${num(d.total)}\n${unit}`,
            tip: { fontSize: 12, fill: "var(--surface)", stroke: "var(--border)" },
          }),
          fit && t.status === "ok" ? Plot.line(fit.line, { x: "x", y: "y", stroke: "var(--series-2)", strokeWidth: 2, strokeDasharray: t.clear ? undefined : "5,4" }) : null,
          Plot.ruleY([0]),
        ],
      });
    },
    [t, fit, raw, unit],
  );

  let sentence = "";
  if (t?.status === "ok" && t.sen && t.mk) {
    const first = t.years[0].year;
    const last = t.years[t.years.length - 1].year;
    const pct = t.perDecade !== null ? `, about ${Math.abs(Math.round(t.perDecade * 100))}% of a typical year per decade` : "";
    sentence = t.clear
      ? `Activity ${t.sen.slope < 0 ? "fell" : "rose"} by about ${num(Math.abs(t.sen.slope))} a year from ${first} to ${last}${pct}.`
      : `No clear trend from ${first} to ${last}.`;
  } else if (t?.status === "too-few-years") {
    sentence = `Not enough complete years for a trend (at least ${MIN_TREND_YEARS} needed).`;
  } else if (t?.status === "too-little") {
    sentence = "Too little activity in this area to judge a trend.";
  }
  const detail =
    t?.status === "ok" && t.sen && t.mk
      ? `Sen's slope ${num(t.sen.slope)} a year (95% range ${num(t.sen.lo)} to ${num(t.sen.hi)}). Mann-Kendall test p = ${pText(t.mk.p)}; "clear" means p below ${TREND_ALPHA}. Complete years of the harmonized record only.`
      : "";

  return (
    <ChartFrame
      title="Is it getting worse here?"
      mode="harmonized"
      exportName="trend"
      notes={[sentence, detail].filter(Boolean)}
      table={() => ({
        columns: ["year", "total", "sen_line"],
        rows: (t?.years ?? []).map((d) => [d.year, d.total, t?.sen ? t.sen.intercept + t.sen.slope * d.year : null]),
        notes: [sentence, detail].filter(Boolean),
      })}
    >
      {status === "loading" || status === "idle" ? (
        <p className="cf-empty">Loading…</p>
      ) : raw ? (
        <p className="status-detail">
          Trends are not shown on the raw record: its 2012 jump would be counted as a trend. Switch to Harmonized to see it.
        </p>
      ) : (
        <>
          {sentence && <p className="status-sentence" style={{ fontSize: "1rem" }}>{sentence}</p>}
          <div ref={plotRef} className="cal-plot" />
          {t?.status === "ok" && (
            <div className="series-key">
              <span><i style={{ background: "var(--series-1)" }} />Yearly total</span>
              <span><i style={{ background: "var(--series-2)" }} />Trend line{t.clear ? "" : " (dashed: not clear)"}; shading: its 95% range</span>
            </div>
          )}
          {detail && <p className="status-detail">{detail}</p>}
        </>
      )}
    </ChartFrame>
  );
}
