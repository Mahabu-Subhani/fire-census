// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { describe, expect, it } from "vitest";
import { normalize, searchPlaces, type District } from "./places";

const d = (name: string, province: string, country: string): District => ({
  name, province, country, label: `${name}, ${province}, ${country}`,
  ring: [[0, 0], [1, 0], [1, 1]], bbox: [0, 0, 1, 1], partly_outside: false, parts_dropped: 0, source: "", licence: "",
});

const list = [
  d("Ludhiana", "Punjab", "India"),
  d("Lahore", "Punjab", "Pakistan"),
  d("Hisar", "Haryāna", "India"),
  d("Río Cuarto", "Córdoba", "Argentina"),
  d("Capital", "Córdoba", "Argentina"),
  d("Capital", "La Rioja", "Argentina"),
];

describe("normalize", () => {
  it("drops accents and case", () => expect(normalize("  Río Cuarto ")).toBe("rio cuarto"));
});

describe("searchPlaces", () => {
  it("finds names without accents", () => expect(searchPlaces(list, "rio")[0].name).toBe("Río Cuarto"));
  it("puts names that start with the query first", () => {
    expect(searchPlaces(list, "la").map((x) => x.name)).toEqual(["Lahore", "Capital"]);
  });
  it("matches a province, so both Punjabs appear", () => {
    expect(searchPlaces(list, "punjab").map((x) => x.country).sort()).toEqual(["India", "Pakistan"]);
  });
  it("tells two places with the same name apart by province", () => {
    expect(searchPlaces(list, "capital").map((x) => x.label)).toEqual(["Capital, Córdoba, Argentina", "Capital, La Rioja, Argentina"]);
  });
  it("matches a province written without accents", () => expect(searchPlaces(list, "haryana")[0].name).toBe("Hisar"));
  it("returns nothing for an empty query or no match", () => {
    expect(searchPlaces(list, "  ")).toEqual([]);
    expect(searchPlaces(list, "bengaluru")).toEqual([]);
  });
  it("respects the limit", () => expect(searchPlaces(list, "a", 2)).toHaveLength(2));
});

// The real files in public/data, built by app/scripts/make_districts.py.
const files = import.meta.glob<{ default: District[] }>("../../public/data/*/districts.json", { eager: true });

describe.each(Object.entries(files))("real district file %s", (_path, file) => {
  const districts = file.default;
  it("has valid outlines and unique labels", () => {
    expect(districts.length).toBeGreaterThan(0);
    expect(new Set(districts.map((x) => x.label)).size).toBe(districts.length);
    for (const x of districts) {
      expect(x.ring.length).toBeGreaterThanOrEqual(3);
      for (const [lon, lat] of x.ring) {
        expect(lon).toBeGreaterThanOrEqual(x.bbox[0] - 1e-6);
        expect(lon).toBeLessThanOrEqual(x.bbox[2] + 1e-6);
        expect(lat).toBeGreaterThanOrEqual(x.bbox[1] - 1e-6);
        expect(lat).toBeLessThanOrEqual(x.bbox[3] + 1e-6);
      }
      expect(x.label).not.toContain("\uFFFD");
    }
  });
});

describe("well-known districts are findable", () => {
  const all = Object.values(files).flatMap((f) => f.default);
  it.each([["ludhiana", "Ludhiana, Punjab, India"], ["lahore", "Lahore, Punjab, Pakistan"], ["chilecito", "Chilecito, La Rioja, Argentina"], ["calamuchita", "Calamuchita, Córdoba, Argentina"]])(
    "%s",
    (query, label) => expect(searchPlaces(all, query).map((x) => x.label)).toContain(label),
  );
});
