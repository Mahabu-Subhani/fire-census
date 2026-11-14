"""Plot monthly raw hotspot counts per satellite, per area (level L0).

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Run: python pipeline/raw_jump.py
"""

import duckdb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from config import AREAS, FIGURES, WORK

COLOURS = {"Terra": "#8c6d1f", "Aqua": "#1f5f8b", "S-NPP": "#b8400f",
           "NOAA-20": "#6a3d9a", "NOAA-21": "#2a7f62"}


def main() -> None:
    FIGURES.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    for area_id, (name, *_rest) in AREAS.items():
        df = con.execute(f"""
            select date_trunc('year', acq_date) as yr, satellite, count(*) as n
            from '{(WORK / (area_id + '.parquet')).as_posix()}'
            group by 1, 2 order by 1, 2""").df()
        wide = df.pivot(index="yr", columns="satellite", values="n").fillna(0)
        fig, ax = plt.subplots(figsize=(9, 4.2))
        for sat in ["Terra", "Aqua", "S-NPP", "NOAA-20", "NOAA-21"]:
            if sat in wide:
                ax.plot(wide.index, wide[sat], label=sat, color=COLOURS[sat], lw=1.8, marker="o", ms=3)
        ax.plot(wide.index, wide.sum(axis=1), label="All sensors added (naive)", color="#222", lw=1.2, ls="--")
        ax.axvline(wide.index[wide.index.year == 2012][0], color="#999", lw=0.8)
        ax.set_title(f"Raw hotspot detections per year, {name}")
        ax.set_ylabel("Detections per year (after cleaning)")
        ax.legend(frameon=False, fontsize=8)
        ax.spines[["top", "right"]].set_visible(False)
        fig.tight_layout()
        fig.savefig(FIGURES / f"raw_jump_{area_id}.png", dpi=150)
        plt.close(fig)

        modis = wide.get("Terra", 0) + wide.get("Aqua", 0)
        total = wide.sum(axis=1)
        before = total[(total.index.year >= 2009) & (total.index.year <= 2011)].mean()
        after = total[(total.index.year >= 2013) & (total.index.year <= 2015)].mean()
        m_before = modis[(modis.index.year >= 2009) & (modis.index.year <= 2011)].mean()
        m_after = modis[(modis.index.year >= 2013) & (modis.index.year <= 2015)].mean()
        print(f"{area_id}: naive total 2009-11 mean {before:,.0f}/yr -> 2013-15 mean {after:,.0f}/yr "
              f"(x{after / before:.2f}); MODIS only x{m_after / m_before:.2f}")


if __name__ == "__main__":
    main()
