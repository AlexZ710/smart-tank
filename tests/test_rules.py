"""Session 11 tests: deterministic temperature/pH/missing-data rules.

Fixtures are synthetic unit-test rows only - never real telemetry.
"""
import pandas as pd

from backend.rules.rules import (
    EVENT_COLUMNS,
    detect_events,
    run,
)


def _row(ts=1, temp=25.0, ph=8.2, **extra):
    return {"timestamp_ms": ts, "temperature_c": temp, "ph": ph, **extra}


def test_normal_row_has_no_events():
    df = pd.DataFrame([_row()])
    assert detect_events(df).empty


def test_temp_and_ph_outside_ranges_generate_events():
    df = pd.DataFrame([_row(ts=2, temp=29.0, ph=7.7)])
    out = detect_events(df)
    assert len(out) == 2
    assert set(out["reason"]) == {
        "temperature outside 24-27 C",
        "pH outside 8-8.4",
    }
    assert set(out["rule_code"]) == {"TEMP_OUT_OF_RANGE", "PH_OUT_OF_RANGE"}
    assert set(out["severity"]) == {"warning"}


def test_determinism_same_input_same_output():
    df = pd.DataFrame([
        _row(ts=1),
        _row(ts=2, temp=33.0),      # critical high
        _row(ts=3, temp=None),      # missing
        _row(ts=4, ph=6.5),         # critical low pH
    ])
    first = detect_events(df)
    second = detect_events(df)
    pd.testing.assert_frame_equal(first, second)


def test_row_and_channel_order_is_stable():
    df = pd.DataFrame([
        _row(ts=1, temp=29.0, ph=7.7),
        _row(ts=2, temp=19.0),
    ])
    out = detect_events(df)
    assert out["timestamp_ms"].tolist() == [1, 1, 2]
    assert out["rule_code"].tolist() == [
        "TEMP_OUT_OF_RANGE", "PH_OUT_OF_RANGE", "TEMP_CRITICAL",
    ]


def test_critical_severity_beyond_critical_band():
    out = detect_events(pd.DataFrame([_row(temp=35.0, ph=6.0)]))
    assert out["severity"].tolist() == ["critical", "critical"]
    assert out["rule_code"].tolist() == ["TEMP_CRITICAL", "PH_CRITICAL"]
    assert "(critical)" in out["reason"].iloc[0]


def test_missing_values_generate_missing_events():
    out = detect_events(pd.DataFrame([_row(temp=None, ph=None)]))
    assert out["rule_code"].tolist() == ["TEMP_MISSING", "PH_MISSING"]
    assert set(out["severity"]) == {"warning"}


def test_validity_flags_override_range_checks():
    # Flagged-invalid reading (e.g. 200 C coerced by cleaning) must raise
    # TEMP_INVALID, not a range/critical event.
    df = pd.DataFrame([
        _row(ts=1, temp=200.0, temperature_valid=False, ph_valid=True),
        _row(ts=2, temp=25.0, temperature_valid=True, ph_valid=True),
    ])
    out = detect_events(df)
    assert len(out) == 1
    assert out["rule_code"].iloc[0] == "TEMP_INVALID"
    assert out["severity"].iloc[0] == "warning"


def test_absent_channel_is_skipped_not_fabricated():
    df = pd.DataFrame([{"timestamp_ms": 1, "temperature_c": 25.0}])
    assert detect_events(df).empty
    df2 = pd.DataFrame([{"timestamp_ms": 1, "ph": 9.5}])
    out = detect_events(df2)
    assert out["rule_code"].tolist() == ["PH_CRITICAL"]


def test_boundary_values_are_inclusive_no_event():
    for temp, ph in [(24.0, 8.0), (27.0, 8.4)]:
        assert detect_events(pd.DataFrame([_row(temp=temp, ph=ph)])).empty


def test_empty_dataframe_returns_typed_empty_frame():
    out = detect_events(pd.DataFrame())
    assert out.empty
    assert list(out.columns) == EVENT_COLUMNS


def test_no_forbidden_rule_codes():
    df = pd.DataFrame([
        _row(ts=1, temp=35.0, ph=6.0),
        _row(ts=2, temp=None, ph=None),
    ])
    codes = " ".join(detect_events(df)["rule_code"]).upper()
    for forbidden in ("ORP", "EC_", "ZP4510", "FS300A", "FLOW", "FLOAT"):
        assert forbidden not in codes


def test_run_writes_events_csv(tmp_path):
    clean = tmp_path / "clean.csv"
    clean.write_text(
        "timestamp_ms,temperature_c,ph\n1000,25.0,8.2\n2000,30.0,8.1\n",
        encoding="utf-8",
    )
    out = tmp_path / "events" / "events.csv"
    events = run(clean, out)
    assert out.exists()
    reread = pd.read_csv(out)
    assert list(reread.columns) == EVENT_COLUMNS
    assert len(reread) == len(events) == 1
    assert reread["rule_code"].iloc[0] == "TEMP_OUT_OF_RANGE"
