"""Session 10 tests: charts plot valid readings only, with honest labels."""
import pandas as pd

from backend.visualization.visualize import SERIES, filter_valid, plot_series


def _df():
    return pd.DataFrame({
        "timestamp_ms": [1, 2, 3, 4],
        "temperature_c": [25.0, 200.0, None, 25.4],
        "temperature_valid": [True, False, False, True],
        "ph": [8.2, 8.1, 8.0, None],
        "ph_valid": [True, True, True, False],
        "light_relative_pct": [40.0, 41.0, 42.0, 43.0],
        "light_valid": [True, True, True, True],
    })


def test_filter_valid_excludes_flagged_and_nan_rows():
    df = _df()
    valid = filter_valid(df, "temperature_c", "temperature_valid")
    assert valid["temperature_c"].tolist() == [25.0, 25.4]


def test_filter_valid_handles_missing_column():
    df = _df().drop(columns=["temperature_c"])
    assert filter_valid(df, "temperature_c", "temperature_valid").empty


def test_plot_series_writes_all_three_channels(tmp_path):
    written = plot_series(_df(), out_dir=tmp_path)
    names = {p.name for p in written}
    assert names == {"temperature.png", "ph.png", "light_relative.png"}


def test_empty_channel_is_skipped_not_fabricated(tmp_path):
    df = _df()
    df["light_valid"] = False
    written = plot_series(df, out_dir=tmp_path)
    assert "light_relative.png" not in {p.name for p in written}


def test_no_unsupported_measurement_labels():
    for _value_col, _flag_col, ylabel, _filename in SERIES:
        lowered = ylabel.lower()
        assert "lux" not in lowered
        assert "par" not in lowered
        assert "ppfd" not in lowered
