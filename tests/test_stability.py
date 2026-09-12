"""Session 13 tests: baseline stability metrics (valid readings only).

Fixtures are synthetic unit-test rows only - never real telemetry.
"""
import pandas as pd

from backend.analysis.stability import (
    analyze,
    channel_stats,
    completeness,
    event_counts,
    xkc_state_counts,
)


def _df():
    return pd.DataFrame({
        "timestamp_ms": [1000, 2000, 3000, 4000],
        "temperature_c": [25.0, 25.5, 300.0, 26.0],
        "temperature_valid": [True, True, False, True],
        "ph": [8.2, 8.1, 8.3, 8.2],
        "ph_valid": [True, True, True, True],
        "light_relative_pct": [40.0, 41.0, 42.0, 43.0],
        "light_valid": [True, True, True, True],
    })


def test_channel_stats_exclude_flagged_invalid():
    s = channel_stats(_df(), "temperature_c", "temperature_valid")
    assert s["valid_rows"] == 3
    assert s["total_rows"] == 4
    assert s["max"] == 26.0  # the 300.0 flagged row is excluded
    assert s["min"] == 25.0


def test_channel_stats_absent_channel_returns_none():
    assert channel_stats(_df(), "temperature_c", None) is not None
    df = _df().drop(columns=["temperature_c"])
    assert channel_stats(df, "temperature_c", "temperature_valid") is None


def test_channel_stats_all_invalid_gives_none_values_not_zeros():
    df = _df()
    df["temperature_valid"] = False
    s = channel_stats(df, "temperature_c", "temperature_valid")
    assert s["valid_rows"] == 0
    assert s["mean"] is None and s["std"] is None


def test_completeness_expected_1hz():
    c = completeness(_df())
    assert c["span_ms"] == 3000
    assert c["expected_rows"] == 4
    assert c["actual_rows"] == 4
    assert c["completeness_pct"] == 100.0


def test_completeness_detects_gaps():
    df = _df()
    df.loc[2, "timestamp_ms"] = 10000  # stretch the span -> missing rows
    c = completeness(df)
    assert c["span_ms"] == 9000
    assert c["expected_rows"] == 10  # 1 Hz over 9 s span
    assert c["actual_rows"] == 4
    assert c["completeness_pct"] == 40.0


def test_event_counts_by_severity_and_code():
    events = pd.DataFrame({
        "timestamp_ms": [1, 2, 3],
        "severity": ["warning", "warning", "critical"],
        "rule_code": ["TEMP_MISSING", "TEMP_MISSING", "PH_CRITICAL"],
        "reason": ["", "", ""],
    })
    ec = event_counts(events)
    assert ec["total"] == 3
    assert ec["warning"] == 2 and ec["critical"] == 1
    assert ec["by_rule_code"] == {"TEMP_MISSING": 2, "PH_CRITICAL": 1}


def test_event_counts_empty():
    ec = event_counts(pd.DataFrame())
    assert ec == {"total": 0, "critical": 0, "warning": 0, "by_rule_code": {}}


def test_xkc_states_only_when_real():
    assert xkc_state_counts(_df()) is None  # column absent
    df = _df()
    df["xkc_level_state"] = "NA"
    assert xkc_state_counts(df) is None  # sensor absent -> no fabrication
    df["xkc_level_state"] = ["NA", "0", "1", "0"]
    assert xkc_state_counts(df) == {"dry_0": 2, "wet_1": 1}


def test_analyze_frame_shape_and_label():
    metrics = analyze(_df(), pd.DataFrame(), label="EXP01")
    labels = set(metrics["label"])
    assert labels == {"EXP01"}
    metric_kinds = metrics["metric"].tolist()
    assert "channel" in metric_kinds
    assert "completeness" in metric_kinds
    assert "events" in metric_kinds
    # three channels present -> three channel rows
    assert metric_kinds.count("channel") == 3


def test_analyze_skips_absent_channels():
    df = _df().drop(columns=["light_relative_pct", "light_valid"])
    metrics = analyze(df, pd.DataFrame())
    channels = metrics.loc[metrics["metric"] == "channel", "channel"].tolist()
    assert channels == ["temperature_c", "ph"]
