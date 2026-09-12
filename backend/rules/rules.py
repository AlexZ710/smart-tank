"""Session 11: deterministic rule engine for temperature / pH / missing data.

Design contract:
- Deterministic: identical input rows always produce identical events
  (same order, same codes, same messages). No randomness, no wall-clock.
- Bounded to the measured baseline channels only: DS18B20 temperature and
  SEN0161-V2 pH. Relative light (PT550) is informational and generates no
  alert rules. The optional XKC level state passes through untouched; the
  engine never depends on it. No flow, ORP, EC or float-switch rules exist
  (those sensors are absent/forbidden in this hardware baseline).
- Cleaning-aware: if `*_valid` flag columns are present (produced by
  backend/collector/clean_data.py), a flagged-invalid reading raises an
  INVALID event instead of being range-checked.
- Output columns align with the `events` table in database/schema.sql
  (severity / rule_code / message-as-reason, keyed by timestamp_ms).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

CLEAN = Path("data/clean/reef_data_clean.csv")
EVENTS_OUT = Path("data/events/events.csv")

# Documented thresholds. Warning band = healthy reef range for a 5 L tank;
# critical band = outside plausible-safe limits, escalate severity.
TEMP_WARN = (24.0, 27.0)     # C
TEMP_CRIT = (20.0, 32.0)     # C
PH_WARN = (8.0, 8.4)
PH_CRIT = (7.0, 9.0)

EVENT_COLUMNS = ["timestamp_ms", "severity", "rule_code", "reason"]

# Rule specifications, evaluated in this fixed order for every row.
CHANNELS = (
    {
        "col": "temperature_c",
        "flag": "temperature_valid",
        "label": "temperature",
        "unit": "C",
        "prefix": "TEMP",
        "warn": TEMP_WARN,
        "crit": TEMP_CRIT,
    },
    {
        "col": "ph",
        "flag": "ph_valid",
        "label": "pH",
        "unit": "",
        "prefix": "PH",
        "warn": PH_WARN,
        "crit": PH_CRIT,
    },
)


def _band_text(label: str, unit: str, lo: float, hi: float) -> str:
    unit_suffix = f" {unit}" if unit else ""
    return f"{label} outside {lo:g}-{hi:g}{unit_suffix}"


def _channel_events(ts, value, valid: bool, spec: dict) -> list[dict]:
    """Evaluate one channel of one row; returns 0 or 1 events (deterministic)."""
    label, unit, prefix = spec["label"], spec["unit"], spec["prefix"]

    if not valid:
        return [{
            "timestamp_ms": ts,
            "severity": "warning",
            "rule_code": f"{prefix}_INVALID",
            "reason": f"invalid {label} reading (flagged by cleaning)",
        }]
    if pd.isna(value):
        return [{
            "timestamp_ms": ts,
            "severity": "warning",
            "rule_code": f"{prefix}_MISSING",
            "reason": f"missing {label}",
        }]

    crit_lo, crit_hi = spec["crit"]
    if value < crit_lo or value > crit_hi:
        return [{
            "timestamp_ms": ts,
            "severity": "critical",
            "rule_code": f"{prefix}_CRITICAL",
            "reason": _band_text(label, unit, crit_lo, crit_hi) + " (critical)",
        }]

    warn_lo, warn_hi = spec["warn"]
    if value < warn_lo or value > warn_hi:
        return [{
            "timestamp_ms": ts,
            "severity": "warning",
            "rule_code": f"{prefix}_OUT_OF_RANGE",
            "reason": _band_text(label, unit, warn_lo, warn_hi),
        }]

    return []


def detect_events(df: pd.DataFrame) -> pd.DataFrame:
    """Return all rule events for a cleaned-readings DataFrame.

    Deterministic: rows are processed in order; within a row, channels are
    processed in CHANNELS order. Columns absent from the input are skipped
    (never fabricated).
    """
    events: list[dict] = []
    for _, row in df.iterrows():
        ts = row.get("timestamp_ms")
        for spec in CHANNELS:
            if spec["col"] not in df.columns:
                continue  # absent channel -> no events, no invention
            value = row.get(spec["col"])
            if pd.notna(value):
                value = float(value)
            # A present validity flag is authoritative (cleaning rejected the
            # reading). Without the flag column, NaN simply means MISSING.
            flag = spec["flag"]
            valid = bool(row.get(flag, True)) if flag in df.columns else True
            events.extend(_channel_events(ts, value, valid, spec))
    return pd.DataFrame(events, columns=EVENT_COLUMNS)


def run(clean_path: Path = CLEAN, out_path: Path = EVENTS_OUT) -> pd.DataFrame:
    """Read the cleaned CSV, detect events, write them append-friendly CSV."""
    df = pd.read_csv(clean_path)
    events = detect_events(df)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    events.to_csv(out_path, index=False)
    return events


def main() -> None:
    events = run()
    print(f"Events written to {EVENTS_OUT}: {len(events)}")
    if not events.empty:
        print(events.groupby(["severity", "rule_code"]).size().to_string())
        print(events.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
