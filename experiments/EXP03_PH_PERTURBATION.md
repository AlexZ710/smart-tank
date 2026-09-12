# EXP03 — pH Perturbation Experiment (Session 15)

**Status: DESIGNED — EXECUTION PENDING HARDWARE**
No ESP32-S3 board/sensor rig is attached, so no real perturbation run has
been recorded. This document is the complete design. Toolchain readiness is
demonstrated on clearly-labeled synthetic mock data only (see
`evidence/S15/validation_output.txt`); mock outputs are NOT results.

## Objective
Observe the tank's pH response to a **controlled small-step, manual**
perturbation and log its recovery, with explicit stop conditions — using
SEN0161-V2 pH telemetry (via ADS1115 A1) only.

**Explicitly out of scope / forbidden:**
- Any automatic dosing. All additions are manual, measured, one-step.
- Any claim of automated pH control. The system is monitoring-only.
- Student-built mains switching of any equipment.
- ORP, EC/conductivity, ZP4510 float state and FS300A flow are not
  measured and must not appear in design, data or analysis. pH is the sole
  acidity measurement in this baseline.

## Preconditions
- [ ] EXP01 baseline PASSED (reference band and daily pH pattern known).
- [ ] **pH freshly calibrated** per `docs/ph_calibration_log.md`
      (CAL7/CAL4 in fresh buffers within 48 h; placeholder voltages
      replaced). An uncalibrated probe invalidates the run.
- [ ] Temperature stable (EXP02 not running concurrently; pH readings
      shift with temperature — temperature is logged alongside and any
      temp excursion during the run is annotated).
- [ ] Commercially rated aquarium pH buffer-up solution (e.g. alkalinity
      buffer) OR the passive option below; manufacturer instructions on
      hand.

## Intervention options (manual only — choose ONE per run)
1. **Passive/observational (preferred first run)**: no chemicals added.
   Perturb gas exchange instead — e.g. temporarily increase surface
   agitation with a manually positioned air stone for a fixed 30 min, then
   remove it. Log start/stop as markers. Expected effect is small and
   safe.
2. **Small-step buffer addition**: pre-dissolve the manufacturer's dose
   for the ACTUAL tank volume (5 L; never dose by eye), further dilute in
   ~250 mL of tank water, add manually in ONE slow pour with gentle
   stirring. Target step: <= 0.1–0.2 pH below the baseline mean. Record
   product name, measured dose and dilution as manual entries/markers.

Only ONE intervention step per run. If the response is too small to
analyze, the run may be repeated on another day — never stack doses
within a run.

## Stop conditions (HARD — abort immediately when any is met)
- pH <= 7.8 or >= 8.6 on two consecutive valid readings.
- Any PH_CRITICAL deterministic event (pH outside 7.0–9.0).
- pH changing faster than 0.2 units per 10 min at any point.
- > 5 consecutive invalid/missing pH readings (probe fault suspect).
- Any visible animal stress signs (per owner judgment) — restore normal
  conditions; livestock welfare outranks the experiment.

Abort procedure: stop additions, restore normal aeration/circulation,
write an `abort` marker with reason, keep collecting — recovery after an
abort is logged exactly like recovery after a normal run.

## Procedure
1. Start collection: `python backend/collector/serial_collector.py --port <COMx> --baud 115200`.
2. Record >= 60 min pre-intervention steady segment (covers pH noise and
   confirms calibration sanity vs EXP01).
3. Marker: `phase=pre` (operator, method, quantities).
4. Perform the single manual intervention. Marker: `phase=intervention`.
5. Observe continuously against the stop conditions for >= 2 h (or until
   pH re-enters and holds the EXP01 baseline band for >= 45 min).
6. Marker: `phase=restore` (or `phase=abort` + reason).
7. Stop, then run the pipeline:
   ```bash
   python backend/collector/clean_data.py
   python backend/rules/rules.py
   python backend/analysis/stability.py --label EXP03
   python backend/visualization/visualize.py
   ```

## Markers
`experiment_markers` / manual CSV: `marker_at, experiment_id = EXP03,
phase (pre/intervention/restore/abort), description, method (product +
measured dose + dilution, or aeration setup), operator_note`. Markers are
manual records; never auto-generated from telemetry.

## Recovery logging (mandatory, valid pH readings only)
- Time series around the window is kept in `experiments/results/EXP03/`
  (charts from visualize.py + metrics CSV from stability.py).
- Recovery log table (fill during/after the run):
  | t (min from marker) | pH | in-band? | action taken | operator note |
  Entries at least at: intervention, peak/trough deviation, band re-entry,
  end of window, and at every abort/stop-condition trigger.

## Analysis (valid pH readings only)
- Pre-segment mean/std vs EXP01 (calibration-drift sanity check).
- Peak deviation (pH units) and time-to-peak from intervention marker.
- Max |dpH/dt| per 10 min over valid consecutive readings.
- Recovery time: peak -> re-entry and 45-min hold within baseline band.
- Temperature co-plot: annotate whether pH movement coincided with any
  temperature movement (correlation is descriptive, not causal proof).
- Event cross-check: PH_* events in window listed and annotated
  (a deliberate warning-band exit is expected; CRITICAL => stop-condition
  breach => run annotated as aborted).

## Acceptance criteria for a valid run
- Calibration current (log entry within 48 h) and recorded in markers.
- Single intervention, all quantities recorded.
- Stop conditions monitored continuously; any trigger honestly recorded.
- Metrics computable from VALID readings with >= 95 % completeness in the
  window; recovery log complete.
- Every number in Results traces to `data/raw/reef_data.csv` + markers.

## Results (fill ONLY with real captured data)
_Run date:_ ____  |  _Intervention:_ ____  |  _Calibration date:_ ____

| Metric | Value |
|---|---|
| pre-segment pH mean/std | _pending_ |
| peak deviation (pH) | _pending_ |
| time-to-peak (min) | _pending_ |
| max dpH/dt (per 10 min) | _pending_ |
| recovery-to-band time (min) | _pending_ |
| PH_* events in window | _pending_ |
| stop conditions triggered | _pending_ |

_Conclusion:_ _pending_

## Integrity rules
- No invented telemetry; mock data (`scripts/generate_mock_telemetry.py`,
  incl. the `ph_drift` scenario used for toolchain dry-runs) never enters
  `data/raw/`, `experiments/results/` or any report.
- The write-up must never claim the project doses or controls pH; wording
  is "manual one-step intervention observed by a monitoring-only system".
