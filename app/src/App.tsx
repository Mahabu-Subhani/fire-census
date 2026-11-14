// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Page layout. Chart slots hold Person C's components from src/charts/.
import { charts } from "./charts";
import MapView from "./map/MapView";
import { useSelection, useSelectionActions } from "./selection";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatMonth(ym: string): string {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

function Header() {
  const { mode } = useSelection();
  const { setMode } = useSelectionActions();
  return (
    <header className="app-header">
      <div>
        <h1>Fire Census</h1>
        <p className="tagline">One fire record, whichever satellite was watching.</p>
      </div>
      <div className="switch" role="group" aria-label="Record shown">
        {(["harmonized", "raw"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === "harmonized" ? "Harmonized" : "Raw"}
          </button>
        ))}
      </div>
    </header>
  );
}

function Controls() {
  const { region, areaKm2, status, place } = useSelection();
  const { regions, setRegion, error, polygon } = useSelectionActions();
  return (
    <div className="controls">
      <label>
        Region
        <select value={region?.id ?? ""} onChange={(e) => setRegion(e.target.value)} disabled={regions.length === 0}>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <p className="area-line">
        {place ?? (polygon ? "Drawn area" : "Whole region")}
        {areaKm2 !== null && <>, {Math.round(areaKm2).toLocaleString("en-GB")} km²</>}
      </p>
      {status === "loading" && <p className="note">Loading the record for this region…</p>}
      {status === "error" && <p className="note error">Could not load the data: {error}</p>}
      {status === "empty" && <p className="note">No detections in this area and date range. Zero detections does not prove there was no fire.</p>}
    </div>
  );
}

function Freshness() {
  const { meta, dataThrough } = useSelection();
  if (!meta) return null;
  return (
    <p className="freshness">
      {dataThrough && <>Data to {formatDate(dataThrough)}. </>}
      {meta.nrt_from && <>Months from {formatMonth(meta.nrt_from)} use near-real-time data and may still change. </>}
      Data version {meta.data_version}, processed {formatDate(meta.generated_at.slice(0, 10))}.
    </p>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="layout">
        <div className="left">
          <Controls />
          <MapView />
        </div>
        <div className="right">
          {charts.map(({ id, Component }) => (
            <div key={id} className={`slot slot-${id}`}>
              <Component />
            </div>
          ))}
        </div>
      </main>
      <footer className="app-footer">
        <Freshness />
        <p>
          We acknowledge the use of data from NASA's Fire Information for Resource Management System (FIRMS)
          (<a href="https://earthdata.nasa.gov/firms">earthdata.nasa.gov/firms</a>), part of NASA's Earth Science
          Data and Information System (ESDIS). Team Sharmaji Ka Satellite, NASA Space Apps 2026.{" "}
          <a href="https://github.com/Mahabu-Subhani/fire-census">Source code</a>.
        </p>
      </footer>
    </div>
  );
}
