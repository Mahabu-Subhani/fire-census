// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Page layout. Chart slots hold Person C's components from src/charts/.
import { useState } from "react";
import { charts } from "./charts";
import CoordinateEntry from "./controls/CoordinateEntry";
import DateRange from "./controls/DateRange";
import { buildSelectionCsv, saveText } from "./downloads/csv";
import EvidencePanel, { ChecksBadge } from "./evidence/EvidencePanel";
import ErrorBoundary from "./ErrorBoundary";
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
      <ChecksBadge />
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
  const selection = useSelection();
  const { region, meta, rows, from, to, mode, showSmall, areaKm2, status, place } = selection;
  const { regions, setRegion, setShowSmall, error, polygon, cellCount } = useSelectionActions();
  const [copied, setCopied] = useState(false);
  const areaLabel = place ?? (polygon ? "Drawn area" : "Whole region");

  const download = () => {
    if (!region || !meta) return;
    const csv = buildSelectionCsv({ region, meta, rows, from, to, mode, areaLabel, areaKm2, polygon });
    saveText(csv, `fire-census_${region.id}_${from}_${to}${polygon ? "_area" : ""}.csv`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  };

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
        {areaLabel}
        {areaKm2 !== null && <>, {Math.round(areaKm2).toLocaleString("en-GB")} km²</>}
        {cellCount !== null && <>, {cellCount.toLocaleString("en-GB")} grid cells</>}
      </p>
      <DateRange />
      <label className="check">
        <input type="checkbox" checked={showSmall} onChange={(e) => setShowSmall(e.target.checked)} />
        Show small fires (seen only by VIIRS, from 2012)
      </label>
      <div className="actions">
        <button type="button" onClick={download} disabled={!meta || status === "loading"}>Download CSV</button>
        <button type="button" onClick={copyLink}>{copied ? "Link copied" : "Copy link to this view"}</button>
        <button type="button" onClick={() => window.print()}>Print summary</button>
      </div>
      {status === "loading" && <p className="note">Loading the record for this region…</p>}
      {status === "error" && <p className="note error">Could not load the data: {error}</p>}
      {status === "empty" && cellCount === 0 && (
        <p className="note">This area contains no grid cell (cells are {region?.cell_deg} degree, about 11 km). Draw a larger area.</p>
      )}
      {status === "empty" && cellCount !== 0 && (
        <p className="note">No detections in this area and date range. Zero detections does not prove there was no fire.</p>
      )}
    </div>
  );
}

/** Shown only on paper: what the printout shows and how to get back to it. */
function PrintHeader() {
  const { region, from, to, mode, place, areaKm2, dataThrough } = useSelection();
  const { polygon } = useSelectionActions();
  if (!region) return null;
  const area = place ?? (polygon ? "Drawn area" : "Whole region");
  return (
    <div className="print-only print-header">
      <p>
        <strong>{region.name}</strong>: {area}
        {areaKm2 !== null && <>, {Math.round(areaKm2).toLocaleString("en-GB")} km²</>}. {formatMonth(from)} to {formatMonth(to)}.{" "}
        {mode === "raw" ? "Raw record" : "Harmonized record"}.{dataThrough && <> Data to {formatDate(dataThrough)}.</>}
      </p>
      <p>Printed {formatDate(new Date().toISOString().slice(0, 10))}. This view online: {window.location.href}</p>
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
      <PrintHeader />
      <main className="layout">
        <div className="left">
          <Controls />
          <ErrorBoundary name="the map">
            <MapView />
          </ErrorBoundary>
          <CoordinateEntry />
        </div>
        <div className="right">
          {charts.map(({ id, Component }) => (
            <div key={id} className={`slot slot-${id}`}>
              <ErrorBoundary name="this chart">
                <Component />
              </ErrorBoundary>
            </div>
          ))}
        </div>
      </main>
      <ErrorBoundary name="the method and checks panel">
        <EvidencePanel />
      </ErrorBoundary>
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
