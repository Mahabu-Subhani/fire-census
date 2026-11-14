"""Known-answer tests of the harmonization method. They need no downloaded data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

The real checks (validate.py) compare the record with Aqua, whose own truth is
unknown. Here the truth is known because we make it: simulated fires with a
chosen MODIS detection curve. The tests ask whether the code in harmonize.py
gets that curve back, and whether the detection-curve record stays right when
the mix of weak and strong fires changes, which is where one constant ratio
goes wrong. Simulated fires are not evidence about real fires; they test the
code and the logic. Not pre-registered.

Run from the repo root: python -m pytest pipeline/tests/test_method.py -q
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import harmonize as hz  # noqa: E402
import validate as va  # noqa: E402

TRUE_F50 = 10.0      # MW: fire strength MODIS detects half as often as its strongest fires
TRUE_WIDTH = 0.25    # width of the true curve, in log10 MW
TRUE_PLATEAU = 0.8   # even strong fires are missed 1 time in 5 (timing, cloud)
CHANCE = 0.05        # an unrelated Aqua fire cell happens to lie beside the VIIRS one
MONTHS = [f"{y}-{m:02d}" for y in range(2012, 2018) for m in range(1, 13)]


def true_p(frp):
    return TRUE_PLATEAU / (1 + np.exp(-(np.log10(frp) - np.log10(TRUE_F50)) / TRUE_WIDTH))


def simulate(rng, months, per_month, median_mw):
    """VIIRS fire cells with known strength; whether Aqua also saw each one."""
    n = per_month * len(months)
    frp = rng.lognormal(np.log(median_mw), 1.2, n)
    seen = rng.random(n) < true_p(frp)
    chance = rng.random(n) < CHANCE
    return pd.DataFrame({"ym": np.repeat(months, per_month), "frp_sum": frp, "seen": seen,
                         "hit": (seen | chance).astype(int),
                         "ctrl": (rng.random(n) < CHANCE).astype(int)})


@pytest.fixture(scope="module")
def calibration():
    rng = np.random.default_rng(1)
    df = simulate(rng, MONTHS, 4000, median_mw=8.0)
    n, h, c = hz.month_bin_counts(df, MONTHS)
    p_raw, p_norm, plateau, f50 = hz.fit_curve(n, h, c)
    aqua = df["seen"].sum()                        # what "Aqua" reported in the fitting years
    return {"n": n, "p_norm": p_norm, "plateau": plateau, "f50": f50,
            "k_curve": aqua / (n @ p_norm).sum(), "k_ratio": aqua / n.sum(),
            "k_floor": aqua / (df["frp_sum"] >= f50).sum()}


def test_bins_cover_every_strength():
    b = hz.bin_index(np.array([0.0, 0.05, 0.1, 1.0, 5000.0, 1e9]))
    assert b.min() == 0 and b.max() == hz.NB - 1
    assert (np.diff(b) >= 0).all()


def test_curve_is_monotone_and_bounded(calibration):
    p = calibration["p_norm"]
    assert (np.diff(p) >= -1e-12).all()
    assert p.min() >= 0 and p.max() <= 1


def test_curve_recovers_the_known_midpoint(calibration):
    # The midpoint is defined against the plateau, as in the true curve.
    assert calibration["f50"] == pytest.approx(TRUE_F50, rel=0.15)


def test_curve_recovers_the_known_shape(calibration):
    # Compare where there is enough data: 1 to 300 MW.
    use = (hz.CENTRES >= 1) & (hz.CENTRES <= 300)
    truth = true_p(hz.CENTRES[use]) / TRUE_PLATEAU
    assert np.abs(calibration["p_norm"][use] - truth).max() < 0.08


def test_chance_matches_are_removed(calibration):
    # Without the control subtraction the weakest fires would sit near CHANCE / plateau.
    weak = hz.CENTRES < 0.5
    assert calibration["p_norm"][weak].max() < 0.03


@pytest.mark.parametrize("median_mw, label", [(8.0, "same mix"), (3.0, "weaker fires"), (25.0, "stronger fires")])
def test_curve_holds_when_the_fire_mix_changes(calibration, median_mw, label):
    """A later period with a different mix: the curve stays within 5 percent of the truth."""
    rng = np.random.default_rng(int(median_mw * 10))
    later = simulate(rng, ["2020-01"], 60000, median_mw)
    counts, _, _ = hz.month_bin_counts(later, ["2020-01"])
    truth = later["seen"].sum()
    curve = calibration["k_curve"] * (counts @ calibration["p_norm"]).sum()
    assert abs(np.log(curve / truth)) < 0.05, label


def test_constant_ratio_breaks_when_the_fire_mix_changes(calibration):
    """The same later periods: one ratio is right only while the mix stays as it was."""
    errors = {}
    for median_mw in (8.0, 3.0, 25.0):
        rng = np.random.default_rng(int(median_mw * 10))
        later = simulate(rng, ["2020-01"], 60000, median_mw)
        errors[median_mw] = np.log(calibration["k_ratio"] * len(later) / later["seen"].sum())
    assert abs(errors[8.0]) < 0.05
    assert errors[3.0] > 0.30       # weaker fires: the ratio counts fires MODIS would have missed
    assert errors[25.0] < -0.30     # stronger fires: it undercounts


def test_step_statistic_reads_a_known_jump():
    idx = pd.period_range("2009-01", "2015-01", freq="M").strftime("%Y-%m")
    s = pd.Series(100.0, index=idx)
    assert va.step(s, *va.W2012) == pytest.approx(0.0)
    s[s.index >= va.VIIRS_START] = 520.0
    assert va.step(s, *va.W2012) == pytest.approx(np.log(5.2))


def test_change_point_test_finds_a_step_and_ignores_noise():
    rng = np.random.default_rng(3)
    noise = rng.normal(1.0, 0.1, 150)
    assert va.pettitt(noise)[1] > 0.05
    stepped = noise.copy()
    stepped[90:] += 0.3
    at, p = va.pettitt(stepped)
    assert p < 0.001 and abs(at - 89) <= 3


def test_shipping_rule_follows_the_preregistration():
    """Curve if it passes its gates, else hard floor, else the constant ratio."""
    ok, bad = {"verdict": "pass"}, {"verdict": "fail"}
    gates = ["C0", "C1", "C1b", "C2", "C3", "C3r"]
    full = {m: {g: ok for g in gates} | {"C8": ok} for m in ("S0", "L2", "L1r")}
    assert va.shipping(full) == "S0"
    unstable = {**full, "S0": full["S0"] | {"C8": bad}}
    assert va.shipping(unstable) == "L2"
    neither = {**unstable, "L2": full["L2"] | {"C1": bad}}
    assert va.shipping(neither) == "L1r"
    # The original held-out check and the revised one are separate gates.
    c3_fails = {m: full[m] | {"C3": bad} for m in full}
    assert va.shipping(c3_fails) == "L1r"
    assert va.shipping(c3_fails, "C3r") == "S0"


def test_hard_floor_constant_is_fitted_on_the_rule_it_is_applied_with():
    """The floor counts a cell if its own strength is at or above the midpoint; the constant must
    be fitted the same way, so that over the fitting months the record equals Aqua's total.
    (Until 14 Nov the constant was fitted on whole strength bins: 4.6 percent off in Punjab.)"""
    rng = np.random.default_rng(5)
    months = [m for m in MONTHS if m >= "2012-02"]
    df = simulate(rng, months, 500, median_mw=8.0)
    df["dn"], df["dt"] = "D", 5
    aqua_by_month = df.groupby("ym")["seen"].sum().astype(float)
    fit = hz.calibrate(df, aqua_by_month, "A", "D")
    counted = (df["frp_sum"] >= fit["f50"]).sum()
    assert fit["k_floor"] * counted == pytest.approx(aqua_by_month.sum(), rel=1e-9)
    assert fit["k_curve"] * (hz.month_bin_counts(df, months)[0] @ np.array(fit["p_norm"])).sum()         == pytest.approx(aqua_by_month.sum(), rel=1e-9)
    for key in ("rel_sd_k", "rel_sd_k_floor", "rel_sd_k_ratio"):      # each model has its own spread
        assert 0 < fit[key] < 0.2


def test_change_point_check_is_not_run_when_it_could_never_fail():
    """Chilecito has 4 usable months; with so few the test cannot reach p < 0.05."""
    assert not va.pettitt_can_reject(4)
    assert not va.pettitt_can_reject(8)
    assert va.pettitt_can_reject(38)
    idx = pd.period_range("2005-01", "2019-12", freq="M").strftime("%Y-%m")
    ser = pd.DataFrame({"R": 1.0, "L0": 1.0, "V_L1r_A": 1.0}, index=idx)
    ser.loc[idx[:4], "R"] = 100.0                                # only 4 months reach 30 Aqua fire cells
    assert va.run_model(ser, "L1r", "A", {})["C1b"]["verdict"] == "not run"


def test_daily_series_keeps_viirs_days_when_aqua_saw_nothing(tmp_path, monkeypatch):
    """The series behind check C7. A day on which VIIRS saw fire and Aqua did not must keep its
    VIIRS value, and a satellite that flew and saw nothing counts as zero in the mean."""
    monkeypatch.setattr(va, "WORK", tmp_path)
    day = pd.Timestamp
    pd.DataFrame({"satellite": ["Aqua", "Aqua", "S-NPP"],
                  "acq_date": [day("2011-10-20"), day("2019-10-20"), day("2019-10-21")]}
                 ).to_parquet(tmp_path / "x_cells.parquet")
    pd.DataFrame({"satellite": ["S-NPP", "S-NPP", "NOAA-20"],
                  "acq_date": [day("2019-10-20"), day("2019-10-21"), day("2019-10-20")],
                  "L2_A": [4.0, 6.0, 2.0]}).to_parquet(tmp_path / "x_weights.parquet")
    harmonized, aqua = va.daily_series("x", "L2", "A")
    assert harmonized[day("2011-10-20")] == 1.0          # before February 2012: Aqua itself
    assert harmonized[day("2019-10-20")] == 3.0          # mean of S-NPP 4 and NOAA-20 2
    assert harmonized[day("2019-10-21")] == 3.0          # S-NPP 6, NOAA-20 flew and saw nothing; no Aqua cell
    assert aqua[day("2019-10-21")] == 0.0
