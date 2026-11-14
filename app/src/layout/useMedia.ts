// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { useEffect, useState } from "react";

/** True while the media query matches; false where matchMedia is missing. */
export function useMedia(query: string): boolean {
  const get = () => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    let mql: MediaQueryList;
    try {
      mql = window.matchMedia(query);
    } catch {
      return;
    }
    const on = () => setMatches(mql.matches);
    mql.addEventListener("change", on);
    on();
    return () => mql.removeEventListener("change", on);
  }, [query]);
  return matches;
}
