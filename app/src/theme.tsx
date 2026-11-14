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
 * Sequential "ember" ramp for fire activity: one hue family, near the surface
 * for little activity and bright for a lot (on dark), light to deep (on light).
 */
export const EMBER: Record<Theme, string[]> = {
  dark: ["#2b1a12", "#6b2a10", "#b8430f", "#f0731f", "#ffb35c", "#ffe6b8"],
  light: ["#fff1e0", "#ffd0a1", "#ffa05c", "#f06a1f", "#c2410c", "#6e2207"],
};
