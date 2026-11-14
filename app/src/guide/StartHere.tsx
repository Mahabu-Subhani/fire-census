// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// A first-visit guide: three steps, a short path for each kind of user named
// in the challenge, and example views. Examples are plain links to shareable
// views, so they open exactly as a shared link would.
import { useState } from "react";

const KEY = "fire-census:start-here-hidden";

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function writeHidden(hidden: boolean): void {
  try {
    if (hidden) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* Private mode or blocked storage: the guide simply shows again next time. */
  }
}

const EXAMPLES = [
  { href: "?r=chilecito&from=2024-01&to=2026-11&m=harmonized", label: "An unusual month: the July 2026 fire near Chilecito, La Rioja" },
  { href: "?r=punjab-haryana&from=2002-07&to=2026-11&m=harmonized", label: "A burning season: crop-residue burning in Punjab and Haryana, 2002 to now" },
  { href: "?r=cordoba&from=2005-01&to=2020-12&m=raw", label: "Why harmonize: the false jump in 2012 in Córdoba's raw record" },
];

const PATHS = [
  { who: "Early warning and emergency teams", what: "Read the summary at the top of the charts, then the calendar: the darkest months are the usual danger period. For fires burning now, use the live fire map link above." },
  { who: "Firefighters", what: "Search your district by name. The calendar shows which months usually burn; the map shows where." },
  { who: "Land managers", what: "Compare districts using activity per 1,000 km² (under the area name), and download the CSV for your planning." },
  { who: "Scientists", what: "Open “How we made two satellites agree” for the method and every check, and “For researchers” for the data files, the data dictionary and a citation." },
];

export default function StartHere() {
  const [hidden, setHidden] = useState(readHidden);
  if (hidden) {
    return (
      <button type="button" className="link-button" onClick={() => { writeHidden(false); setHidden(false); }}>
        Show the guide
      </button>
    );
  }
  return (
    <section className="start-here" aria-labelledby="start-title">
      <div className="start-head">
        <h2 id="start-title">Start here</h2>
        <button type="button" className="link-button" onClick={() => { writeHidden(true); setHidden(true); }}>
          Hide the guide
        </button>
      </div>
      <ol className="steps">
        <li><strong>Choose an area:</strong> a region, then search a district, draw on the map, or enter coordinates.</li>
        <li><strong>Choose the dates</strong> you care about, to the month.</li>
        <li><strong>Read the calendar:</strong> years down the side, months across. Darker means more fire activity.</li>
      </ol>
      <details className="paths">
        <summary>What to look at first, by role</summary>
        <dl>
          {PATHS.map((p) => (
            <div key={p.who}>
              <dt>{p.who}</dt>
              <dd>{p.what}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="examples-title">Or open an example:</p>
      <ul className="examples">
        {EXAMPLES.map((e) => (
          <li key={e.href}><a href={e.href}>{e.label}</a></li>
        ))}
      </ul>
    </section>
  );
}
