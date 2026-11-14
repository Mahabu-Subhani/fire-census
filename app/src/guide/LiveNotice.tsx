// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Says plainly what the app is and is not, at the top of the page. An
// emergency responder must never mistake this record for a live alert.
import { useSelection, useSelectionActions } from "../selection";
import { firmsLiveUrl, ringBBox } from "./links";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export default function LiveNotice() {
  const { region, dataThrough } = useSelection();
  const { polygon } = useSelectionActions();
  if (!region) return null;
  const bbox = polygon ? ringBBox(polygon) : region.bbox;
  return (
    <aside className="live-notice" aria-label="About this record">
      <p>
        <strong>A record of past fire activity{dataThrough ? `, up to ${formatDate(dataThrough)}` : ""}.</strong> It
        is not a live alert service. For fires burning now, see{" "}
        <a href={firmsLiveUrl(bbox)} target="_blank" rel="noopener noreferrer">
          NASA's live fire map for this area
        </a>{" "}
        and follow your local fire and emergency services.
      </p>
    </aside>
  );
}
