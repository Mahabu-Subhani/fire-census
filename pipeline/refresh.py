"""Bring the record up to date with FIRMS near-real-time data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

The archive download ends about a week before it was requested. This script
asks the FIRMS area API for every day after the last date we hold, for each
area's box and each operating satellite, and saves the rows as near-real-time
files that clean.py reads like any other. Then rerun the pipeline from clean.py.

Manual by design: whether data may update itself after the submission deadline
is not yet confirmed (docs/APP_VISION.md, decision 29). Run it before submitting.

Needs FIRMS_MAP_KEY in the repo's .env (python scripts/setup_keys.py).
Run: python pipeline/refresh.py
"""

import csv
import io
import os
import time
import urllib.request
from datetime import date, timedelta

import duckdb

from config import AREAS, RAW, REPO

# S-NPP stopped delivering data on 2 November 2026, so it is not requested.
SOURCES = {"MODIS_NRT": "MODIS", "VIIRS_NOAA20_NRT": "VIIRS", "VIIRS_NOAA21_NRT": "VIIRS"}
API = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/{bbox}/{days}/{start}"


def map_key() -> str:
    for line in (REPO / ".env").read_text(encoding="utf-8").splitlines():
        if line.startswith("FIRMS_MAP_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("FIRMS_MAP_KEY not found in .env; run python scripts/setup_keys.py")


def last_date() -> date:
    """The newest acquisition date in any raw file we hold."""
    con = duckdb.connect()
    files = [p.as_posix() for p in RAW.glob("*/fire_*.csv")]
    q = " union all ".join(f"select max(acq_date::date) d from read_csv('{f}', all_varchar=true)" for f in files)
    return con.execute(f"select max(d) from ({q})").fetchone()[0]


def area_last_date(area: str) -> date:
    """Newest date already fetched for one area: its own API files, else the archive."""
    files = sorted(RAW.glob(f"NRTAPI_*/fire_nrt_api_{area}_*.csv"))
    if not files:
        return last_archive_date()
    name = files[-1].stem.split("_")                       # ..._<area>_<start>_<n>d
    return date.fromisoformat(name[-2]) + timedelta(days=int(name[-1][:-1]) - 1)


def last_archive_date() -> date:
    con = duckdb.connect()
    files = [p.as_posix() for p in RAW.glob("DL_FIRE_*/fire_*.csv")]
    q = " union all ".join(f"select max(acq_date::date) d from read_csv('{f}', all_varchar=true)" for f in files)
    return con.execute(f"select max(d) from ({q})").fetchone()[0]


def main() -> None:
    key = map_key()
    end = date.today() - timedelta(days=1)       # complete days only
    print(f"Fetching each area from the day after its last date, to {end}")
    for area, (_name, west, south, east, north, country) in AREAS.items():
        start = area_last_date(area) + timedelta(days=1)    # each area from its own last date
        if start > end:
            print(f"{area}: up to date")
            continue
        for source, family in SOURCES.items():
            folder = RAW / f"NRTAPI_{country}_{family}_{source}"
            folder.mkdir(parents=True, exist_ok=True)
            day, n = start, 0
            while day <= end:
                days = min(5, (end - day).days + 1)           # the API allows 1 to 5 days per call ("Expects [1..5]")
                url = API.format(key=key, source=source, bbox=f"{west},{south},{east},{north}",
                                 days=days, start=day.isoformat())
                text = urllib.request.urlopen(url, timeout=120).read().decode("utf-8")
                rows = list(csv.reader(io.StringIO(text)))
                if not rows or "latitude" not in rows[0]:
                    raise SystemExit(f"Unexpected answer from FIRMS for {source}: {text[:200]}")
                out = folder / f"fire_nrt_api_{area}_{day.isoformat()}_{days}d.csv"
                out.write_text(text, encoding="utf-8")
                n += len(rows) - 1
                day += timedelta(days=days)
                time.sleep(1)                                 # stay well inside the API's rate limit
            print(f"{area} {source}: {n} detections")


if __name__ == "__main__":
    main()
