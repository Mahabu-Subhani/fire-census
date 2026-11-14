"""The constant per calendar month (harmonize.seasonal_constants): known answers, no downloaded data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import harmonize as hz  # noqa: E402
import validate as va  # noqa: E402

CAL = np.arange(1, 13)


def test_no_fires_gives_the_year_round_constant():
    k = hz.seasonal_constants(np.zeros(12), np.zeros(12), CAL, 0.4)
    assert k == pytest.approx(np.full(12, 0.4))


def test_many_fires_give_the_ratio_of_the_three_month_window():
    aqua, viirs = np.zeros(12), np.zeros(12)
    aqua[3:6] = [1e6, 2e6, 3e6]          # April, May, June
    viirs[3:6] = 4e6
    k = hz.seasonal_constants(aqua, viirs, CAL, 0.9)
    assert k[4] == pytest.approx(6e6 / 12e6, rel=1e-3)      # May: April to June pooled
    assert k[3] == pytest.approx(3e6 / 8e6, rel=1e-3)       # April: March (empty), April, May
    assert k[9] == pytest.approx(0.9)                       # October: no fires nearby


def test_december_and_january_are_neighbours():
    aqua, viirs = np.zeros(12), np.zeros(12)
    aqua[11], viirs[11] = 1e6, 2e6
    k = hz.seasonal_constants(aqua, viirs, CAL, 0.9)
    assert k[0] == pytest.approx(0.5, rel=1e-3) and k[10] == pytest.approx(0.5, rel=1e-3)


def test_several_years_of_the_same_calendar_month_are_summed():
    months = [f"{y}-{m:02d}" for y in (2012, 2013) for m in range(1, 13)]
    cal = hz.calendar_month(months)
    aqua = np.where(cal == 5, 1e6, 0.0)
    viirs = np.where(cal == 5, 4e6, 0.0)
    assert hz.seasonal_constants(aqua, viirs, cal, 0.9)[4] == pytest.approx(0.25, rel=1e-3)


def test_a_seasonal_bias_is_removed_and_a_year_round_constant_leaves_it():
    """Simulated record: MODIS sees half of VIIRS's fire cells in summer and a quarter in winter."""
    months = [f"{y}-{m:02d}" for y in range(2012, 2018) for m in range(1, 13)]
    cal = hz.calendar_month(months)
    viirs = np.full(len(months), 4000.0)
    true_k = np.where((cal >= 4) & (cal <= 9), 0.5, 0.25)
    aqua = viirs * true_k
    k_year = aqua.sum() / viirs.sum()
    k_m = hz.seasonal_constants(aqua, viirs, cal, k_year)
    assert abs(np.log(k_year / 0.5)) > 0.25                              # year-round: 29 percent off in summer
    assert np.abs(np.log(k_m[[5, 6, 11, 0]] / [0.5, 0.5, 0.25, 0.25])).max() < 0.01   # mid-season months recovered


def test_the_year_round_versions_are_checked_with_the_same_code():
    idx = pd.Index(["2012-02", "2012-03"], name="ym")
    ser = pd.DataFrame({"R": [10.0, 10.0], "V_L2_A": [1.0, 2.0], "V_L2y_A": [3.0, 4.0],
                        "L2_A__S-NPP": [1.0, 2.0], "L2y_A__S-NPP": [3.0, 4.0]}, index=idx)
    view = va.annual_view(ser)
    assert list(view["V_L2_A"]) == [3.0, 4.0] and list(view["L2_A__S-NPP"]) == [3.0, 4.0]
    assert list(ser["V_L2_A"]) == [1.0, 2.0]                # the original table is untouched
