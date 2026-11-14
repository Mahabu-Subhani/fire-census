// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Page layout. Two views share one selection: "overview" (everyone: the answer,
// the calendar, the comparison, the outlook) and "research" (every chart, the
// method and every check, the data). Chart slots hold Person C's components.
import { lazy, Suspense, useState } from "react";
import { charts } from "./charts";
import { formatMonth, useAreaLabel } from "./charts/ChartFrame";
import CoordinateEntry from "./controls/CoordinateEntry";
import DateRange from "./controls/DateRange";
import PlaceSearch from "./controls/PlaceSearch";
import { buildSelectionCsv, saveText } from "./downloads/csv";
import HotspotDownload from "./downloads/HotspotDownload";
import ErrorBoundary from "./ErrorBoundary";
import { summaryText } from "./evidence/checks";
import ForResearchers from "./guide/ForResearchers";
import Glossary from "./guide/Glossary";
import Hero from "./layout/Hero";
import { Reveal } from "./layout/motion";
import TopBar from "./layout/TopBar";
import { useSelection, useSelectionActions } from "./selection";
import { unitLabel } from "./stats";

// The map library and the chart library are large; load them after the first screen.
const MapView = lazy(() => import("./map/MapView"));
const EvidencePanel = lazy(() => import("./evidence/EvidencePanel"));
const SourcesPanel = lazy(() => import("./sources/SourcesPanel"));

const Loading = ({ height }: { height: number }) => <div className="skeleton" style={{ height }} aria-label="Loading" />;

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function Controls() {
  const { region, meta, rows, from, to, mode, showSmall, areaKm2, status, place } = useSelection();
  const { setShowSmall, error, polygon, cellCount } = useSelectionActions();
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
      <DateRange />
      <label className="toggle">
        <input type="checkbox" role="switch" checked={showSmall} onChange={(e) => setShowSmall(e.target.checked)} />
        <span className="toggle-track" aria-hidden="true" />
        <span>Small fires layer <small>(VIIRS only, from 2012)</small></span>
      </label>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={download} disabled={!meta || status === "loading"}>Download CSV</button>
        <button type="button" className="btn" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
        <button type="button" className="btn" onClick={() => window.print()}>Print</button>
      </div>
      <HotspotDownload />
      {status === "error" && <p className="note error">Could not load the data: {error}</p>}
      {status === "empty" && cellCount === 0 && (
        <p className="note">This area contains no grid cell (cells are {region?.cell_deg} degree, about 11 km). Draw a larger area.</p>
      )}
      {status === "empty" && cellCount !== 0 && (
        <p className="note">No detections here in these dates. That does not prove there was no fire.</p>
      )}
    </div>
  );
}

/** Where: region, district search, and the area's size. The map follows it. */
function AreaPicker() {
  const { region, areaKm2, place } = useSelection();
  const { regions, setRegion, polygon, cellCount } = useSelectionActions();
  const areaLabel = place ?? (polygon ? "Drawn area" : "Whole region");
  return (
    <div className="controls">
      <div className="field">
        <label htmlFor="region-select">Region</label>
        <select id="region-select" value={region?.id ?? ""} onChange={(e) => setRegion(e.target.value)} disabled={regions.length === 0}>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <PlaceSearch />
      <p className="area-line">
        <span>{areaLabel}</span>
        {areaKm2 !== null && <span className="mono">{areaKm2.toLocaleString("en-GB", { maximumFractionDigits: 2 })} km²</span>}
        {cellCount !== null && <span className="mono">{cellCount.toLocaleString("en-GB")} cells</span>}
      </p>
    </div>
  );
}

/** Shown once above the charts: what every chart below is about. */
function ContextBar() {
  const { meta, mode, from, to } = useSelection();
  const area = useAreaLabel();
  return (
    <div className="context-bar">
      <span className="context-area">{area}</span>
      {from && to && <span>{formatMonth(from)} – {formatMonth(to)}</span>}
      <span className={`context-mode context-mode-${mode}`}>{mode === "raw" ? "Raw" : "Harmonized"}</span>
      <span className="context-unit">{unitLabel(meta, mode)}</span>
    </div>
  );
}

/** Shown only on paper: what the printout shows and how to get back to it. */
function PrintHeader() {
  const { region, from, to, mode, dataThrough } = useSelection();
  const area = useAreaLabel();
  if (!region) return null;
  return (
    <div className="print-only print-header">
      <p>
        <strong>Fire Census · {region.name}</strong>: {area}. {formatMonth(from)} to {formatMonth(to)}.{" "}
        {mode === "raw" ? "Raw record" : "Harmonized record"}.{dataThrough && <> Data to {formatDate(dataThrough)}.</>}
      </p>
      <p>Printed {formatDate(new Date().toISOString().slice(0, 10))}. This view online: {window.location.href}</p>
    </div>
  );
}

function ResearchHead() {
  const { meta } = useSelection();
  return (
    <section className="research-head">
      <p className="eyebrow">Data &amp; methods</p>
      <h1>
        Every chart, every check, <em>and the data behind them.</em>
      </h1>
      {meta && <p className="research-sub">Pre-registered checks for this region: {summaryText(meta.checks)}.</p>}
    </section>
  );
}

function MethodCallout() {
  const { meta } = useSelection();
  const { setView } = useSelectionActions();
  if (!meta) return null;
  return (
    <Reveal className="callout">
      <div>
        <p className="eyebrow">How we know</p>
        <p className="callout-text">Checks fixed before the data was opened: {summaryText(meta.checks)}. Failures are shown, not hidden.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => { setView("research"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        Method, checks and data
      </button>
    </Reveal>
  );
}

function Footer() {
  const { meta, dataThrough } = useSelection();
  return (
    <footer className="app-footer">
      {meta && (
        <p className="freshness">
          {dataThrough && <>Data to {formatDate(dataThrough)}. </>}
          {meta.nrt_from && <>Months from {formatMonth(meta.nrt_from)} are near-real-time and may change. </>}
          Data version {meta.data_version}.
        </p>
      )}
      <p>
        We acknowledge the use of data from NASA's Fire Information for Resource Management System (FIRMS)
        (<a href="https://earthdata.nasa.gov/firms">earthdata.nasa.gov/firms</a>), part of NASA's Earth Science
        Data and Information System (ESDIS). Team Sharmaji Ka Satellite, NASA Space Apps 2026 ·{" "}
        <a href="https://github.com/Mahabu-Subhani/fire-census">Source code</a>
      </p>
    </footer>
  );
}

export default function App() {
  const { view } = useSelectionActions();
  return (
    <>
      <TopBar />
      <div className="app">
        <PrintHeader />
        {view === "overview" ? <Hero /> : <ResearchHead />}
        <main className="layout" id="explore">
          <aside className="panel" aria-label="Choose an area and dates">
            <AreaPicker />
            <ErrorBoundary name="the map">
              <Suspense fallback={<Loading height={300} />}>
                <MapView />
              </Suspense>
            </ErrorBoundary>
            <CoordinateEntry />
            <Controls />
          </aside>
          <div className="charts">
            <ContextBar />
            {charts
              .filter((c) => c.views.includes(view))
              .map(({ id, Component }, i) => (
                <Reveal key={`${view}-${id}`} id={`chart-${id}`} className={`slot slot-${id}`} delay={i * 60}>
                  <ErrorBoundary name="this chart">
                    <Suspense fallback={<Loading height={260} />}>
                      <Component />
                    </Suspense>
                  </ErrorBoundary>
                </Reveal>
              ))}
            {view === "overview" && <MethodCallout />}
          </div>
        </main>
        {view === "research" && (
          <>
            <ErrorBoundary name="the satellites section">
              <Reveal>
                <Suspense fallback={<Loading height={300} />}>
                  <SourcesPanel />
                </Suspense>
              </Reveal>
            </ErrorBoundary>
            <ErrorBoundary name="the method and checks panel">
              <Reveal>
                <Suspense fallback={<Loading height={400} />}>
                  <EvidencePanel />
                </Suspense>
              </Reveal>
            </ErrorBoundary>
            <Reveal><Glossary /></Reveal>
            <ErrorBoundary name="the researchers section">
              <Reveal><ForResearchers /></Reveal>
            </ErrorBoundary>
          </>
        )}
        <Footer />
      </div>
    </>
  );
}
