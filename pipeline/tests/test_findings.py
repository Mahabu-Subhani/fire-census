"""findings.py: the sun's height on known answers, and the constants read from the shipped files. No downloaded data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).
"""

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import findings  # noqa: E402


def test_the_sun_is_overhead_at_the_equator_near_the_equinoxes_and_lower_at_the_solstices():
    h = findings.midday_sun_height(0.0)
    assert h[2] > 86 and h[8] > 86            # mid-March and mid-September
    assert h[5] == pytest.approx(90 - 23.3, abs=0.5) and h[11] == pytest.approx(90 - 23.3, abs=0.5)


def test_summer_is_in_opposite_months_in_the_two_hemispheres():
    north, south = findings.midday_sun_height(30.0), findings.midday_sun_height(-32.0)
    assert int(np.argmax(north)) == 5 and int(np.argmin(north)) == 11      # June high, December low
    assert int(np.argmax(south)) == 11 and int(np.argmin(south)) == 5      # December high, June low


def test_borrowed_constants_are_not_reported_as_an_area_of_their_own():
    assert findings.constants_and_sun("chilecito") is None


@pytest.mark.parametrize("area", ["cordoba", "punjab-haryana"])
def test_constants_are_read_from_the_shipped_files(area):
    got = findings.constants_and_sun(area)
    assert len(got["constant_over_year_round"]) == 12
    assert -1 <= got["rank_correlation_with_midday_sun_height"] <= 1
