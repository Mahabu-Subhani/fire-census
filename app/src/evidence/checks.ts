// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Turns meta.json into what the Checks and Method panels show. All numbers
// come from meta.json; this file only formats them.
import type { Check, Meta, Region, Verdict } from "../data/types";

export const VERDICT_LABEL: Record<Verdict, string> = { pass: "Passed", fail: "Failed", "not run": "Not run" };

/** A check added after the results were seen (for example C3r). */
export function isAddedAfter(check: Check): boolean {
  return /after results/i.test(`${check.name} ${check.note}`);
}

export function summarizeChecks(checks: Check[]) {
  const count = (v: Verdict) => checks.filter((c) => c.verdict === v).length;
  return {
    pass: count("pass"),
    fail: count("fail"),
    notRun: count("not run"),
    preRegistered: checks.filter((c) => !isAddedAfter(c)).length,
    addedAfter: checks.filter(isAddedAfter).length,
  };
}

/** "8 passed, 2 failed, 1 not run" (zero counts left out). */
export function summaryText(checks: Check[]): string {
  const s = summarizeChecks(checks);
  const parts = [
    s.pass ? `${s.pass} passed` : "",
    s.fail ? `${s.fail} failed` : "",
    s.notRun ? `${s.notRun} not run` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no checks";
}

/** Show a value as the pipeline wrote it; round long numbers to 3 decimals. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(3);
  return String(value);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthName(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

interface Calibration {
  months?: string[];
  reference_pair?: string;
  area?: string;
}

export function calibrationOf(meta: Meta): Calibration {
  const c = meta.calibration;
  return c && typeof c === "object" ? (c as Calibration) : {};
}

function floorOf(meta: Meta): { day: number | null; night: number | null } {
  const f = meta.floor_mw as { day?: number | null; night?: number | null } | undefined;
  return { day: f?.day ?? null, night: f?.night ?? null };
}

/**
 * The always-visible plain-language summary, worded for the level that
 * shipped (Person A's text in submission/method_panel.md, adapted per level).
 */
export function shortVersion(meta: Meta): string {
  const opening =
    "VIIRS detects substantially more fire hotspots than MODIS, so combined counts step up in 2012. " +
    "All values are expressed as MODIS-equivalent detections";
  const closing = " Weaker VIIRS-only fires are reported separately in the small-fire layer.";
  const floor = floorOf(meta);
  const constants = meta.constants as { day?: number; night?: number } | undefined;
  switch (meta.level_shipped) {
    case "S0":
      return `${opening}, using a MODIS detection-probability curve by fire strength.${closing}`;
    case "L2":
      return floor.day !== null && floor.night !== null
        ? `${opening}: from 2012, only VIIRS fire cells MODIS could have detected are counted (above ${floor.day} MW by day and ${floor.night} MW by night).${closing}`
        : `${opening}: from 2012, only VIIRS fire cells MODIS could have detected are counted.${closing}`;
    case "L1r":
      return constants?.day !== undefined && constants?.night !== undefined
        ? `${opening}, scaling VIIRS fire cells by a constant ratio from the overlap period (${constants.day} by day, ${constants.night} by night).`
        : `${opening}, scaling VIIRS fire cells by a constant ratio from the overlap period.`;
    default:
      return `${opening}. Method: ${meta.level_name ?? meta.level_shipped}.`;
  }
}

/** Where the calibration came from, including when an area borrows another's. */
export function calibrationText(meta: Meta, region: Region, regions: Region[]): string {
  const c = calibrationOf(meta);
  const span = c.months && c.months.length === 2 ? `${monthName(c.months[0])} to ${monthName(c.months[1])}` : "the overlap years";
  const pair = c.reference_pair ?? "Aqua MODIS and Suomi NPP VIIRS";
  if (c.area && c.area !== region.id) {
    const source = regions.find((r) => r.id === c.area)?.name ?? c.area;
    return `This area has too few fires of its own, so it uses the calibration of ${source}: ${pair}, ${span}.`;
  }
  return `Calibrated on this region: ${pair}, ${span}.`;
}

/**
 * A region that ships the fallback because its held-out checks fail (C3 and
 * C3r). Read from meta.json, so no region is named here.
 */
export function isCaseStudy(meta: Meta): boolean {
  const verdict = (id: string) => meta.checks.find((c) => c.id === id)?.verdict;
  return verdict("C3") === "fail" && verdict("C3r") === "fail";
}
