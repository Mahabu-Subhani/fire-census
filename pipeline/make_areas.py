"""Exact outlines for areas named after administrative units.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

The Punjab and Haryana box (73.8 to 77.6 E, 27.6 to 32.6 N) was only 46
percent Punjab, Haryana and Chandigarh; the rest was Rajasthan, Himachal
Pradesh, Uttar Pradesh, Delhi, Jammu and Kashmir, and 9.5 percent Pakistani
Punjab, for which we have no data (the FIRMS request was for India). This
script builds the outline of the three Indian units from the geoBoundaries
district outlines already in the app (app/public/data/punjab-haryana/
districts.json; geoBoundaries gbOpen IND ADM2, ODbL 1.0), and writes it as
pipeline/areas/punjab-haryana.json with its area in km².

Run: python pipeline/make_areas.py
"""

import json
import unicodedata

from pyproj import Geod
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.ops import unary_union

from config import APP_DATA, REPO

UNITS = {"punjab-haryana": {("India", "Punjab"), ("India", "Haryana"), ("India", "Chandigarh")}}
OUT = REPO / "pipeline" / "areas"


def plain(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def main() -> None:
    OUT.mkdir(exist_ok=True)
    geod = Geod(ellps="WGS84")
    for area, units in UNITS.items():
        districts = json.loads((APP_DATA / area / "districts.json").read_text(encoding="utf-8"))
        parts = [Polygon(d["ring"]).buffer(0) for d in districts if (d["country"], plain(d["province"])) in units]
        shape = unary_union(parts).buffer(0.002).buffer(-0.002)        # close slivers between districts
        shape = shape.simplify(0.005, preserve_topology=True)          # about 500 m
        polys = list(shape.geoms) if isinstance(shape, MultiPolygon) else [shape]
        polys = [p for p in polys if p.area > 1e-4]
        area_km2 = sum(abs(geod.geometry_area_perimeter(p)[0]) for p in polys) / 1e6
        rings = [[[round(x, 4), round(y, 4)] for x, y in list(p.exterior.coords)[:-1]] for p in polys]
        west, south, east, north = unary_union(polys).bounds
        out = {"area": area, "units": sorted(f"{c}: {p}" for c, p in units), "area_km2": round(area_km2, 2),
               "bbox": [round(west, 3), round(south, 3), round(east, 3), round(north, 3)],
               "outline": rings, "source": "geoBoundaries gbOpen IND ADM2 (via districts.json), ODbL 1.0",
               "geometry": mapping(MultiPolygon(polys))}
        (OUT / f"{area}.json").write_text(json.dumps(out), encoding="utf-8")
        print(f"{area}: {len(districts)} districts read, {len(parts)} used, {len(polys)} polygon(s), "
              f"{sum(len(r) for r in rings)} points, {area_km2:,.0f} km2, bbox {out['bbox']}")


if __name__ == "__main__":
    main()
