"""Hardware-free DRY-RUN of the full pipeline on SYNTHETIC mock data.

Runs: mock generator -> clean -> rules -> stability metrics, for the
`baseline` and `sensor_faults` scenarios. Every input is clearly-labeled
mock data (scripts/generate_mock_telemetry.py); nothing here is an
experimental result, and all outputs stay under gitignored `data/mock/`.

Usage (repo root, conda env `reef`):
    python scripts/dryrun_pipeline_mock.py
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.analysis.stability import analyze
from backend.collector.clean_data import clean
from backend.rules.rules import run as run_rules
from backend.visualization.visualize import plot_series
from scripts.generate_mock_telemetry import generate, generate_manual

MOCK = Path("data/mock")


def main() -> None:
    MOCK.mkdir(parents=True, exist_ok=True)
    print("=" * 70)
    print("DRY-RUN ON SYNTHETIC MOCK DATA - NOT REAL TELEMETRY - NOT RESULTS")
    print("=" * 70)

    for name, scenario, rows in (("baseline", "baseline", 120),
                                 ("faults", "sensor_faults", 40),
                                 ("excursion", "temp_excursion", 180)):
        raw = MOCK / f"mock_raw_{name}.csv"
        raw.write_text("\n".join(generate(scenario, rows)) + "\n",
                       encoding="utf-8")
        cleaned = clean(raw, MOCK / f"mock_clean_{name}.csv")
        events = run_rules(MOCK / f"mock_clean_{name}.csv",
                           MOCK / f"mock_events_{name}.csv")
        metrics = analyze(cleaned, events, label=f"MOCK-DRYRUN-{name}")
        print(f"--- mock {name}: rows={len(cleaned)} events={len(events)} ---")
        cols = ["label", "metric", "channel", "valid_rows", "valid_pct",
                "mean", "std", "min", "max"]
        print(metrics[[c for c in cols if c in metrics.columns]]
              .to_string(index=False))
        charts = plot_series(cleaned, out_dir=MOCK)
        print(f"charts (MOCK, stay in data/mock): {[p.name for p in charts]}")
        print()

    manual_path = MOCK / "mock_manual.csv"
    manual_path.write_text("\n".join(generate_manual()) + "\n", encoding="utf-8")
    manual = pd.read_csv(manual_path)
    print(f"mock manual rows: {len(manual)} "
          f"metrics={sorted(manual.metric_name.unique())}")
    print("\nDry-run complete. Outputs under data/mock/ (gitignored) must "
          "never be copied into data/raw, experiments/results or reports.")


if __name__ == "__main__":
    main()
