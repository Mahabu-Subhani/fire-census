"""Export the app's data files in the contract shape (docs/ARCHITECTURE.md).

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Level L0 export: raw counts are real. `harm` is a PLACEHOLDER equal to the raw
MODIS count and `small` is 0 until harmonize.py replaces them. meta.json says so.

Run: python pipeline/export.py
"""

import json
import subprocess
from datetime import datetime, timezone

import duckdb

from config import APP_DATA, AREAS, DISPLAY_CELL_DEG, HARMONIZED_FROM, REPO, WORK

CHECK_IDS = [
    ("C0", "The raw record shows the 2012 jump", "greater than 0.5"),
    ("C1", "No seam at 2012", "absolute value at most 0.10"),
    ("C1b", "No change point at 2012 (Pettitt)", "no change point with p < 0.05 between Jul 2011 and Dec 2012"),
    ("C2", "No seam at placebo dates (2008, 2016)", "absolute value at most 0.10 at both"),
    ("C3", "Held-out years 2018 to 2019", "median absolute log ratio at most 0.15"),
    ("C4", "NOAA-20 alone reproduces the record", "slope 0.90 to 1.10 and correlation at least 0.90"),
    ("C5", "Curve midpoint is physically plausible", "within a factor of 2 of published limits"),
    ("C6", "Burned-area relationship is stable", "absolute log ratio at most 0.25"),
    ("C7", "Punjab peak moves later after 2009", "at least +5 days, p < 0.05"),
    ("C8", "Curve is stable under resampling", "90% range at most 50% of the midpoint"),
]


def git_commit() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=REPO,
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        return ""


def main() -> None:
    con = duckdb.connect()
    d = DISPLAY_CELL_DEG
    regions = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for area_id, (name, west, south, east, north, _country) in AREAS.items():
        src = (WORK / f"{area_id}.parquet").as_posix()
        rows = con.execute(f"""
            select round((floor(lon / {d}) + 0.5) * {d}, 3) as lon,
                   round((floor(lat / {d}) + 0.5) * {d}, 3) as lat,
                   strftime(acq_date, '%Y-%m') as ym,
                   sum((sensor = 'MODIS')::int) as raw_modis,
                   sum((sensor = 'VIIRS')::int) as raw_viirs
            from '{src}' group by 1, 2, 3 order by 3, 2, 1""").fetchall()
        first, last = con.execute(
            f"select strftime(min(acq_date), '%Y-%m'), strftime(max(acq_date), '%Y-%m') from '{src}'").fetchone()
        cube = [{"lon": lon, "lat": lat, "ym": ym, "raw_modis": int(m), "raw_viirs": int(v),
                 "harm": int(m), "harm_lo": int(m), "harm_hi": int(m), "small": 0,
                 "terra_only": ym < HARMONIZED_FROM}
                for lon, lat, ym, m, v in rows]
        out = APP_DATA / area_id
        out.mkdir(parents=True, exist_ok=True)
        (out / "cube.json").write_text(json.dumps(cube, separators=(",", ":")), encoding="utf-8")
        meta = {
            "level_shipped": "L0",
            "placeholder_note": "harm equals raw MODIS counts until harmonization is exported",
            "floor_mw": {"day": None, "night": None},
            "ladder": [],
            "checks": [{"id": i, "name": n, "value": None, "threshold": t, "verdict": "not run", "note": ""}
                       for i, n, t in CHECK_IDS],
            "curve": {"day": [], "night": []},
            "data_version": "0.1.0",
            "code_commit": git_commit(),
            "generated_at": now,
            "sources": ["MODIS Collection 6.1 (Terra, Aqua), NASA FIRMS archive",
                        "VIIRS 375 m Collection 2 (S-NPP, NOAA-20, NOAA-21), NASA FIRMS archive"],
        }
        (out / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        regions.append({"id": area_id, "name": name, "bbox": [west, south, east, north],
                        "cell_deg": d, "first_month": first, "last_month": last,
                        "harmonized_from": HARMONIZED_FROM})
        size = (out / "cube.json").stat().st_size / 1e6
        print(f"{area_id}: {len(cube):,} rows, cube.json {size:.2f} MB, {first} to {last}")
    (APP_DATA / "regions.json").write_text(json.dumps(regions, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
