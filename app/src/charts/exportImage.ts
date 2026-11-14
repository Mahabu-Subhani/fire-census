// AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending).
// SVG and PNG export of a chart: its Plot figures stacked under the title,
// unit and area lines, with notes and the source underneath. Theme colours
// (CSS variables) are resolved, so the file looks the same outside the app.

const SVG_NS = "http://www.w3.org/2000/svg";
const PAINT = ["fill", "stroke", "color", "stop-color"] as const;

/** Copy resolved colours from the live chart into its clone. */
function resolveColours(live: Element, clone: Element): void {
  const a = [live, ...live.querySelectorAll("*")];
  const b = [clone, ...clone.querySelectorAll("*")];
  a.forEach((el, i) => {
    const target = b[i];
    if (!target) return;
    for (const prop of PAINT) {
      const attr = el.getAttribute(prop);
      if (attr && attr.includes("var(")) {
        target.setAttribute(prop, getComputedStyle(el).getPropertyValue(prop) || attr);
      }
    }
  });
}

function text(x: number, y: number, content: string, size: number, weight = 400, opacity = 1): SVGTextElement {
  const t = document.createElementNS(SVG_NS, "text");
  t.setAttribute("x", String(x));
  t.setAttribute("y", String(y));
  t.setAttribute("font-size", String(size));
  t.setAttribute("font-weight", String(weight));
  t.setAttribute("fill", "currentColor");
  if (opacity < 1) t.setAttribute("fill-opacity", String(opacity));
  t.textContent = content;
  return t;
}

/** Wrap text to about `chars` characters per line. */
function wrap(s: string, chars: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of s.split(/\s+/)) {
    if (line && (line + " " + word).length > chars) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

export function composeSvg(figure: HTMLElement, head: { title: string; lines: string[] }, notes: string[]): string {
  const plots = [...figure.querySelectorAll<SVGSVGElement>(".cf-body svg")].filter((s) =>
    [...s.classList].some((c) => c.startsWith("plot")),
  );
  const pad = 16;
  const width = Math.max(320, ...plots.map((p) => p.getBoundingClientRect().width)) + pad * 2;
  const chars = Math.floor((width - pad * 2) / 6.2);
  const style = getComputedStyle(figure);
  const slot = figure.closest(".slot") ?? figure;
  const bg = getComputedStyle(slot).backgroundColor;

  const root = document.createElementNS(SVG_NS, "svg");
  root.setAttribute("xmlns", SVG_NS);
  root.setAttribute("font-family", "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif");
  root.style.color = style.color;
  const back = document.createElementNS(SVG_NS, "rect");
  back.setAttribute("width", "100%");
  back.setAttribute("height", "100%");
  back.setAttribute("fill", bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#ffffff");
  root.append(back);

  let y = pad + 16;
  root.append(text(pad, y, head.title, 16, 700));
  for (const l of head.lines.flatMap((l) => wrap(l, chars))) {
    y += 17;
    root.append(text(pad, y, l, 12, 400, 0.8));
  }
  y += 12;
  for (const p of plots) {
    const box = p.getBoundingClientRect();
    const clone = p.cloneNode(true) as SVGSVGElement;
    resolveColours(p, clone);
    clone.setAttribute("x", String(pad));
    clone.setAttribute("y", String(y));
    clone.setAttribute("width", String(box.width));
    clone.setAttribute("height", String(box.height));
    root.append(clone);
    y += box.height + 8;
  }
  for (const l of notes.flatMap((n) => wrap(n, chars))) {
    y += 15;
    root.append(text(pad, y, l, 11, 400, 0.8));
  }
  y += pad;
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(y));
  root.setAttribute("viewBox", `0 0 ${width} ${y}`);
  return new XMLSerializer().serializeToString(root);
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveSvg(svg: string, filename: string): void {
  saveBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export async function savePng(svg: string, filename: string, scale = 2): Promise<void> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(img.width * scale);
  canvas.height = Math.ceil(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Could not make the PNG");
  saveBlob(blob, filename);
}
