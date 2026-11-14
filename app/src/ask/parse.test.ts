// AI-assisted: written with help from Claude (Anthropic). Reviewed by Mahabu Subhani (pending).
import { describe, expect, it } from "vitest";
import { parseQuery, type AskContext, type AskPlace } from "./parse";

const ring: [number, number][] = [[0, 0], [1, 0], [1, 1]];
const place = (regionId: string, name: string, province: string, country: string): AskPlace => ({ regionId, name, label: `${name}, ${province}, ${country}`, ring });

const ctx: AskContext = {
  regions: [
    { id: "cordoba", name: "Córdoba and neighbouring areas, Argentina", first_month: "2000-11", last_month: "2026-11" },
    { id: "punjab-haryana", name: "Punjab and Haryana, India", first_month: "2000-11", last_month: "2026-11" },
    { id: "karnataka-south", name: "Southern Karnataka, India", first_month: "2000-11", last_month: "2026-11" },
    { id: "chilecito", name: "Chilecito, Argentina", first_month: "2000-11", last_month: "2026-11" },
  ],
  places: [
    place("punjab-haryana", "Ludhiana", "Punjab", "India"),
    place("punjab-haryana", "Sangrur", "Punjab", "India"),
    place("cordoba", "Río Cuarto", "Córdoba", "Argentina"),
    place("cordoba", "General San Martín", "Córdoba", "Argentina"),
    place("cordoba", "General San Martín", "La Rioja", "Argentina"),
    place("cordoba", "San Martín", "San Luis", "Argentina"),
    place("chilecito", "Chilecito", "La Rioja", "Argentina"),
    place("karnataka-south", "Mysuru", "Karnataka", "India"),
  ],
  currentRegionId: "cordoba",
};

const ask = (text: string) => parseQuery(text, ctx);
const range = (text: string) => {
  const p = ask(text);
  return [p.from, p.to];
};
const marked = (text: string) => ask(text).tokens.map((t) => text.slice(t.start, t.end));

describe("question bar: places", () => {
  it("finds a district and its region", () => {
    const p = ask("fires in Ludhiana");
    expect(p.place?.label).toBe("Ludhiana, Punjab, India");
    expect(p.regionId).toBe("punjab-haryana");
    expect(p.problem).toBeNull();
  });
  it("ignores case and accents", () => {
    expect(ask("rio cuarto 2020").place?.name).toBe("Río Cuarto");
    expect(ask("RÍO CUARTO").place?.name).toBe("Río Cuarto");
  });
  it("prefers the longest name", () => {
    expect(ask("general san martin").place?.name).toBe("General San Martín");
    expect(ask("san martin").place?.name).toBe("San Martín");
  });
  it("reads a region name as the whole region", () => {
    const p = ask("punjab last 10 years");
    expect(p.regionId).toBe("punjab-haryana");
    expect(p.wholeRegion).toBe(true);
    expect(p.place).toBeNull();
  });
  it("treats a region's own name as the region, not the district of the same name", () => {
    const p = ask("chilecito");
    expect(p.regionId).toBe("chilecito");
    expect(p.wholeRegion).toBe(true);
  });
  it("keeps the current area when no place is typed", () => {
    const p = ask("2019");
    expect(p.regionId).toBeNull();
    expect(p.wholeRegion).toBe(false);
  });
  it("refuses a place outside the processed areas", () => {
    const p = ask("fires in Bengaluru this month");
    expect(p.problem).toContain("Bengaluru");
  });
  it("does not mistake ordinary words after 'in' for a place", () => {
    expect(ask("fires in the last 5 years").problem).toBeNull();
    expect(ask("Ludhiana in 2019").problem).toBeNull();
    expect(ask("Ludhiana in October").problem).toBeNull();
  });
});

describe("question bar: dates", () => {
  it.each([
    ["October 2024", "2024-10", "2024-10"],
    ["oct 2024", "2024-10", "2024-10"],
    ["2024 October", "2024-10", "2024-10"],
    ["2024-10", "2024-10", "2024-10"],
    ["Sept, 2019", "2019-09", "2019-09"],
    ["2019", "2019-01", "2019-12"],
    ["2015 to 2020", "2015-01", "2020-12"],
    ["2015-2020", "2015-01", "2020-12"],
    ["between 2015 and 2020", "2015-01", "2020-12"],
    ["from March to June 2024", "2024-03", "2024-06"],
    ["Oct 2023 until Feb 2024", "2023-10", "2024-02"],
    ["since 2018", "2018-01", "2026-11"],
    ["from May 2012", "2012-05", "2026-11"],
    ["last year", "2025-01", "2025-12"],
    ["this year", "2026-01", "2026-11"],
    ["last month", "2026-10", "2026-10"],
    ["last 5 years", "2022-01", "2026-11"],
    ["past three months", "2026-09", "2026-11"],
    ["whole record", "2000-11", "2026-11"],
    ["this month", "2000-11", "2026-11"],
    // A month without a year: its most recent occurrence in the record.
    ["October", "2026-10", "2026-10"],
    ["December", "2025-12", "2025-12"],
    // Cut to the record.
    ["1995 to 2005", "2000-11", "2005-12"],
  ])("%s", (text, from, to) => {
    expect(range(text)).toEqual([from, to]);
  });
  it("says so when the dates were cut", () => {
    expect(ask("1995 to 2005").note).toContain("Nov 2000");
    expect(ask("2019").note).toBeNull();
  });
  it("refuses dates outside the record", () => {
    expect(ask("1990").problem).toContain("Nov 2000");
    expect(ask("2031").problem).toContain("Nov 2026");
  });
  it("labels what it read", () => {
    expect(ask("oct 2024").tokens[0].label).toBe("Oct 2024");
    expect(ask("2019").tokens[0].label).toBe("2019");
    expect(ask("2015-2020").tokens[0].label).toBe("Jan 2015 to Dec 2020");
    expect(ask("this month").tokens[0].label).toBe("This month (Nov 2026)");
  });
});

describe("question bar: options and marking", () => {
  it("reads raw, harmonized, small fires and methods", () => {
    expect(ask("ludhiana raw").mode).toBe("raw");
    expect(ask("harmonised record 2019").mode).toBe("harmonized");
    expect(ask("small fires in Mysuru").small).toBe(true);
    expect(ask("show the checks").research).toBe(true);
  });
  it("marks exactly the parts it understood", () => {
    expect(marked("How was Ludhiana in October 2024, raw?")).toEqual(["Ludhiana", "October 2024", "raw"]);
    expect(marked("río cuarto from 2015 to 2020")).toEqual(["río cuarto", "from 2015 to 2020"]);
    expect(marked("punjab and haryana since 2012")).toEqual(["punjab", "haryana", "since 2012"]);
  });
  it("puts everything together", () => {
    const p = ask("Sangrur october 2023 raw");
    expect([p.regionId, p.place?.name, p.from, p.to, p.mode]).toEqual(["punjab-haryana", "Sangrur", "2023-10", "2023-10", "raw"]);
  });
  it("is empty for empty text and refuses text with nothing in it", () => {
    expect(ask("   ").tokens).toEqual([]);
    expect(ask("   ").problem).toBeNull();
    expect(ask("hello there").problem).toContain("No place or date");
  });
});
