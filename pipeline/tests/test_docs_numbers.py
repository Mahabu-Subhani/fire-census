"""The numbers we quote must be the numbers the pipeline wrote. Needs no downloaded data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

AGENTS.md rule 4: every number on the project page comes from the pipeline.
After a rebuild the documents can fall behind (on 14 November the README still
quoted values from before Punjab was clipped). This test reads each area's
meta.json, the file the app shows, and fails if README.md or
submission/results.md quotes a different value for the same check.

Run from the repo root: python -m pytest pipeline/tests/test_docs_numbers.py -q
"""

import json
import math
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import APP_DATA, REPO  # noqa: E402

AREAS = ["cordoba", "punjab-haryana"]          # the two calibrated areas, in table-column order
README = (REPO / "README.md").read_text(encoding="utf-8")
RESULTS = (REPO / "submission" / "results.md").read_text(encoding="utf-8")


def checks(area: str) -> dict:
    meta = json.loads((APP_DATA / area / "meta.json").read_text(encoding="utf-8"))
    return {c["id"]: c for c in meta["checks"]}


def number(value) -> float:
    """First decimal number in a check's value: 0.087, '+0.087' or '2016: -0.089; 2008: +0.000'."""
    found = re.search(r"-?\d+\.\d+", str(value)) or re.search(r"-?\d+", str(value))
    return float(found.group())


def table_row(text: str, starts_with: str) -> list[str]:
    """Cells of the first Markdown table row whose first cell starts with the given text."""
    for line in text.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and cells[0].startswith(starts_with):
            return cells
    raise AssertionError(f"no table row starting with {starts_with!r}")


@pytest.mark.parametrize("check_id", ["C0", "C1", "C1x", "C2", "C3", "C3r", "C3x", "C6", "C6m"])
@pytest.mark.parametrize("col, area", list(enumerate(AREAS)))
def test_results_table_matches_meta(check_id, col, area):
    cell = table_row(RESULTS, check_id)[2 + col]
    got = checks(area)[check_id]
    quoted = number(re.sub(r"\*\*.*?\*\*", "", cell))      # the number after the bold verdict
    assert quoted == pytest.approx(number(got["value"]), abs=0.0006), f"{check_id} {area}: {cell}"
    assert f"**{got['verdict'].capitalize()}.**" in cell, f"{check_id} {area} verdict: {cell}"


@pytest.mark.parametrize("col, area", list(enumerate(AREAS)))
def test_results_noaa20_matches_meta(col, area):
    cell = table_row(RESULTS, "C4")[2 + col]
    slope, corr = re.findall(r"\d\.\d+", checks(area)["C4"]["value"])
    assert f"Slope {slope}" in cell and f"correlation {corr}" in cell


def test_results_peak_shift_matches_meta():
    cell = table_row(RESULTS, "C7")[3]                     # defined for Punjab and Haryana only
    got = checks("punjab-haryana")["C7"]
    assert f"{number(got['value']):.1f} days" in cell
    assert f"**{got['verdict'].capitalize()}.**" in cell


def test_no_claim_that_every_check_passes_while_one_fails():
    """A sentence we had to withdraw on 14 November: it must not come back unless it is true."""
    pre_registered = ("C0", "C1", "C1b", "C2", "C3", "C4", "C5", "C6", "C7")
    all_pass = all(checks("punjab-haryana")[c]["verdict"] == "pass" for c in pre_registered)
    if not all_pass:
        for text in (README, RESULTS):
            assert "every pre-registered check" not in text


@pytest.mark.parametrize("col, area", list(enumerate(AREAS)))
def test_readme_step_table_matches_meta(col, area):
    """The README gives the 2012 step as a multiple: exp of the log step in meta.json."""
    c = checks(area)
    raw = number(table_row(README, "Raw record")[1 + col])
    harm = number(table_row(README, "After harmonization")[1 + col])
    assert raw == pytest.approx(math.exp(number(c["C0"]["value"])), abs=0.06)
    assert harm == pytest.approx(math.exp(number(c["C1"]["value"])), abs=0.006)


def test_readme_quotes_the_shipped_out_of_sample_and_held_out_values():
    c = checks("cordoba")
    for check_id in ("C1x", "C3"):
        value = f"{abs(number(c[check_id]['value'])):.3f}"
        assert value in README, f"README should quote {check_id} = {value}"
    slope, corr = re.findall(r"\d\.\d+", c["C4"]["value"])
    assert f"slope {slope}" in README and f"correlation {corr}" in README


@pytest.mark.parametrize("area", ["cordoba", "punjab-haryana", "chilecito", "karnataka-south"])
def test_unit_note_names_the_method_that_ships(area):
    meta = json.loads((APP_DATA / area / "meta.json").read_text(encoding="utf-8"))
    how = {"S0": "detection curve", "L2": "hard floor", "L1r": "conversion ratio"}
    assert how[meta["level_shipped"]] in meta["unit_note"]
    assert "each calendar month" in meta["unit_note"]          # decision 57
