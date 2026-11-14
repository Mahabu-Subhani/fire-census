// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { bboxToPolygon } from "../data/select";
import { analyseAgreement, clockDiffMinutes, fmtClock, localHours, meanClock, passDrift, RULES, type SourceYear } from "./agreement";

const HEAD = "latitude,longitude,acq_date,acq_time,satellite,instrument,confidence,daynight,type";
const file = (...rows: string[]) => [HEAD, ...rows, ""].join("\n");

describe("clock helpers", () => {
  it("turns UTC and longitude into local solar time", () => {
    expect(localHours("0800", 75)).toBeCloseTo(13, 5);
    expect(localHours("0453", -63)).toBeCloseTo(0.683, 2);
    expect(localHours("30", -15)).toBeCloseTo(23.5, 5);
  });
  it("averages times across midnight", () => {
    const a = (h: number) => (h / 24) * 2 * Math.PI;
    const m = meanClock(Math.sin(a(23.5)) + Math.sin(a(0.5)), Math.cos(a(23.5)) + Math.cos(a(0.5)), 2)!;
    expect(Math.min(m, 24 - m)).toBeCloseTo(0, 5);
    expect(meanClock(0, 0, 0)).toBeNull();
  });
  it("formats and subtracts clock times", () => {
    expect(fmtClock(13.12)).toBe("13:07");
    expect(fmtClock(null)).toBe("none");
    expect(clockDiffMinutes(13.2, 15.41)).toBe(133);
    expect(clockDiffMinutes(23.5, 0.5)).toBe(60);
  });
});

describe("analyseAgreement", () => {
  const text = file(
    // Fire 1: Aqua and S-NPP, neighbouring cells, same day: both families.
    "30.505,75.505,2020-10-15,0800,Aqua,MODIS,80,D,0",
    "30.512,75.512,2020-10-15,0750,SNPP,SNPP,n,D,0",
    "30.512,75.513,2020-10-15,0750,SNPP,SNPP,n,D,0", // same cell, same pass: one fire cell
    // Fire 2: two VIIRS satellites, no MODIS.
    "30.705,75.705,2020-10-15,0750,SNPP,SNPP,n,D,0",
    "30.705,75.705,2020-10-15,0840,N20,VIIRS,h,D,0",
    // Fire 3: one VIIRS satellite only.
    "30.905,75.905,2020-10-16,0750,N20,VIIRS,n,D,0",
    // Fire 4: MODIS only (Terra, morning).
    "31.105,76.105,2020-10-16,0530,Terra,MODIS,60,D,0",
    // Left out: low confidence, and a static source.
    "31.305,76.305,2020-10-16,0750,SNPP,SNPP,l,D,0",
    "31.505,76.505,2020-10-16,0800,Aqua,MODIS,20,D,0",
    "31.705,76.705,2020-10-16,0800,Aqua,MODIS,90,D,2",
    // Outside the dates.
    "30.505,75.505,2020-12-01,0800,Aqua,MODIS,80,D,0",
  );

  it("sorts fires by who saw them", () => {
    const r = analyseAgreement([text], null, "2020-10", "2020-10");
    expect(r.rows).toBe(10);
    expect([r.both, r.viirsSeveral, r.viirsOne, r.modisOnly]).toEqual([1, 1, 1, 1]);
    expect(r.fires).toBe(4);
    expect(r.lowConfidence).toBe(2);
    expect(r.notFire).toBe(1);
    expect(r.hasViirs).toBe(true);
  });
  it("counts detections and pass times per satellite", () => {
    const r = analyseAgreement([text], null, "2020-10", "2020-10");
    const snpp = r.satellites.find((s) => s.satellite === "S-NPP")!;
    expect(snpp.detections).toBe(4);
    expect(snpp.fireCells).toBe(2);
    expect(fmtClock(snpp.dayTime)).toBe("12:53");
    expect(r.satellites.map((s) => s.satellite)).toEqual(["Terra", "Aqua", "S-NPP", "NOAA-20"]);
  });
  it("says too few to judge below the minimum sample", () => {
    const r = analyseAgreement([text], null, "2020-10", "2020-10");
    expect(r.pair).toMatchObject({ a: "S-NPP", b: "NOAA-20", na: 2, nb: 2, verdict: "few" });
  });
  it("judges two VIIRS satellites on enough fires", () => {
    const many = (sat: string, n: number) => Array.from({ length: n }, (_, i) => `${(30.005 + i * 0.02).toFixed(3)},75.005,2020-10-15,0750,${sat},VIIRS,n,D,0`);
    const agree = analyseAgreement([file(...many("N20", 40), ...many("N21", 36))], null, "2020-10", "2020-10");
    expect(agree.pair?.verdict).toBe("agree");
    const differ = analyseAgreement([file(...many("N20", 60), ...many("N21", 32))], null, "2020-10", "2020-10");
    expect(differ.pair?.verdict).toBe("differ");
    expect(Math.abs(differ.pair!.logRatio!)).toBeGreaterThan(RULES.AGREE_LOG_RATIO);
  });
  it("respects the drawn area and handles MODIS-only selections", () => {
    const r = analyseAgreement([text], bboxToPolygon([76, 31, 76.2, 31.2]), "2020-10", "2020-10");
    expect(r.rows).toBe(1);
    expect(r.modisOnly).toBe(1);
    expect(r.hasViirs).toBe(false);
    expect(r.pair).toBeNull();
  });
  it("returns zeros for an empty file", () => {
    expect(analyseAgreement([""], null, "2020-01", "2020-12").fires).toBe(0);
  });
});

describe("passDrift", () => {
  const row = (year: number, satellite: SourceYear["satellite"], t: number | null, day = 500): SourceYear => ({ year, satellite, family: "MODIS", day, night: 0, days_with_detections: 100, day_local_time: t });
  it("measures the move between the first and last usable year", () => {
    const d = passDrift([row(2005, "Aqua", 13.2), row(2015, "Aqua", 13.25), row(2026, "Aqua", 15.41), row(2012, "S-NPP", 13.09), row(2026, "S-NPP", 13.09)]);
    expect(d.find((x) => x.satellite === "Aqua")).toMatchObject({ firstYear: 2005, lastYear: 2026, minutes: 133, drifted: true });
    expect(d.find((x) => x.satellite === "S-NPP")).toMatchObject({ minutes: 0, drifted: false });
  });
  it("skips years with too few detections", () => {
    expect(passDrift([row(2005, "Terra", 10.9), row(2026, "Terra", 9.2, 5)])).toEqual([]);
  });
});
