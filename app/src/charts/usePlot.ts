// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Mounts an Observable Plot figure into a div and redraws it at the div's width.
// Returns a callback ref, so it works for a div that mounts after loading.
import { useEffect, useState, type DependencyList } from "react";

export function usePlot(build: (width: number) => Element | null, deps: DependencyList) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  useEffect(() => {
    if (!el || width === 0) return;
    const node = build(width);
    el.replaceChildren(...(node ? [node] : []));
    return () => node?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, width, ...deps]);

  return setEl;
}
