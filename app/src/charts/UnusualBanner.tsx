// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The answer on top (docs/APP_VISION.md, Q1): is the current month unusual
// here? Rank first, ratio second, month to date, on the harmonized record
// (the raw record has no month-to-date and a false jump in 2012).
// Minimum activity (decision 32) and baseline (decision 33) from stats/.
// useMonthStatus() is shared with the hero, so both always say the same thing.
import { useMemo } from "react";
import { useSelection } from "../selection";
import {
  compareMonth, fmtValue, formatRank, formatRatio, MIN_ACTIVITY, MIN_HISTORY_YEARS, parseYm, VERDICT_TEXT,
  type Baseline,
} from "../stats";
import { BASELINE_TEXT, setBaseline, useBaseline } from "./baseline";
import ChartFrame from "./ChartFrame";

export const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Exact harmonized value, two decimals. */
export const num = (v: number) => fmtValue(v, "harmonized");

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

export interface MonthStatus {
  state: "loading" | "none" | "ready";
  /** "November 2026 so far (1 to 5 Nov)" */
  when: string;
  /** The judgement in a few words: "lowest of 25 Novembers" */
  headline: string;
  /** "0.06 times the median" or a reason it cannot be judged. */
  ratioText: string;
  /** The numbers behind it, exact. */
  detail: string;
  verdict: string | null;
  verdictText: string | null;
  alert: boolean;
  /** Set when the month is near-real-time data. */
  provisional: string;
  /** This month and the median, exact; null when there is nothing to compare. */
  valueText: string | null;
  medianText: string | null;
}

export function useMonthStatus(): MonthStatus {
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
  const empty = { when: "", headline: "", ratioText: "", detail: "", verdict: null, verdictText: null, alert: false, provisional: "", valueText: null, medianText: null };
  if (status === "loading" || status === "idle") return { state: "loading", ...empty };
  if (!c || !month || c.year === null) return { state: "none", ...empty, headline: "No data to compare for this area." };

  const name = MONTH_FULL[month - 1];
  const when = `${name} ${c.year}${c.toDay ? ` so far (1 to ${c.toDay} ${name.slice(0, 3)})` : ""}`;
  const n = c.baselineYears.length;
  const span = n ? ` (${c.baselineYears[0]} to ${c.baselineYears[n - 1]})` : "";
  const earlier = `${n} earlier ${name}s${span}`;
  let headline = "";
  let ratioText = "";
  let detail = "";
  if (c.status === "ok") {
    headline = `${formatRank(c.rank!)} ${name}s`;
    ratioText = c.ratio !== null ? `${formatRatio(c.ratio)} times the median` : "the median is 0";
    detail = `This month ${num(c.value!)}; median of ${earlier} ${num(c.median!)}.${c.toDay ? ` Every year counts days 1 to ${c.toDay} only.` : ""}`;
  } else if (c.status === "too-little") {
    headline = "too little activity to judge";
    detail = `This month ${num(c.value!)} and the median of ${earlier} ${num(c.median!)} are both below ${MIN_ACTIVITY}.`;
  } else if (c.status === "not-enough-history") {
    headline = "not enough history to judge";
    detail = `Only ${earlier} in the harmonized record; at least ${MIN_HISTORY_YEARS} are needed.`;
  } else {
    headline = "no data to compare";
    detail = "The month-to-date count is missing for this month.";
  }
  const ym = `${c.year}-${String(month).padStart(2, "0")}`;
  return {
    state: "ready",
    when,
    headline,
    ratioText,
    detail,
    verdict: c.verdict ?? null,
    verdictText: c.verdict ? VERDICT_TEXT[c.verdict] : null,
    alert: c.verdict === "above" || c.verdict === "far-above",
    provisional: meta?.nrt_from && ym >= meta.nrt_from ? "Provisional: near-real-time data that may still change." : "",
    valueText: c.value !== null && c.value !== undefined ? num(c.value) : null,
    medianText: c.median !== null && c.median !== undefined ? num(c.median) : null,
  };
}

export default function UnusualBanner() {
  const s = useMonthStatus();
  return (
    <ChartFrame title="Is now unusual?" mode="harmonized" lede="This month so far, against the same days of the same month in earlier years.">
      {s.state === "loading" ? (
        <p className="cf-empty">Loading…</p>
      ) : s.state === "none" ? (
        <p className="cf-empty">{s.headline}</p>
      ) : (
        <div className={`status${s.alert ? " status-alert" : ""}`} role="status">
          <p className="status-sentence">
            {s.when}: {s.headline}
            {s.ratioText && <>, {s.ratioText}</>}.{" "}
            {s.verdictText && <span className={`verdict verdict-${s.verdict}`}>{s.verdictText}</span>}
          </p>
          <p className="status-detail">{s.detail} {s.provisional}</p>
          <div className="chart-controls">
            <span>Compare with</span>
            <BaselineSwitch />
          </div>
        </div>
      )}
    </ChartFrame>
  );
}
