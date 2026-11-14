// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Sensor agreement. Two parts, both counted from the published
// hotspot files:
//  1. Who was watching: which satellites reported each year, and how far each
//     one's daytime pass has moved on the clock (from <region>/sources.json).
//  2. For the area and one year: every fire sorted by which satellites saw it.
// The rules are in agreement.ts (RULES) and docs/DECISIONS.md, decision 38.
import { useEffect, useMemo, useState } from "react";
import { fetchHotspotYear, isHtml, yearsInRange } from "../downloads/hotspots";
import { useSelection, useSelectionActions } from "../selection";
import { fmtShare } from "../stats";
import { EMBER, useTheme } from "../theme";
import { analyseAgreement, FAMILY, fmtClock, passDrift, RULES, SATELLITES, type Agreement, type SourceYear } from "./agreement";

const base = import.meta.env.BASE_URL;
const whole = (n: number) => n.toLocaleString("en-GB");

async function loadSources(regionId: string): Promise<SourceYear[]> {
  const response = await fetch(`${base}data/${regionId}/sources.json`);
  if (!response.ok || isHtml(response)) return [];
  return ((await response.json()) as { rows: SourceYear[] }).rows;
}

/** Minutes of drift to a step of the ember ramp (0 = on time). */
const DRIFT_STEPS = [15, RULES.DRIFT_MINUTES, 60, 120];
const driftStep = (minutes: number) => DRIFT_STEPS.filter((s) => Math.abs(minutes) > s).length;
const DRIFT_LABELS = ["< 15 min", "15–30", "30–60", "60–120", "> 120 min"];

function Watching({ rows }: { rows: SourceYear[] }) {
  const { theme } = useTheme();
  const ramp = EMBER[theme];
  const years = useMemo(() => {
    const ys = rows.map((r) => r.year);
    return ys.length ? Array.from({ length: Math.max(...ys) - Math.min(...ys) + 1 }, (_, i) => Math.min(...ys) + i) : [];
  }, [rows]);
  const drift = useMemo(() => passDrift(rows), [rows]);
  const byKey = useMemo(() => new Map(rows.map((r) => [`${r.satellite}|${r.year}`, r])), [rows]);
  const moved = drift.filter((d) => d.drifted);
  const viirsSteady = drift.some((d) => FAMILY[d.satellite] === "VIIRS") && drift.every((d) => FAMILY[d.satellite] !== "VIIRS" || !d.drifted);

  return (
    <>
      <h3>Satellite coverage and overpass drift</h3>
      <div className="src-grid-wrap">
        <div className="src-grid" role="img" aria-label="Satellites reporting each year, coloured by how far the daytime pass time has moved. The table below gives the same numbers.">
          {SATELLITES.map((s) => {
            const d = drift.find((x) => x.satellite === s);
            return (
              <div className="src-row" key={s}>
                <span className="src-name">{s}</span>
                <span className="src-cells">
                  {years.map((y) => {
                    const r = byKey.get(`${s}|${y}`);
                    const usable = r && r.day_local_time !== null && d;
                    const minutes = usable ? Math.round((r.day_local_time! - d.firstTime) * 60) : 0;
                    return (
                      <span
                        key={y}
                        className={`src-cell${r ? "" : " src-cell-empty"}`}
                        style={r ? { background: ramp[1 + (usable ? driftStep(minutes) : 0)] } : undefined}
                        title={r ? `${s}, ${y}: ${whole(r.day + r.night)} detections; day overpass ${fmtClock(r.day_local_time)} local solar time` : `${s}, ${y}: no data`}
                      />
                    );
                  })}
                </span>
              </div>
            );
          })}
          <div className="src-row src-axis" aria-hidden="true">
            <span className="src-name" />
            <span className="src-cells">
              {years.map((y) => (
                <span key={y} className="src-tick">{y % 5 === 0 ? y : ""}</span>
              ))}
            </span>
          </div>
        </div>
      </div>
      <p className="src-legend" aria-hidden="true">
        <span>Daytime overpass drift</span>
        {DRIFT_LABELS.map((label, i) => (
          <span key={label} className="src-key"><i style={{ background: ramp[1 + i] }} />{label}</span>
        ))}
        <span className="src-key"><i className="src-cell-empty" />No data</span>
      </p>
      {moved.length > 0 ? (
        <ul className="src-findings">
          {moved.map((d) => (
            <li key={d.satellite}>
              <strong>{d.satellite}</strong>: <span className="mono">{fmtClock(d.firstTime)}</span> ({d.firstYear}) to{" "}
              <span className="mono">{fmtClock(d.lastTime)}</span> ({d.lastYear}),{" "}
              <span className="mono">{d.minutes > 0 ? "+" : "−"}{Math.abs(d.minutes)}</span> min.
            </li>
          ))}
          {viirsSteady && <li>VIIRS overpass stable within {RULES.DRIFT_MINUTES} min; harmonized record unaffected.</li>}
        </ul>
      ) : (
        <p className="src-note">No overpass drift above {RULES.DRIFT_MINUTES} min.</p>
      )}
      <details className="src-details">
        <summary>Table</summary>
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead>
              <tr><th>Year</th>{SATELLITES.map((s) => <th key={s}>{s}: detections, day overpass</th>)}</tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y}>
                  <td>{y}</td>
                  {SATELLITES.map((s) => {
                    const r = byKey.get(`${s}|${y}`);
                    return <td key={s}>{r ? `${whole(r.day + r.night)}, ${fmtClock(r.day_local_time)}` : "–"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

const TIERS: { key: "both" | "viirsSeveral" | "viirsOne" | "modisOnly"; label: string }[] = [
  { key: "both", label: "MODIS and VIIRS" },
  { key: "viirsSeveral", label: "VIIRS, two or more satellites" },
  { key: "viirsOne", label: "VIIRS, single satellite" },
  { key: "modisOnly", label: "MODIS only" },
]

function Result({ a, year }: { a: Agreement; year: number }) {
  const max = Math.max(a.both, a.viirsSeveral, a.viirsOne, a.modisOnly, 1);
  return (
    <div className="src-result">
      <div className="ev-table-wrap">
        <table className="ev-table">
          <thead>
            <tr><th>Satellite</th><th>Sensor</th><th>Detections</th><th>Fire cells</th><th>Day overpass</th><th>Night overpass</th></tr>
          </thead>
          <tbody>
            {a.satellites.map((s) => (
              <tr key={s.satellite}>
                <td>{s.satellite}</td><td>{s.family}</td><td>{whole(s.detections)}</td><td>{whole(s.fireCells)}</td>
                <td>{fmtClock(s.dayTime)}</td><td>{fmtClock(s.nightTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="src-note">
        Overpass times in local solar time. Excluded: <span className="mono">{whole(a.notFire)}</span> non-vegetation,{" "}
        <span className="mono">{whole(a.lowConfidence)}</span> low confidence.
      </p>

      {a.fires === 0 ? (
        <p className="src-note">No fire cells in {year}.</p>
      ) : !a.hasViirs ? (
        <p className="src-note">
          MODIS only (VIIRS from 2012): <span className="mono">{whole(a.modisOnly)}</span> fire cells.
        </p>
      ) : (
        <>
          <h4>Fire cells by detecting sensor (<span className="mono">{whole(a.fires)}</span>)</h4>
          <ul className="src-tiers">
            {TIERS.map((t) => (
              <li key={t.key}>
                <div className="src-tier-head">
                  <span>{t.label}</span>
                  <span className="mono">{whole(a[t.key])} · {fmtShare(a[t.key] / a.fires)}</span>
                </div>
                <div className="src-bar"><i style={{ width: `${(a[t.key] / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          {a.pair && (
            <p className={`src-verdict src-verdict-${a.pair.verdict}`}>
              {a.pair.verdict === "few" ? (
                <><strong>Insufficient data.</strong> {a.pair.a} / {a.pair.b}: fewer than {RULES.MIN_SAMPLE} fire cells.</>
              ) : (
                <>
                  <strong>{a.pair.verdict === "agree" ? "VIIRS consistent." : "VIIRS inconsistent."}</strong>{" "}
                  {a.pair.a} <span className="mono">{whole(a.pair.na)}</span>, {a.pair.b}{" "}
                  <span className="mono">{whole(a.pair.nb)}</span> fire cells. Log ratio <span className="mono">{a.pair.logRatio!.toFixed(2)}</span>{" "}
                  (limit <span className="mono">{RULES.AGREE_LOG_RATIO.toFixed(2)}</span>).
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function SourcesPanel() {
  const { region, from, to } = useSelection();
  const { polygon } = useSelectionActions();
  const [sources, setSources] = useState<SourceYear[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; result?: Agreement; year?: number; message?: string }>({ status: "idle" });

  useEffect(() => {
    setSources([]);
    let live = true;
    if (region) loadSources(region.id).then((rows) => live && setSources(rows));
    return () => {
      live = false;
    };
  }, [region]);

  const years = useMemo(() => {
    const have = new Set(sources.map((r) => r.year));
    return yearsInRange(from, to).filter((y) => have.has(y));
  }, [sources, from, to]);
  const chosen = year !== null && years.includes(year) ? year : years[years.length - 1] ?? null;

  // A result belongs to one area, year and date range; drop it when any changes.
  useEffect(() => setState({ status: "idle" }), [region, polygon, from, to, chosen]);

  if (!region || sources.length === 0) return null;

  const run = async () => {
    if (chosen === null) return;
    setState({ status: "busy" });
    try {
      const text = await fetchHotspotYear(base, region.id, chosen);
      if (text === null) {
        setState({ status: "error", message: `No hotspot file for ${chosen}.` });
        return;
      }
      setState({ status: "done", year: chosen, result: analyseAgreement([text], polygon, from, to) });
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  };

  return (
    <section className="sources" id="sources">
      <h2>Sensor agreement</h2>
      <Watching rows={sources} />

      <h3>Detection agreement</h3>
      {chosen === null ? (
        <p className="src-note">No hotspot files for the selected period.</p>
      ) : (
        <div className="src-run">
          <div className="field">
            <label htmlFor="src-year">Year</label>
            <select id="src-year" value={chosen} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={run} disabled={state.status === "busy"}>
            {state.status === "busy" ? "Processing…" : "Run comparison"}
          </button>
        </div>
      )}
      <div role="status">
        {state.status === "error" && <p className="note error">Comparison failed: {state.message}</p>}
        {state.status === "done" && state.result && <Result a={state.result} year={state.year!} />}
      </div>

      <details className="src-details">
        <summary>Criteria</summary>
        <ul className="src-rules">
          <li>Same fire: same or adjacent {RULES.CELL_DEG}° cell, same date, same half-day.</li>
          <li>Excluded: non-vegetation detections, MODIS confidence below {RULES.MODIS_MIN_CONFIDENCE}, VIIRS low confidence.</li>
          <li>VIIRS agreement: |log ratio| ≤ {RULES.AGREE_LOG_RATIO.toFixed(2)}.</li>
          <li>Minimum sample: {RULES.MIN_SAMPLE} fire cells.</li>
          <li>Overpass drift: more than {RULES.DRIFT_MINUTES} min from the first year.</li>
          <li>Near-real-time rows carry no type; static heat sources may be included.</li>
        </ul>
      </details>
    </section>
  );
}
