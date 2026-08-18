import pandas as pd
from backend.rules.rules import detect_events


def test_normal_row_has_no_events():
    df = pd.DataFrame([{"timestamp_ms": 1, "temperature_c": 25.0, "ph": 8.2}])
    assert detect_events(df).empty


def test_temp_and_ph_outside_ranges_generate_events():
    df = pd.DataFrame([{"timestamp_ms": 2, "temperature_c": 29.0, "ph": 7.7}])
    out = detect_events(df)
    assert len(out) == 2
    assert set(out["reason"]) == {"temperature outside 24-27 C", "pH outside 8.0-8.4"}
