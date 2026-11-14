"""Rebuild the cleaned tables from the hotspot files that ship with the app.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

Why. The raw FIRMS archive files are not in git, so until now nobody could
rerun the method without requesting them from NASA. But the app ships every
detection inside each area (app/public/data/<area>/hotspots/<year>.csv.gz,
written by hotspots.py), with the reason any detection was left out. This
script turns those files back into WORK/<area>.parquet (and the table from
before the confidence filter), the tables clean.py writes, so every step from
harmonize.py to export.py can be rerun from a fresh clone with no account and
no download.

What it cannot redo: the cleaning itself (it trusts the reasons in the files)
and anything that needs other data (obs, burned area, land cover).

Run:  python pipeline/from_hotspots.py
Then: python pipeline/harmonize.py && python pipeline/validate.py && python pipeline/loyo.py
"""

import duckdb

from config import APP_DATA, AREAS, INTERNAL_CELL_DEG, MODIS_MIN_CONFIDENCE, WORK

SAT_NAMES = {"Terra": "Terra", "Aqua": "Aqua", "T": "Terra", "A": "Aqua",
             "SNPP": "S-NPP", "N": "S-NPP", "N20": "NOAA-20", "N21": "NOAA-21"}
# Reasons written by hotspots.py for detections that clean.py removed.
CLEANED_OUT = ("outside the area%", "not a vegetation fire%",
               "near-real-time detection at a known static heat source", "low confidence")
# sensitivity.py also needs the table from before the confidence filter.
VERSIONS = {"": CLEANED_OUT, "_with_low_conf": CLEANED_OUT[:3]}


def rebuild(con: duckdb.DuckDBPyConnection, area: str, suffix: str = "") -> int:
    files = (APP_DATA / area / "hotspots" / "*.csv.gz").as_posix()
    known = ", ".join(f"('{k}', '{v}')" for k, v in SAT_NAMES.items())
    dropped = " and ".join(f"harm_reason not like '{r}'" for r in VERSIONS[suffix])
    cell = INTERNAL_CELL_DEG
    out = WORK / f"{area}{suffix}.parquet"
    con.execute(f"""
        copy (
            select latitude::double as lat, longitude::double as lon,
                   acq_date::date as acq_date, lpad(acq_time, 4, '0') as acq_time, daynight,
                   case when m.satellite in ('Terra', 'Aqua') then 'MODIS' else 'VIIRS' end as sensor,
                   scan::double as scan, track::double as track, frp::double as frp,
                   confidence as confidence_raw, version, try_cast(type as integer) as type,
                   (type is null or type = '') as is_nrt, m.satellite,
                   case when m.satellite in ('Terra', 'Aqua') then
                            case when try_cast(confidence as integer) < {MODIS_MIN_CONFIDENCE} then 'low'
                                 when try_cast(confidence as integer) < 80 then 'nominal' else 'high' end
                        else case confidence when 'l' then 'low' when 'n' then 'nominal' when 'h' then 'high' end
                   end as confidence_class,
                   cast(floor(longitude::double / {cell}) as integer) as cx,
                   cast(floor(latitude::double / {cell}) as integer) as cy
            from read_csv('{files}', all_varchar=true, header=true) r
            join (values {known}) m(code, satellite) on r.satellite = m.code
            where {dropped}
            order by acq_date, m.satellite
        ) to '{out.as_posix()}' (format parquet)""")
    return con.execute(f"select count(*) from '{out.as_posix()}'").fetchone()[0]


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    for area in AREAS:
        if not (APP_DATA / area / "hotspots").exists():
            print(f"{area}: no hotspot files, skipped")
            continue
        with_low = rebuild(con, area, "_with_low_conf")
        print(f"{area}: {rebuild(con, area):,} cleaned detections rebuilt ({with_low:,} before the confidence filter)")


if __name__ == "__main__":
    main()
