"""Clean the raw FIRMS files into one table per area.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Steps, each reporting how many rows it removes:
  1. Read every archive (standard) and NRT file with one schema.
  2. Cut out each area by bounding box.
  3. Remove exact duplicate rows.
  4. Standard rows: keep type == 0 (presumed vegetation fire).
     NRT rows have no type field: drop those in cells that the standard data
     marks as persistent non-vegetation sources (static mask).
  5. Drop low-confidence detections (MODIS < 30, VIIRS 'l'); raw value kept.

Run: python pipeline/clean.py     Output: WORK/<area>.parquet and WORK/clean_report.json
"""

import json

import duckdb

from config import AREAS, INTERNAL_CELL_DEG, MODIS_MIN_CONFIDENCE, RAW, REQUESTS, WORK

SAT_NAMES = {"Terra": "Terra", "Aqua": "Aqua", "T": "Terra", "A": "Aqua",
             "SNPP": "S-NPP", "N": "S-NPP", "N20": "NOAA-20", "N21": "NOAA-21"}
STATIC_MIN_DETECTIONS = 3  # non-vegetation standard detections needed to mask a cell


def load_all(con: duckdb.DuckDBPyConnection) -> None:
    """Create table raw_all with a unified schema from every raw file."""
    parts = []
    for folder in sorted(RAW.iterdir()):
        req = folder.name.split("_")[-1]
        country, family, _ = REQUESTS[req]
        for csv in sorted(folder.glob("fire_*.csv")):
            is_nrt = "nrt" in csv.name
            cols = [r[0] for r in con.execute(
                f"describe select * from read_csv('{csv.as_posix()}', all_varchar=true)").fetchall()]
            type_expr = "try_cast(type as integer)" if "type" in cols else "null::integer"
            parts.append(f"""
                select latitude::double as lat, longitude::double as lon,
                       acq_date::date as acq_date, lpad(acq_time, 4, '0') as acq_time,
                       daynight, satellite as satellite_raw, '{family}' as sensor,
                       scan::double as scan, track::double as track, frp::double as frp,
                       confidence as confidence_raw, version, {type_expr} as type,
                       {str(is_nrt).lower()} as is_nrt, '{country}' as country,
                       '{csv.name}' as source_file
                from read_csv('{csv.as_posix()}', all_varchar=true, header=true)""")
    con.execute("create table raw_all as " + " union all by name ".join(parts))

    known = ", ".join(f"('{k}', '{v}')" for k, v in SAT_NAMES.items())
    con.execute(f"create table sat_map as select * from (values {known}) t(satellite_raw, satellite)")
    unknown = con.execute(
        "select distinct satellite_raw from raw_all where satellite_raw not in (select satellite_raw from sat_map)"
    ).fetchall()
    if unknown:
        raise ValueError(f"Unknown satellite codes: {unknown}")


def clean_area(con: duckdb.DuckDBPyConnection, area_id: str) -> dict:
    name, west, south, east, north, country = AREAS[area_id]
    report = {"area": area_id, "name": name}
    cell = INTERNAL_CELL_DEG

    con.execute(f"""
        create or replace temp table a0 as
        select r.* exclude (satellite_raw), m.satellite,
               case when sensor = 'MODIS' then
                        case when try_cast(confidence_raw as integer) < {MODIS_MIN_CONFIDENCE} then 'low'
                             when try_cast(confidence_raw as integer) < 80 then 'nominal' else 'high' end
                    else case confidence_raw when 'l' then 'low' when 'n' then 'nominal'
                                             when 'h' then 'high' end end as confidence_class,
               cast(floor(lon / {cell}) as integer) as cx,
               cast(floor(lat / {cell}) as integer) as cy
        from raw_all r join sat_map m using (satellite_raw)
        where country = '{country}' and lon >= {west} and lon < {east}
          and lat >= {south} and lat < {north}""")
    report["rows_in_box"] = con.execute("select count(*) from a0").fetchone()[0]

    con.execute("create or replace temp table a1 as select distinct * from a0")
    n1 = con.execute("select count(*) from a1").fetchone()[0]
    report["removed_exact_duplicates"] = report["rows_in_box"] - n1

    # Static mask from standard rows: cells with repeated non-vegetation detections.
    con.execute(f"""
        create or replace temp table static_cells as
        select cx, cy from a1 where not is_nrt and type in (1, 2, 3)
        group by 1, 2 having count(*) >= {STATIC_MIN_DETECTIONS}""")
    report["static_cells"] = con.execute("select count(*) from static_cells").fetchone()[0]

    con.execute("""
        create or replace temp table a2 as
        select a1.* from a1 left join static_cells s using (cx, cy)
        where (not is_nrt and type = 0) or (is_nrt and s.cx is null)""")
    n2 = con.execute("select count(*) from a2").fetchone()[0]
    report["removed_non_vegetation_standard"] = con.execute(
        "select count(*) from a1 where not is_nrt and (type is null or type <> 0)").fetchone()[0]
    report["removed_nrt_in_static_cells"] = n1 - n2 - report["removed_non_vegetation_standard"]

    con.execute("create or replace temp table a3 as select * from a2 where confidence_class <> 'low'")
    n3 = con.execute("select count(*) from a3").fetchone()[0]
    report["removed_low_confidence"] = n2 - n3
    report["rows_out"] = n3

    nulls = con.execute(
        "select count(*) from a3 where lat is null or lon is null or acq_date is null "
        "or satellite is null or frp is null or confidence_class is null").fetchone()[0]
    if nulls:
        raise ValueError(f"{area_id}: {nulls} rows with missing required fields")

    report["per_satellite"] = {
        s: {"rows": n, "first": str(d0), "last": str(d1), "nrt_rows": nrt}
        for s, n, d0, d1, nrt in con.execute(
            "select satellite, count(*), min(acq_date), max(acq_date), sum(is_nrt::int) "
            "from a3 group by 1 order by 1").fetchall()}

    # Also keep the unfiltered-by-confidence table for the sensitivity check (decision 8).
    out = WORK / f"{area_id}.parquet"
    con.execute(f"copy (select * from a3 order by acq_date, satellite) to '{out.as_posix()}' (format parquet)")
    out_all = WORK / f"{area_id}_with_low_conf.parquet"
    con.execute(f"copy (select * from a2 order by acq_date, satellite) to '{out_all.as_posix()}' (format parquet)")
    return report


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    load_all(con)
    reports = [clean_area(con, a) for a in AREAS]
    (WORK / "clean_report.json").write_text(json.dumps(reports, indent=2), encoding="utf-8")
    for r in reports:
        accounted = (r["rows_out"] + r["removed_exact_duplicates"] + r["removed_non_vegetation_standard"]
                     + r["removed_nrt_in_static_cells"] + r["removed_low_confidence"])
        assert accounted == r["rows_in_box"], f"{r['area']}: rows not conserved"
        print(json.dumps(r))


if __name__ == "__main__":
    main()
