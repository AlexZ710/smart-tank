# Results & Discussion Draft (Session 17)

**Status: DRAFT SKELETON — NO EXPERIMENTAL RESULTS YET.**
No ESP32-S3 rig has been attached and no tank campaign has run, so every
result cell in this document and in `docs/results_table.csv` is PENDING.
No value in either file may ever be filled from mock or synthetic data.

## 1. Reproducibility contract

All figures and tables are derived, regenerable artifacts:

```bash
python backend/collector/serial_collector.py --port <COMx>   # real capture -> data/raw (append-only)
python backend/collector/clean_data.py                        # -> data/clean (+ validity flags)
python backend/rules/rules.py                                 # -> data/events
python backend/analysis/stability.py --label RESULTS          # metrics (stdout/CSV)
python backend/visualization/visualize.py                     # -> docs/figures/*.png (valid rows only)
python scripts/make_results.py                                # -> docs/results_table.csv
```

`scripts/make_results.py` reads ONLY real pipeline outputs
(`data/clean`, `data/events`, `data/manual/manual_measurements.csv`);
missing sources yield explicit PENDING rows - never zeros, never
interpolations, never mock values. Re-running the chain after each real
capture regenerates every table/figure byte-reproducibly (deterministic
engine, fixed seeds irrelevant here since no randomness is used).

## 2. Available measurements (what results MAY report)

| Variable | Type | Source | Claim limits |
|---|---|---|---|
| Temperature (C) | measured | DS18B20 | valid rows only |
| pH | measured | SEN0161-V2 | only after logged buffer calibration |
| Relative light (%) | measured | PT550 | relative signal; never lux/PAR/PPFD |
| Water level state | optional measured | XKC-Y25-T12V | only when installed; else absent |
| Salinity (SG) | manual | refractometer via ledger | labeled manual, never sensor-derived |
| Ammonia (mg/L) | manual | reagent kit via ledger | labeled manual, never sensor-derived |
| Observation scores | manual/qualitative | EXP05 checklist | labeled subjective |
| Events | derived | S11 deterministic engine | rule_code + severity only |

Unavailable and forbidden anywhere in results: ORP, EC/conductivity,
ZP4510 float state, FS300A flow, any auto-dosing outcome.

## 3. Per-experiment result sections (fill from real runs only)

### 3.1 EXP01 Baseline stability — _pending run_
Table: mean/std/min-max per channel, completeness %, event counts
(from `make_results.py`). Figure: `docs/figures/temperature.png`,
`ph.png`, `light_relative.png` for the baseline window.
Discussion points prepared: diurnal temperature amplitude vs room
conditions; pH daily swing vs aeration; sensor fault rate.

### 3.2 EXP02 Temperature response — _pending run_
Table: EXP02 Results block (max dT/dt per 10 min, time-to-peak, peak
delta, recovery-to-band). Figure: temperature chart across the marker
window. Discussion points prepared: 5 L thermal inertia, heater cycling
signature, recovery asymmetry (warming vs cooling).

### 3.3 EXP03 pH perturbation — _pending run_
Table: EXP03 Results block (peak deviation, max dpH/dt, recovery,
stop-condition log). Figure: pH chart with temperature co-plot.
Discussion points prepared: buffer capacity of a 5 L system, pH-temperature
co-movement as descriptive context (not causality), calibration stability
before/after the run.

### 3.4 EXP04 Manual salinity drift — _pending campaign_
Table: SG series, drift rate per day, top-off volumes. Figure: manual SG
points over time with target band (points only - no interpolation).
Discussion points prepared: evaporation rate vs temperature context,
effectiveness of top-off discipline.

### 3.5 EXP05 Organic load risk — _pending campaign_
Table: weekly ammonia + observation totals + risk levels + mitigations.
Figure: ammonia points with risk bands; observation-total trend.
Discussion points prepared: feeding-log associations (descriptive, small
n), whether mitigations preceded threshold crossings, event-context
overlay usefulness.

## 4. Honest-limitations section (pre-written, always applies)

- Single-probe single-location measurements; no spatial resolution in a
  5 L volume.
- pH accuracy bounded by calibration recency (placeholders until S07
  buffer calibration is logged).
- Light channel is relative only; no photometric calibration exists.
- Manual metrics depend on operator discipline and instrument quality;
  they are logged with method and timestamp for traceability.
- Small system, small n: no statistical causality claims are made
  anywhere; associations are descriptive.
- Monitoring-only: the system never actuates; all interventions are
  manual and logged.

## 5. Figure conventions

- Valid readings only (`*_valid` flags); invalid rows are excluded and
  counted in events, never plotted as gaps-filled guesses.
- Labels use honest units: "Temperature (C)", "pH", "Relative light (%)".
- Charts regenerate via `python backend/visualization/visualize.py`;
  titles state "(valid readings only)".
