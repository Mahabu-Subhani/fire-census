// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Date range to the month, limited to the region's record. Uses year and
// month menus because <input type="month"> is missing in some browsers.
import { useSelection, useSelectionActions } from "../selection";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthPicker({ label, value, min, max, onChange }: { label: string; value: string; min: string; max: string; onChange: (v: string) => void }) {
  const [year, month] = value.split("-");
  const y0 = Number(min.slice(0, 4));
  const y1 = Number(max.slice(0, 4));
  const years = Array.from({ length: y1 - y0 + 1 }, (_, i) => String(y0 + i));
  const clamp = (v: string) => (v < min ? min : v > max ? max : v);
  return (
    <fieldset className="month-picker">
      <legend>{label}</legend>
      <select aria-label={`${label} month`} value={month} onChange={(e) => onChange(clamp(`${year}-${e.target.value}`))}>
        {MONTHS.map((m, i) => {
          const mm = String(i + 1).padStart(2, "0");
          return <option key={mm} value={mm}>{m}</option>;
        })}
      </select>
      <select aria-label={`${label} year`} value={year} onChange={(e) => onChange(clamp(`${e.target.value}-${month}`))}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </fieldset>
  );
}

export default function DateRange() {
  const { region, from, to } = useSelection();
  const { setRange } = useSelectionActions();
  if (!region || !from || !to) return null;
  const { first_month: min, last_month: max, harmonized_from } = region;
  return (
    <div className="date-range">
      <MonthPicker label="From" value={from} min={min} max={max} onChange={(f) => setRange(f, f > to ? f : to)} />
      <MonthPicker label="To" value={to} min={min} max={max} onChange={(t) => setRange(t < from ? t : from, t)} />
      <div className="range-presets">
        <button type="button" onClick={() => setRange(min, max)}>Whole record</button>
        <button type="button" onClick={() => setRange(harmonized_from, max)}>Harmonized years</button>
        <button type="button" onClick={() => setRange(`${Number(max.slice(0, 4)) - 9}-01`, max)}>Last 10 years</button>
      </div>
    </div>
  );
}
