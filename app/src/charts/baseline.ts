// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// The comparison baseline (all years or the last 10), shared by the status
// sentence and the month comparison so they always agree. Default: all years
// (decision 33).
import { useSyncExternalStore } from "react";
import type { Baseline } from "../stats";

let current: Baseline = "all";
const listeners = new Set<() => void>();

export function setBaseline(b: Baseline): void {
  current = b;
  listeners.forEach((l) => l());
}

export function useBaseline(): Baseline {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export const BASELINE_TEXT: Record<Baseline, string> = { all: "All years", last10: "Last 10 years" };
