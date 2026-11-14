// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// Owned by Person C. The chart column shows these components in this order,
// in the views listed. "overview" is everyone's page (the answer itself sits in
// the hero there); "research" adds every chart. App.tsx never needs to change.
// Each component takes no props and reads useSelection().
// Each chart loads on demand, so the first screen does not wait for the chart
// library (Observable Plot); App.tsx shows a placeholder while one loads.
import { lazy, type ComponentType } from "react";
import type { Selection, View } from "../selection";

const ActivitySeries = lazy(() => import("./ActivitySeries"));
const BurningCalendar = lazy(() => import("./BurningCalendar"));
const MonthComparison = lazy(() => import("./MonthComparison"));
const OutlookStrip = lazy(() => import("./OutlookStrip"));
const LandCover = lazy(() => import("./LandCover"));
const FireEpisodes = lazy(() => import("./FireEpisodes"));
const SeasonTiming = lazy(() => import("./SeasonTiming"));
const TrendChart = lazy(() => import("./TrendChart"));
const UnusualBanner = lazy(() => import("./UnusualBanner"));

/** `available` hides a chart whose data does not exist for this selection (default: always shown). */
export const charts: { id: string; Component: ComponentType; views: View[]; available?: (s: Selection) => boolean }[] = [
  { id: "banner", Component: UnusualBanner, views: ["research"] },
  { id: "calendar", Component: BurningCalendar, views: ["overview", "research"] },
  { id: "comparison", Component: MonthComparison, views: ["overview", "research"] },
  { id: "outlook", Component: OutlookStrip, views: ["overview", "research"] },
  // Whole-region analyses from the pipeline (decision 37); hidden when an area is drawn.
  { id: "season", Component: SeasonTiming, views: ["overview", "research"], available: (s) => !s.drawn && !!s.season?.years.length },
  { id: "landcover", Component: LandCover, views: ["overview", "research"], available: (s) => !s.drawn && !!s.landcover?.months.length },
  { id: "episodes", Component: FireEpisodes, views: ["overview", "research"], available: (s) => !s.drawn && !!s.episodes?.count },
  { id: "series", Component: ActivitySeries, views: ["research"] },
  { id: "trend", Component: TrendChart, views: ["research"] },
];
