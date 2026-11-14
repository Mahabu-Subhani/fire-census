// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk; changes by Charulekha Rajesh (pending).
// Owned by Person C. The right-hand column shows these components in this
// order. Add, remove or reorder charts here; App.tsx never needs to change.
// Each component takes no props and reads useSelection().
import type { ComponentType } from "react";
import ActivitySeries from "./ActivitySeries";
import BurningCalendar from "./BurningCalendar";
import MonthComparison from "./MonthComparison";
import UnusualBanner from "./UnusualBanner";

export const charts: { id: string; Component: ComponentType }[] = [
  { id: "calendar", Component: BurningCalendar },
  { id: "banner", Component: UnusualBanner },
  { id: "comparison", Component: MonthComparison },
  { id: "series", Component: ActivitySeries },
];
