// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Loads the static files Person A writes to app/public/data/.
import type { District } from "./places";
import type { CubeRow, Meta, Region } from "./types";

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
