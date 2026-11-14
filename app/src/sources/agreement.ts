// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "Do the satellites agree?" Five satellites watch the same ground at different
// times of day with two kinds of sensor, so they report different things. This
// file reads the published hotspot rows for an area and says, fire by fire,
// which satellites saw it. Pure functions; every number is counted from rows.
import { pointInPolygon } from "../data/select";
import type { Polygon } from "../data/types";
import { splitCsvLine } from "../downloads/hotspots";

/**
 * The rules, in one place. The first four repeat what the pipeline already
 * uses; the last three are new and are recorded in docs/DECISIONS.md (38).
 */
export const RULES = {
  /** Fire cell size in degrees, about 1 km (decision 6). */
  CELL_DEG: 0.01,
  /** Two detections are the same fire if at most this many cells apart (pipeline NEIGHBOUR). */
  NEIGHBOUR: 1,
  /** MODIS detections below this confidence are left out (decision 8); so is VIIRS "low". */
  MODIS_MIN_CONFIDENCE: 30,
  /** Fewer fire cells than this: too few to judge (same minimum as the pre-registered checks). */
  MIN_SAMPLE: 30,
  /** Two VIIRS satellites agree if the log of their ratio is at most this (about 28 percent). */
  AGREE_LOG_RATIO: 0.25,
  /** A satellite's pass has drifted if its local time moved by more than this many minutes. */
  DRIFT_MINUTES: 30,
} as const;

export type Family = "MODIS" | "VIIRS";
export const SATELLITES = ["Terra", "Aqua", "S-NPP", "NOAA-20", "NOAA-21"] as const;
export type Satellite = (typeof SATELLITES)[number];
export const FAMILY: Record<Satellite, Family> = { Terra: "MODIS", Aqua: "MODIS", "S-NPP": "VIIRS", "NOAA-20": "VIIRS", "NOAA-21": "VIIRS" };

const CODES: Record<string, Satellite> = { Terra: "Terra", T: "Terra", Aqua: "Aqua", A: "Aqua", SNPP: "S-NPP", N: "S-NPP", N20: "NOAA-20", N21: "NOAA-21" };
const BIT: Record<Satellite, number> = { Terra: 1, Aqua: 2, "S-NPP": 4, "NOAA-20": 8, "NOAA-21": 16 };
const MODIS_BITS = 3;
const VIIRS_BITS = 28;

/** Local solar time in hours (0 to 24) from a UTC "HHMM" time and a longitude. */
export function localHours(acqTime: string, lon: number): number {
  const t = acqTime.trim().padStart(4, "0");
  const h = Number(t.slice(0, 2)) + Number(t.slice(2)) / 60 + lon / 15;
  return ((h % 24) + 24) % 24;
}

/** Mean of clock times, safe across midnight. Null for no values. */
export function meanClock(sumSin: number, sumCos: number, n: number): number | null {
  if (n === 0) return null;
  const h = (Math.atan2(sumSin, sumCos) / (2 * Math.PI)) * 24;
  return ((h % 24) + 24) % 24;
}

/** 13.12 hours as "13:07". */
export function fmtClock(hours: number | null): string {
  if (hours === null) return "none";
  const m = Math.round(hours * 60) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Minutes from clock time a to clock time b, between -720 and 720. */
export function clockDiffMinutes(a: number, b: number): number {
  let d = (b - a) * 60;
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return Math.round(d);
}

export interface SatelliteStats {
  satellite: Satellite;
  family: Family;
  /** Every detection in the area and dates, before any filter. */
  detections: number;
  dayTime: number | null;
  nightTime: number | null;
  /** Fire cells (cell, date, day or night) this satellite saw, after the filters. */
  fireCells: number;
}

export type PairVerdict = "agree" | "differ" | "few";

export interface Agreement {
  rows: number;
  satellites: SatelliteStats[];
  /** Left out before comparing: not a vegetation fire, or low confidence. */
  notFire: number;
  lowConfidence: number;
  /** Fires (fire cells per date and half-day), by who saw them. They add up to `fires`. */
  both: number;
  viirsSeveral: number;
  viirsOne: number;
  modisOnly: number;
  fires: number;
  hasViirs: boolean;
  /** The two VIIRS satellites with most fire cells, compared. */
  pair: { a: Satellite; b: Satellite; na: number; nb: number; logRatio: number | null; verdict: PairVerdict } | null;
}

function bitCount(m: number): number {
  let c = 0;
  for (; m; m &= m - 1) c++;
  return c;
}

/**
 * Compare the satellites over one or more hotspot files (text of
 * <region>/hotspots/<YYYY>.csv). Rows outside the polygon (null: everywhere)
 * or outside the months [from, to] are ignored.
 */
export function analyseAgreement(texts: string[], polygon: Polygon | null, from: string, to: string): Agreement {
  const acc = new Map<Satellite, { n: number; ds: number; dc: number; dn: number; ns: number; nc: number; nn: number }>();
  const cells = new Map<string, number>();
  let rows = 0;
  let notFire = 0;
  let lowConfidence = 0;

  for (const text of texts) {
    const lines = text.split(/\r?\n/);
    let h = 0;
    while (h < lines.length && (lines[h].trim() === "" || lines[h].startsWith("#"))) h++;
    if (h >= lines.length) continue;
    const cols = splitCsvLine(lines[h]).map((c) => c.trim().toLowerCase());
    const idx = (name: string) => cols.indexOf(name);
    const [iLat, iLon, iDate, iTime, iSat, iConf, iDn, iType] = ["latitude", "longitude", "acq_date", "acq_time", "satellite", "confidence", "daynight", "type"].map(idx);
    if ([iLat, iLon, iDate, iTime, iSat, iDn].some((i) => i < 0)) {
      throw new Error("The hotspot file lacks a column needed to compare satellites.");
    }
    for (let k = h + 1; k < lines.length; k++) {
      const line = lines[k];
      if (line === "") continue;
      const f = line.includes('"') ? splitCsvLine(line) : line.split(",");
      const date = f[iDate] ?? "";
      const ym = date.slice(0, 7);
      if (ym < from || ym > to) continue;
      const lat = Number(f[iLat]);
      const lon = Number(f[iLon]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      if (polygon && !pointInPolygon(lon, lat, polygon)) continue;
      const sat = CODES[f[iSat]];
      if (!sat) continue;
      rows++;
      const night = f[iDn] === "N";
      let a = acc.get(sat);
      if (!a) acc.set(sat, (a = { n: 0, ds: 0, dc: 0, dn: 0, ns: 0, nc: 0, nn: 0 }));
      a.n++;
      const angle = (localHours(f[iTime] ?? "", lon) / 24) * 2 * Math.PI;
      if (night) {
        a.ns += Math.sin(angle);
        a.nc += Math.cos(angle);
        a.nn++;
      } else {
        a.ds += Math.sin(angle);
        a.dc += Math.cos(angle);
        a.dn++;
      }
      // Filters, as in the pipeline: vegetation fires only, low confidence out.
      const type = iType >= 0 ? f[iType] : "";
      if (type !== "" && type !== "0") {
        notFire++;
        continue;
      }
      const conf = iConf >= 0 ? f[iConf] : "";
      const low = FAMILY[sat] === "MODIS" ? conf !== "" && Number(conf) < RULES.MODIS_MIN_CONFIDENCE : conf === "l" || conf === "low";
      if (low) {
        lowConfidence++;
        continue;
      }
      const key = `${date}${night ? "N" : "D"}|${Math.floor(lon / RULES.CELL_DEG)}|${Math.floor(lat / RULES.CELL_DEG)}`;
      cells.set(key, (cells.get(key) ?? 0) | BIT[sat]);
    }
  }

  const fireCells = new Map<Satellite, number>();
  let both = 0;
  let viirsSeveral = 0;
  let viirsOne = 0;
  let modisOnly = 0;
  const r = RULES.NEIGHBOUR;
  for (const [key, mask] of cells) {
    for (const s of SATELLITES) if (mask & BIT[s]) fireCells.set(s, (fireCells.get(s) ?? 0) + 1);
    const [head, xs, ys] = key.split("|");
    const x = Number(xs);
    const y = Number(ys);
    let near = mask;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (dx || dy) near |= cells.get(`${head}|${x + dx}|${y + dy}`) ?? 0;
      }
    }
    if (mask & VIIRS_BITS) {
      if (near & MODIS_BITS) both++;
      else if (bitCount(near & VIIRS_BITS) >= 2) viirsSeveral++;
      else viirsOne++;
    } else if (!(near & VIIRS_BITS)) modisOnly++;
    // A MODIS cell beside a VIIRS cell is the same fire, already counted under "both".
  }

  const satellites: SatelliteStats[] = SATELLITES.filter((s) => acc.has(s)).map((s) => {
    const a = acc.get(s)!;
    return { satellite: s, family: FAMILY[s], detections: a.n, dayTime: meanClock(a.ds, a.dc, a.dn), nightTime: meanClock(a.ns, a.nc, a.nn), fireCells: fireCells.get(s) ?? 0 };
  });

  const viirs = satellites.filter((s) => s.family === "VIIRS").sort((p, q) => q.fireCells - p.fireCells);
  let pair: Agreement["pair"] = null;
  if (viirs.length >= 2) {
    const [p, q] = viirs;
    const few = p.fireCells < RULES.MIN_SAMPLE || q.fireCells < RULES.MIN_SAMPLE;
    const logRatio = q.fireCells > 0 ? Math.log(p.fireCells / q.fireCells) : null;
    pair = { a: p.satellite, b: q.satellite, na: p.fireCells, nb: q.fireCells, logRatio, verdict: few || logRatio === null ? "few" : Math.abs(logRatio) <= RULES.AGREE_LOG_RATIO ? "agree" : "differ" };
  }

  return { rows, satellites, notFire, lowConfidence, both, viirsSeveral, viirsOne, modisOnly, fires: both + viirsSeveral + viirsOne + modisOnly, hasViirs: viirs.length > 0, pair };
}

/** One row of <region>/sources.json (written by app/scripts/make_sources.py). */
export interface SourceYear {
  year: number;
  satellite: Satellite;
  family: Family;
  day: number;
  night: number;
  days_with_detections: number;
  day_local_time: number | null;
}

export interface Drift {
  satellite: Satellite;
  firstYear: number;
  lastYear: number;
  firstTime: number;
  lastTime: number;
  minutes: number;
  drifted: boolean;
}

/** How far each satellite's daytime pass has moved between its first and last usable year. */
export function passDrift(rows: SourceYear[]): Drift[] {
  return SATELLITES.flatMap((s) => {
    const mine = rows.filter((r) => r.satellite === s && r.day_local_time !== null && r.day >= RULES.MIN_SAMPLE).sort((a, b) => a.year - b.year);
    if (mine.length < 2) return [];
    const first = mine[0];
    const last = mine[mine.length - 1];
    const minutes = clockDiffMinutes(first.day_local_time!, last.day_local_time!);
    return [{ satellite: s, firstYear: first.year, lastYear: last.year, firstTime: first.day_local_time!, lastTime: last.day_local_time!, minutes, drifted: Math.abs(minutes) > RULES.DRIFT_MINUTES }];
  });
}
