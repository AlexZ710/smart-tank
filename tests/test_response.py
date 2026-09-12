"""Session 15 tests: EXP02/EXP03 response + recovery metrics.

Fixtures are synthetic unit-test rows only - never real telemetry.
1 Hz cadence: 60 rows = 1 minute per index block of 60.
"""
import pandas as pd

from backend.analysis.response import (
    max_rate_per_10min,
    peak_deviation,
    pre_segment_stats,
    recovery_time_min,
    response_report,
    valid_series,
)


def _series(n_pre=60, n_ramp=60, n_hold=240):
    """temp: 60 rows at 25.0, ramp up to 27.0 over 60 rows, hold 25.0."""
    ts = [1000 * (i + 1) for i in range(n_pre + n_ramp + n_hold)]
    vals = [25.0] * n_pre
    vals += [25.0 + 2.0 * (i + 1) / n_ramp for i in range(n_ramp)]
    vals += [25.0] * n_hold
    return pd.DataFrame({
        "timestamp_ms": ts,
        "temperature_c": vals,
        "temperature_valid": [True] * len(ts),
    })


INTERVENTION_TS = 61_000  # first ramp row


def test_valid_series_honors_flags():
    df = _series()
    df.loc[10, "temperature_valid"] = False
    s = valid_series(df, "temperature_c", "temperature_valid")
    assert len(s) == len(df) - 1
    assert len(s[s["timestamp_ms"] == 11_000]) == 0  # flagged row removed
    assert list(s.index) == list(range(len(s)))       # index reset


def test_valid_series_absent_column():
    s = valid_series(pd.DataFrame(), "temperature_c", "temperature_valid")
    assert s.empty


def test_pre_segment_stats():
    df = _series()
    stats = pre_segment_stats(valid_series(df, "temperature_c",
                                           "temperature_valid"),
                              "temperature_c", INTERVENTION_TS)
    assert stats["pre_rows"] == 60
    assert stats["pre_mean"] == 25.0
    assert stats["pre_std"] == 0.0


def test_pre_segment_stats_empty_before_marker():
    stats = pre_segment_stats(
        valid_series(_series(), "temperature_c", "temperature_valid"),
        "temperature_c", 0)
    assert stats == {"pre_mean": None, "pre_std": None, "pre_rows": 0}


def test_max_rate_bounded_by_ramp():
    s = valid_series(_series(), "temperature_c", "temperature_valid")
    rate = max_rate_per_10min(s, "temperature_c")
    # ramp: 2 C over 1 minute -> within any 10-min window max change is 2 C
    assert rate == 2.0


def test_max_rate_none_for_short_series():
    s = valid_series(_series(), "temperature_c", "temperature_valid").head(1)
    assert max_rate_per_10min(s, "temperature_c") is None


def test_peak_deviation_and_time_to_peak():
    s = valid_series(_series(), "temperature_c", "temperature_valid")
    peak = peak_deviation(s, "temperature_c", 25.0, INTERVENTION_TS)
    assert peak["peak_delta"] == 2.0
    # peak at last ramp row: ts 120_000 -> (120000-61000)/60000 ~ 0.98 min
    assert peak["time_to_peak_min"] == round((120_000 - 61_000) / 60000.0, 2)


def test_recovery_time_measured_from_peak():
    s = valid_series(_series(), "temperature_c", "temperature_valid")
    peak_ts = 120_000.0
    # hold starts immediately after peak; 30-min hold needs 1801 rows but we
    # have 240 hold rows (4 min) -> use hold_min=3 for the unit test
    rec = recovery_time_min(s, "temperature_c", peak_ts, (24.0, 26.0),
                            hold_min=3.0)
    # band re-entry is the first hold row, 1000 ms (0.02 min) after the peak
    assert rec == 0.02


def test_recovery_none_when_never_back_in_band():
    df = _series(n_hold=0)
    s = valid_series(df, "temperature_c", "temperature_valid")
    # band far below all values -> never recovers
    assert recovery_time_min(s, "temperature_c", 61_000.0, (10.0, 11.0),
                             hold_min=1.0) is None


def test_response_report_end_to_end():
    rep = response_report(_series(), "temperature_c", "temperature_valid",
                          INTERVENTION_TS, (24.0, 26.0), hold_min=3.0)
    assert rep["channel"] == "temperature_c"
    assert rep["pre_mean"] == 25.0
    assert rep["peak_delta"] == 2.0
    assert rep["max_rate_per_10min"] == 2.0
    assert rep["recovery_time_min"] == 0.02


def test_response_report_all_invalid_yields_nones_not_fabrication():
    df = _series()
    df["temperature_valid"] = False
    rep = response_report(df, "temperature_c", "temperature_valid",
                          INTERVENTION_TS, (24.0, 26.0))
    assert rep["pre_mean"] is None
    assert rep["peak_delta"] is None
    assert rep["max_rate_per_10min"] is None
    assert rep["recovery_time_min"] is None
