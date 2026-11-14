# AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
"""Who lives near the fires? People per square of the fire record, for the app.

Population: WorldPop 2020, 1 km (30 arc-second), UN-adjusted (CC-BY-4.0). One
GeoTIFF per country, downloaded once to a folder outside git:
    https://data.worldpop.org/GIS/Population/Global_2000_2020_1km_UNadj/2020/IND/ind_ppp_2020_1km_Aggregated_UNadj.tif
    https://data.worldpop.org/GIS/Population/Global_2000_2020_1km_UNadj/2020/ARG/arg_ppp_2020_1km_Aggregated_UNadj.tif

Writes app/public/data/<region>/population.json (contract in
docs/ARCHITECTURE.md): people per 0.1 degree square, the grid of cube.json.
Each 1 km population pixel counts whole in the square holding its centre.
The app adds up the squares with fire in the area and dates shown, so the
number follows the user's selection and the Raw / Harmonized switch
(app/src/charts/population.ts).

Why squares and not a buffer around each 1 km fire cell: a buffer is a
footprint, and footprints are not harmonized. VIIRS's 375 m pixels spread the
same fires over more 1 km cells than MODIS does, so a 5 km buffer jumped by
about 60 % in Punjab in 2012 with the harmonized class alone. Counting
squares that pass a harmonized activity threshold does not jump (decision 44).

Run from the repo root (needs numpy and Pillow):
    python -I app/scripts/make_population.py <folder with the .tif files> [region ...]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

DATA = Path(__file__).resolve().parents[1] / "public" / "data"
COUNTRY = {"punjab-haryana": "ind", "karnataka-south": "ind", "cordoba": "arg", "chilecito": "arg"}
SOURCE = ("WorldPop 2020, 1 km, UN-adjusted (Global_2000_2020_1km_UNadj), "
          "https://www.worldpop.org, CC-BY-4.0")

Image.MAX_IMAGE_PIXELS = None


def read_worldpop(path: Path):
    """Population array (rows north to south), its west and north edges, and the pixel size in degrees."""
    im = Image.open(path)
    scale = im.tag_v2[33550]  # GeoTIFF ModelPixelScale
    tie = im.tag_v2[33922]    # GeoTIFF ModelTiepoint: pixel (0, 0) at (lon, lat)
    a = np.array(im, dtype=np.float64)
    a[~np.isfinite(a) | (a < 0)] = 0.0  # nodata is -99999
    return a, float(tie[3]), float(tie[4]), float(scale[0])


def snap(bbox, step):
    """The region box widened to whole squares, so square centres match cube.json (multiples of step plus half)."""
    w, s, e, n = bbox
    k = 1e-9
    return (math.floor(w / step + k) * step, math.floor(s / step + k) * step,
            math.ceil(e / step - k) * step, math.ceil(n / step - k) * step)


def inside(lon, lat, rings):
    """Boolean mask [lat, lon]: pixel centres inside any ring (even-odd ray casting), as the pipeline clips."""
    X, Y = np.meshgrid(lon, lat)
    out = np.zeros(X.shape, dtype=bool)
    for ring in rings:
        xs = np.array([p[0] for p in ring])
        ys = np.array([p[1] for p in ring])
        xj, yj = np.roll(xs, 1), np.roll(ys, 1)
        hit = np.zeros(X.shape, dtype=bool)
        for x1, y1, x2, y2 in zip(xs, ys, xj, yj):
            if y1 == y2:
                continue
            crosses = ((y1 > Y) != (y2 > Y)) & (X < (x2 - x1) * (Y - y1) / (y2 - y1) + x1)
            hit ^= crosses
        out |= hit
    return out


def grid_population(pop, west0, north0, px, bbox, step, outline=None):
    """Population summed into a step-degree grid over the snapped box: (array [row south to north, column west to east], snapped box).

    With an outline, only 1 km pixels whose centre is inside it count.
    """
    w, s, e, n = snap(bbox, step)
    nx, ny = round((e - w) / step), round((n - s) / step)
    c0 = max(0, math.floor((w - west0) / px))
    c1 = min(pop.shape[1], math.ceil((e - west0) / px))
    r0 = max(0, math.floor((north0 - n) / px))
    r1 = min(pop.shape[0], math.ceil((north0 - s) / px))
    sub = pop[r0:r1, c0:c1]
    lon = west0 + (np.arange(c0, c1) + 0.5) * px
    lat = north0 - (np.arange(r0, r1) + 0.5) * px
    if outline:
        sub = np.where(inside(lon, lat, outline), sub, 0.0)
    ix = np.floor((lon - w) / step + 1e-9).astype(int)
    iy = np.floor((lat - s) / step + 1e-9).astype(int)
    ok_x, ok_y = (ix >= 0) & (ix < nx), (iy >= 0) & (iy < ny)
    sub = sub[np.ix_(ok_y, ok_x)]
    flat = (iy[ok_y][:, None] * nx + ix[ok_x][None, :]).ravel()
    return np.bincount(flat, weights=sub.ravel(), minlength=nx * ny).reshape(ny, nx), (w, s, e, n)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    only = set(sys.argv[2:])
    regions = json.loads((DATA / "regions.json").read_text(encoding="utf-8"))
    cache = {}
    for reg in regions:
        rid = reg["id"]
        if (only and rid not in only) or rid not in COUNTRY:
            continue
        iso = COUNTRY[rid]
        if iso not in cache:
            cache[iso] = read_worldpop(folder / f"{iso}_ppp_2020_1km_Aggregated_UNadj.tif")
        pop, west0, north0, px = cache[iso]
        bbox, step = reg["bbox"], reg["cell_deg"]
        # Areas clipped to an exact outline (Punjab and Haryana) count only the people inside it.
        grid, box = grid_population(pop, west0, north0, px, bbox, step, reg.get("outline"))
        squares = [[round(box[0] + (ix + 0.5) * step, 2), round(box[1] + (iy + 0.5) * step, 2), int(round(grid[iy, ix]))]
                   for iy in range(grid.shape[0]) for ix in range(grid.shape[1]) if grid[iy, ix] >= 0.5]
        doc = {
            "source": SOURCE,
            "population_year": 2020,
            "square_deg": step,
            "method": (f"People per {step} degree square (the cube.json grid), from the 1 km WorldPop map: each "
                       "population pixel counts whole in the square holding its centre"
                       + (", and only pixels whose centre is inside the area's exact outline count" if reg.get("outline") else "")
                       + ". The 2020 map is used for "
                       "every year, so changes over time show where fires burned, not population change."),
            "region_population": int(round(grid.sum())),
            "squares": squares,
        }
        (DATA / rid / "population.json").write_text(json.dumps(doc, separators=(",", ":")), encoding="utf-8")
        print(f"{rid}: {doc['region_population']:,} people in the box, {len(squares)} squares", flush=True)


if __name__ == "__main__":
    main()
