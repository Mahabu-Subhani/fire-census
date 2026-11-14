// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Season and episode views: label helpers, and the real files the pipeline wrote.
import { describe, expect, it } from "vitest";
import type { Episodes, Meta, Season } from "../data/types";
import { isCaseStudy } from "../evidence/checks";
import { episodeDates } from "./FireEpisodes";
import { doyLabel, isClear, mdLabel } from "./SeasonTiming";

const files = import.meta.glob<{ default: unknown }>("../../public/data/**/{regions,meta,season,episodes}.json", { eager: true });
const has = (path: string) => `../../public/data/${path}` in files;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = (path: string): any => files[`../../public/data/${path}`].default;
const regions: { id: string }[] = data("regions.json");

describe("labels", () => {
  it("turns a day of the year and MM-DD into a date", () => {
    expect(doyLabel(1)).toBe("1 Jan");
    expect(doyLabel(309)).toBe("5 Nov");
    expect(doyLabel(298.3)).toBe("25 Oct");
    expect(mdLabel("11-05")).toBe("5 Nov");
  });
  it("calls a trend clear only when its range excludes zero", () => {
    expect(isClear({ days_per_decade: 6.7, lo: 5.7, hi: 8.3 })).toBe(true);
    expect(isClear({ days_per_decade: 7, lo: -1, hi: 15 })).toBe(false);
    expect(isClear({ days_per_decade: -2.8, lo: -5.6, hi: -0.1 })).toBe(true);
  });
  it("writes one-day and many-day episodes", () => {
    const e = { start: "2026-07-27", end: "2026-07-31" } as Episodes["latest"][number];
    expect(episodeDates(e)).toBe("27 Jul 2026 to 31 Jul 2026");
    expect(episodeDates({ ...e, end: e.start })).toBe("27 Jul 2026");
  });
});

describe("the published files", () => {
  for (const { id } of regions) {
    if (has(`${id}/season.json`)) {
      it(`${id}: season years are ordered and inside the year`, () => {
        const s: Season = data(`${id}/season.json`);
        expect(s.years.length).toBeGreaterThan(1);
        for (const y of s.years) {
          expect(y.start_doy).toBeLessThanOrEqual(y.peak_doy);
          expect(y.peak_doy).toBeLessThanOrEqual(y.end_doy);
          expect(y.end_doy).toBeLessThanOrEqual(366);
        }
        expect(s.trend.peak.lo).toBeLessThanOrEqual(s.trend.peak.hi);
      });
    }
    if (has(`${id}/episodes.json`)) {
      it(`${id}: episode ranks are within the count`, () => {
        const e: Episodes = data(`${id}/episodes.json`);
        for (const x of [...e.latest, ...e.largest]) {
          expect(x.rank_total).toBeGreaterThanOrEqual(1);
          expect(x.rank_total).toBeLessThanOrEqual(e.count);
        }
        expect(e.largest[0].rank_total).toBe(1);
      });
    }
  }
  it("marks as a case study only a region whose held-out checks both fail", () => {
    const flagged = regions.filter(({ id }) => isCaseStudy(data(`${id}/meta.json`) as Meta)).map((r) => r.id);
    expect(flagged).toEqual(["karnataka-south"]);
  });
});
