// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The check summary in the top bar. Kept apart from the evidence panel so the
// first screen does not have to load the chart library.
import { useSelection } from "../selection";
import { summarizeChecks } from "./checks";

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
