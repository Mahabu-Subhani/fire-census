// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from /<repository name>/.
export default defineConfig({
  base: "/fire-census/",
  plugins: [react()],
  test: { environment: "node" },
});
