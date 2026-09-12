"""Session 13: baseline stability metrics for EXP01 (and reuse in S14-S17).

Computes per-channel descriptive statistics over VALID readings only
(honoring the cleaning layer's *_valid flags), completeness against the
expected 1 Hz sampling window, and deterministic-event counts.

Integrity rules:
- No invented telemetry: metrics come exclusively from the input frames;
  absent channels yield no rows (never fabricated zeros).
- Relative light is descriptive only; no stability criterion is applied to
  it and it is never expressed as lux/PAR/PPFD.
- The optional XKC level state is reported as state counts only when real
  0/1 states exist.
- This module does not decide pass/fail on its own; EXP01 acceptance is
  evaluated against the criteria written in experiments/EXP01_BASELINE.md.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

CLEAN = Path("data/clean/reef_data_clean.csv")
EVENTS = Path("data/events/events.csv")

# value column, validity flag, reported label
CHANNELS = (
    ("temperature_c", "temperature_valid", "temperature_c"),
    ("ph", "ph_valid", "ph"),
    ("light_relative_pct", "light_valid", "light_relative_pct"),
)

EXPECTED_INTERVAL_MS = 1000  # integrated monitor samples at 1 Hz


def channel_stats(df: pd.DataFrame, col: str, flag: str | None) -> dict | None:
    """Descriptive stats over valid readings; None if the channel is absent."""
    if col not in df.columns:
        return None
    if flag and flag in df.columns:
        series = pd.to_numeric(
            df.loc[df[flag].astype(bool), col], errors="coerce").dropna()
        total_rows = len(df)
    else:
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        total_rows = len(df)
    stats = {
        "channel": col,
        "total_rows": total_rows,
        "valid_rows": int(len(series)),
        "valid_pct": round(100.0 * len(series) / total_rows, 2) if total_rows else 0.0,
    }
    if series.empty:
        stats.update({"mean": None, "std": None, "min": None, "max": None})
    else:
        stats.update({
            "mean": round(float(series.mean()), 3),
            "std": round(float(series.std(ddof=0)), 3) if len(series) > 1 else 0.0,
            "min": round(float(series.min()), 3),
            "max": round(float(series.max()), 3),
        })
    return stats


def completeness(df: pd.DataFrame) -> dict:
    """Compare captured span against the expected 1 Hz row count."""
    if df.empty or "timestamp_ms" not in df.columns:
        return {"span_ms": 0, "expected_rows": 0, "actual_rows": 0,
                "completeness_pct": None}
    ts = pd.to_numeric(df["timestamp_ms"], errors="coerce").dropna()
    if ts.empty:
        return {"span_ms": 0, "expected_rows": 0, "actual_rows": 0,
                "completeness_pct": None}
    span_ms = float(ts.max() - ts.min())
    expected = int(span_ms // EXPECTED_INTERVAL_MS) + 1
    actual = int(len(ts))
    return {
        "span_ms": int(span_ms),
        "expected_rows": expected,
        "actual_rows": actual,
        "completeness_pct": round(100.0 * actual / expected, 2) if expected else None,
    }


def event_counts(events: pd.DataFrame | None) -> dict:
    """Counts by severity and rule_code from the deterministic engine."""
    out: dict = {"total": 0, "critical": 0, "warning": 0, "by_rule_code": {}}
    if events is None or events.empty:
        return out
    out["total"] = int(len(events))
    if "severity" in events.columns:
        sev = events["severity"].astype(str).str.lower()
        out["critical"] = int((sev == "critical").sum())
        out["warning"] = int((sev == "warning").sum())
    if "rule_code" in events.columns:
        out["by_rule_code"] = {
            str(k): int(v) for k, v in events.groupby("rule_code").size().items()
        }
    return out


def xkc_state_counts(df: pd.DataFrame) -> dict | None:
    """0/1 state counts; None when the optional sensor produced no states."""
    if "xkc_level_state" not in df.columns:
        return None
    states = df["xkc_level_state"].astype(str).str.strip()
    present = states[states.isin({"0", "1"})]
    if present.empty:
        return None
    return {"dry_0": int((present == "0").sum()),
            "wet_1": int((present == "1").sum())}


def analyze(df: pd.DataFrame, events: pd.DataFrame | None,
            label: str = "EXP01") -> pd.DataFrame:
    """Full metrics frame: one row per present channel + a completeness row."""
    rows: list[dict] = []
    for col, flag, _name in CHANNELS:
        stats = channel_stats(df, col, flag)
        if stats is not None:
            rows.append({"label": label, "metric": "channel", **stats})
    rows.append({"label": label, "metric": "completeness", **completeness(df)})
    ec = event_counts(events)
    rows.append({
        "label": label, "metric": "events", "channel": None,
        "total_rows": None, "valid_rows": None, "valid_pct": None,
        "mean": None, "std": None, "min": None, "max": None,
        "events_total": ec["total"], "events_critical": ec["critical"],
        "events_warning": ec["warning"],
        "by_rule_code": str(ec["by_rule_code"]) if ec["by_rule_code"] else None,
    })
    xkc = xkc_state_counts(df)
    if xkc is not None:
        rows.append({
            "label": label, "metric": "xkc_optional", "channel": "xkc_level_state",
            "total_rows": len(df), "valid_rows": xkc["dry_0"] + xkc["wet_1"],
            "valid_pct": None, "mean": None, "std": None,
            "min": xkc["dry_0"], "max": xkc["wet_1"],
        })
    return pd.DataFrame(rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Baseline stability metrics (valid readings only).")
    ap.add_argument("--clean", type=Path, default=CLEAN)
    ap.add_argument("--events", type=Path, default=EVENTS)
    ap.add_argument("--label", default="EXP01")
    ap.add_argument("--out", type=Path, default=None,
                    help="optional metrics CSV path (e.g. experiments/results/EXP01/metrics.csv)")
    args = ap.parse_args()

    df = pd.read_csv(args.clean) if args.clean.exists() else pd.DataFrame()
    events = (pd.read_csv(args.events) if args.events.exists()
              else pd.DataFrame(columns=["timestamp_ms", "severity", "rule_code", "reason"]))
    metrics = analyze(df, events, label=args.label)
    print(metrics.to_string(index=False))
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        metrics.to_csv(args.out, index=False)
        print(f"\nmetrics written -> {args.out}")


if __name__ == "__main__":
    main()
