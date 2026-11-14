// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The first screen: the promise, the answer for the selected area, four real
// numbers, and the record itself as a dot picture. Every number comes from the data.
import { useMonthStatus } from "../charts/UnusualBanner";
import { summarizeChecks } from "../evidence/checks";
import { firmsLiveUrl, ringBBox } from "../guide/links";
import { useSelection, useSelectionActions } from "../selection";
import { fmtValue, value } from "../stats";
import EmberGrid from "./EmberGrid";
import { CountUp, Reveal } from "./motion";

const EXAMPLES = [
  { href: "?r=chilecito&from=2024-01&to=2026-11", label: "Chilecito fire, July 2026" },
  { href: "?r=punjab-haryana&from=2002-07&to=2026-11", label: "Punjab crop burning" },
  { href: "?r=cordoba&from=2005-01&to=2020-12&m=raw", label: "The 2012 jump, raw" },
];

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const whole = (v: number) => Math.round(v).toLocaleString("en-GB");

export default function Hero() {
  const { region, meta, rows, mode, areaKm2, place, drawn, dataThrough } = useSelection();
  const { polygon } = useSelectionActions();
  const s = useMonthStatus();
  const total = rows.reduce((sum, r) => sum + value(r, mode), 0);
  const years = region ? Number(region.last_month.slice(0, 4)) - Number(region.harmonized_from.slice(0, 4)) + 1 : 0;
  const checks = meta ? summarizeChecks(meta.checks) : null;
  const areaName = place ?? (drawn ? "the drawn area" : region?.name ?? "");
  const live = region ? firmsLiveUrl(polygon ? ringBBox(polygon) : region.bbox) : null;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow">
          NASA FIRMS · MODIS + VIIRS{region ? ` · ${region.first_month.slice(0, 4)}–${region.last_month.slice(0, 4)}` : ""}
        </p>
        <h1 id="hero-title">
          One fire record, <em>whichever satellite was watching.</em>
        </h1>

        <Reveal className={`answer${s.alert ? " answer-alert" : ""}`} delay={120}>
          {s.state === "ready" ? (
            <>
              <p className="answer-where">{s.when} · {areaName}</p>
              <p className="answer-main">
                {s.headline}
                {s.verdictText && <span className={`chip chip-${s.verdict}`}>{s.verdictText}</span>}
              </p>
              <p className="answer-nums">
                {s.valueText && <span><b>{s.valueText}</b> this month</span>}
                {s.medianText && <span><b>{s.medianText}</b> usual (median)</span>}
                {s.ratioText.endsWith(" times the median") && <span><b>{s.ratioText.replace(" times the median", "×")}</b> the usual</span>}
              </p>
              {s.provisional && <p className="answer-sub">{s.provisional}</p>}
            </>
          ) : (
            <p className="answer-sub">{s.state === "loading" ? "Reading the record…" : s.headline}</p>
          )}
        </Reveal>

        <dl className="stats">
          <Reveal className="stat" delay={180}>
            <dt>years on one scale</dt>
            <dd><CountUp value={years} format={whole} /></dd>
          </Reveal>
          <Reveal className="stat" delay={240}>
            <dt>fire activity, dates shown</dt>
            <dd><CountUp value={total} format={(v) => fmtValue(v, mode)} /></dd>
          </Reveal>
          {areaKm2 !== null && areaKm2 > 0 && (
            <Reveal className="stat" delay={300}>
              <dt>per 1,000 km²</dt>
              <dd><CountUp value={(total / areaKm2) * 1000} format={(v) => fmtValue(v, mode)} /></dd>
            </Reveal>
          )}
          {checks && (
            <Reveal className="stat" delay={360}>
              <dt>checks passed</dt>
              <dd><CountUp value={checks.pass} format={whole} /><span className="stat-of"> / {checks.pass + checks.fail + checks.notRun}</span></dd>
            </Reveal>
          )}
        </dl>

        <div className="hero-foot">
          <div className="try" aria-label="Examples">
            <span>Try</span>
            {EXAMPLES.map((e) => <a key={e.href} className="pill" href={e.href}>{e.label}</a>)}
          </div>
          {dataThrough && live && (
            <p className="live">
              History to {formatDay(dataThrough)}, not a live alert.{" "}
              <a href={live} target="_blank" rel="noopener noreferrer">Fires burning now ↗</a>
            </p>
          )}
        </div>
      </div>
      <Reveal className="hero-art" delay={80}>
        <EmberGrid />
      </Reveal>
    </section>
  );
}
