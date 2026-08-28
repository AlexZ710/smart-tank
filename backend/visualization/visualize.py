"""Session 10: visualize temperature, pH and relative light from clean data.

Rules:
- Only readings flagged valid by `clean_data.py` are plotted; invalid or
  missing values never appear as if they were measurements.
- The light channel is labeled "Relative light (%)" - the PT550 is a
  relative signal. Charts must never claim lux/PAR/PPFD.
- XKC is not plotted; it is optional hardware and not part of the core
  visualization set.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # headless-safe backend for tests and scripts
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

DATA = Path("data/clean/reef_data_clean.csv")
FIGURES = Path("docs/figures")

# (value column, validity flag column, axis label, output file)
SERIES = [
    ("temperature_c", "temperature_valid", "Temperature (C)", "temperature.png"),
    ("ph", "ph_valid", "pH", "ph.png"),
    ("light_relative_pct", "light_valid", "Relative light (%)", "light_relative.png"),
]


def filter_valid(df: pd.DataFrame, value_col: str, flag_col: str) -> pd.DataFrame:
    """Rows whose validity flag is True and whose value is not NaN."""
    if value_col not in df.columns:
        return df.iloc[0:0]
    if flag_col in df.columns:
        mask = df[flag_col].fillna(False).astype(bool)
    else:
        mask = pd.Series(True, index=df.index)
    return df[mask & df[value_col].notna()]


def plot_series(df: pd.DataFrame, out_dir: Path = FIGURES) -> list[Path]:
    """Render each configured series; returns the files written."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    for value_col, flag_col, ylabel, filename in SERIES:
        valid = filter_valid(df, value_col, flag_col)
        if valid.empty:
            print(f"[viz] {value_col}: no valid rows - chart skipped.")
            continue

        fig, ax = plt.subplots(figsize=(10, 4))
        ax.plot(valid["timestamp_ms"], valid[value_col])
        ax.set_xlabel("ESP32 uptime (ms)")
        ax.set_ylabel(ylabel)
        ax.set_title(f"{value_col} (valid readings only)")
        fig.tight_layout()
        target = out_dir / filename
        fig.savefig(target, dpi=150)
        plt.close(fig)
        written.append(target)

    return written


def main() -> None:
    df = pd.read_csv(DATA)
    written = plot_series(df)
    for path in written:
        print(f"[viz] wrote {path}")


if __name__ == "__main__":
    main()
