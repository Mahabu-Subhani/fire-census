"""Per-year hotspot files for the app's "Download hotspots" button.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

One gzipped CSV per area and year: app/public/data/<area>/hotspots/<YYYY>.csv.gz.
Every FIRMS detection inside the area's box, with its original FIRMS columns,
plus three columns that say what the harmonized record did with it:

  harm_class   harmonized | small | excluded
  harm_reason  why, in words
  detect_prob  VIIRS only: the chance Aqua MODIS would have reported this fire
               cell (detection curve), or 1/0 against the hard floor

Run after harmonize.py and export.py:  python pipeline/hotspots.py
"""

import gzip
import json

import duckdb
import pandas as pd

from config import APP_DATA, AREAS, INTERNAL_CELL_DEG, MODIS_MIN_CONFIDENCE, RAW, REPO, WORK, area_cells, folder_info

FIRMS_COLS = ["latitude", "longitude", "brightness", "scan", "track", "acq_date", "acq_time", "satellite",
              "instrument", "confidence", "version", "bright_t31", "frp", "daynight", "type"]
SAT = {"Terra": "Terra", "Aqua": "Aqua", "T": "Terra", "A": "Aqua", "SNPP": "S-NPP", "N": "S-NPP",
       "N20": "NOAA-20", "N21": "NOAA-21"}


def load(con, country: str) -> None:
    parts = []
    for folder in sorted(RAW.iterdir()):
        req = folder.name.split("_")[-1]
        c, family = folder_info(folder.name)
        if c != country:
            continue
        for csv in sorted(folder.glob("fire_*.csv")):
            cols = [r[0] for r in con.execute(
                f"describe select * from read_csv('{csv.as_posix()}', all_varchar=true)").fetchall()]
            sel = ", ".join(c2 if c2 in cols else f"null::varchar as {c2}" for c2 in FIRMS_COLS)
            parts.append(f"select {sel}, '{family}' as sensor, {str('nrt' in csv.name).lower()} as is_nrt "
                         f"from read_csv('{csv.as_posix()}', all_varchar=true, header=true)")
    con.execute("create or replace table raw_c as " + " union all ".join(parts))


def main() -> None:
    shipping = json.loads((REPO / "pipeline" / "shipping.json").read_text(encoding="utf-8"))
    curves = json.loads((WORK / "curves.json").read_text(encoding="utf-8"))
    con = duckdb.connect()
    sat_map = ", ".join(f"('{k}', '{v}')" for k, v in SAT.items())
    loaded = None
    cell = INTERNAL_CELL_DEG
    for area, (_name, west, south, east, north, country) in AREAS.items():
        if loaded != country:
            load(con, country)
            loaded = country
        model, variant = shipping["areas"][area]["model"], shipping["areas"][area]["variant"]
        donor = curves["transfer"].get(area, area)
        f50 = {dn: curves["areas"][donor][f"{variant}_{dn}"]["f50"] for dn in ("D", "N")}

        # Weights of every VIIRS fire cell (from harmonize.py) for the shipped model.
        w = pd.read_parquet(WORK / f"{area}_weights.parquet",
                            columns=["cx", "cy", "satellite", "acq_date", "dn", "frp_sum", f"p_{variant}"])
        w = w.rename(columns={f"p_{variant}": "p", "dn": "daynight"})
        w["acq_date"] = pd.to_datetime(w["acq_date"]).dt.date
        if model == "L2":
            w["p"] = (w["frp_sum"] >= w["daynight"].map(f50)).astype(float)
        con.register("w", w[["cx", "cy", "satellite", "acq_date", "daynight", "p"]])

        cells = area_cells(area)
        has_outline = cells is not None
        cells_df = cells if has_outline else pd.DataFrame({"cx": pd.Series([], dtype="int32"),
                                                            "cy": pd.Series([], dtype="int32")})
        con.execute("create or replace temp table outline_cells as select * from cells_df")
        static = (WORK / f"{area}.parquet").as_posix()
        con.execute(f"""
            create or replace temp table static_cells as
            select cx, cy from (
                select cast(floor(longitude::double / {cell}) as int) cx, cast(floor(latitude::double / {cell}) as int) cy
                from raw_c where not is_nrt and try_cast(type as int) in (1, 2, 3)
                  and longitude::double >= {west} and longitude::double < {east}
                  and latitude::double >= {south} and latitude::double < {north})
            group by 1, 2 having count(*) >= 3""")
        con.execute(f"""
            create or replace temp table hs as
            with r as (
                select raw_c.*, m.satellite_name,
                       cast(floor(longitude::double / {cell}) as int) cx,
                       cast(floor(latitude::double / {cell}) as int) cy,
                       acq_date::date as d
                from raw_c join (values {sat_map}) m(code, satellite_name) on raw_c.satellite = m.code
                where longitude::double >= {west} and longitude::double < {east}
                  and latitude::double >= {south} and latitude::double < {north})
            select r.*, w.p,
              case
                when {str(has_outline).lower()} and oc.cx is null then 'excluded'
                when not is_nrt and coalesce(try_cast(type as int), -1) <> 0 then 'excluded'
                when is_nrt and s.cx is not null then 'excluded'
                when (sensor = 'MODIS' and try_cast(confidence as int) < {MODIS_MIN_CONFIDENCE})
                     or (sensor = 'VIIRS' and confidence = 'l') then 'excluded'
                when satellite_name = 'Terra' and d < date '2002-07-01' then 'harmonized'
                when satellite_name = 'Aqua' and d < date '2012-02-01' then 'harmonized'
                when sensor = 'MODIS' then 'excluded'
                when w.p >= 0.5 then 'harmonized'
                else 'small' end as harm_class,
              case
                when {str(has_outline).lower()} and oc.cx is null then 'outside the area (another state or country)'
                when not is_nrt and coalesce(try_cast(type as int), -1) <> 0
                     then 'not a vegetation fire (FIRMS type ' || coalesce(type, 'missing') || ')'
                when is_nrt and s.cx is not null then 'near-real-time detection at a known static heat source'
                when (sensor = 'MODIS' and try_cast(confidence as int) < {MODIS_MIN_CONFIDENCE})
                     or (sensor = 'VIIRS' and confidence = 'l') then 'low confidence'
                when satellite_name = 'Terra' and d < date '2002-07-01' then 'Terra only, before Aqua (not harmonized)'
                when satellite_name = 'Aqua' and d < date '2012-02-01' then 'Aqua MODIS: the reference record before VIIRS'
                when sensor = 'MODIS' and satellite_name = 'Terra' then 'Terra morning overpass: kept as a separate raw series'
                when sensor = 'MODIS' then 'Aqua after January 2012: the record uses VIIRS from then on'
                when w.p >= 0.5 then 'VIIRS fire cell MODIS would usually see'
                else 'VIIRS fire cell MODIS would usually miss (small-fire layer)' end as harm_reason
            from r
            left join static_cells s on r.cx = s.cx and r.cy = s.cy
            left join outline_cells oc on r.cx = oc.cx and r.cy = oc.cy
            left join w on w.cx = r.cx and w.cy = r.cy and w.satellite = r.satellite_name
                       and w.acq_date = r.d and w.daynight = r.daynight""")
        out = APP_DATA / area / "hotspots"
        out.mkdir(parents=True, exist_ok=True)
        cols = ", ".join(FIRMS_COLS)
        years = [y for (y,) in con.execute("select distinct year(d) from hs order by 1").fetchall()]
        total = 0
        for y in years:
            df = con.execute(f"""select {cols}, harm_class, harm_reason,
                                        case when sensor = 'VIIRS' then round(p, 4) end as detect_prob
                                 from hs where year(d) = {y} order by acq_date, acq_time""").df()
            with gzip.open(out / f"{y}.csv.gz", "wt", encoding="utf-8", newline="") as fh:
                df.to_csv(fh, index=False)
            total += len(df)
        counts = dict(con.execute("select harm_class, count(*) from hs group by 1").fetchall())
        missing = con.execute("select count(*) from hs where sensor = 'VIIRS' and harm_class <> 'excluded' "
                              "and p is null").fetchone()[0]
        size = sum(f.stat().st_size for f in out.glob("*.csv.gz")) / 1e6
        print(f"{area}: {total:,} detections in {len(years)} files, {size:.1f} MB; {counts}; "
              f"VIIRS kept rows without a cell weight: {missing}")
        clean_n = con.execute(f"select count(*) from '{static}'").fetchone()[0]
        kept = counts.get("harmonized", 0) + counts.get("small", 0)
        kept_modis_late = con.execute("select count(*) from hs where harm_class = 'excluded' and (harm_reason like "
                                      "'%Terra morning%' or harm_reason like 'Aqua after%')").fetchone()[0]
        print(f"  check: cleaned rows {clean_n:,} = kept {kept:,} + MODIS rows not used after their period "
              f"{kept_modis_late:,} -> {clean_n == kept + kept_modis_late}")


if __name__ == "__main__":
    main()
