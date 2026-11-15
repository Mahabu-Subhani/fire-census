"""One constant per calendar month against one year-round constant: the before-and-after table.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

History. On 15 Nov this script was the experiment behind decision 57: check C3
(held-out months, limit 0.15) failed, and split by calendar month the error
ln(H / Aqua) was the same in the fitting years and the held-out years, so one
year-round constant left a seasonal bias. The hypothesis and the settings were
written in the same step as the run, seconds before its first result
(docs/research/20261115-checks-audit-seasonal-bias.md), and it was run once. Mahabu then adopted the constants per calendar month, and
the fitting moved into harmonize.py (seasonal_constants), which now writes both
versions of every model; validate.py runs the same checks on both.

What it does now: reads WORK/checks.json and prints, for each model, the checks
under one year-round constant (what shipped until 15 Nov) and under a constant
per calendar month (what ships), with the error by calendar month.

Run (after validate.py):  python pipeline/seasonal.py     Output: WORK/seasonal.json
"""

import json

from config import AREAS, WORK

IDS = ("C1", "C1b", "C2", "C3", "C3x", "C3r", "C4")


def main() -> None:
    checks = json.loads((WORK / "checks.json").read_text(encoding="utf-8"))
    out = {}
    for area in AREAS:
        res = checks[area]["variants"]["A"]
        out[area] = {"ships_under_the_rule_as_first_written": {"year_round": res["ship_year_round"],
                                                                "per_calendar_month": res["ship"]},
                     "models": {}}
        print(f"\n== {area}: the rule as first written ships {res['ship_year_round']} with a year-round constant, "
              f"{res['ship']} with a constant per calendar month")
        for model in ("S0", "L2", "L1r"):
            entry = {}
            for how, src in (("year_round", res["checks_year_round"]), ("per_calendar_month", res["checks"])):
                entry[how] = {"checks": {i: {"value": src[model][i]["value"], "verdict": src[model][i]["verdict"]}
                                         for i in IDS if i in src[model]},
                              **res["error_by_calendar_month"][model][how]}
                print(f"  {model} {how:18s} " + "; ".join(f"{i} {c['verdict']} ({c['value']})"
                                                          for i, c in entry[how]["checks"].items()))
            out[area]["models"][model] = entry
    (WORK / "seasonal.json").write_text(json.dumps(out, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
