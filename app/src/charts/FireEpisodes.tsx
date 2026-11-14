// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// "How does this fire compare with earlier ones?" The most recent fire
// episodes with their rank among all episodes since 2002, and the largest on
// record. Every number comes from <region>/episodes.json (pipeline/stretch.py).
// Whole region only: the file is computed for the whole region.
import type { Episode } from "../data/types";
import { useSelection } from "../selection";
import { fmtValue } from "../stats";
import ChartFrame from "./ChartFrame";

const num = (v: number) => fmtValue(v, "harmonized");
const whole = (v: number) => v.toLocaleString("en-GB");

function day(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function episodeDates(e: Episode): string {
  return e.start === e.end ? day(e.start) : `${day(e.start)} to ${day(e.end)}`;
}

function Rows({ list, count, mark }: { list: Episode[]; count: number; mark?: Episode }) {
  return (
    <div className="ev-table-wrap">
      <table className="ev-table ep-table">
        <thead>
          <tr><th>Dates</th><th>Days</th><th>Total</th><th>Busiest day</th><th>Rank by total</th><th>Record</th></tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.start} className={mark && e.start === mark.start ? "ep-mark" : undefined}>
              <td>{episodeDates(e)}</td>
              <td>{whole(e.days)}</td>
              <td>{num(e.total)}</td>
              <td>{num(e.peak)} on {day(e.peak_day)}</td>
              <td>{whole(e.rank_total)} of {whole(count)}</td>
              <td>{e.sensor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FireEpisodes() {
  const { episodes } = useSelection();
  if (!episodes || episodes.count === 0) return null;
  const latest = [...episodes.latest].reverse();
  const largest = episodes.largest.slice(0, 5);
  // The most notable recent episode: the best-ranked of the latest ones.
  const notable = latest.reduce<Episode | undefined>((best, e) => (!best || e.rank_total < best.rank_total ? e : best), undefined);
  const sentence = notable
    ? `The largest recent episode, ${episodeDates(notable)}, ranks ${whole(notable.rank_total)} of ${whole(episodes.count)} since July 2002.`
    : "";

  return (
    <ChartFrame
      title="Fire episodes"
      mode="harmonized"
      exportName="episodes"
      notes={[sentence, episodes.definition]}
      table={() => ({
        columns: ["list", "start", "end", "days", "total", "peak", "peak_day", "rank_total", "rank_peak", "of", "sensor"],
        rows: [
          ...latest.map((e) => ["latest", e.start, e.end, e.days, e.total, e.peak, e.peak_day, e.rank_total, e.rank_peak, episodes.count, e.sensor]),
          ...episodes.largest.map((e) => ["largest", e.start, e.end, e.days, e.total, e.peak, e.peak_day, e.rank_total, e.rank_peak, episodes.count, e.sensor]),
        ],
        notes: [episodes.definition],
      })}
    >
      {sentence && <p className="status-sentence" style={{ fontSize: "1rem" }}>{sentence}</p>}
      <h3 className="ep-head">Most recent</h3>
      <Rows list={latest} count={episodes.count} mark={notable} />
      <h3 className="ep-head">Largest on record</h3>
      <Rows list={largest} count={episodes.count} />
      <p className="status-detail">{episodes.definition} Whole region, whatever area is drawn.</p>
    </ChartFrame>
  );
}
