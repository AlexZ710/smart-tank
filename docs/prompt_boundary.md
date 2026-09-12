# Prompt Boundary (Session 12)

Normative rules for every AI-generated summary or report in Smart Tank.
Enforced in code by `backend/ai_agent/reef_agent.py`.

## 1. Input boundary — what the agent may see

| Allowed input | Source |
|---|---|
| `temperature_c` (+ `temperature_valid`) | DS18B20 via cleaned pipeline |
| `ph`, `ph_voltage_v` (+ `ph_valid`) | SEN0161-V2 via cleaned pipeline |
| `light_relative_pct`, `light_voltage_v` (+ `light_valid`) | PT550, relative only |
| `xkc_level_state` (NA/0/1, nullable) | optional XKC-Y25-T12V; absent-tolerant |
| manual measurements (salinity SG, ammonia mg/L, notes) | `manual_measurements` table / manual CSV |
| deterministic events (`rule_code`, `severity`, counts) | `backend/rules/rules.py` |

**Rejected inputs.** Any column whose name contains a forbidden-sensor term
(ORP, conductivity, `ec_us`/`ec_ms`/`_ec_`, flow, ZP4510, FS300A,
float_switch, ...) causes `guard_columns()` to raise `ValueError` before any
text is generated. Forbidden telemetry can never reach a prompt or report.

## 2. Output boundary — what the agent may say

- Restate and organize observed data only. No invented, estimated or
  interpolated values; empty input yields "No telemetry available."
- Light is reported as **relative %** only — never lux, PAR or PPFD.
- Salinity and ammonia appear only when a manual measurement exists, and
  are labeled as manual.
- The boundary statement (what is NOT measured) is appended to every
  summary.
- Absent optional hardware (XKC) is simply not mentioned — never reported
  as a fabricated level.

## 3. Recommendation boundary — human confirmation required

- Recommendations originate only from deterministic `rule_code`s via
  `RECOMMENDATION_MAP`; the agent does not invent new ones.
- Every recommendation carries
  `requires_human_confirmation: True` and is rendered with the marker
  `[REQUIRES HUMAN CONFIRMATION]`.
- Suggestions are observation/verification actions (check wiring, verify
  with reference thermometer, re-calibrate with buffers, re-measure).
- Never permitted in any recommendation: automatic dosing, mains-voltage
  switching, actuator commands, or any instruction to bypass human review.

## 4. LLM provider boundary

- No provider is wired in this repository session. `build_llm_prompt()`
  emits the exact bounded prompt a future approved provider may receive;
  it embeds only guard-passed data and the rules above (restate-only,
  no invention, keep confirmation markers).
- If a provider is added later: it must receive only this bounded prompt,
  its output must not be auto-executed, and its API keys must live in
  environment/deployment secrets — never in source (same policy as Wi-Fi
  credentials; see `docs/Device_Provisioning.md`).

## 5. Reproducing

```bash
python -m backend.collector.clean_data   # raw -> clean (if data exists)
python -m backend.rules.rules            # clean -> events
python -m backend.ai_agent.reef_agent    # bounded summary + LLM prompt
pytest tests/test_reef_agent.py -q       # boundary tests
```
