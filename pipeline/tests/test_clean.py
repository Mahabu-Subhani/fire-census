"""Data checks on the cleaned tables.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Run from the repo root: python -m pytest pipeline/tests -q
"""

import json
import sys
from pathlib import Path

import duckdb
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import AREAS, WORK  # noqa: E402

FIRST_DATE = {"Terra": "2000-11-01", "Aqua": "2002-07-01", "S-NPP": "2012-01-20",
              "NOAA-20": "2018-04-01", "NOAA-21": "2023-03-01"}
con = duckdb.connect()


@pytest.fixture(scope="module")
def report():
    return {r["area"]: r for r in json.loads((WORK / "clean_report.json").read_text(encoding="utf-8"))}


@pytest.mark.parametrize("area", list(AREAS))
def test_rows_conserved(area, report):
    r = report[area]
    removed = (r.get("removed_outside_outline", 0) + r["removed_exact_duplicates"] + r["removed_non_vegetation_standard"]
               + r["removed_nrt_in_static_cells"] + r["removed_low_confidence"])
    assert r["rows_out"] + removed == r["rows_in_box"]
    n = con.execute(f"select count(*) from '{(WORK / (area + '.parquet')).as_posix()}'").fetchone()[0]
    assert n == r["rows_out"]


@pytest.mark.parametrize("area", list(AREAS))
def test_inside_box_and_no_missing(area):
    _, west, south, east, north, _ = AREAS[area]
    src = (WORK / f"{area}.parquet").as_posix()
    bad = con.execute(f"""select count(*) from '{src}' where lon < {west} or lon >= {east}
        or lat < {south} or lat >= {north} or lat is null or lon is null or acq_date is null
        or satellite is null or frp is null or daynight not in ('D', 'N')""").fetchone()[0]
    assert bad == 0


@pytest.mark.parametrize("area", list(AREAS))
def test_mission_dates_and_filters(area):
    src = (WORK / f"{area}.parquet").as_posix()
    for sat, first in con.execute(f"select satellite, min(acq_date)::varchar from '{src}' group by 1").fetchall():
        assert first >= FIRST_DATE[sat], f"{sat} has data before its mission start"
    assert con.execute(f"select count(*) from '{src}' where confidence_class = 'low'").fetchone()[0] == 0
    assert con.execute(f"select count(*) from '{src}' where not is_nrt and type <> 0").fetchone()[0] == 0


@pytest.mark.parametrize("area", list(AREAS))
def test_pixel_sizes_plausible(area):
    src = (WORK / f"{area}.parquet").as_posix()
    for sensor, lo, hi in con.execute(
            f"select sensor, min(scan), max(scan) from '{src}' group by 1").fetchall():
        if sensor == "MODIS":
            assert 0.9 <= lo and hi <= 5.0
        else:
            assert 0.3 <= lo and hi <= 0.85


def test_outline_areas_are_clipped():
    """Areas with an exact outline keep only detections whose 1 km cell centre is inside it."""
    from config import area_cells
    for area in AREAS:
        cells = area_cells(area)
        if cells is None:
            continue
        con.register("oc", cells)
        src = (WORK / f"{area}.parquet").as_posix()
        outside = con.execute(f"select count(*) from '{src}' t anti join oc using (cx, cy)").fetchone()[0]
        assert outside == 0
