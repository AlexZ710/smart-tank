"""Session 15: response/recovery metrics shared by EXP02 and EXP03.

Computes, from VALID readings only (honoring *_valid flags):
- pre-segment statistics before an intervention index;
- maximum absolute rate of change per 10 minutes;
- peak deviation from the pre-segment mean and its time offset;
- recovery time: peak until the series re-enters a target band and holds
  for a required duration.

Integrity: metrics are derived exclusively from the input series; an empty
or all-invalid series yields None values (never fabricated numbers).
"""
from __future__ import annotations

import pandas as pd

RATE_WINDOW_MIN = 10.0


def valid_series(df: pd.DataFrame, col: str, flag: str) -> pd.DataFrame:
    """timestamp_ms + value rows where the validity flag is True."""
    if col not in df.columns:
        return pd.DataFrame(columns=["timestamp_ms", col])
    mask = df[flag].astype(bool) if flag in df.columns else df[col].notna()
    out = df.loc[mask, ["timestamp_ms", col]].copy()
    out[col] = pd.to_numeric(out[col], errors="coerce")
    return out.dropna().reset_index(drop=True)


def pre_segment_stats(series: pd.DataFrame, col: str,
                      intervention_ts: float) -> dict:
    pre = series[series["timestamp_ms"] < intervention_ts][col]
    if pre.empty:
        return {"pre_mean": None, "pre_std": None, "pre_rows": 0}
    return {
        "pre_mean": round(float(pre.mean()), 3),
        "pre_std": round(float(pre.std(ddof=0)), 3) if len(pre) > 1 else 0.0,
        "pre_rows": int(len(pre)),
    }


def max_rate_per_10min(series: pd.DataFrame, col: str,
                       interval_ms: int = 1000) -> float | None:
    """Max |delta| across a rolling 10-minute window of valid readings."""
    if len(series) < 2:
        return None
    step_ms = RATE_WINDOW_MIN * 60 * 1000
    ts = series["timestamp_ms"].to_numpy(dtype=float)
    vals = series[col].to_numpy(dtype=float)
    worst = None
    j = 0
    for i in range(len(ts)):
        while ts[i] - ts[j] > step_ms:
            j += 1
        if i == j:
            continue
        rate = abs(vals[i] - vals[j])  # change across <= 10 min
        if worst is None or rate > worst:
            worst = rate
    return round(float(worst), 3) if worst is not None else None


def peak_deviation(series: pd.DataFrame, col: str, pre_mean: float,
                   intervention_ts: float) -> dict:
    post = series[series["timestamp_ms"] >= intervention_ts]
    if post.empty or pre_mean is None:
        return {"peak_delta": None, "peak_ts": None, "time_to_peak_min": None}
    deltas = (post[col] - pre_mean).abs()
    idx = int(deltas.idxmax())
    peak_ts = float(post.loc[idx, "timestamp_ms"])
    peak_delta = float(post.loc[idx, col] - pre_mean)
    return {
        "peak_delta": round(peak_delta, 3),
        "peak_ts": peak_ts,
        "time_to_peak_min": round((peak_ts - intervention_ts) / 60000.0, 2),
    }


def recovery_time_min(series: pd.DataFrame, col: str, peak_ts: float,
                      band: tuple[float, float], hold_min: float = 30.0,
                      interval_ms: int = 1000) -> float | None:
    """Minutes from peak until the value re-enters `band` and holds there.

    Hold is measured as (n_consecutive_in_band - 1) * interval >= hold_min.
    Returns None if recovery never completes within the series.
    """
    post = series[series["timestamp_ms"] >= peak_ts].reset_index(drop=True)
    if post.empty:
        return None
    lo, hi = band
    in_band = (post[col] >= lo) & (post[col] <= hi)
    run = 0
    hold_rows = int(hold_min * 60 * 1000 // interval_ms) + 1
    for i, ok in enumerate(in_band):
        run = run + 1 if ok else 0
        if run >= hold_rows:
            entry_i = i - run + 1
            return round(float(post.loc[entry_i, "timestamp_ms"] - peak_ts)
                         / 60000.0, 2)
    return None


def response_report(df: pd.DataFrame, col: str, flag: str,
                    intervention_ts: float, band: tuple[float, float],
                    hold_min: float = 30.0, interval_ms: int = 1000) -> dict:
    """All EXP02/EXP03-style metrics for one channel in one call."""
    series = valid_series(df, col, flag)
    stats = pre_segment_stats(series, col, intervention_ts)
    peak = peak_deviation(series, col, stats["pre_mean"], intervention_ts)
    recovery = None
    if peak["peak_ts"] is not None:
        recovery = recovery_time_min(series, col, peak["peak_ts"], band,
                                     hold_min, interval_ms)
    return {
        "channel": col,
        **stats,
        "max_rate_per_10min": max_rate_per_10min(series, col, interval_ms),
        **peak,
        "recovery_time_min": recovery,
    }
