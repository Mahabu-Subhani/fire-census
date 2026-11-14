// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk; map-first layout by Charulekha Rajesh (pending review).
// Page layout. Two views share one selection. "overview" is map first: the
// map fills the screen, one panel holds the answer and sections that open one
// at a time, and a small toolbar holds the actions (decision 39). "research"
// is the full page: every chart, the method and every check, the data.
// Chart slots hold Person C's components.
import { lazy, Suspense, useState, type ReactNode } from "react";
import { charts } from "./charts";
import { formatMonth, useAreaLabel } from "./charts/ChartFrame";
import { useMonthStatus } from "./charts/UnusualBanner";
import CoordinateEntry from "./controls/CoordinateEntry";
import DateRange from "./controls/DateRange";
import PlaceSearch from "./controls/PlaceSearch";
import { buildSelectionCsv, saveText } from "./downloads/csv";
import HotspotDownload from "./downloads/HotspotDownload";
import ErrorBoundary from "./ErrorBoundary";
import { isCaseStudy, summaryText } from "./evidence/checks";
import ForResearchers from "./guide/ForResearchers";
import Glossary from "./guide/Glossary";
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

/** Download, link, print: the same actions in both views. */
function useActions() {
  const { region, meta, rows, from, to, mode, areaKm2, status, place } = useSelection();
  const { polygon } = useSelectionActions();
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

  return { download, copyLink, copied, canDownload: Boolean(meta) && status !== "loading" };
}

/** Dates, the small-fire layer, the hotspot file and the notes about empty areas. */
function Controls({ withActions }: { withActions: boolean }) {
  const { region, showSmall, status } = useSelection();
  const { setShowSmall, error, cellCount } = useSelectionActions();
  const { download, copyLink, copied, canDownload } = useActions();

  return (
    <div className="controls">
      <DateRange />
      <label className="toggle">
        <input type="checkbox" role="switch" checked={showSmall} onChange={(e) => setShowSmall(e.target.checked)} />
        <span className="toggle-track" aria-hidden="true" />
        <span>Small fires layer <small>(VIIRS only, from 2012)</small></span>
      </label>
      {withActions && (
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={download} disabled={!canDownload}>Download CSV</button>
          <button type="button" className="btn" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
          <button type="button" className="btn" onClick={() => window.print()}>Print</button>
        </div>
      )}
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
  const { region, areaKm2, place, meta } = useSelection();
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
      {meta && isCaseStudy(meta) && (
        <p className="note case-study">
          <strong>Case study.</strong> This area was added after the start and its held-out checks fail, so it uses the
          simpler fallback method. Read its numbers with care; the checks are under Data &amp; methods.
        </p>
      )}
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
      <h1>Every chart, every check, and the data behind them.</h1>
      {meta && <p className="research-sub">Pre-registered checks for this region: {summaryText(meta.checks)}.</p>}
    </section>
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
        Data and Information System (ESDIS). Satellite imagery: NASA Blue Marble through NASA GIBS.
        Team Sharmaji Ka Satellite, NASA Space Apps 2026 ·{" "}
        <a href="https://github.com/Mahabu-Subhani/fire-census">Source code</a>
      </p>
    </footer>
  );
}

/** The answer, always visible at the top of the panel. */
function Answer() {
  const s = useMonthStatus();
  const { place, drawn, region, meta } = useSelection();
  const area = place ?? (drawn ? "Drawn area" : region?.name ?? "");
  const caseStudy = meta !== null && isCaseStudy(meta);
  return (
    <div className="mf-answer" role="status">
      {s.state === "ready" ? (
        <>
          <p className="mf-when">{s.when} · {area}{caseStudy ? " · case study" : ""}</p>
          <p className="mf-headline">{s.headline}</p>
          {s.verdictText && <p className={`mf-verdict${s.alert ? " alert" : ""}`}>{s.verdictText}</p>}
        </>
      ) : (
        <p className="mf-when">{s.state === "loading" ? "Reading the record…" : s.headline}</p>
      )}
    </div>
  );
}

function Section({ id, label, open, onToggle, children }: { id: string; label: string; open: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <>
      <button type="button" className="mf-sec" aria-expanded={open} aria-controls={`sec-${id}`} onClick={() => onToggle(id)}>
        <span>{label}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div id={`sec-${id}`} className="mf-body">{children}</div>}
    </>
  );
}

const OVERVIEW_CHARTS: Record<string, string> = {
  calendar: "Burning calendar",
  comparison: "This month against past years",
  outlook: "Next 3 months · past years",
  // Whole-region analyses; listed only where the file exists and no area is drawn.
  season: "Critical period · has it moved?",
  landcover: "Crops or wild land?",
  episodes: "This fire against earlier ones",
};

const Icon = {
  download: <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M2.5 13.5 H13.5" />,
  link: <path d="M6.5 9.5 L9.5 6.5 M7 4.5 L8.5 3 a2.5 2.5 0 0 1 3.5 3.5 L10.5 8 M9 11.5 L7.5 13 a2.5 2.5 0 0 1 -3.5 -3.5 L5.5 8" />,
  print: <path d="M4 6 V2 H12 V6 M4 11 H2.5 V6 H13.5 V11 H12 M4 9 H12 V14 H4 Z" />,
  method: <path d="M8 1.5 a6.5 6.5 0 1 0 0.01 0 Z M6 6.2 a2 2 0 1 1 2.6 1.9 c-.6.2 -.6.7 -.6 1.4 M8 11.5 V12" />,
};

function Overview() {
  const [open, setOpen] = useState<string | null>("calendar");
  const { setView } = useSelectionActions();
  const { download, copyLink, copied, canDownload } = useActions();
  const selection = useSelection();
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));
  const tool = (icon: ReactNode, label: string, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{icon}</svg>
      {label}
    </button>
  );

  return (
    <main className="mapfirst" id="explore">
      <div className="mf-map">
        <ErrorBoundary name="the map">
          <Suspense fallback={<Loading height={300} />}>
            <MapView />
          </Suspense>
        </ErrorBoundary>
      </div>
      <aside className="mf-panel" aria-label="Results">
        <Answer />
        {charts
          .filter((c) => c.id in OVERVIEW_CHARTS && (c.available?.(selection) ?? true))
          .map(({ id, Component }) => (
            <Section key={id} id={id} label={OVERVIEW_CHARTS[id]} open={open === id} onToggle={toggle}>
              <div className={`slot slot-${id}`}>
                <ErrorBoundary name="this chart">
                  <Suspense fallback={<Loading height={220} />}>
                    <Component />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </Section>
          ))}
        <Section id="area" label="Area" open={open === "area"} onToggle={toggle}>
          <AreaPicker />
          <CoordinateEntry />
        </Section>
        <Section id="dates" label="Dates and layers" open={open === "dates"} onToggle={toggle}>
          <Controls withActions={false} />
        </Section>
        <Section id="satellites" label="Do the satellites agree?" open={open === "satellites"} onToggle={toggle}>
          <ErrorBoundary name="the satellites section">
            <Suspense fallback={<Loading height={220} />}>
              <SourcesPanel />
            </Suspense>
          </ErrorBoundary>
        </Section>
      </aside>
      <nav className="mf-tools" aria-label="Tools">
        {tool(Icon.download, "Download", download, !canDownload)}
        {tool(Icon.link, copied ? "Copied" : "Link", copyLink)}
        {tool(Icon.print, "Print", () => window.print())}
        {tool(Icon.method, "Method", () => { setView("research"); window.scrollTo({ top: 0 }); })}
      </nav>
    </main>
  );
}

function Research() {
  const selection = useSelection();
  return (
    <>
      <ResearchHead />
      <main className="layout" id="explore">
        <aside className="panel" aria-label="Choose an area and dates">
          <AreaPicker />
          <ErrorBoundary name="the map">
            <Suspense fallback={<Loading height={300} />}>
              <MapView />
            </Suspense>
          </ErrorBoundary>
          <CoordinateEntry />
          <Controls withActions />
        </aside>
        <div className="charts">
          <ContextBar />
          {charts
            .filter((c) => c.views.includes("research") && (c.available?.(selection) ?? true))
            .map(({ id, Component }, i) => (
              <Reveal key={`research-${id}`} id={`chart-${id}`} className={`slot slot-${id}`} delay={i * 60}>
                <ErrorBoundary name="this chart">
                  <Suspense fallback={<Loading height={260} />}>
                    <Component />
                  </Suspense>
                </ErrorBoundary>
              </Reveal>
            ))}
        </div>
      </main>
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
  );
}

export default function App() {
  const { view } = useSelectionActions();
  return (
    <>
      <TopBar />
      <div className={view === "overview" ? "app app-wide" : "app"}>
        <PrintHeader />
        {view === "overview" ? <Overview /> : <Research />}
        <Footer />
      </div>
    </>
  );
}
