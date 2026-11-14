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

/** How far a cube download has got: bytes read (uncompressed) and the expected total, when known. */
export interface Progress {
  regionId: string;
  read: number;
  total: number | null;
}
let progress: Progress | null = null;
const listeners = new Set<() => void>();
function setProgress(p: Progress | null) {
  progress = p;
  listeners.forEach((l) => l());
}
/** For useSyncExternalStore: the loading bar subscribes here, outside the selection contract. */
export const cubeProgress = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => progress,
};

/** The expected size of a cube, from the build (vite.config.ts); null in tests or for a region added later. */
function expectedBytes(regionId: string): number | null {
  const sizes = typeof __CUBE_BYTES__ === "object" ? __CUBE_BYTES__ : {};
  return sizes[regionId] ?? null;
}

/** Reads cube.json as a stream so the page can show how much has arrived. Falls back to a plain read. */
async function fetchCube(regionId: string): Promise<CubeRow[]> {
  const response = await fetch(`${base}${regionId}/cube.json`);
  if (!response.ok) throw new Error(`Could not load ${regionId}/cube.json (HTTP ${response.status})`);
  if (!response.body || typeof TextDecoder === "undefined") return (await response.json()) as CubeRow[];
  const total = expectedBytes(regionId);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let read = 0;
  let last = 0;
  setProgress({ regionId, read: 0, total });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    read += value.byteLength;
    parts.push(decoder.decode(value, { stream: true }));
    // A few updates a second are enough for the bar.
    const now = Date.now();
    if (now - last > 120) {
      last = now;
      setProgress({ regionId, read, total });
    }
  }
  parts.push(decoder.decode());
  setProgress({ regionId, read, total: total ?? read });
  try {
    return JSON.parse(parts.join("")) as CubeRow[];
  } finally {
    setProgress(null);
  }
}

// Cubes are large, so keep each one after its first load.
const cubeCache = new Map<string, Promise<CubeRow[]>>();
export function loadCube(regionId: string): Promise<CubeRow[]> {
  let cube = cubeCache.get(regionId);
  if (!cube) {
    cube = fetchCube(regionId);
    cube.catch(() => setProgress(null));
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
