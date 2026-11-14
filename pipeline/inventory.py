"""Inventory of the raw FIRMS files before any cleaning.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Run: python pipeline/inventory.py   (prints Markdown; paste into pipeline/NOTES.md)
"""

import duckdb

from config import RAW, folder_info


def main() -> None:
    con = duckdb.connect()
    print("| File | Rows | Dates | satellite | instrument | version | confidence | type | scan | track | frp |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    for folder in sorted(RAW.iterdir()):
        req = folder.name.split("_")[-1]
        country, family = folder_info(folder.name)
        for csv in sorted(folder.glob("fire_*.csv")):
            src = f"read_csv('{csv.as_posix()}', all_varchar=true, header=true)"
            cols = [r[0] for r in con.execute(f"describe select * from {src}").fetchall()]
            has_type = "type" in cols

            def distinct(col: str, limit: int = 8) -> str:
                rows = con.execute(
                    f"select {col}, count(*) c from {src} group by 1 order by c desc limit {limit}"
                ).fetchall()
                return ", ".join(f"{v}:{c}" for v, c in rows)

            n, d0, d1, s0, s1, t0, t1, f0, f50, f99, f1 = con.execute(
                f"""select count(*), min(acq_date), max(acq_date),
                    min(scan::double), max(scan::double),
                    min(track::double), max(track::double),
                    min(frp::double), median(frp::double),
                    quantile_cont(frp::double, 0.99), max(frp::double) from {src}"""
            ).fetchone()
            if family == "MODIS":
                conf = con.execute(
                    f"select sum((confidence::int < 30)::int), sum((confidence::int between 30 and 79)::int), "
                    f"sum((confidence::int >= 80)::int) from {src}"
                ).fetchone()
                conf_s = f"<30:{conf[0]}, 30-79:{conf[1]}, >=80:{conf[2]}"
            else:
                conf_s = distinct("confidence")
            print(
                f"| {country} {csv.name} | {n:,} | {d0} to {d1} | {distinct('satellite')} | "
                f"{distinct('instrument')} | {distinct('version')} | {conf_s} | "
                f"{distinct('type') if has_type else 'no type column'} | {s0:.2f}-{s1:.2f} | "
                f"{t0:.2f}-{t1:.2f} | min {f0:.1f}, med {f50:.1f}, p99 {f99:.0f}, max {f1:.0f} |"
            )


if __name__ == "__main__":
    main()
