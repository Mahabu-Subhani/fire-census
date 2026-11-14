// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Sticky top bar: name, the two views, the Raw / Harmonized switch, theme.
import { ChecksBadge } from "../evidence/ChecksBadge";
import { useSelection, useSelectionActions, type View } from "../selection";
import { useTheme } from "../theme";

const VIEWS: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "research", label: "Data" },
];

function Logo() {
  // Three rising dots: an ember, and the dot calendar in miniature.
  return (
    <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="17" r="2.6" fill="var(--accent)" opacity="0.55" />
      <circle cx="12" cy="12.5" r="3.4" fill="var(--accent)" opacity="0.8" />
      <circle cx="18" cy="7" r="4.2" fill="var(--accent)" />
    </svg>
  );
}

export default function TopBar() {
  const { mode } = useSelection();
  const { setMode, view, setView } = useSelectionActions();
  const { theme, toggle } = useTheme();
  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="./" aria-label="Fire Census, home">
          <Logo />
          <span>Fire Census</span>
        </a>
        <nav className="tabs" aria-label="View">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className="tab" aria-current={view === v.id ? "page" : undefined} onClick={() => go(v.id)}>
              {v.label}
            </button>
          ))}
        </nav>
        <div className="topbar-tools">
          {view === "research" && <ChecksBadge />}
          <div className="seg" role="group" aria-label="Record shown">
            {(["harmonized", "raw"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
                title={m === "harmonized" ? "Comparable across all years" : "As reported; jumps in 2012 when VIIRS starts"}>
                {m === "harmonized" ? "Harmonized" : "Raw"}
              </button>
            ))}
          </div>
          <button type="button" className="icon-button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
