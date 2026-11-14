# AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
"""Who was watching: per region, year and satellite, how many detections there
were and at what local solar time the daytime pass happened.

Reads the per-year hotspot files Person A publishes
(app/public/data/<region>/hotspots/<YYYY>.csv.gz) and writes
app/public/data/<region>/sources.json (contract in docs/ARCHITECTURE.md).
Every number is counted from those files; nothing is assumed.

Run from the repo root:  python -I app/scripts/make_sources.py
"""
import csv
import gzip
import io
import json
import math
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "public" / "data"
NAMES = {"Terra": "Terra", "T": "Terra", "Aqua": "Aqua", "A": "Aqua", "SNPP": "S-NPP", "N": "S-NPP",
         "N20": "NOAA-20", "N21": "NOAA-21"}
FAMILY = {"Terra": "MODIS", "Aqua": "MODIS", "S-NPP": "VIIRS", "NOAA-20": "VIIRS", "NOAA-21": "VIIRS"}


def local_hours(acq_time: str, lon: float) -> float:
    t = acq_time.strip().zfill(4)
    return (int(t[:2]) + int(t[2:]) / 60 + lon / 15) % 24


def circular_mean(hours: list) -> float:
    s = sum(math.sin(h / 24 * 2 * math.pi) for h in hours)
    c = sum(math.cos(h / 24 * 2 * math.pi) for h in hours)
    return (math.atan2(s, c) / (2 * math.pi) * 24) % 24


def main() -> None:
    for region in sorted(p for p in DATA.iterdir() if (p / "hotspots").is_dir()):
        out = []
        for f in sorted((region / "hotspots").glob("*.csv.gz")):
            n = defaultdict(lambda: {"D": 0, "N": 0})
            day_t = defaultdict(list)
            days = defaultdict(set)
            with gzip.open(f) as raw:
                for row in csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8")):
                    sat = NAMES.get(row["satellite"])
                    if sat is None:
                        raise SystemExit(f"Unknown satellite {row['satellite']!r} in {f}")
                    dn = "N" if row["daynight"] == "N" else "D"
                    n[sat][dn] += 1
                    days[sat].add(row["acq_date"])
                    if dn == "D":
                        day_t[sat].append(local_hours(row["acq_time"], float(row["longitude"])))
            for sat in sorted(n):
                out.append({
                    "year": int(f.name[:4]), "satellite": sat, "family": FAMILY[sat],
                    "day": n[sat]["D"], "night": n[sat]["N"], "days_with_detections": len(days[sat]),
                    "day_local_time": round(circular_mean(day_t[sat]), 2) if day_t[sat] else None,
                })
        doc = {
            "note": "Counted from the hotspot files of this region: every FIRMS detection, before any filter. "
                    "day_local_time is the mean local solar time (hours) of daytime detections.",
            "rows": out,
        }
        (region / "sources.json").write_text(json.dumps(doc, separators=(",", ":")), encoding="utf-8")
        print(region.name, len(out), "rows")


if __name__ == "__main__":
    main()
