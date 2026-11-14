// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Definitions of the terms the app uses. The unit comes from
// meta.json, never typed here.
import { monthName } from "../evidence/checks";
import { useSelection } from "../selection";

export default function Glossary() {
  const { meta, region } = useSelection();
  const terms: [string, string][] = [
    ["Hotspot (detection)", "A pixel flagged by a satellite as substantially hotter than its surroundings, usually a fire. One fire may produce several hotspots."],
    ["Fire activity", `Unit of the harmonized record: ${meta?.unit ?? "see Method details"}. Counted as Aqua MODIS would have observed it, so all years are comparable.`],
    ["Harmonized", "Adjusted to a consistent sensor baseline across all years. Use for comparisons between years."],
    ["Raw", "MODIS and VIIRS detections as reported, summed. Contains a step in 2012 at VIIRS onset."],
    ["Small fires", "Low-intensity fires detected only by VIIRS, from 2012. Reported as a separate layer; excluded from the harmonized count."],
    ["Terra only", `Months before ${region ? monthName(region.harmonized_from) : "July 2002"}, morning Terra overpass only. Not comparable with later years.`],
    ["Near-real-time", "Provisional data, replaced by standard data after about five months."],
    ["Fire radiative power (MW)", "Radiant heat output of a fire, in megawatts."],
    ["Grid cell", `${region?.cell_deg ?? 0.1}° square (about 11 km) used for the map and downloads.`],
    ["Zero detections", "No hotspot recorded. Fires under cloud or smoke, or between overpasses, are not detected."],
  ];
  return (
    <section className="glossary" id="glossary" aria-labelledby="glossary-title">
      <h2 id="glossary-title">Glossary</h2>
      <dl>
        {terms.map(([term, meaning]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
