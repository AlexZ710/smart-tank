# EXP02 — Temperature Response Experiment (Session 14)

**Status: DESIGNED — EXECUTION PENDING HARDWARE**
No ESP32-S3 board/sensor rig is attached, so no real response run has been
recorded. This document is the complete design. Toolchain readiness is
demonstrated on clearly-labeled synthetic mock data only (see
`evidence/S14/validation_output.txt`); mock outputs are NOT results.

## Objective
Quantify how the 5 L tank's temperature responds to a **manual, external**
thermal disturbance and how it recovers — response rate, peak deviation and
recovery time — using DS18B20 telemetry only.

**Explicitly out of scope / forbidden:**
- Any claim of automated heater control. The system is monitoring-only; it
  never switches the heater.
- Student-built mains-voltage switching, relays or smart-plug automation
  wired by the project. The only permitted interventions are manual actions
  a person performs on commercially rated equipment (heater's own
  thermostat, measuring jug, room conditions).
- No automatic dosing of any kind.
- ORP, EC/conductivity, ZP4510 float state and FS300A flow are not
  measured and must not appear in design, data or analysis.

## Preconditions
- [ ] EXP01 baseline PASSED (stable 24–48 h reference; needed as the
      comparison window).
- [ ] S04–S08 board verifications complete; DS18B20 standalone capture OK
      (`evidence/S06/serial_capture.txt`).
- [ ] Heater is a commercially rated aquarium heater with its own
      thermostat, used per manufacturer instructions.
- [ ] One intervention method chosen and rehearsed (see below).

## Intervention options (manual/external only — choose ONE per run)
1. **Warm-water addition**: slowly add a measured volume (<= 5 % of tank
   volume, e.g. 250 mL) of water pre-warmed to a recorded temperature
   (target: raise tank ~0.5–1.0 C; never above 28 C). Record added volume
   and its temperature as manual entries.
2. **Heater setpoint step (manual)**: owner manually turns the heater's
   built-in thermostat up by one small step (e.g. +1 C), waits, then
   manually returns it. All switching is the appliance's own rated
   control — no project-built switching.
3. **Passive cool-down**: manually unplug nothing — instead raise room
   cooling (e.g. open window/fan pointed away from splash zone) and record
   the ambient change qualitatively.

Safety limits (hard stop, abort run): temperature reaching 28.5 C or
falling below 23.0 C; any sensor DISCONNECT_SENTINEL/IMPLAUSIBLE burst
(> 5 consecutive); visible equipment fault -> restore normal conditions.

## Procedure
1. Start collection: `python backend/collector/serial_collector.py --port <COMx> --baud 115200`.
2. Record a >= 30 min pre-intervention steady segment.
3. Write an experiment marker (see Markers below) with the exact
   intervention description, method, quantities, operator.
4. Perform the intervention ONCE, manually. Do not touch anything else.
5. Record >= 2 h post-intervention (or until temperature is back within
   the EXP01 baseline band for >= 30 min).
6. Write a second marker at the moment normal equipment settings are
   restored.
7. Stop, then run the pipeline and mark the run window:
   ```bash
   python backend/collector/clean_data.py
   python backend/rules/rules.py
   python backend/analysis/stability.py --label EXP02
   python backend/visualization/visualize.py
   ```

## Markers
Use the `experiment_markers` table / manual CSV with fields:
`marker_at (timestamp_ms or local time), experiment_id = EXP02, phase
(pre/intervention/restore), description, method, operator_note`.
Markers are manual records; they are never auto-generated from telemetry.

## Analysis (valid temperature readings only)
- Pre-segment: mean/std (compare to EXP01).
- Response phase: maximum |dT/dt| (C per 10 min, computed over valid
  consecutive readings), time from intervention marker to peak deviation.
- Peak: max temperature and delta above pre-segment mean.
- Recovery: time from peak until temperature re-enters and stays within
  the EXP01 baseline band for >= 30 min.
- Event cross-check: list TEMP_* events inside the window; a warning-band
  exit during a deliberate excursion is expected and must be annotated,
  not hidden. CRITICAL events => intervention too aggressive; annotate
  and consider a smaller step next run.
- pH is plotted alongside (temperature can shift pH readings); descriptive
  only — no pH acceptance criterion in EXP02.

## Acceptance criteria for a valid run
- Markers present for intervention and restore, with quantities recorded.
- No safety-limit breach; run aborted cleanly if one occurred (aborted
  runs are kept and annotated).
- Metrics above computable from VALID readings with >= 95 % completeness
  in the run window.
- All numbers in Results trace to `data/raw/reef_data.csv` + markers.

## Results (fill ONLY with real captured data)
_Run date:_ ____  |  _Intervention:_ ____  |  _Pre-segment mean/std:_ ____

| Metric | Value |
|---|---|
| max response rate (C/10 min) | _pending_ |
| time to peak (min) | _pending_ |
| peak delta above pre-mean (C) | _pending_ |
| recovery time to band (min) | _pending_ |
| TEMP_* events in window | _pending_ |

_Conclusion:_ _pending_

## Integrity rules
- No invented telemetry; mock data (`scripts/generate_mock_telemetry.py`,
  incl. the `temp_excursion` scenario used for toolchain dry-runs) never
  enters `data/raw/`, `experiments/results/` or any report.
- The write-up must never claim the project controls the heater; wording
  is "manual/external intervention observed by a monitoring-only system".
