from __future__ import annotations
import pandas as pd


def detect_events(df: pd.DataFrame) -> pd.DataFrame:
    events: list[dict] = []
    for _, row in df.iterrows():
        ts = row.get("timestamp_ms")
        temp = row.get("temperature_c")
        ph = row.get("ph")
        if pd.isna(temp):
            events.append({"timestamp_ms": ts, "severity": "warning", "reason": "missing temperature"})
        elif temp < 24.0 or temp > 27.0:
            events.append({"timestamp_ms": ts, "severity": "warning", "reason": "temperature outside 24-27 C"})
        if pd.isna(ph):
            events.append({"timestamp_ms": ts, "severity": "warning", "reason": "missing pH"})
        elif ph < 8.0 or ph > 8.4:
            events.append({"timestamp_ms": ts, "severity": "warning", "reason": "pH outside 8.0-8.4"})
    return pd.DataFrame(events, columns=["timestamp_ms", "severity", "reason"])
