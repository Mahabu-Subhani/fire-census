// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Summaries of a list of values: median, rank and 90th percentile.
// Callers drop null (unknown) values before calling these.

function sorted(list: number[]): number[] {
  return [...list].sort((a, b) => a - b);
}

/**
 * Quantile q (0..1) with linear interpolation between the closest ranks
 * (the "type 7" rule used by R's default and numpy). Null for an empty list.
 */
export function quantile(list: number[], q: number): number | null {
  if (list.length === 0) return null;
  const s = sorted(list);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function median(list: number[]): number | null {
  return quantile(list, 0.5);
}

export function p90(list: number[]): number | null {
  return quantile(list, 0.9);
}

export interface Rank {
  /** 1 = highest. Tied values share the best rank ("1224" ranking). */
  rank: number;
  /** Number of values ranked, including this one. */
  of: number;
  /** True if another value in the list equals this one. */
  tied: boolean;
}

/**
 * Rank of `x` from the top, among `list`. `list` must include `x` itself
 * (for example every year's November, this year included). Null if it does not.
 */
export function rank(x: number, list: number[]): Rank | null {
  const equal = list.filter((v) => v === x).length;
  if (equal === 0) return null;
  return { rank: 1 + list.filter((v) => v > x).length, of: list.length, tied: equal > 1 };
}

/** A value in a rank list, and whether it carries the harmonization error. */
export interface UncertainValue {
  value: number;
  uncertain: boolean;
}

/** Seeded generator (mulberry32), so the same data always gives the same range. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 90 percent range of the rank of `current` (1 = highest) among `others` when
 * every uncertain value is off by a log-normal factor with standard deviation
 * `sigma` (natural log), independently. `sigma` is the out-of-sample monthly
 * scatter of the harmonized record against Aqua (pipeline/loyo.py). Values
 * before 2012 are Aqua itself and are not perturbed. Null without a usable sigma.
 */
export function rankRange(
  current: UncertainValue,
  others: UncertainValue[],
  sigma: number | null | undefined,
  draws = 2000,
): { lo: number; hi: number } | null {
  if (!sigma || !(sigma > 0) || current.value <= 0) return null;
  const rand = rng(20261114);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const jitter = (v: UncertainValue) => (v.uncertain && v.value > 0 ? v.value * Math.exp(sigma * normal()) : v.value);
  const ranks: number[] = [];
  for (let i = 0; i < draws; i++) {
    const x = jitter(current);
    let r = 1;
    for (const o of others) if (jitter(o) > x) r++;
    ranks.push(r);
  }
  ranks.sort((a, b) => a - b);
  return { lo: ranks[Math.floor(0.05 * (draws - 1))], hi: ranks[Math.ceil(0.95 * (draws - 1))] };
}

/** "21st to 24th", or "" when the range is a single place. */
export function formatRankRange(r: { lo: number; hi: number } | null): string {
  if (!r || r.lo === r.hi) return "";
  return `${ordinal(r.lo)} to ${ordinal(r.hi)}`;
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** "2nd highest of 24", "joint 2nd highest of 24", "highest of 24" or "lowest of 24". */
export function formatRank(r: Rank): string {
  if (r.rank === r.of && r.of > 1 && !r.tied) return `lowest of ${r.of}`;
  const place = r.rank === 1 ? "highest" : `${ordinal(r.rank)} highest`;
  return `${r.tied ? "joint " : ""}${place} of ${r.of}`;
}

/** A ratio to the median: two decimals below 1, so 0.058 reads "0.06", not a flattering "0.1". */
export function formatRatio(r: number): string {
  return r.toFixed(2);
}
