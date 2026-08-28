"""Session 10: clean missing/invalid readings while PRESERVING raw data.

Rules:
- Raw rows are never deleted. Invalid readings are coerced to NaN and flagged
  with *_valid columns so downstream layers (rules, charts, reports) can
  decide what to use.
- Validity ranges follow the measurement boundary
  (docs/measurement_boundary.md): temperature from the DS18B20, pH from the
  SEN0161-V2, relative light from the PT550 (0-100 %; never lux/PAR/PPFD).
- The optional XKC field (`xkc_level_state`: NA/0/1) passes through
  untouched; the pipeline works when it is absent.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

RAW = Path("data/raw/reef_data.csv")
OUT = Path("data/clean/reef_data_clean.csv")

NUMERIC = [
    "timestamp_ms", "temperature_c", "ph", "ph_voltage_v",
    "light_relative_pct", "light_voltage_v",
]

TEMPERATURE_RANGE = (-10.0, 85.0)   # plausible DS18B20 range for a tank
PH_RANGE = (0.0, 14.0)               # physical pH bounds
LIGHT_RANGE = (0.0, 100.0)           # relative percent is clamped by design


def clean(raw_path: Path = RAW, out_path: Path = OUT) -> pd.DataFrame:
    """Read raw CSV, coerce/flag invalid values, preserve every row."""
    df = pd.read_csv(raw_path)

    for col in NUMERIC:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Flag validity without deleting rows - raw data is preserved.
    if "temperature_c" in df.columns:
        df["temperature_valid"] = df["temperature_c"].between(
            *TEMPERATURE_RANGE, inclusive="both")
    if "ph" in df.columns:
        df["ph_valid"] = df["ph"].between(*PH_RANGE, inclusive="both")
    if "light_relative_pct" in df.columns:
        df["light_valid"] = df["light_relative_pct"].between(
            *LIGHT_RANGE, inclusive="both")

    # Optional XKC column: keep as collected (NA/0/1); no dependency on it.
    # pandas parses the literal "NA" as missing and 0/1 as floats, so map the
    # column back to its contracted string values.
    if "xkc_level_state" in df.columns:
        df["xkc_level_state"] = (
            df["xkc_level_state"]
            .map(lambda v: "NA" if pd.isna(v) else str(v).strip())
            .str.replace(r"\.0$", "", regex=True)
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    return df


def main() -> None:
    df = clean()
    print(f"Rows preserved: {len(df)}")
    for flag in ("temperature_valid", "ph_valid", "light_valid"):
        if flag in df.columns:
            print(f"  {flag}: {int(df[flag].sum())}/{len(df)} valid")
    print(df.tail())


if __name__ == "__main__":
    main()
