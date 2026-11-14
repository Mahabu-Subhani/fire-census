// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The answer on top (docs/APP_VISION.md, Q1): is the current month unusual
// here? Rank first, ratio second, month to date, on the harmonized record
// (the raw record has no month-to-date and a false jump in 2012).
// Minimum activity (decision 32) and baseline (decision 33) from stats/.
import { useMemo } from "react";
import { useSelection } from "../selection";
import { compareMonth, formatRank, formatRatio, MIN_ACTIVITY, MIN_HISTORY_YEARS, parseYm, VERDICT_TEXT, type Baseline } from "../stats";
import { BASELINE_TEXT, setBaseline, useBaseline } from "./baseline";
import ChartFrame from "./ChartFrame";

export const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const num = (v: number) => v.toLocaleString("en", { maximumFractionDigits: v < 10 ? 1 : 0 });

export function BaselineSwitch() {
  const baseline = useBaseline();
  return (
    <div className="switch" role="group" aria-label="Compare with">
      {(["all", "last10"] as Baseline[]).map((b) => (
        <button key={b} type="button" aria-pressed={baseline === b} onClick={() => setBaseline(b)}>
          {BASELINE_TEXT[b]}
        </button>
      ))}
    </div>
  );
}

export default function UnusualBanner() {
  const { status, areaRows, region, dataThrough, meta } = useSelection();
  const baseline = useBaseline();
  const month = dataThrough ? parseYm(dataThrough.slice(0, 7))[1] : null;

  const c = useMemo(
    () =>
      region && month
        ? compareMonth({ areaRows, month, mode: "harmonized", baseline, harmonizedFrom: region.harmonized_from, dataThrough })
        : null,
    [areaRows, month, baseline, region, dataThrough],
  );

  if (status === "loading" || status === "idle") {
    return (
      <ChartFrame title="Is now unusual?" mode="harmonized">
        <p className="cf-empty">Loading…</p>
      </ChartFrame>
    );
  }
  if (!c || !month || c.year === null) {
    return (
      <ChartFrame title="Is now unusual?" mode="harmonized">
        <p className="cf-empty">No data to compare for this area.</p>
      </ChartFrame>
    );
  }

  const name = MONTH_FULL[month - 1];
  const short = name.slice(0, 3);
  const when = `${name} ${c.year}${c.toDay ? ` so far (1 to ${c.toDay} ${short})` : ""}`;
  const n = c.baselineYears.length;
  const span = n ? `${c.baselineYears[0]} to ${c.baselineYears[n - 1]}` : "";
  const earlier = `${n} earlier ${name}s${span ? ` (${span})` : ""}`;

  let sentence: string;
  let detail: string;
  if (c.status === "ok") {
    const ratio = c.ratio !== null ? `${formatRatio(c.ratio)} times the median` : "while the median is 0";
    sentence = `${when}: ${formatRank(c.rank!)} ${name}s, ${ratio}.`;
    detail = `This month ${num(c.value!)}; median of ${earlier} ${num(c.median!)}.`;
  } else if (c.status === "too-little") {
    sentence = `${when}: too little activity to judge.`;
    detail = `This month ${num(c.value!)} and the median of ${earlier} ${num(c.median!)} are both below ${MIN_ACTIVITY}.`;
  } else if (c.status === "not-enough-history") {
    sentence = `${when}: not enough history to judge.`;
    detail = `Only ${earlier} in the harmonized record; at least ${MIN_HISTORY_YEARS} are needed.`;
  } else {
    sentence = `${when}: no data to compare.`;
    detail = "The month-to-date count is missing for this month.";
  }
  const ym = `${c.year}-${String(month).padStart(2, "0")}`;
  const nrt = meta?.nrt_from && ym >= meta.nrt_from
    ? ` ${name} ${c.year} is near-real-time data (from ${meta.nrt_from}) and may change.`
    : "";
  const alert = c.verdict === "above" || c.verdict === "far-above";

  return (
    <ChartFrame title="Is now unusual?" mode="harmonized">
      <div className={`status${alert ? " status-alert" : ""}`} role="status">
        <p className="status-sentence">
          {sentence} {c.verdict && <span className={`verdict verdict-${c.verdict}`}>{VERDICT_TEXT[c.verdict]}</span>}
        </p>
        <p className="status-detail">
          {detail}
          {c.toDay ? ` Every year counts days 1 to ${c.toDay} only, so the incomplete month is compared fairly.` : ""}
          {nrt}
        </p>
        <div className="chart-controls">
          <span>Compare with</span>
          <BaselineSwitch />
        </div>
      </div>
    </ChartFrame>
  );
}
