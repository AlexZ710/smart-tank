"""Session 17: regenerate docs/results_table.csv reproducibly.

The table is DERIVED data: it is rebuilt from the real pipeline outputs
(data/clean, data/events, data/manual ledger) every run. If a source does
not exist or holds no rows, the affected cells read PENDING - values are
never invented, and mock data (data/mock) is never read by this script.

Usage (repo root, conda env `reef`):
    python scripts/make_results.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow direct execution (python scripts/make_results.py) from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd

from backend.analysis.manual_log import load as load_manual
from backend.analysis.stability import analyze
from backend.rules.rules import detect_events

CLEAN = Path("data/clean/reef_data_clean.csv")
EVENTS = Path("data/events/events.csv")
OUT = Path("docs/results_table.csv")

COLUMNS = ["item", "metric", "value", "unit", "source", "status"]

PENDING = "PENDING"


def _rows() -> list[dict]:
    rows: list[dict] = []

    # Telemetry-derived rows (EXP01/EXP02/EXP03 context).
    if CLEAN.exists():
        df = pd.read_csv(CLEAN)
    else:
        df = pd.DataFrame()
    if not df.empty:
        events = (pd.read_csv(EVENTS) if EVENTS.exists()
                  else detect_events(df))
        metrics = analyze(df, events, label="RESULTS")
        for _, m in metrics.iterrows():
            if m["metric"] == "channel":
                for key in ("mean", "std", "min", "max", "valid_pct"):
                    rows.append({
                        "item": m["channel"], "metric": key,
                        "value": m.get(key, PENDING),
                        "unit": {"valid_pct": "%"}.get(key, ""),
                        "source": str(CLEAN), "status": "computed",
                    })
            elif m["metric"] == "completeness":
                rows.append({
                    "item": "capture", "metric": "completeness_pct",
                    "value": m.get("completeness_pct", PENDING), "unit": "%",
                    "source": str(CLEAN), "status": "computed",
                })
            elif m["metric"] == "events":
                rows.append({
                    "item": "deterministic_events", "metric": "total",
                    "value": m.get("events_total", 0), "unit": "count",
                    "source": str(EVENTS), "status": "computed",
                })
    else:
        for item in ("temperature_c", "ph", "light_relative_pct", "capture"):
            rows.append({"item": item, "metric": "summary",
                         "value": "", "unit": "",
                         "source": str(CLEAN),
                         "status": PENDING + " (no real telemetry captured)"})

    # Manual ledger rows (EXP04/EXP05 context).
    manual = load_manual()
    if not manual.empty:
        for metric, group in manual.groupby("metric_name"):
            vals = pd.to_numeric(group["value"], errors="coerce").dropna()
            rows.append({
                "item": str(metric), "metric": "manual_latest",
                "value": vals.iloc[-1] if not vals.empty else "",
                "unit": group["unit"].iloc[-1],
                "source": "data/manual/manual_measurements.csv",
                "status": "recorded (manual)",
            })
    else:
        for item in ("salinity_sg", "ammonia_mg_l", "observation_score"):
            rows.append({"item": item, "metric": "manual_latest",
                         "value": "", "unit": "",
                         "source": "data/manual/manual_measurements.csv",
                         "status": PENDING + " (no manual entries yet)"})

    # Experiment run status (all pending hardware/tank as of S17).
    for exp, note in (
        ("EXP01_baseline", "protocol prepared; run pending hardware"),
        ("EXP02_temp_response", "design complete; run pending hardware"),
        ("EXP03_ph_perturbation", "design complete; run pending hardware"),
        ("EXP04_salinity_drift", "protocol prepared; campaign pending tank"),
        ("EXP05_organic_load", "protocol prepared; campaign pending tank"),
    ):
        rows.append({"item": exp, "metric": "run_status", "value": note,
                     "unit": "", "source": "experiments/",
                     "status": PENDING})
    return rows


def main() -> None:
    table = pd.DataFrame(_rows(), columns=COLUMNS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    table.to_csv(OUT, index=False)
    print(f"wrote {OUT} ({len(table)} rows)")
    print(table.to_string(index=False))


if __name__ == "__main__":
    main()
