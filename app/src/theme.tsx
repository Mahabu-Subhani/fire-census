// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Dark by default (the design), light on request (daylight, print). The choice
// is remembered in this browser only.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const KEY = "fire-census:theme";

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage blocked: use the default */
  }
  return "dark";
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* not remembered: fine */
    }
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Sequential "ember" ramp for fire activity: near the surface for little
 * activity, bright (dark theme) or deep (light theme) for a lot. Checked with
 * the dataviz validator (--ordinal), 14 Nov: lightness rises steadily, every
 * step at least 0.06 apart, hue spread 32° dark and 31° light. The near-zero
 * end deliberately sits close to the surface, as a heat map should.
 */
export const EMBER: Record<Theme, string[]> = {
  dark: ["#3a2418", "#6b2a10", "#b8430f", "#f0731f", "#ffb35c", "#ffd8a8"],
  light: ["#ffe4c7", "#ffc68f", "#ffa05c", "#f06a1f", "#c2410c", "#6e2207"],
};

/**
 * Diverging ramp for "difference from average": purple below, ember above,
 * neutral near the surface at average. Each arm changes steadily in lightness
 * away from the middle (validator --ordinal per arm, 14 Nov), and the two ends
 * stay distinct under colour-vision deficiency (worst protan ΔE 24.6 dark,
 * 27.7 light; target 8). Seven evenly spaced stops; the middle one is average.
 */
export const DIVERGE: Record<Theme, string[]> = {
  dark: ["#d4c6fb", "#a48be8", "#6c55b8", "#3d3a37", "#b8501a", "#f08a3c", "#ffc78a"],
  light: ["#45237f", "#7553c4", "#a993dd", "#e9e5df", "#f2a46b", "#d9641a", "#8f3108"],
};
