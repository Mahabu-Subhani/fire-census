// AI-assisted: written with help from Claude (Anthropic). Reviewed by Mahabu Subhani (pending).
// The question bar on a page of its own (decision 55): type a place and a
// time in plain words, see the understood parts coloured as you type, press
// Enter and the overview opens on exactly that. The reading is done by fixed
// rules in parse.ts; nothing is sent anywhere and nothing is answered here.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { loadDistricts } from "../data/load";
import { useSelection, useSelectionActions } from "../selection";
import { EMPTY, parseQuery, type AskPlace, type Parsed } from "./parse";
import "./ask.css";

const KIND_NAME = { place: "Where", date: "When", option: "Show" } as const;

/** The typed text again, with the understood parts wrapped so they can be coloured. */
function marked(text: string, parsed: Parsed): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  for (const t of parsed.tokens) {
    if (t.start > at) out.push(text.slice(at, t.start));
    out.push(<mark key={t.start} className={`ask-${t.kind}`}>{text.slice(t.start, t.end)}</mark>);
    at = t.end;
  }
  out.push(text.slice(at));
  return out;
}

export default function AskLanding() {
  const { region } = useSelection();
  const { regions, apply } = useSelectionActions();
  const [text, setText] = useState("");
  const [places, setPlaces] = useState<AskPlace[]>([]);
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mirror = useRef<HTMLDivElement>(null);

  // District names of every processed region, so any of them can be typed.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      regions.map((r) => loadDistricts(r.id).then((list) => list.map((d) => ({ regionId: r.id, name: d.name, label: d.label, ring: d.ring })))),
    ).then((lists) => !cancelled && setPlaces(lists.flat()));
    return () => {
      cancelled = true;
    };
  }, [regions]);

  const parsed = useMemo(
    () => (regions.length ? parseQuery(text, { regions, places, currentRegionId: region?.id ?? null }) : EMPTY),
    [text, regions, places, region],
  );

  // The coloured copy sits exactly under the transparent input text.
  const sync = () => {
    if (mirror.current && input.current) mirror.current.scrollLeft = input.current.scrollLeft;
  };
  useLayoutEffect(sync, [text]);
  useEffect(() => input.current?.focus(), []);

  const go = (e: FormEvent) => {
    e.preventDefault();
    if (parsed.tokens.length === 0 || parsed.problem) {
      setTried(true);
      return;
    }
    apply({
      regionId: parsed.regionId ?? undefined,
      polygon: parsed.place ? parsed.place.ring : parsed.wholeRegion ? null : undefined,
      place: parsed.place?.label,
      from: parsed.from ?? undefined,
      to: parsed.to ?? undefined,
      mode: parsed.mode ?? undefined,
      small: parsed.small ? true : undefined,
      view: parsed.research ? "research" : "overview",
    });
    window.scrollTo({ top: 0 });
  };

  const examples = useMemo(() => {
    // Well-known districts when they are there; otherwise whatever the data has.
    const pick = (name: string, n: number) => places.find((p) => p.name === name)?.name ?? places.find((p) => p.regionId === regions[n]?.id)?.name;
    const a = pick("Ludhiana", 0);
    const b = pick("Calamuchita", 1);
    return [
      a && `${a} this month`,
      b && `${b} from 2015 to 2020`,
      a && `${a} October 2023 raw`,
      "last 10 years",
    ].filter((x): x is string => Boolean(x));
  }, [places, regions]);

  const ready = parsed.tokens.length > 0 && !parsed.problem;
  // A problem with what is typed shows at once when it names something we do
  // not have; "nothing found" waits for Enter, so it does not nag mid-word.
  const problem = parsed.problem && (tried || parsed.tokens.length > 0 || /not in the processed/.test(parsed.problem)) ? parsed.problem : null;

  return (
    <main className="ask" id="explore">
      <h1>Where and when?</h1>
      <p className="ask-sub">Type a district or region and a time. The parts that are understood change colour.</p>
      <form className="ask-form" onSubmit={go} role="search">
        <div className="ask-field">
          <div className="ask-mirror" ref={mirror} aria-hidden="true">{marked(text, parsed)}</div>
          <input
            ref={input}
            className="ask-input"
            type="text"
            inputMode="search"
            enterKeyHint="go"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Place and time"
            aria-describedby="ask-read"
            placeholder={examples[0] ? `For example: ${examples[0]}` : "A district and a time"}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setTried(false);
            }}
            onScroll={sync}
            onKeyUp={sync}
            onSelect={sync}
          />
        </div>
        <button type="submit" className="btn btn-primary ask-go" disabled={!ready} aria-label="Show it">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2.5 8 H13 M9 4 L13 8 L9 12" /></svg>
        </button>
      </form>

      <div id="ask-read" className="ask-read" aria-live="polite">
        {parsed.tokens.length > 0 && (
          <ul className="ask-chips">
            {parsed.tokens.map((t) => (
              <li key={t.start} className={`ask-${t.kind}`}>
                <span>{KIND_NAME[t.kind]}</span> {t.label}
              </li>
            ))}
          </ul>
        )}
        {problem && <p className="note error">{problem}</p>}
        {!problem && parsed.note && <p className="note">{parsed.note}</p>}
        {ready && <p className="ask-hint">Press Enter to open it.</p>}
      </div>

      {text === "" && examples.length > 0 && (
        <div className="ask-try">
          <span>Try</span>
          {examples.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setText(x);
                input.current?.focus();
              }}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      <p className="ask-fine">
        This bar matches place names, months and years by fixed rules. It is not an AI model, it sends nothing anywhere,
        and it covers only the {regions.length || ""} processed areas.
      </p>
    </main>
  );
}
