# AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
# Builds app/public/data/<region>/districts.json from geoBoundaries ADM2 files.
# Usage: python -I make_districts.py <downloads dir> <repo root>
import json
import math
import sys
from pathlib import Path

downloads, repo = Path(sys.argv[1]), Path(sys.argv[2])
regions = json.loads((repo / "app/public/data/regions.json").read_text(encoding="utf-8"))

SOURCES = {
    "IND": ("India", "geoBoundaries gbOpen IND ADM2 (2021; Pathways Data Pvt. Ltd., lgdirectory.gov.in)", "ODbL 1.0"),
    "PAK": ("Pakistan", "geoBoundaries gbOpen PAK ADM2 (2019; geoBoundaries, Wikipedia)", "Public Domain"),
    "ARG": ("Argentina", "geoBoundaries gbOpen ARG ADM2 (2020; Instituto Geografico Nacional, UNHCR, OCHA ROLAC)", "CC BY 3.0 IGO"),
}
COUNTRIES_FOR = {"punjab-haryana": ["IND", "PAK"], "cordoba": ["ARG"], "chilecito": ["ARG"], "karnataka-south": ["IND"]}
# Spelling errors in the source, corrected here and listed in docs/REFERENCES.md.
CORRECTIONS = {"La Roja": "La Rioja"}
TOLERANCE = 0.002  # degrees, about 200 m


def ring_area(ring):
    """Planar area in degrees squared, with cos(latitude) scaling; enough to rank rings."""
    if len(ring) < 3:
        return 0.0
    k = math.cos(math.radians(sum(p[1] for p in ring) / len(ring)))
    s = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        s += x1 * k * y2 - x2 * k * y1
    return abs(s) / 2


def simplify(points, tol):
    """Douglas-Peucker on an open polyline, iterative."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = points[a], points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-12
        best, idx = 0.0, None
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / norm
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def outer_rings(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"][0]]
    if geometry["type"] == "MultiPolygon":
        return [poly[0] for poly in geometry["coordinates"]]
    return []


def bbox_of(ring):
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    return [min(xs), min(ys), max(xs), max(ys)]


def overlaps(a, b):
    return a[0] <= b[2] and a[2] >= b[0] and a[1] <= b[3] and a[3] >= b[1]


def inside(a, b):
    return a[0] >= b[0] and a[1] >= b[1] and a[2] <= b[2] and a[3] <= b[3]


def point_in(x, y, ring):
    inside_ = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][:2]
        xj, yj = ring[j][:2]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside_ = not inside_
        j = i
    return inside_


def inner_point(ring):
    """A point inside the ring: the vertex mean if it is inside, else the first inside midpoint of a chord."""
    cx, cy = sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)
    if point_in(cx, cy, ring):
        return cx, cy
    for i in range(0, len(ring), max(1, len(ring) // 40)):
        for j in range(i + 2, len(ring), max(1, len(ring) // 40)):
            mx, my = (ring[i][0] + ring[j][0]) / 2, (ring[i][1] + ring[j][1]) / 2
            if point_in(mx, my, ring):
                return mx, my
    return cx, cy


provinces = {}
for c in SOURCES:
    adm1 = json.loads((downloads / f"{c}-ADM1.geojson").read_text(encoding="utf-8"))["features"]
    provinces[c] = [(CORRECTIONS.get(f["properties"].get("shapeName", "").strip(), f["properties"].get("shapeName", "").strip()), outer_rings(f["geometry"])) for f in adm1]


def province_of(code, ring):
    x, y = inner_point(ring)
    for name, rings in provinces[code]:
        if any(point_in(x, y, r) for r in rings):
            return name
    return None


features = {c: json.loads((downloads / f"{c}-ADM2.geojson").read_text(encoding="utf-8"))["features"] for c in SOURCES}

for region in regions:
    rb = region["bbox"]
    out = []
    for code in COUNTRIES_FOR[region["id"]]:
        country, source, licence = SOURCES[code]
        for f in features[code]:
            rings = outer_rings(f["geometry"])
            if not rings:
                continue
            ring = max(rings, key=ring_area)
            if ring[0] == ring[-1]:
                ring = ring[:-1]
            box = bbox_of(ring)
            if not overlaps(box, rb):
                continue
            # A closed ring has equal end points, which Douglas-Peucker cannot use:
            # split it at the point farthest from the start and simplify each half.
            far = max(range(len(ring)), key=lambda i: math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]))
            small = simplify(ring[: far + 1], TOLERANCE)[:-1] + simplify(ring[far:] + [ring[0]], TOLERANCE)[:-1]
            if len(small) < 3:
                continue
            out.append({
                "name": f["properties"].get("shapeName", "").strip() or "Unnamed",
                "province": province_of(code, ring),
                "country": country,
                "ring": [[round(x, 4), round(y, 4)] for x, y in small],
                "bbox": [round(v, 4) for v in box],
                "partly_outside": not inside(box, rb),
                "parts_dropped": len(rings) - 1,
                "source": source,
                "licence": licence,
            })
    # Unique labels: add the country, and a number if a name repeats.
    seen = {}
    for d in sorted(out, key=lambda d: (d["name"], d["province"] or "", d["country"])):
        key = (d["name"], d["province"], d["country"])
        seen[key] = seen.get(key, 0) + 1
        middle = f', {d["province"]}' if d["province"] else ""
        d["label"] = f'{d["name"]}{middle}, {d["country"]}' + (f' ({seen[key]})' if seen[key] > 1 else "")
    out.sort(key=lambda d: d["label"])
    path = repo / "app/public/data" / region["id"] / "districts.json"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    dropped = sum(d["parts_dropped"] for d in out)
    print(f'{region["id"]}: {len(out)} districts, {sum(d["partly_outside"] for d in out)} partly outside, '
          f'{dropped} extra polygon parts dropped, {path.stat().st_size // 1024} KB')
