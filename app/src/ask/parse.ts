// AI-assisted: written with help from Claude (Anthropic). Reviewed by Mahabu Subhani (pending).
// The question bar's reader. Fixed rules, no language model and no network:
// it looks for the names of the processed regions and their districts, for
// months, years and ranges, and for a few keywords, and returns the selection
// they describe. It never answers a question; it only sets the screen.
// Every part it recognised is returned with its position in the text, so the
// bar can colour it while the visitor types (docs/DECISIONS.md, decision 55).
import { normalize } from "../data/places";
import type { Mode, Polygon } from "../data/types";

export interface AskRegion {
  id: string;
  name: string;
  first_month: string;
  last_month: string;
}

export interface AskPlace {
  regionId: string;
  name: string;
  label: string;
  ring: Polygon;
}

export type TokenKind = "place" | "date" | "option";

export interface Token {
  /** Position in the typed text, end exclusive. */
  start: number;
  end: number;
  kind: TokenKind;
  /** What it was read as: "Ludhiana, Punjab, India", "Oct 2024", "Raw record". */
  label: string;
}

export interface Parsed {
  tokens: Token[];
  /** The region to show; null keeps the current one. */
  regionId: string | null;
  /** A district to select. */
  place: AskPlace | null;
  /** True when a region was named without a district: show all of it. */
  wholeRegion: boolean;
  from: string | null;
  to: string | null;
  mode: Mode | null;
  research: boolean;
  small: boolean;
  /** Why the question cannot be shown; Enter does nothing while this is set. */
  problem: string | null;
  /** Said next to the result, for example when dates were cut to the record. */
  note: string | null;
}

export interface AskContext {
  regions: AskRegion[];
  places: AskPlace[];
  currentRegionId: string | null;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNT_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20 };
/** Words in a region's id that do not name it on their own. */
const NOT_A_NAME = new Set(["south", "north", "east", "west", "and", "neighbouring", "areas", "hills", "rioja", "argentina", "india"]);
/** After "in" or "near", these are not an attempt at a place name. */
const NOT_A_PLACE = new Set(["the", "a", "an", "my", "our", "this", "that", "it", "each", "every", "all", "any", "which", "what", "total", "general", "detail", "full", "fact", "there", "here", "area", "region", "district"]);

interface Word {
  text: string;
  start: number;
  end: number;
}

function words(text: string): Word[] {
  const out: Word[] = [];
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) out.push({ text: normalize(m[0]), start: m.index, end: m.index + m[0].length });
  return out;
}

const key = (name: string) => words(name).map((w) => w.text).join(" ");

function monthIndex(word: string): number | null {
  if (word.length < 3) return null;
  const i = MONTHS.findIndex((m) => m === word || (word.length === 3 && m.startsWith(word)) || (word === "sept" && m === "september"));
  return i >= 0 ? i + 1 : null;
}

const yearOf = (word: string): number | null => (/^(19|20)\d\d$/.test(word) ? Number(word) : null);
const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
const shift = (month: string, by: number) => {
  const n = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + by;
  return ym(Math.floor(n / 12), (n % 12) + 1);
};
export const monthLabel = (month: string) => `${MONTH_SHORT[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

/** A month, a year, or both, as typed. */
interface Point {
  len: number;
  y: number | null;
  m: number | null;
}

/** A date before the region is known: resolved against that region's record. */
type DateSpec =
  | { kind: "all" }
  | { kind: "latest"; back: number }
  | { kind: "thisYear"; back: number }
  | { kind: "lastN"; n: number; unit: "month" | "year" }
  | { kind: "since"; p: Point }
  | { kind: "range"; a: Point; b: Point }
  | { kind: "point"; p: Point };

interface Found {
  len: number;
  kind: TokenKind;
  apply: (state: Draft) => void;
}

interface Draft {
  regionIds: string[];
  placeKeys: { key: string; token: number }[];
  date: { spec: DateSpec; token: number } | null;
  mode: Mode | null;
  research: boolean;
  small: boolean;
}

function readPoint(w: Word[], i: number, text: string): Point | null {
  const a = w[i];
  if (!a) return null;
  const b = w[i + 1];
  const gap = b ? text.slice(a.end, b.start) : "";
  const m = monthIndex(a.text);
  const y = yearOf(a.text);
  if (m !== null) {
    const y2 = b ? yearOf(b.text) : null;
    return y2 !== null && /^[\s,]*$/.test(gap) ? { len: 2, y: y2, m } : { len: 1, y: null, m };
  }
  if (y !== null) {
    if (b) {
      const m2 = monthIndex(b.text);
      if (m2 !== null && /^\s+$/.test(gap)) return { len: 2, y, m: m2 };
      // "2024-10" and "2024/10"
      if (/^[-/]$/.test(gap) && /^(0?[1-9]|1[0-2])$/.test(b.text)) return { len: 2, y, m: Number(b.text) };
    }
    return { len: 1, y, m: null };
  }
  return null;
}

function readDate(w: Word[], i: number, text: string): { len: number; spec: DateSpec } | null {
  const t = (k: number) => w[i + k]?.text ?? "";
  const two = `${t(0)} ${t(1)}`;
  if (["this month", "current month", "right now"].includes(two)) return { len: 2, spec: { kind: "latest", back: 0 } };
  if (["last month", "previous month"].includes(two)) return { len: 2, spec: { kind: "latest", back: 1 } };
  if (["this year", "current year"].includes(two)) return { len: 2, spec: { kind: "thisYear", back: 0 } };
  if (["last year", "previous year"].includes(two)) return { len: 2, spec: { kind: "thisYear", back: 1 } };
  if (["all time", "whole record", "full record", "entire record", "all years", "every year"].includes(two)) return { len: 2, spec: { kind: "all" } };
  if (["now", "today", "currently", "latest"].includes(t(0))) return { len: 1, spec: { kind: "latest", back: 0 } };
  if (t(0) === "last" || t(0) === "past") {
    const n = /^\d{1,3}$/.test(t(1)) ? Number(t(1)) : (COUNT_WORDS[t(1)] ?? null);
    const unit = /^years?$/.test(t(2)) ? "year" : /^months?$/.test(t(2)) ? "month" : null;
    if (n && unit) return { len: 3, spec: { kind: "lastN", n, unit } };
    if (/^(decade)$/.test(t(1))) return { len: 2, spec: { kind: "lastN", n: 10, unit: "year" } };
  }

  const lead = ["since", "from", "between", "after"].includes(t(0)) ? t(0) : null;
  const j = lead ? i + 1 : i;
  const a = readPoint(w, j, text);
  if (!a) return null;
  const next = w[j + a.len];
  const after = w[j + a.len - 1];
  if (next) {
    const gap = text.slice(after.end, next.start).trim();
    const joined = /^[-–—]$/.test(gap);
    const linked = ["to", "until", "till", "through", "upto"].includes(next.text) || (lead === "between" && next.text === "and");
    const b = joined ? readPoint(w, j + a.len, text) : linked ? readPoint(w, j + a.len + 1, text) : null;
    if (b) return { len: (lead ? 1 : 0) + a.len + (joined ? 0 : 1) + b.len, spec: { kind: "range", a, b } };
  }
  if (lead === "since" || lead === "from" || lead === "after") return { len: 1 + a.len, spec: { kind: "since", p: a } };
  if (lead) return null;
  return { len: a.len, spec: { kind: "point", p: a } };
}

/** Turn what was typed into months of this region's record. */
function resolveDate(spec: DateSpec, region: AskRegion): { from: string; to: string } {
  const last = region.last_month;
  const lastY = Number(last.slice(0, 4));
  // A month with no year is its most recent occurrence in the record.
  const recent = (m: number) => (ym(lastY, m) <= last ? ym(lastY, m) : ym(lastY - 1, m));
  const start = (p: Point, yearHint: number | null) =>
    p.m !== null ? (p.y ?? yearHint) !== null ? ym((p.y ?? yearHint)!, p.m) : recent(p.m) : ym(p.y!, 1);
  const end = (p: Point, yearHint: number | null) =>
    p.m !== null ? (p.y ?? yearHint) !== null ? ym((p.y ?? yearHint)!, p.m) : recent(p.m) : ym(p.y!, 12);
  switch (spec.kind) {
    case "all":
      return { from: region.first_month, to: last };
    case "latest":
      // "This month" keeps the whole record on screen: the answer at the top
      // of the panel is already about the latest month.
      return spec.back === 0 ? { from: region.first_month, to: last } : { from: shift(last, -spec.back), to: shift(last, -spec.back) };
    case "thisYear":
      return { from: ym(lastY - spec.back, 1), to: ym(lastY - spec.back, 12) };
    case "lastN":
      return spec.unit === "year" ? { from: ym(lastY - spec.n + 1, 1), to: last } : { from: shift(last, -(spec.n - 1)), to: last };
    case "since":
      return { from: start(spec.p, null), to: last };
    case "range": {
      const from = start(spec.a, spec.b.y);
      const to = end(spec.b, spec.a.y);
      return from <= to ? { from, to } : { from: to, to: from };
    }
    case "point":
      return { from: start(spec.p, null), to: end(spec.p, null) };
  }
}

function dateLabel(spec: DateSpec, from: string, to: string): string {
  if (spec.kind === "all") return "Whole record";
  if (spec.kind === "latest" && spec.back === 0) return `This month (${monthLabel(to)})`;
  if (from === to) return monthLabel(from);
  if (from.slice(0, 4) === to.slice(0, 4) && from.endsWith("-01") && to.endsWith("-12")) return from.slice(0, 4);
  return `${monthLabel(from)} to ${monthLabel(to)}`;
}

export const EMPTY: Parsed = {
  tokens: [], regionId: null, place: null, wholeRegion: false, from: null, to: null, mode: null, research: false, small: false, problem: null, note: null,
};

export function parseQuery(text: string, ctx: AskContext): Parsed {
  const w = words(text);
  if (w.length === 0) return EMPTY;

  // Names to look for, as sequences of words.
  const regionNames = new Map<string, string>();
  for (const r of ctx.regions) {
    // "punjab-haryana" and "Bandipur, Nagarhole and BR Hills, Karnataka, India" both name their region.
    for (const part of [...r.id.split("-"), ...words(r.name).map((x) => x.text)]) {
      if (part.length >= 5 && !NOT_A_NAME.has(part)) regionNames.set(part, r.id);
    }
  }
  const placeNames = new Map<string, AskPlace[]>();
  let longest = 1;
  for (const p of ctx.places) {
    const k = key(p.name);
    if (k.length < 3) continue;
    placeNames.set(k, [...(placeNames.get(k) ?? []), p]);
    longest = Math.max(longest, k.split(" ").length);
  }

  const draft: Draft = { regionIds: [], placeKeys: [], date: null, mode: null, research: false, small: false };
  const spans: { start: number; end: number; kind: TokenKind }[] = [];
  const unknown: string[] = [];

  const at = (i: number): Found | null => {
    const found: Found[] = [];
    const date = readDate(w, i, text);
    if (date && !draft.date) found.push({ len: date.len, kind: "date", apply: (d) => { d.date = { spec: date.spec, token: spans.length }; } });
    const regionId = regionNames.get(w[i].text);
    if (regionId) found.push({ len: 1, kind: "place", apply: (d) => { d.regionIds.push(regionId); } });
    for (let n = Math.min(longest, w.length - i); n >= 1; n--) {
      const k = w.slice(i, i + n).map((x) => x.text).join(" ");
      if (placeNames.has(k)) {
        found.push({ len: n, kind: "place", apply: (d) => { d.placeKeys.push({ key: k, token: spans.length }); } });
        break;
      }
    }
    const one = w[i].text;
    const two = `${one} ${w[i + 1]?.text ?? ""}`;
    if (one === "raw") found.push({ len: two === "raw record" ? 2 : 1, kind: "option", apply: (d) => { d.mode = "raw"; } });
    if (/^harmoni[sz]ed?$/.test(one) || one === "comparable") found.push({ len: /^harmoni[sz]ed record$/.test(two) ? 2 : 1, kind: "option", apply: (d) => { d.mode = "harmonized"; } });
    if (/^small fires?$/.test(two)) found.push({ len: 2, kind: "option", apply: (d) => { d.small = true; } });
    if (["method", "methods", "checks", "evidence", "glossary"].includes(one)) found.push({ len: 1, kind: "option", apply: (d) => { d.research = true; } });
    // The longest reading wins; on a tie a date, then a region, then a district.
    return found.reduce<Found | null>((best, f) => (best === null || f.len > best.len ? f : best), null);
  };

  for (let i = 0; i < w.length; ) {
    const f = at(i);
    if (f) {
      f.apply(draft);
      spans.push({ start: w[i].start, end: w[i + f.len - 1].end, kind: f.kind });
      i += f.len;
      continue;
    }
    // "in Bengaluru": a place we do not have. Say so instead of guessing.
    if (["in", "at", "near", "around"].includes(w[i].text) && w[i + 1] && !at(i + 1) && !NOT_A_PLACE.has(w[i + 1].text) && !/^\d+$/.test(w[i + 1].text)) {
      unknown.push(text.slice(w[i + 1].start, w[i + 1].end));
    }
    i += 1;
  }

  // Where: a district decides the region; otherwise a named region; otherwise the current one.
  const named = draft.regionIds[0] ?? null;
  let place: AskPlace | null = null;
  const labels = new Map<number, string>();
  for (const { key: k, token } of draft.placeKeys) {
    const options = placeNames.get(k)!;
    const pick = options.find((p) => p.regionId === named) ?? options.find((p) => p.regionId === ctx.currentRegionId) ?? options[0];
    place ??= pick;
    labels.set(token, pick.label);
  }
  const regionId = place?.regionId ?? named;
  const region = ctx.regions.find((r) => r.id === (regionId ?? ctx.currentRegionId)) ?? null;

  let from: string | null = null;
  let to: string | null = null;
  let problem: string | null = null;
  let note: string | null = null;
  if (draft.date && region) {
    const asked = resolveDate(draft.date.spec, region);
    if (asked.to < region.first_month || asked.from > region.last_month) {
      problem = `The record for ${region.name} runs from ${monthLabel(region.first_month)} to ${monthLabel(region.last_month)}.`;
    } else {
      from = asked.from < region.first_month ? region.first_month : asked.from;
      to = asked.to > region.last_month ? region.last_month : asked.to;
      if (from !== asked.from || to !== asked.to) note = `The record runs from ${monthLabel(region.first_month)} to ${monthLabel(region.last_month)}; the dates were cut to fit.`;
      labels.set(draft.date.token, dateLabel(draft.date.spec, from, to));
    }
  }

  if (unknown.length > 0 && !place && !named) {
    problem = `"${unknown[0]}" is not in the processed areas. Try ${ctx.regions.map((r) => r.name).join("; ")}, or a district inside one of them.`;
  }

  const tokens: Token[] = spans.map((s, n) => {
    const raw = text.slice(s.start, s.end);
    let label = labels.get(n);
    if (!label && s.kind === "place") label = ctx.regions.find((r) => r.id === regionNames.get(normalize(raw)))?.name ?? raw;
    if (!label && s.kind === "option") {
      const k = normalize(raw);
      label = k.startsWith("raw") ? "Raw record" : k.startsWith("small") ? "Small fires layer" : /^(harmoni|comparable)/.test(k) ? "Harmonized record" : "Data and methods";
    }
    return { ...s, label: label ?? raw };
  });

  if (tokens.length === 0 && !problem) problem = "No place or date found in that. Try a district, a month or a year.";

  return {
    tokens, regionId, place, wholeRegion: !place && named !== null, from, to,
    mode: draft.mode, research: draft.research, small: draft.small, problem, note,
  };
}
