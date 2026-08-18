from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

DATA = Path("data/clean/reef_data_clean.csv")
FIGURES = Path("docs/figures")


def main() -> None:
    df = pd.read_csv(DATA)
    FIGURES.mkdir(parents=True, exist_ok=True)
    for col, ylabel, filename in [
        ("temperature_c", "Temperature (C)", "temperature.png"),
        ("ph", "pH", "ph.png"),
        ("light_relative_pct", "Relative light (%)", "light_relative.png"),
    ]:
        if col not in df.columns:
            continue
        fig, ax = plt.subplots(figsize=(10, 4))
        ax.plot(df["timestamp_ms"], df[col])
        ax.set_xlabel("ESP32 uptime (ms)")
        ax.set_ylabel(ylabel)
        ax.set_title(col)
        fig.tight_layout()
        fig.savefig(FIGURES/filename, dpi=150)
        plt.close(fig)

if __name__ == "__main__":
    main()
