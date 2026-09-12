"""Session 16: append-only manual-measurement ledger (EXP04/EXP05).

Backs the manual-only metrics: salinity SG, ammonia, nitrite, structured
observation scores and operator notes. The CSV ledger mirrors the
`manual_measurements` table in database/schema.sql:

    measured_at, experiment_id, metric_name, value, unit, method, operator_note

Integrity rules:
- Append-only: existing rows are never modified or deleted.
- No invented data: every row requires a real value, unit and method from
  the operator; the tool refuses incomplete rows.
- No forbidden-sensor metrics: metric names containing ORP / EC /
  conductivity / flow / float terms are rejected - those parameters are
  absent from the hardware baseline and must not enter the data model,
  even as "manual" entries.
- Salinity/ammonia are manual-only by design; nothing here derives values
  from telemetry.
"""
from __future__ import annotations

import argparse
import csv
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

LEDGER = Path("data/manual/manual_measurements.csv")

COLUMNS = ["measured_at", "experiment_id", "metric_name", "value",
           "unit", "method", "operator_note"]

# Known manual metrics -> canonical unit (extensible; warnings only).
METRIC_UNITS = {
    "salinity_sg": "SG",
    "ammonia_mg_l": "mg/L",
    "nitrite_mg_l": "mg/L",
    "observation_score": "score",
    "note": "",
    "topoff_ml": "mL",
    "water_change_l": "L",
    "feeding_g": "g",
}

FORBIDDEN_METRIC_TERMS = (
    "orp", "conductivity", "ec_", "_ec", "flow", "float",
    "zp4510", "fs300a", "par", "lux", "ppfd",
)


def _validate(metric: str, value: float, unit: str, method: str) -> None:
    lowered = metric.lower()
    for term in FORBIDDEN_METRIC_TERMS:
        if term in lowered:
            raise ValueError(
                f"metric '{metric}' rejected: forbidden-sensor term '{term}' "
                "(absent from hardware baseline; not even manual)")
    expected = METRIC_UNITS.get(lowered)
    if expected is not None and unit != expected:
        print(f"WARNING: unit '{unit}' differs from canonical '{expected}' "
              f"for {metric}")
    if method.strip() == "" and lowered != "note":
        raise ValueError("method is mandatory (instrument/kit/checklist name)")
    if pd.isna(value):
        raise ValueError("value must be a real number - no invented data")


def load(ledger_path: Path = LEDGER) -> pd.DataFrame:
    if not ledger_path.exists():
        return pd.DataFrame(columns=COLUMNS)
    return pd.read_csv(ledger_path, dtype={"operator_note": str})


def add(metric: str, value: float, unit: str, method: str,
        experiment_id: str = "", operator_note: str = "",
        measured_at: str | None = None, ledger_path: Path = LEDGER) -> dict:
    """Append one validated row; returns the row dict."""
    _validate(metric, value, unit, method)
    row = {
        "measured_at": measured_at or datetime.now().astimezone().isoformat(
            timespec="seconds"),
        "experiment_id": experiment_id,
        "metric_name": metric,
        "value": value,
        "unit": unit,
        "method": method,
        "operator_note": operator_note,
    }
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    new_file = not ledger_path.exists()
    with ledger_path.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS)
        if new_file:
            writer.writeheader()
        writer.writerow(row)
    return row


def summary(ledger_path: Path = LEDGER) -> str:
    df = load(ledger_path)
    if df.empty:
        return "Manual ledger is empty - no entries recorded yet."
    lines = [f"Manual ledger: {len(df)} rows"]
    for metric, group in df.groupby("metric_name"):
        vals = pd.to_numeric(group["value"], errors="coerce").dropna()
        if vals.empty:
            lines.append(f"- {metric}: {len(group)} rows (non-numeric)")
        else:
            lines.append(
                f"- {metric}: {len(group)} rows, latest {vals.iloc[-1]:g} "
                f"{group['unit'].iloc[-1]}, min {vals.min():g}, "
                f"max {vals.max():g}")
    return "\n".join(lines)


def _re_float(text: str) -> float:
    if not re.fullmatch(r"-?\d+(\.\d+)?([eE][-+]?\d+)?", text.strip()):
        raise argparse.ArgumentTypeError(f"not a plain number: {text!r}")
    return float(text)


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Append-only manual measurement ledger (manual-only metrics).")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_add = sub.add_parser("add", help="append one manual measurement row")
    p_add.add_argument("--metric", required=True)
    p_add.add_argument("--value", required=True, type=_re_float)
    p_add.add_argument("--unit", required=True)
    p_add.add_argument("--method", required=True)
    p_add.add_argument("--experiment-id", default="")
    p_add.add_argument("--note", default="")
    p_add.add_argument("--at", default=None,
                       help="ISO timestamp override (default: now, local tz)")

    sub.add_parser("list", help="print the ledger")
    sub.add_parser("summary", help="print per-metric summary")

    args = ap.parse_args()
    if args.cmd == "add":
        row = add(args.metric, args.value, args.unit, args.method,
                  experiment_id=args.experiment_id,
                  operator_note=args.note, measured_at=args.at)
        print(f"appended: {row}")
    elif args.cmd == "list":
        df = load()
        print(df.to_string(index=False) if not df.empty
              else "Manual ledger is empty.")
    else:
        print(summary())


if __name__ == "__main__":
    main()
