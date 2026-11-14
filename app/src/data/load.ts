// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Loads the static files Person A writes to app/public/data/.
import type { District } from "./places";
import type { CubeRow, DriftFile, Episodes, LandCover, Meta, Population, Region, Season } from "./types";

const base = `${import.meta.env.BASE_URL}data/`;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(base + path);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  return (await response.json()) as T;
}

export const loadRegions = () => getJson<Region[]>("regions.json");

// Cubes are large, so keep each one after its first load.
const cubeCache = new Map<string, Promise<CubeRow[]>>();
export function loadCube(regionId: string): Promise<CubeRow[]> {
  let cube = cubeCache.get(regionId);
  if (!cube) {
    cube = getJson<CubeRow[]>(`${regionId}/cube.json`);
    cube.catch(() => cubeCache.delete(regionId));
    cubeCache.set(regionId, cube);
  }
  return cube;
}

export const loadMeta = (regionId: string) => getJson<Meta>(`${regionId}/meta.json`);

/** An optional file: null if it is missing (or the server answered with a page instead). */
async function getOptional<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(base + path);
    if (!response.ok || (response.headers.get("content-type") ?? "").includes("text/html")) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const loadSeason = (regionId: string) => getOptional<Season>(`${regionId}/season.json`);
export const loadDrift = (regionId: string) => getOptional<DriftFile>(`${regionId}/drift.json`);
export const loadLandCover = (regionId: string) => getOptional<LandCover>(`${regionId}/landcover.json`);
export const loadPopulation = (regionId: string) => getOptional<Population>(`${regionId}/population.json`);
export const loadEpisodes = (regionId: string) => getOptional<Episodes>(`${regionId}/episodes.json`);

// Districts are optional: a region without the file simply has no place search.
const districtCache = new Map<string, Promise<District[]>>();
export function loadDistricts(regionId: string): Promise<District[]> {
  let districts = districtCache.get(regionId);
  if (!districts) {
    districts = getJson<District[]>(`${regionId}/districts.json`).catch(() => []);
    districtCache.set(regionId, districts);
  }
  return districts;
}
