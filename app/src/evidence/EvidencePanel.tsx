// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Layer 2 of docs/RESEARCHER_EXPERIENCE.md: the method and every check, one
// click from the answer. Text from Person A's submission/method_panel.md;
// every number from meta.json. Failed and not-run checks are shown as plainly
// as passed ones.
import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";
import type { CurvePoint } from "../data/types";
import { useSelection, useSelectionActions } from "../selection";
import { calibrationText, formatValue, isAddedAfter, monthName, shortVersion, summarizeChecks, VERDICT_LABEL } from "./checks";

/** The shipping reason without a repeat of the level name it often starts with. */
function reasonText(reason: string | undefined, levelName: string | undefined): string {
  if (!reason) return "";
  const prefix = levelName ? `${levelName}.` : "";
  return prefix && reason.startsWith(prefix) ? reason.slice(prefix.length).trim() : reason;
}

const VERDICT_MARK = { pass: "✓", fail: "✗", "not run": "–" } as const;

function DetectionCurve({ day, night, floorDay }: { day: CurvePoint[]; night: CurvePoint[]; floorDay: number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!box.current || width === 0) return;
    const points = [
      ...day.map((p) => ({ ...p, when: "Day" })),
      ...night.map((p) => ({ ...p, when: "Night" })),
    ].filter((p) => p.frp !== null && p.frp > 0 && p.p !== null);
    if (points.length === 0) {
      box.current.replaceChildren();
      return;
    }
    const chart = Plot.plot({
      width,
      height: Math.min(320, Math.max(220, width * 0.5)),
      marginLeft: 48,
      style: { background: "transparent", color: "currentColor", fontSize: "12px" },
      x: { type: "log", label: "Fire strength seen by VIIRS (MW, log scale)", grid: true },
      y: { domain: [0, 1], label: "Chance Aqua MODIS also reported it", percent: true, grid: true },
      color: { domain: ["Day", "Night"], range: ["#d9480f", "#1c7ed6"], legend: true },
      marks: [
        Plot.areaY(points, { x: "frp", y1: "p_lo", y2: "p_hi", fill: "when", fillOpacity: 0.18, curve: "monotone-x" }),
        Plot.lineY(points, { x: "frp", y: "p", stroke: "when", strokeWidth: 2, curve: "monotone-x", tip: true }),
        ...(floorDay ? [Plot.ruleX([floorDay], { stroke: "currentColor", strokeDasharray: "4,3" })] : []),
      ],
    });
    box.current.replaceChildren(chart);
    return () => chart.remove();
  }, [day, night, floorDay, width]);

  return <div ref={box} className="ev-curve" role="img" aria-label="Detection curve: the chance that Aqua MODIS reported a fire that VIIRS saw, by fire strength, by day and by night" />;
}

export function ChecksBadge() {
  const { meta } = useSelection();
  if (!meta || meta.checks.length === 0) return null;
  const s = summarizeChecks(meta.checks);
  return (
    <a className="checks-badge" href="#evidence">
      Checks: {s.pass} passed{s.fail ? `, ${s.fail} failed` : ""}{s.notRun ? `, ${s.notRun} not run` : ""}
    </a>
  );
}

export default function EvidencePanel() {
  const { meta, region } = useSelection();
  const { regions } = useSelectionActions();
  if (!meta || !region) return null;
  const s = summarizeChecks(meta.checks);
  const floor = meta.floor_mw as { day?: number | null } | undefined;

  return (
    <section id="evidence" className="evidence" aria-labelledby="evidence-title">
      <h2 id="evidence-title">How we made two satellites agree</h2>
      <p className="ev-lead">{shortVersion(meta)}</p>

      <h3>Checks for {region.name}</h3>
      <p>
        {s.preRegistered} checks were written down before the data was opened. Each is listed with its limit, its value
        and whether it passed. {s.addedAfter > 0 && <>{s.addedAfter === 1 ? "One check was" : `${s.addedAfter} checks were`} added after the results, with the reason, and {s.addedAfter === 1 ? "is" : "are"} shown next to the original. </>}
        Result: {s.pass} passed, {s.fail} failed, {s.notRun} not run.
      </p>
      <ul className="ev-checks">
        {meta.checks.map((c) => (
          <li key={c.id} className={`ev-check ev-${c.verdict.replace(" ", "-")}`}>
            <span className="ev-verdict" aria-label={VERDICT_LABEL[c.verdict]}>
              <span aria-hidden="true">{VERDICT_MARK[c.verdict]}</span> {VERDICT_LABEL[c.verdict]}
            </span>
            <div className="ev-body">
              <strong>{c.id}. {c.name}</strong>
              {isAddedAfter(c) && <span className="ev-tag">added after results</span>}
              <dl>
                <dt>Limit</dt><dd>{c.threshold || "none stated"}</dd>
                <dt>Value</dt><dd>{formatValue(c.value)}</dd>
              </dl>
              {isAddedAfter(c) && (
                <p className="ev-note">Added after we saw the results, because the original limit was stricter than two satellites can agree month by month. Both are shown.</p>
              )}
              {c.note && <p className="ev-note">{c.note}</p>}
            </div>
          </li>
        ))}
      </ul>

      <details className="ev-detail">
        <summary>Method in detail</summary>
        <p>
          <strong>Unit.</strong> {meta.unit ?? "Not stated"}. From {monthName(region.harmonized_from)} (Aqua's first full
          month) the calendar counts what Aqua MODIS reported, and from the start of VIIRS it counts what Aqua would have
          reported, computed from VIIRS. Earlier months are marked "Terra only, not harmonized".
        </p>
        <p>
          <strong>Method shipped here: {meta.level_name ?? meta.level_shipped}.</strong> {reasonText(meta.shipping_reason, meta.level_name)}
        </p>
        <p>
          <strong>The curve.</strong> Where Aqua and Suomi NPP passed over the same place on the same day, we asked: did
          Aqua also report the fire VIIRS saw? The answer, by fire strength, is the curve below.{" "}
          {floor?.day ? <>Half of fires at {floor.day} MW are caught by day (dashed line).</> : null}{" "}
          {calibrationText(meta, region, regions)}
        </p>
        <DetectionCurve day={meta.curve.day} night={meta.curve.night} floorDay={floor?.day ?? null} />

        {meta.ladder.length > 0 && (
          <>
            <h3>The ladder: what each step does to the 2012 seam</h3>
            <p>A step of 0 at 2012 means no seam where VIIRS begins. The placebo is the same test at 2016, where nothing changed. Held-out is the error in years the method never saw.</p>
            <div className="ev-table-wrap">
              <table className="ev-table">
                <thead>
                  <tr><th scope="col">Level</th><th scope="col">Step at 2012</th><th scope="col">Placebo 2016</th><th scope="col">Held-out error</th></tr>
                </thead>
                <tbody>
                  {meta.ladder.map((rung, i) => (
                    <tr key={i}>
                      <th scope="row">{formatValue(rung.level)}</th>
                      <td>{formatValue(rung.step_2012)}</td>
                      <td>{rung.placebo_2016 === undefined ? "–" : formatValue(rung.placebo_2016)}</td>
                      <td>{rung.held_out === undefined ? "–" : formatValue(rung.held_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3>Limits</h3>
        <ul>
          <li>Counts are detections, not every fire: cloud and smoke hide fires from all satellites. Zero detections does not prove there was no fire.</li>
          <li>One month on its own is noisy; compare the same month across years.</li>
          <li>{meta.nrt_from ? <>Months from {monthName(meta.nrt_from)} are provisional (near-real-time data).</> : <>Recent months are provisional.</>}</li>
        </ul>
        <p className="ev-meta">
          Data version {meta.data_version}, code commit {meta.code_commit || "not stated"}, processed {meta.generated_at.slice(0, 10)}.
          Sources: {meta.sources.join("; ")}.{" "}
          <a href="https://github.com/Mahabu-Subhani/fire-census/blob/main/docs/PREREGISTRATION.md">Pre-registered checks</a>.
        </p>
      </details>
    </section>
  );
}
