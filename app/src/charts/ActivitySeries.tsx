// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Placeholder. This folder belongs to Person C (Charulekha): replace freely.
import { useSelection } from "../selection";

export default function ActivitySeries() {
  const { status, rows } = useSelection();
  return (
    <div className="placeholder">
      <strong>ActivitySeries</strong>
      <span>
        {status}, {rows.length.toLocaleString()} rows
      </span>
    </div>
  );
}
