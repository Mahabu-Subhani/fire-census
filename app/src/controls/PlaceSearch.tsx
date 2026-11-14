// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Search a district by name: the fastest way for a manager to pick an area
// (docs/APP_VISION.md, Q9). A combobox: type, use the arrow keys, press Enter.
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { loadDistricts } from "../data/load";
import { searchPlaces, type District } from "../data/places";
import { useSelection, useSelectionActions } from "../selection";

export default function PlaceSearch() {
  const { region, place } = useSelection();
  const { setPolygon } = useSelectionActions();
  const [districts, setDistricts] = useState<District[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [chosen, setChosen] = useState<District | null>(null);
  const listId = useId();

  useEffect(() => {
    setDistricts([]);
    setQuery("");
    setChosen(null);
    if (region) loadDistricts(region.id).then(setDistricts);
  }, [region]);

  if (!region || districts.length === 0) return null;

  const matches = searchPlaces(districts, query);
  const choose = (d: District) => {
    setPolygon(d.ring, d.label);
    setChosen(d);
    setQuery(d.label);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && matches.length > 0;
  const current = chosen && place === chosen.label ? chosen : null;

  return (
    <div className="place-search">
      <label htmlFor={`${listId}-input`}>Find a district</label>
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        placeholder={region.id === "punjab-haryana" ? "For example Ludhiana" : "For example Calamuchita"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
      />
      {showList && (
        <ul id={listId} role="listbox" className="place-list">
          {matches.map((d, i) => (
            <li
              key={d.label}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(d)}
            >
              {d.label}
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() !== "" && matches.length === 0 && (
        <p className="note">No district by that name in {region.name}. Only the processed regions are searchable.</p>
      )}
      {current?.partly_outside && (
        <p className="note">Part of {current.name} lies outside the processed region; only the part inside is counted.</p>
      )}
      <p className="fine-print">
        District outlines: geoBoundaries ({[...new Set(districts.map((d) => d.licence))].join(", ")}), simplified. Shown
        only to choose an area; they imply no position on any boundary.
      </p>
    </div>
  );
}
