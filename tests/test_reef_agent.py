"""Session 12 tests: bounded AI report agent.

Fixtures are synthetic unit-test rows only - never real telemetry.
Forbidden-sensor column names appear ONLY as rejection fixtures proving
the input guard refuses them.
"""
import re

import pandas as pd
import pytest

from backend.ai_agent.reef_agent import (
    BOUNDARY_STATEMENT,
    CONFIRMATION_MARKER,
    RECOMMENDATION_MAP,
    build_llm_prompt,
    build_summary,
    guard_columns,
    propose_recommendations,
)


def _df():
    return pd.DataFrame({
        "timestamp_ms": [1, 2, 3],
        "temperature_c": [25.0, 300.0, 26.0],
        "temperature_valid": [True, False, True],
        "ph": [8.2, 8.1, 8.3],
        "ph_valid": [True, True, True],
        "light_relative_pct": [40.0, 41.0, 42.0],
        "light_valid": [True, True, True],
    })


def _events():
    return pd.DataFrame({
        "timestamp_ms": [2],
        "severity": ["warning"],
        "rule_code": ["TEMP_INVALID"],
        "reason": ["invalid temperature reading (flagged by cleaning)"],
    })


def test_empty_input_reports_no_telemetry_honestly():
    out = build_summary(pd.DataFrame(), pd.DataFrame())
    assert out.startswith("No telemetry available.")
    assert BOUNDARY_STATEMENT in out


@pytest.mark.parametrize("bad_col", [
    "orp_mv", "ec_us_cm", "conductivity_ms", "flow_lpm",
    "zp4510_state", "fs300a_flow", "float_switch_state",
])
def test_forbidden_sensor_columns_are_rejected(bad_col):
    df = _df()
    df[bad_col] = 0
    with pytest.raises(ValueError, match="Forbidden-sensor columns"):
        build_summary(df, pd.DataFrame())


def test_guard_columns_accepts_allowed_frame():
    guard_columns(_df())  # must not raise


def test_summary_uses_only_valid_readings_in_stats():
    out = build_summary(_df(), pd.DataFrame())
    temp_line = next(l for l in out.splitlines()
                     if l.startswith("- Temperature"))
    # the 300 C flagged-invalid row must not enter the stats
    assert "300" not in temp_line
    assert "2 valid readings" in temp_line
    assert "3 valid readings" in out  # pH and light lines


def test_summary_has_no_unsupported_measurement_claims():
    out = build_summary(_df(), _events()).lower()
    # word-boundary match: boundary prose ("parameter", "FS300A") is allowed,
    # unit claims on data lines are not
    for pattern in (r"\blux\b", r"\bpar\b", r"\bppfd\b"):
        assert re.search(pattern, out) is None
    assert BOUNDARY_STATEMENT in build_summary(_df(), _events())


def test_xkc_absent_is_not_mentioned_or_fabricated():
    df = _df()
    df["xkc_level_state"] = "NA"
    assert "Water level state" not in build_summary(df, pd.DataFrame())


def test_xkc_present_states_are_reported():
    df = _df()
    df["xkc_level_state"] = ["NA", "1", "0"]
    out = build_summary(df, pd.DataFrame())
    assert "Water level state (optional XKC sensor)" in out
    assert "latest 0" in out


def test_manual_measurements_are_included_and_labeled():
    manual = pd.DataFrame([
        {"metric_name": "salinity", "value": 1.025, "unit": "SG"},
        {"metric_name": "ammonia", "value": 0.02, "unit": "mg/L"},
    ])
    out = build_summary(_df(), pd.DataFrame(), manual=manual)
    assert "Manual measurements on record:" in out
    assert "salinity: 1.025 SG" in out
    assert "ammonia: 0.02 mg/L" in out


def test_recommendations_require_human_confirmation():
    recs = propose_recommendations(_events())
    assert len(recs) == 1
    assert recs[0]["rule_code"] == "TEMP_INVALID"
    assert recs[0]["requires_human_confirmation"] is True
    assert recs[0]["suggestion"] in RECOMMENDATION_MAP.values()


def test_recommendations_dedup_by_rule_code():
    events = pd.DataFrame({
        "rule_code": ["TEMP_MISSING", "TEMP_MISSING", "PH_CRITICAL"],
    })
    recs = propose_recommendations(events)
    assert [r["rule_code"] for r in recs] == ["TEMP_MISSING", "PH_CRITICAL"]


def test_no_events_means_no_recommendations():
    out = build_summary(_df(), pd.DataFrame())
    assert "No candidate recommendations" in out
    assert CONFIRMATION_MARKER not in out


def test_summary_renders_confirmation_markers():
    out = build_summary(_df(), _events())
    assert f"- {CONFIRMATION_MARKER} " in out
    assert "- deterministic events: 1" in out
    assert "TEMP_INVALID: 1" in out


def test_unknown_rule_code_gets_no_invented_recommendation():
    events = pd.DataFrame({"rule_code": ["SOMETHING_NEW"]})
    assert propose_recommendations(events) == []


def test_llm_prompt_embeds_summary_and_constraints():
    summary = build_summary(_df(), _events())
    prompt = build_llm_prompt(summary)
    assert summary in prompt
    assert "Never invent" in prompt
    assert CONFIRMATION_MARKER in prompt
    assert "lux" in prompt.lower()  # the prohibition rule, not a claim
    assert "no provider" not in prompt  # prompt text itself is provider-ready


def test_determinism_same_input_same_summary():
    first = build_summary(_df(), _events())
    second = build_summary(_df(), _events())
    assert first == second
