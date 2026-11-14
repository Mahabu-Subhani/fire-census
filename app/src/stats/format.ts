// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// One way to write numbers everywhere, never approximated: harmonized values
// are fractional, so they always show two decimals; raw values are counts, so
// they show whole numbers. No "12K" style shortening anywhere.
import type { Mode } from "../data/types";

const grouped = (digits: number) =>
  new Intl.NumberFormat("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const two = grouped(2);
const zero = grouped(0);

/** A value as the record holds it: "1,234.57" (harmonized) or "1,235" (raw). */
export function fmtValue(v: number, mode: Mode = "harmonized"): string {
  return mode === "raw" ? zero.format(v) : two.format(v);
}

/** A difference with its sign: "+12.35", "−3.10", "0.00". */
export function fmtDiff(v: number, mode: Mode = "harmonized"): string {
  const body = fmtValue(Math.abs(v), mode);
  return v > 0 ? `+${body}` : v < 0 ? `−${body}` : body;
}

/** Axis ticks: full numbers with grouping, decimals only when the tick has them. */
export function fmtTick(v: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(v);
}

/** A share as a percentage with one decimal: "78.4%". */
export function fmtShare(share: number): string {
  return `${grouped(1).format(share * 100)}%`;
}
