"""Probe NASA's daily fire-mask products before committing to a full download.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani.

Reads EARTHDATA_TOKEN from the repo's .env (never printed). Lists granules for
one tile and one month and reports their sizes, so we can decide the scope.

Run: python pipeline/obs_probe.py
"""

import os

import earthaccess

from config import REPO


def load_env() -> None:
    env = REPO / ".env"
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def main() -> None:
    load_env()
    earthaccess.login(strategy="environment")
    for short, bbox in (("MYD14A1", (-64.0, -32.0, -63.9, -31.9)), ("VNP14A1", (-64.0, -32.0, -63.9, -31.9)),
                        ("MYD14A1", (75.0, 30.5, 75.1, 30.6))):
        res = earthaccess.search_data(short_name=short, bounding_box=bbox,
                                      temporal=("2016-09-01", "2016-09-30"))
        sizes = [(g.size if isinstance(g.size, float) else g.size()) for g in res]
        names = [g["umm"]["GranuleUR"] for g in res][:3]
        print(short, bbox, "granules:", len(res), "total MB:", round(sum(sizes), 1), "examples:", names)


if __name__ == "__main__":
    main()
