from pathlib import Path
import pandas as pd

RAW = Path("data/raw/reef_data.csv")
OUT = Path("data/clean/reef_data_clean.csv")

NUMERIC = ["timestamp_ms", "temperature_c", "ph", "ph_voltage_v", "light_relative_pct", "light_voltage_v"]

def clean() -> pd.DataFrame:
    df = pd.read_csv(RAW)
    for col in NUMERIC:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    # Preserve rows; flag invalid core sensor readings rather than deleting raw data.
    df["temperature_valid"] = df["temperature_c"].between(-10, 85, inclusive="both")
    df["ph_valid"] = df["ph"].between(0, 14, inclusive="both")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    return df

if __name__ == "__main__":
    print(clean().tail())
