"""Bounded report formatter. Add an approved LLM provider later if desired."""
from __future__ import annotations
import pandas as pd

ALLOWED_MEASURED = ["temperature_c", "ph", "light_relative_pct"]
ALLOWED_MANUAL = ["manual_salinity_sg", "manual_ammonia_mg_l", "notes"]


def build_summary(df: pd.DataFrame, events: pd.DataFrame) -> str:
    if df.empty:
        return "No telemetry available."
    latest = df.iloc[-1]
    lines = ["Smart Tank observed-data summary:"]
    for col in ALLOWED_MEASURED:
        if col in df.columns and pd.notna(latest.get(col)):
            lines.append(f"- {col}: {latest[col]}")
    lines.append(f"- deterministic events: {len(events)}")
    lines.append("Boundary: ORP, EC, ZP4510 float state and flow are not measured in this hardware baseline.")
    return "\n".join(lines)
