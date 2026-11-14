// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Layer 2 of docs/RESEARCHER_EXPERIENCE.md: the method and every check, one
// click from the answer. Text from Person A's submission/method_panel.md;
// every number from meta.json. Failed and not-run checks are shown as plainly
// as passed ones.
import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState, useMemo } from "react";
import type { CurvePoint } from "../data/types";
import { useSelection, useSelectionActions } from "../selection";
import { calibrationText, formatValue, isAddedAfter, monthName, shortVersion, summarizeChecks, VERDICT_LABEL } from "./checks";

export { ChecksBadge } from "./ChecksBadge";

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

export default function EvidencePanel() {
  const { meta, region, areaRows, drift } = useSelection();
  const { regions } = useSelectionActions();
  // Clear-view days per cell and month, where the pipeline filled them in.
  const obs = useMemo(() => {
    const v = areaRows.map((r) => r.obs).filter((o): o is number => typeof o === "number").sort((a, b) => a - b);
    return v.length ? { n: v.length, of: areaRows.length, lo: v[0], mid: v[Math.floor(v.length / 2)], hi: v[v.length - 1] } : null;
  }, [areaRows]);
  // Aqua alone against this record: mean of 2012 to 2021 (before its orbit drifted) and the last full year.
  const aqua = useMemo(() => {
    const rows = (drift?.years ?? []).filter((y) => typeof y.aqua_over_harmonized === "number");
    const before = rows.filter((y) => y.year <= 2021).map((y) => y.aqua_over_harmonized as number);
    const lastFull = rows.filter((y) => y.year < Number((meta?.data_through ?? "9999").slice(0, 4))).pop();
    if (before.length === 0 || !lastFull || lastFull.year <= 2021) return null;
    return { before: before.reduce((a, b) => a + b, 0) / before.length, year: lastFull.year, ratio: lastFull.aqua_over_harmonized as number };
  }, [drift, meta]);
  if (!meta || !region) return null;
  const s = summarizeChecks(meta.checks);
  const floor = meta.floor_mw as { day?: number | null } | undefined;

  return (
    <section id="evidence" className="evidence" aria-labelledby="evidence-title">
      <h2 id="evidence-title">Harmonization method</h2>
      <p className="ev-lead">{shortVersion(meta)}</p>

      <h3>Pre-registered checks: {region.name}</h3>
      <p>
        Passed: {s.pass}. Failed: {s.fail}. Not run: {s.notRun}. Registered before data access: {s.preRegistered}
        {s.addedAfter > 0 && <>; added after results: {s.addedAfter}</>}.
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
                <p className="ev-note">Revised limit, added after results. Original shown alongside.</p>
              )}
              {c.note && <p className="ev-note">{c.note}</p>}
            </div>
          </li>
        ))}
      </ul>

      <details className="ev-detail">
        <summary>Method details</summary>
        <p>
          <strong>Unit.</strong> {meta.unit ?? "Not stated"}. From {monthName(region.harmonized_from)}: Aqua MODIS
          detections; from VIIRS onset: Aqua-equivalent detections derived from VIIRS. Earlier months: Terra only, not
          harmonized.
          {typeof meta.unit_note === "string" && <> {meta.unit_note}</>}
        </p>
        {obs && (
          <p>
            <strong>Clear-view days.</strong> Median <span className="mono">{obs.mid}</span> per cell-month (range{" "}
            <span className="mono">{obs.lo}</span>–<span className="mono">{obs.hi}</span>; Aqua daily fire masks;{" "}
            <span className="mono">{obs.n.toLocaleString("en-GB")}</span> of <span className="mono">{obs.of.toLocaleString("en-GB")}</span>{" "}
            cell-months). Counts are not corrected for cloud cover.
          </p>
        )}
        {aqua && (
          <p>
            <strong>Aqua MODIS orbital drift.</strong> Aqua's afternoon overpass has drifted later since 2022. Ratio of
            Aqua to this record: <span className="mono">{aqua.before.toFixed(2)}</span> (2012–2021 mean),{" "}
            <span className="mono">{aqua.ratio.toFixed(2)}</span> ({aqua.year}). This record uses VIIRS from 2012. See{" "}
            <a href="#sources">Sensor agreement</a>.
          </p>
        )}
        <p>
          <strong>Method applied: {meta.level_name ?? meta.level_shipped}.</strong> {reasonText(meta.shipping_reason, meta.level_name)}
        </p>
        <p>
          <strong>Detection curve.</strong> Probability that Aqua MODIS detected a fire observed by Suomi NPP VIIRS on
          coincident overpasses, by fire radiative power.{" "}
          {floor?.day ? <>Daytime 50% detection at {floor.day} MW (dashed line).</> : null}{" "}
          {calibrationText(meta, region, regions)}
        </p>
        <DetectionCurve day={meta.curve.day} night={meta.curve.night} floorDay={floor?.day ?? null} />

        {meta.ladder.length > 0 && (
          <>
            <h3>Method ladder</h3>
            <p>Step at 2012: discontinuity at VIIRS onset (0 = none). Placebo 2016: same test, no sensor change. Held-out error: error in withheld years.</p>
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
          <li>Counts are detections, not fires. Cloud and smoke obscure fires from all sensors; zero detections do not imply no fire.</li>
          <li>Single months are noisy; compare the same month across years.</li>
          <li>{meta.nrt_from ? <>Months from {monthName(meta.nrt_from)} are provisional (near-real-time).</> : <>Recent months are provisional.</>}</li>
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
