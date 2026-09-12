# EXP01 — Baseline Stability Experiment (Session 13)

**Status: PREPARED — EXECUTION PENDING HARDWARE**
No ESP32-S3 board/sensor rig has been attached yet, so no real baseline has
been recorded. This document is the complete, ready-to-run protocol. The
analysis toolchain has been dry-run on clearly-labeled synthetic mock data
(see `evidence/S13/validation_output.txt`); **mock outputs are tool checks,
not experimental results**, and are never committed as data.

## Objective
Record 24–48 h of undisturbed baseline telemetry from the assembled rig and
quantify stability of the measured channels, using only available telemetry
plus optional manual entries.

## Measured channels (hardware baseline)
| Channel | Sensor | Notes |
|---|---|---|
| Temperature (C) | DS18B20 on GPIO4 | stability metric |
| pH | SEN0161-V2 via ADS1115 A1 | requires S07 two-point buffer calibration FIRST |
| Relative light (%) | PT550 via ADS1115 A3 | descriptive only; never lux/PAR/PPFD |
| Water level state | XKC-Y25-T12V (optional) | NA when absent; experiment never depends on it |

Manual-only entries (optional during baseline): salinity (SG, refractometer),
ammonia (mg/L, liquid test kit) -> `manual_measurements` /
`experiments/results/EXP01/manual_entries.csv`.

Not measured / forbidden: ORP, EC/conductivity, ZP4510 float state, FS300A
flow. The experiment must not reference or estimate them.

## Preconditions (all required before starting)
- [ ] S04-S08 pending board verifications complete (serial captures in
      `evidence/S04..S08/`).
- [ ] pH calibrated per `docs/ph_calibration_log.md` (CAL7/CAL4 in fresh
      buffers; placeholders replaced in the integrated monitor).
- [ ] Tank filled, stocked/cycled as far as the owner intends for baseline;
      heater and light on their normal fixed schedules (no changes during
      the run).
- [ ] Rig runs `SmartTank_Integrated_Monitor` firmware; board enumerated.

## Procedure
1. Start collection from the repo root (conda env `reef`):
   ```bash
   python backend/collector/serial_collector.py --port <COMx> --baud 115200
   ```
   Append-only output: `data/raw/reef_data.csv`.
2. Let the system run **undisturbed for 24–48 h**. No water changes, no
   dosing, no equipment adjustments; log any unavoidable disturbance as a
   manual note row with its timestamp.
3. Optional manual entries: record salinity and/or ammonia at the start and
   end of the window (method + operator note mandatory).
4. Stop collection, then run the pipeline:
   ```bash
   python backend/collector/clean_data.py
   python backend/rules/rules.py
   python backend/analysis/stability.py --clean data/clean/reef_data_clean.csv --events data/events/events.csv --label EXP01
   ```
5. Save outputs into `experiments/results/EXP01/` (metrics CSV, charts from
   `python backend/visualization/visualize.py`, event list).

## Acceptance / stability criteria (evaluated on VALID readings only)
- Temperature: std-dev <= 0.5 C and all valid readings within 24–27 C.
- pH: full valid range within 8.0–8.4 (post-calibration).
- Data completeness: >= 95 % of expected 1 Hz rows present and valid for
  temperature and pH over the window.
- Deterministic events: zero CRITICAL events; warnings individually
  explained (disturbance note or sensor fault follow-up).
- Relative light: reported descriptively (day/night pattern visible); no
  numeric stability criterion (relative signal only).

If any criterion fails: record the failure honestly, investigate, and rerun
the baseline. Failed baselines are kept (append-only raw data) and annotated.

## Results (fill ONLY with real captured data)
_Window:_ ____  |  _Rows collected:_ ____  |  _Valid %:_ ____

| Metric | Temperature | pH | Light (descriptive) |
|---|---|---|---|
| mean | _pending_ | _pending_ | _pending_ |
| std-dev | _pending_ | _pending_ | _pending_ |
| min–max | _pending_ | _pending_ | _pending_ |

_Events:_ ____  |  _Manual entries:_ ____  |  _Conclusion:_ _pending_

## Integrity rules
- No invented telemetry: every number in Results must trace to
  `data/raw/reef_data.csv` rows captured from the physical rig.
- Mock data (`scripts/generate_mock_telemetry.py`) may ONLY be used to
  dry-run tooling; its filenames stay under `data/mock/` (gitignored) and
  its outputs are never copied into `experiments/results/`.
