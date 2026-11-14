// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Plain-language meanings of the words the app uses. The unit comes from
// meta.json, never typed here.
import { monthName } from "../evidence/checks";
import { useSelection } from "../selection";

export default function Glossary() {
  const { meta, region } = useSelection();
  const terms: [string, string][] = [
    ["Hotspot (detection)", "A spot on the ground that a satellite saw as much hotter than its surroundings, usually a fire. One fire can make several hotspots, so this is not a count of fires."],
    ["Fire activity", `What the harmonized charts count: ${meta?.unit ?? "see the method panel"}. In plain words: how many small squares of land showed a fire on each satellite pass, counted the way the Aqua MODIS satellite would have seen them, so every year is counted the same way.`],
    ["Harmonized", "Corrected so that the record means the same thing in every year, whichever satellite was flying. Use this to compare years."],
    ["Raw", "Exactly as the satellites reported, MODIS and VIIRS added together. It jumps in 2012, when the more sensitive VIIRS satellite started, even though the burning did not."],
    ["Small fires", "Weak fires that only the newer VIIRS satellites can see, from 2012 on. Kept as a separate layer so the extra detail is not lost, and never added into the harmonized count."],
    ["Terra only", `Months before ${region ? monthName(region.harmonized_from) : "July 2002"}, when only the Terra satellite's morning pass existed. Shown, but not comparable with later years.`],
    ["Near-real-time", "Data delivered quickly, then replaced by final data after about five months. Recent months can still change."],
    ["Fire strength (MW)", "Fire radiative power, the heat a fire gives off, in megawatts. Small crop fires are typically a few MW; large wildfires can reach hundreds."],
    ["Grid cell", `A square about 11 km across (${region?.cell_deg ?? 0.1} degree) used to summarise the map and the downloads.`],
    ["Zero detections", "No hotspot was seen. A fire can still have burned under cloud or smoke, or between satellite passes."],
  ];
  return (
    <details className="glossary" id="glossary">
      <summary>What the words mean</summary>
      <dl>
        {terms.map(([term, meaning]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
