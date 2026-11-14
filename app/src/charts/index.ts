// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk; changes by Charulekha Rajesh (pending).
// Owned by Person C. The right-hand column shows these components in this
// order. Add, remove or reorder charts here; App.tsx never needs to change.
// Each component takes no props and reads useSelection().
import type { ComponentType } from "react";
import ActivitySeries from "./ActivitySeries";
import BurningCalendar from "./BurningCalendar";
import MonthComparison from "./MonthComparison";
import OutlookStrip from "./OutlookStrip";
import TrendChart from "./TrendChart";
import UnusualBanner from "./UnusualBanner";

export const charts: { id: string; Component: ComponentType }[] = [
  { id: "banner", Component: UnusualBanner },
  { id: "calendar", Component: BurningCalendar },
  { id: "outlook", Component: OutlookStrip },
  { id: "comparison", Component: MonthComparison },
  { id: "trend", Component: TrendChart },
  { id: "series", Component: ActivitySeries },
];
