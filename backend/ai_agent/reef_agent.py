"""Session 12: bounded AI report agent.

Hard boundaries (see docs/prompt_boundary.md for the normative rules):
- Input vocabulary: only the allowed measured columns (DS18B20 temperature,
  SEN0161-V2 pH, PT550 relative light, optional XKC level state), manual
  measurement records, and deterministic rule events from backend/rules.
  Input columns matching forbidden sensors (ORP, EC/conductivity, flow,
  ZP4510/FS300A-style float switches) are REJECTED with a ValueError - they
  are absent from this hardware baseline and must never reach a report.
- Output: descriptive summaries of observed data plus candidate
  recommendations. EVERY recommendation carries
  `requires_human_confirmation=True` and is rendered under a
  "[REQUIRES HUMAN CONFIRMATION]" marker. Nothing is ever executed,
  dosed or switched by this module.
- No invented telemetry: empty input yields "No telemetry available."
- No LLM provider is connected in this session. `build_llm_prompt()`
  produces the exact bounded prompt text an approved provider may later
  receive; it embeds only data that passed the input guard.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

CLEAN = Path("data/clean/reef_data_clean.csv")
EVENTS = Path("data/events/events.csv")

ALLOWED_MEASURED = ["temperature_c", "ph", "light_relative_pct"]
OPTIONAL_MEASURED = ["xkc_level_state"]  # nullable; XKC sensor may be absent
ALLOWED_MANUAL = ["manual_salinity_sg", "manual_ammonia_mg_l", "notes"]
ALLOWED_FLAGS = ["temperature_valid", "ph_valid", "light_valid", "timestamp_ms"]

# Lowercase substrings that must never appear in an input column name.
# Presence indicates forbidden-sensor telemetry -> refuse the input.
FORBIDDEN_INPUT_TERMS = (
    "orp", "conductivity", "ec_us", "ec_ms", "_ec_", "flow",
    "zp4510", "fs300a", "float_switch", "float-state", "salinity_probe",
)

# Candidate recommendations keyed by deterministic rule_code. Observation /
# verification actions only - never dosing, never mains switching, never
# automatic intervention. Every entry requires human confirmation.
RECOMMENDATION_MAP = {
    "TEMP_MISSING": "Check DS18B20 wiring/probe on GPIO4 and collect a fresh reading before drawing conclusions.",
    "TEMP_INVALID": "A temperature reading failed plausibility cleaning; verify the DS18B20 probe and wiring, then re-measure.",
    "TEMP_OUT_OF_RANGE": "Verify tank temperature manually with a reference thermometer and inspect heater/fan settings.",
    "TEMP_CRITICAL": "URGENTLY verify temperature manually with a reference thermometer and inspect heating/cooling equipment. Manual intervention only - no automatic dosing or mains switching.",
    "PH_MISSING": "Check the SEN0161-V2 / ADS1115 (A1) wiring and collect a fresh reading.",
    "PH_INVALID": "A pH reading failed plausibility cleaning; verify sensor wiring and calibration state, then re-measure.",
    "PH_OUT_OF_RANGE": "Confirm pH calibration with fresh 7.00/4.00 buffers (docs/ph_calibration_log.md) and re-measure before any intervention.",
    "PH_CRITICAL": "URGENTLY confirm pH calibration with fresh buffers and re-measure. Manual intervention only - no automatic dosing.",
}

CONFIRMATION_MARKER = "[REQUIRES HUMAN CONFIRMATION]"

BOUNDARY_STATEMENT = (
    "Boundary: ORP, EC/conductivity, ZP4510 float state, FS300A flow and any "
    "other unlisted parameter are NOT measured in this hardware baseline. "
    "Salinity and ammonia exist only as manual measurements. Nothing in this "
    "report may be acted on automatically."
)


def guard_columns(df: pd.DataFrame) -> None:
    """Reject input frames carrying forbidden-sensor columns."""
    offenders = [
        col for col in df.columns
        if any(term in str(col).lower() for term in FORBIDDEN_INPUT_TERMS)
    ]
    if offenders:
        raise ValueError(
            "Forbidden-sensor columns rejected (absent from hardware "
            f"baseline): {offenders}"
        )


def _channel_stats(df: pd.DataFrame, col: str, flag: str | None) -> str | None:
    """Latest + min/max/mean over valid rows only; None if channel absent."""
    if col not in df.columns:
        return None
    series = pd.to_numeric(df[col], errors="coerce").dropna()
    if flag and flag in df.columns:
        series = pd.to_numeric(
            df.loc[df[flag].astype(bool), col], errors="coerce").dropna()
    if series.empty:
        return "no valid readings in window"
    latest = series.iloc[-1]
    if len(series) == 1:
        return f"latest {latest:g} (1 valid reading)"
    return (f"latest {latest:g}, min {series.min():g}, "
            f"max {series.max():g}, mean {series.mean():.2f} "
            f"({len(series)} valid readings)")


def propose_recommendations(events: pd.DataFrame) -> list[dict]:
    """Map deterministic rule_codes to candidate recommendations.

    Every entry is flagged as requiring human confirmation. Order follows
    first appearance in the events frame; duplicates are collapsed.
    """
    recs: list[dict] = []
    seen: set[str] = set()
    if events is None or events.empty or "rule_code" not in events.columns:
        return recs
    for code in events["rule_code"]:
        code = str(code)
        if code in seen or code not in RECOMMENDATION_MAP:
            continue
        seen.add(code)
        recs.append({
            "rule_code": code,
            "suggestion": RECOMMENDATION_MAP[code],
            "requires_human_confirmation": True,
        })
    return recs


def build_summary(
    df: pd.DataFrame,
    events: pd.DataFrame,
    manual: pd.DataFrame | None = None,
) -> str:
    """Descriptive summary built ONLY from allowed observed/manual data."""
    guard_columns(df)
    if manual is not None:
        guard_columns(manual)

    if df.empty:
        return "No telemetry available. " + BOUNDARY_STATEMENT

    lines = ["Smart Tank observed-data summary:"]
    flags = {"temperature_c": "temperature_valid", "ph": "ph_valid",
             "light_relative_pct": "light_valid"}
    labels = {"temperature_c": "Temperature (C)", "ph": "pH",
              "light_relative_pct": "Relative light (%)"}
    for col in ALLOWED_MEASURED:
        stats = _channel_stats(df, col, flags.get(col))
        if stats is not None:
            lines.append(f"- {labels[col]}: {stats}")

    # Optional XKC state: report only when the sensor actually produced
    # 0/1 states; never fabricate a level for absent hardware.
    if "xkc_level_state" in df.columns:
        states = df["xkc_level_state"].astype(str).str.strip()
        present = states[states.isin({"0", "1"})]
        if not present.empty:
            lines.append(
                f"- Water level state (optional XKC sensor): latest {present.iloc[-1]} "
                f"({len(present)} state readings)")

    # Manual measurements (salinity / ammonia are manual-only by design).
    if manual is not None and not manual.empty:
        lines.append("Manual measurements on record:")
        for _, m in manual.iterrows():
            metric = m.get("metric_name", "manual")
            value = m.get("value")
            unit = m.get("unit", "")
            lines.append(f"- {metric}: {value} {unit}".rstrip())

    # Deterministic events, counted by rule_code - never re-derived here.
    total = 0 if events is None or events.empty else len(events)
    lines.append(f"- deterministic events: {total}")
    if total and "rule_code" in events.columns:
        counts = events.groupby("rule_code").size()
        for code, n in counts.items():
            lines.append(f"    - {code}: {n}")

    recs = propose_recommendations(events)
    if recs:
        lines.append("Candidate recommendations (human decision required):")
        for r in recs:
            lines.append(f"- {CONFIRMATION_MARKER} {r['suggestion']}")
    else:
        lines.append("- No candidate recommendations; continue routine observation.")

    lines.append(BOUNDARY_STATEMENT)
    return "\n".join(lines)


def build_llm_prompt(summary: str) -> str:
    """Exact bounded prompt text for a future approved LLM provider.

    The provider may ONLY restate/organize the embedded observed data under
    the stated constraints. No provider is wired in this session.
    """
    return (
        "You are a bounded aquarium reporting assistant for a 5 L "
        "monitoring-only reef tank.\n"
        "Rules you must follow:\n"
        "1. Use ONLY the observed data embedded below. Never invent, "
        "estimate or interpolate measurements.\n"
        "2. ORP, EC/conductivity, flow and float-switch data are NOT "
        "measured by this system; never claim otherwise.\n"
        "3. Light is a relative percentage only; never express it as lux, "
        "PAR or PPFD.\n"
        "4. Every recommendation you repeat must keep its "
        f"{CONFIRMATION_MARKER} marker and be phrased as a suggestion for a "
        "human to confirm. Never instruct automatic dosing or mains "
        "switching.\n"
        "5. If the data is insufficient, say so explicitly.\n\n"
        "Observed data:\n"
        f"{summary}\n"
    )


def main() -> None:
    df = pd.read_csv(CLEAN) if CLEAN.exists() else pd.DataFrame()
    events = pd.read_csv(EVENTS) if EVENTS.exists() else pd.DataFrame(
        columns=["timestamp_ms", "severity", "rule_code", "reason"])
    summary = build_summary(df, events)
    print(summary)
    print()
    print("--- bounded LLM prompt (no provider connected) ---")
    print(build_llm_prompt(summary))


if __name__ == "__main__":
    main()
