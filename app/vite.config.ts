// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { readdirSync, statSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Uncompressed size of each region's cube.json, read at build time. GitHub
// Pages sends the file gzipped, so the browser cannot tell how much is left;
// these sizes let the loading bar show a true share (src/data/load.ts).
function cubeBytes(): Record<string, number> {
  const dir = new URL("./public/data/", import.meta.url);
  const out: Record<string, number> = {};
  try {
    for (const id of readdirSync(dir)) {
      try {
        out[id] = statSync(new URL(`${id}/cube.json`, dir)).size;
      } catch {
        // not a region folder
      }
    }
  } catch {
    // no data folder: the bar shows megabytes read instead
  }
  return out;
}

// GitHub Pages serves the site from /<repository name>/.
export default defineConfig({
  base: "/fire-census/",
  plugins: [react()],
  define: { __CUBE_BYTES__: JSON.stringify(cubeBytes()) },
  test: { environment: "node" },
});
