// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The interface between the app shell (Person B) and the charts (Person C).
// Charts call useSelection() and never load files themselves.
// Controls call useSelectionActions(). See docs/ARCHITECTURE.md, "Inside the app".
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadCube, loadMeta, loadRegions } from "../data/load";
import { bboxToPolygon, overlapsBBox, polygonAreaKm2, selectCells } from "../data/select";
import type { CubeRow, Meta, Mode, Polygon, Region, Selection } from "../data/types";

export type { CubeRow, Meta, Mode, Polygon, Region, Selection } from "../data/types";

export interface SelectionActions {
  regions: Region[];
  /** The drawn area, or null for the whole region. */
  polygon: Polygon | null;
  error: string | null;
  setRegion: (id: string) => void;
  setPolygon: (polygon: Polygon | null, place?: string | null) => void;
  setRange: (from: string, to: string) => void;
  setMode: (mode: Mode) => void;
  setShowSmall: (show: boolean) => void;
}

const SelectionContext = createContext<Selection | null>(null);
const ActionsContext = createContext<SelectionActions | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [cube, setCube] = useState<CubeRow[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [polygon, setPolygonState] = useState<Polygon | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<Mode>("harmonized");
  const [showSmall, setShowSmall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegions()
      .then((list) => {
        setRegions(list);
        if (list.length > 0) setRegionId(list[0].id);
        else setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const region = regions.find((r) => r.id === regionId) ?? null;

  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCube(null);
    setMeta(null);
    setPolygonState(null);
    setPlace(null);
    setFrom(region.first_month);
    setTo(region.last_month);
    Promise.all([loadCube(region.id), loadMeta(region.id)])
      .then(([c, m]) => {
        if (cancelled) return;
        setCube(c);
        setMeta(m);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [region]);

  const rows = useMemo(
    () => (cube && from && to ? selectCells(cube, polygon, from, to) : []),
    [cube, polygon, from, to],
  );

  const outside = polygon !== null && region !== null && !overlapsBBox(polygon, region.bbox);

  const selection: Selection = {
    region,
    meta,
    rows,
    from,
    to,
    mode,
    showSmall,
    status: error ? "error" : loading ? "loading" : !cube ? "idle" : outside || rows.length === 0 ? "empty" : "ready",
    areaKm2: polygon ? polygonAreaKm2(polygon) : region ? polygonAreaKm2(bboxToPolygon(region.bbox)) : null,
    place,
    dataThrough: meta?.data_through ?? null,
  };

  const actions: SelectionActions = {
    regions,
    polygon,
    error,
    setRegion: setRegionId,
    setPolygon: (p, name = null) => {
      setPolygonState(p);
      setPlace(p ? name : null);
    },
    setRange: (f, t) => {
      setFrom(f);
      setTo(t);
    },
    setMode,
    setShowSmall,
  };

  return (
    <ActionsContext.Provider value={actions}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
    </ActionsContext.Provider>
  );
}

/** For charts: everything about the current view. */
export function useSelection(): Selection {
  const selection = useContext(SelectionContext);
  if (!selection) throw new Error("useSelection() must be used inside <SelectionProvider>");
  return selection;
}

/** For the shell's controls only. Charts should not change the selection. */
export function useSelectionActions(): SelectionActions {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error("useSelectionActions() must be used inside <SelectionProvider>");
  return actions;
}
