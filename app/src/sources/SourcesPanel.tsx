// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// "Do the satellites agree?" Two parts, both counted from the published
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
const DRIFT_LABELS = ["within 15 min", "15 to 30", "30 to 60", "60 to 120", "over 120 min"];

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
      <h3>Who was watching, and when in the day</h3>
      <p className="src-note">
        One square per satellite and year. Colour shows how far its daytime pass has moved from where it started. A fire that
        peaks in the afternoon looks bigger to a satellite that arrives later, so a moved pass changes the count without any
        change on the ground.
      </p>
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
                        title={r ? `${s}, ${y}: ${whole(r.day + r.night)} detections; daytime pass ${fmtClock(r.day_local_time)} local solar time` : `${s}, ${y}: not reporting`}
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
        <span>Daytime pass moved by</span>
        {DRIFT_LABELS.map((label, i) => (
          <span key={label} className="src-key"><i style={{ background: ramp[1 + i] }} />{label}</span>
        ))}
        <span className="src-key"><i className="src-cell-empty" />not reporting</span>
      </p>
      {moved.length > 0 ? (
        <ul className="src-findings">
          {moved.map((d) => (
            <li key={d.satellite}>
              <strong>{d.satellite}</strong> passed at <span className="mono">{fmtClock(d.firstTime)}</span> in {d.firstYear} and at{" "}
              <span className="mono">{fmtClock(d.lastTime)}</span> in {d.lastYear}: <span className="mono">{Math.abs(d.minutes)}</span> minutes{" "}
              {d.minutes > 0 ? "later" : "earlier"}. Its recent counts are not comparable with its early ones.
            </li>
          ))}
          {viirsSteady && <li>The harmonized record uses VIIRS from 2012, whose pass has stayed within {RULES.DRIFT_MINUTES} minutes here, so this drift does not enter it.</li>}
        </ul>
      ) : (
        <p className="src-note">No satellite's daytime pass has moved by more than {RULES.DRIFT_MINUTES} minutes here.</p>
      )}
      <details className="src-details">
        <summary>The same numbers as a table</summary>
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead>
              <tr><th>Year</th>{SATELLITES.map((s) => <th key={s}>{s}: detections, daytime pass</th>)}</tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y}>
                  <td>{y}</td>
                  {SATELLITES.map((s) => {
                    const r = byKey.get(`${s}|${y}`);
                    return <td key={s}>{r ? `${whole(r.day + r.night)}, ${fmtClock(r.day_local_time)}` : "not reporting"}</td>;
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

const TIERS: { key: "both" | "viirsSeveral" | "viirsOne" | "modisOnly"; label: string; meaning: string }[] = [
  { key: "both", label: "Seen by MODIS and VIIRS", meaning: "Both kinds of sensor saw it. The strongest confirmation." },
  { key: "viirsSeveral", label: "Seen by two or more VIIRS satellites, not MODIS", meaning: "Confirmed by a second look, but too small or too cool for MODIS." },
  { key: "viirsOne", label: "Seen by one VIIRS satellite only", meaning: "A single look: a short burn that ended between passes, cloud on the other pass, or a fire at the edge of detection." },
  { key: "modisOnly", label: "Seen by MODIS only", meaning: "Usually a different time of day: Terra passes in the morning, and Aqua now passes later than VIIRS." },
];

function Result({ a, year }: { a: Agreement; year: number }) {
  const max = Math.max(a.both, a.viirsSeveral, a.viirsOne, a.modisOnly, 1);
  return (
    <div className="src-result">
      <div className="ev-table-wrap">
        <table className="ev-table">
          <thead>
            <tr><th>Satellite</th><th>Sensor</th><th>Detections</th><th>Fire cells</th><th>Day pass</th><th>Night pass</th></tr>
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
        Pass times are local solar time, averaged over this area's detections. Detections are every row FIRMS reported. Fire
        cells count a square of about 1 km once per satellite, date and half of the day, after leaving out{" "}
        <span className="mono">{whole(a.notFire)}</span> detections that are not vegetation fires and{" "}
        <span className="mono">{whole(a.lowConfidence)}</span> of low confidence.
      </p>

      {a.fires === 0 ? (
        <p className="src-note">No fire cells here in {year}. That does not prove there was no fire.</p>
      ) : !a.hasViirs ? (
        <p className="src-note">
          Only MODIS reported here in these dates (VIIRS starts in 2012), so there is nothing to compare:{" "}
          <span className="mono">{whole(a.modisOnly)}</span> fire cells seen by MODIS.
        </p>
      ) : (
        <>
          <h4>Of <span className="mono">{whole(a.fires)}</span> fire cells, who saw each one</h4>
          <ul className="src-tiers">
            {TIERS.map((t) => (
              <li key={t.key}>
                <div className="src-tier-head">
                  <span>{t.label}</span>
                  <span className="mono">{whole(a[t.key])} · {fmtShare(a[t.key] / a.fires)}</span>
                </div>
                <div className="src-bar"><i style={{ width: `${(a[t.key] / max) * 100}%` }} /></div>
                <p>{t.meaning}</p>
              </li>
            ))}
          </ul>
          {a.pair && (
            <p className={`src-verdict src-verdict-${a.pair.verdict}`}>
              {a.pair.verdict === "few" ? (
                <>Too few fires to judge whether {a.pair.a} and {a.pair.b} agree (fewer than {RULES.MIN_SAMPLE} fire cells for one of them).</>
              ) : (
                <>
                  <strong>{a.pair.verdict === "agree" ? "The two VIIRS satellites agree." : "The two VIIRS satellites differ."}</strong>{" "}
                  {a.pair.a} saw <span className="mono">{whole(a.pair.na)}</span> fire cells and {a.pair.b}{" "}
                  <span className="mono">{whole(a.pair.nb)}</span>: log ratio <span className="mono">{a.pair.logRatio!.toFixed(2)}</span>, limit{" "}
                  <span className="mono">{RULES.AGREE_LOG_RATIO.toFixed(2)}</span>.
                  {a.pair.verdict === "differ" && " Treat this area and period with care: one satellite may have been off, or cloud may have hidden one pass."}
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
      <p className="eyebrow">Sources</p>
      <h2>Do the satellites agree?</h2>
      <p className="ev-lead">
        Five satellites with two kinds of sensor pass over at different times of day, so they never report exactly the same
        thing. This section shows who was watching, when, and how often they confirm each other.
      </p>
      <Watching rows={sources} />

      <h3>In your area: who saw each fire</h3>
      {chosen === null ? (
        <p className="src-note">No hotspot files for the years in your date range.</p>
      ) : (
        <div className="src-run">
          <div className="field">
            <label htmlFor="src-year">Year</label>
            <select id="src-year" value={chosen} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={run} disabled={state.status === "busy"}>
            {state.status === "busy" ? "Reading every detection…" : "Compare the satellites"}
          </button>
          <p className="fine-print">Reads every detection of that year in your area and dates. A busy year is a few megabytes.</p>
        </div>
      )}
      <div role="status">
        {state.status === "error" && <p className="note error">Could not compare: {state.message}</p>}
        {state.status === "done" && state.result && <Result a={state.result} year={state.year!} />}
      </div>

      <details className="src-details">
        <summary>The rules used here</summary>
        <ul className="src-rules">
          <li>Same fire: detections in the same square of about 1 km ({RULES.CELL_DEG} degree) or a neighbouring one, on the same date and the same half of the day. This is the rule the harmonization uses.</li>
          <li>Left out before comparing: detections FIRMS marks as not a vegetation fire, MODIS confidence below {RULES.MODIS_MIN_CONFIDENCE}, and VIIRS "low" confidence.</li>
          <li>Two VIIRS satellites agree when the log of the ratio of their fire cells is at most {RULES.AGREE_LOG_RATIO.toFixed(2)} (about 28 percent). Two identical sensors differ by 0.07 to 0.10 in a month in our data, so this is about three times their normal scatter.</li>
          <li>Fewer than {RULES.MIN_SAMPLE} fire cells: too few to judge, the same minimum as the pre-registered checks.</li>
          <li>A daytime pass has drifted when it moved more than {RULES.DRIFT_MINUTES} minutes from its first year.</li>
          <li>Near-real-time rows carry no type, so recent static heat sources may still be counted as fires here.</li>
        </ul>
      </details>
    </section>
  );
}
