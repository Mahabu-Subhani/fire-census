// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Owned by Person C. The chart column shows these components in this order,
// in the views listed. "overview" is everyone's page (the answer itself sits in
// the hero there); "research" adds every chart. App.tsx never needs to change.
// Each component takes no props and reads useSelection().
// Each chart loads on demand, so the first screen does not wait for the chart
// library (Observable Plot); App.tsx shows a placeholder while one loads.
import { lazy, type ComponentType } from "react";
import type { View } from "../selection";

const ActivitySeries = lazy(() => import("./ActivitySeries"));
const BurningCalendar = lazy(() => import("./BurningCalendar"));
const MonthComparison = lazy(() => import("./MonthComparison"));
const OutlookStrip = lazy(() => import("./OutlookStrip"));
const TrendChart = lazy(() => import("./TrendChart"));
const UnusualBanner = lazy(() => import("./UnusualBanner"));

export const charts: { id: string; Component: ComponentType; views: View[] }[] = [
  { id: "banner", Component: UnusualBanner, views: ["research"] },
  { id: "calendar", Component: BurningCalendar, views: ["overview", "research"] },
  { id: "comparison", Component: MonthComparison, views: ["overview", "research"] },
  { id: "outlook", Component: OutlookStrip, views: ["overview", "research"] },
  { id: "series", Component: ActivitySeries, views: ["research"] },
  { id: "trend", Component: TrendChart, views: ["research"] },
];
