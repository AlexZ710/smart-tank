"""Session 10 tests: cleaning preserves raw rows and flags invalid readings."""
import pandas as pd

from backend.collector.clean_data import clean

HEADER = ("timestamp_ms,temperature_c,ph,ph_voltage_v,"
          "light_relative_pct,light_voltage_v,xkc_level_state")

# Synthetic fixture rows for unit tests ONLY - not real telemetry.
ROWS = [
    "1000,25.30,8.20,1.512,42.5,1.40,NA",   # fully valid, XKC absent
    "2000,25.40,8.15,1.510,44.0,1.45,1",   # fully valid, XKC installed
    "3000,200.00,8.10,1.500,45.0,1.50,NA",  # implausible temperature
    "4000,25.50,-5.0,1.600,46.0,1.55,NA",   # pH outside physical bounds
    "5000,25.60,8.05,1.490,150.0,1.60,0",   # light percent out of range
    "6000,,8.00,,47.0,1.65,NA",             # missing temperature
]


def _write_raw(tmp_path):
    raw = tmp_path / "reef_data.csv"
    raw.write_text(HEADER + "\n" + "\n".join(ROWS) + "\n", encoding="utf-8")
    return raw


def test_clean_preserves_every_raw_row(tmp_path):
    df = clean(_write_raw(tmp_path), tmp_path / "clean.csv")
    assert len(df) == len(ROWS)  # no rows deleted


def test_validity_flags(tmp_path):
    df = clean(_write_raw(tmp_path), tmp_path / "clean.csv")
    assert df["temperature_valid"].tolist() == [True, True, False, True, True, False]
    assert df["ph_valid"].tolist() == [True, True, True, False, True, True]
    assert df["light_valid"].tolist() == [True, True, True, True, False, True]


def test_missing_values_coerced_to_nan_not_dropped(tmp_path):
    df = clean(_write_raw(tmp_path), tmp_path / "clean.csv")
    assert pd.isna(df.loc[5, "temperature_c"])
    assert df.loc[5, "ph"] == 8.00  # sibling values intact


def test_xkc_passes_through_untouched(tmp_path):
    df = clean(_write_raw(tmp_path), tmp_path / "clean.csv")
    assert df["xkc_level_state"].tolist() == ["NA", "1", "NA", "NA", "0", "NA"]


def test_output_written(tmp_path):
    out = tmp_path / "sub" / "clean.csv"
    clean(_write_raw(tmp_path), out)
    assert out.exists()
    reread = pd.read_csv(out)
    assert {"temperature_valid", "ph_valid", "light_valid"} <= set(reread.columns)
