"""Session 16 tests: append-only manual measurement ledger.

Fixture rows are synthetic unit-test entries only - never real readings.
Forbidden-sensor metric names appear ONLY as rejection fixtures.
"""
import pandas as pd
import pytest

from backend.analysis.manual_log import COLUMNS, add, load, summary


def test_add_creates_ledger_with_header(tmp_path):
    ledger = tmp_path / "manual.csv"
    add("salinity_sg", 1.025, "SG", "refractometer", ledger_path=ledger,
        measured_at="2026-09-12T10:00:00+08:00")
    df = load(ledger)
    assert list(df.columns) == COLUMNS
    assert len(df) == 1
    assert df.iloc[0]["metric_name"] == "salinity_sg"


def test_append_only_never_rewrites_existing_rows(tmp_path):
    ledger = tmp_path / "manual.csv"
    add("salinity_sg", 1.025, "SG", "refractometer", ledger_path=ledger,
        measured_at="2026-09-12T10:00:00+08:00")
    first_line = ledger.read_text(encoding="utf-8").splitlines()[1]
    add("ammonia_mg_l", 0.02, "mg/L", "liquid test kit", ledger_path=ledger,
        measured_at="2026-09-12T11:00:00+08:00")
    lines = ledger.read_text(encoding="utf-8").splitlines()
    assert lines[1] == first_line  # untouched
    assert len(lines) == 3         # header + 2 rows


@pytest.mark.parametrize("bad_metric", [
    "orp_mv", "ec_us_cm", "conductivity_manual", "flow_rate",
    "zp4510_state", "fs300a_total_l", "float_switch_events",
])
def test_forbidden_sensor_metrics_rejected_even_as_manual(tmp_path, bad_metric):
    with pytest.raises(ValueError, match="forbidden-sensor term"):
        add(bad_metric, 1.0, "x", "manual", ledger_path=tmp_path / "m.csv")


def test_method_mandatory(tmp_path):
    with pytest.raises(ValueError, match="method is mandatory"):
        add("salinity_sg", 1.025, "SG", "  ", ledger_path=tmp_path / "m.csv")


def test_nan_value_rejected(tmp_path):
    with pytest.raises(ValueError, match="real number"):
        add("salinity_sg", float("nan"), "SG", "refractometer",
            ledger_path=tmp_path / "m.csv")


def test_unit_mismatch_warns_but_records(tmp_path, capsys):
    add("salinity_sg", 35.0, "ppt", "refractometer",
        ledger_path=tmp_path / "m.csv")
    assert "WARNING" in capsys.readouterr().out
    assert len(load(tmp_path / "m.csv")) == 1


def test_load_missing_file_returns_empty_frame(tmp_path):
    df = load(tmp_path / "nope.csv")
    assert df.empty
    assert list(df.columns) == COLUMNS


def test_summary_empty_and_populated(tmp_path):
    ledger = tmp_path / "manual.csv"
    assert "empty" in summary(ledger)
    add("salinity_sg", 1.024, "SG", "refractometer", ledger_path=ledger)
    add("salinity_sg", 1.026, "SG", "refractometer", ledger_path=ledger)
    out = summary(ledger)
    assert "salinity_sg: 2 rows" in out
    assert "min 1.024" in out and "max 1.026" in out


def test_ledger_is_dataframe_friendly(tmp_path):
    ledger = tmp_path / "manual.csv"
    add("observation_score", 21, "score", "EXP05 checklist",
        experiment_id="EXP05", ledger_path=ledger)
    df = load(ledger)
    assert pd.api.types.is_numeric_dtype(df["value"])
    assert pd.to_numeric(df["value"]).iloc[0] == 21
    assert df.iloc[0]["experiment_id"] == "EXP05"
