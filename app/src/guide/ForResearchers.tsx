// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Layer 3 of docs/RESEARCHER_EXPERIENCE.md: citation, whole files, data
// dictionary and code to load them. Field meanings mirror the data contract in
// docs/ARCHITECTURE.md; change both together.
import { useState } from "react";
import { useSelection } from "../selection";

const SITE = "https://mahabu-subhani.github.io/fire-census/";

function fields(unit: string): [string, string, string][] {
  return [
  ["lon, lat", "degrees", "Centre of the grid cell"],
  ["ym", "YYYY-MM", "Month (dates are UTC)"],
  ["raw_modis", "count", "MODIS hotspots, Terra and Aqua, as reported"],
  ["raw_viirs", "count", "VIIRS hotspots, all VIIRS satellites, as reported"],
  ["harm", unit, "The harmonized value: comparable across all years"],
  ["harm_lo, harm_hi", "same as harm", "Range for harm; equal to harm where no range is computed"],
  ["small", "fire cells", "Small-fire layer: VIIRS-only weak fires, 0 before 2012"],
  ["terra_only", "true or false", "Month before Aqua: Terra only, not harmonized"],
  ["mtd", "same as harm", "Month to date, only for the month of data_through; empty elsewhere"],
  ];
}

function CopyBox({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked: the text stays selectable. */
    }
  };
  return (
    <div className="copy-box">
      <pre tabIndex={0} aria-label={label}>{text}</pre>
      <button type="button" onClick={copy}>{copied ? "Copied" : `Copy ${label}`}</button>
    </div>
  );
}

export default function ForResearchers() {
  const { meta, region } = useSelection();
  if (!meta || !region) return null;
  const base = `${SITE}data/${region.id}/`;
  const year = meta.generated_at.slice(0, 4);
  const citation =
    `Fire Census (${year}). Harmonized MODIS and VIIRS burning activity record, ${region.name}. ` +
    `Data version ${meta.data_version}, code ${meta.code_commit || "unstated"}. Team Sharmaji Ka Satellite, NASA Space Apps Challenge 2026. ${SITE}\n\n` +
    `We acknowledge the use of data from NASA's Fire Information for Resource Management System (FIRMS) ` +
    `(https://earthdata.nasa.gov/firms), part of NASA's Earth Science Data and Information System (ESDIS).`;
  const python = `import pandas as pd\n\ncube = pd.read_json("${base}cube.json")\ncube["raw_total"] = cube.raw_modis + cube.raw_viirs\nmonthly = cube.groupby("ym")[["harm", "raw_total", "small"]].sum()\nprint(monthly.tail())`;
  const r = `library(jsonlite)\n\ncube <- fromJSON("${base}cube.json")\nmonthly <- aggregate(cbind(harm, small) ~ ym, data = cube, FUN = sum)\ntail(monthly)`;
  return (
    <section className="researchers" id="researchers" aria-labelledby="researchers-title">
      <h2 id="researchers-title">For researchers</h2>
      <h3>Cite this</h3>
      <CopyBox label="citation" text={citation} />
      <h3>Whole files for {region.name}</h3>
      <ul>
        <li><a href={`${base}cube.json`}>cube.json</a>: every cell and month (missing rows mean zero).</li>
        <li><a href={`${base}meta.json`}>meta.json</a>: method, every check with its value and verdict, the detection curve, versions.</li>
        <li><a href={`${base}districts.json`}>districts.json</a>: district outlines used by the search (geoBoundaries).</li>
        <li><a href={`${SITE}data/regions.json`}>regions.json</a>: the processed regions and their extents.</li>
      </ul>
      <h3>Data dictionary</h3>
      <div className="ev-table-wrap">
        <table className="ev-table">
          <thead><tr><th scope="col">Column</th><th scope="col">Unit</th><th scope="col">Meaning</th></tr></thead>
          <tbody>
            {fields(meta.unit ?? "see meta.json").map(([col, unit, meaning]) => (
              <tr key={col}><th scope="row"><code>{col}</code></th><td>{unit}</td><td>{meaning}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Load it in Python or R</h3>
      <CopyBox label="Python code" text={python} />
      <CopyBox label="R code" text={r} />
      <p className="fine-print">
        The pipeline, the tests and the pre-registered checks are in the{" "}
        <a href="https://github.com/Mahabu-Subhani/fire-census">source repository</a>.
      </p>
    </section>
  );
}
