# EXP04 — Manual Salinity Drift (Session 16)

**Status: PREPARED — EXECUTION PENDING TANK OPERATION**
Salinity is a **manual-only** metric in this project. There is NO EC /
conductivity sensor in the hardware baseline (forbidden to reintroduce),
and nothing in this experiment may claim salinity is automatically
measured, estimated from telemetry, or derived from any sensor.

## Objective
Track evaporation-driven salinity drift in the 5 L tank between water
changes using manual refractometer/hydrometer readings, and define when
drift becomes a risk requiring corrective action (manual top-off / partial
water change by the owner).

## Data sources (manual only)
| Metric | Instrument | Unit | Cadence |
|---|---|---|---|
| Salinity (specific gravity) | handheld refractometer (preferred) or hydrometer | SG (e.g. 1.025) | >= 2x per week, same time of day |
| Top-off events | operator log | mL RO/DI water added + time | every top-off |
| Water changes | operator log | volume + mixed SG | every change |
| Notes | free text | - | as needed |

Record rows via `backend/analysis/manual_log.py` (append-only ledger at
`data/manual/manual_measurements.csv`, schema-compatible with the
`manual_measurements` DB table):

```bash
python -m backend.analysis.manual_log add --metric salinity_sg --value 1.0250 --unit SG --method refractometer --note "before top-off"
```

Telemetry correlation (temperature/pH at the reading time) is descriptive
context only — salinity is NEVER computed from it.

## Procedure
1. Calibrate/verify the refractometer per its manual (zero on distilled
   water); record the verification as a manual note row.
2. Twice weekly (e.g. Mon/Thu evenings), read SG at tank temperature;
   apply the instrument's temperature procedure; log the row.
3. Log every top-off and water change with volumes.
4. Continue for >= 4 weeks (or >= 2 full water-change cycles).

## Risk thresholds (owner decision aid, not automation)
- Target band: SG 1.024–1.026 (or the owner's chosen reef target +/- 0.002).
- **Watch**: any reading outside target band -> schedule a corrective
  manual top-off (low) or diluted-salinity water change (high) within 24 h.
- **Act now**: SG <= 1.020 or >= 1.030, or a jump >= 0.004 between
  consecutive readings -> same-day manual correction; check for
  evaporation/runaway top-off causes.
- All corrections are manual. The system only records and reports.

## Analysis
- SG time series with target band overlay (manual data points only; gaps
  are gaps — never interpolated).
- Drift rate between water changes (SG per day, from consecutive manual
  readings).
- Top-off volume vs interval summary (evaporation proxy, descriptive).
- Cross-reference with temperature chart for the same weeks (descriptive
  only; higher temperature -> more evaporation is context, not a computed
  claim).

## Acceptance criteria for a valid campaign
- >= 8 salinity rows over >= 4 weeks, instrument verification logged.
- Every out-of-band reading has a matching corrective-action log row.
- No row lacks method/operator data (ledger enforces this).

## Results (fill ONLY with real manual entries)
_Campaign window:_ ____  |  _Readings:_ ____  |  _SG min–max:_ ____
_Drift rate (SG/day):_ ____  |  _Out-of-band events:_ ____
_Conclusion:_ _pending_

## Integrity rules
- No invented data: every row must come from a real reading by the operator.
- Forbidden to claim: automatic salinity, EC/conductivity measurement,
  sensor-derived salinity estimates. The bounded AI report (S12) may only
  restate logged manual values, labeled as manual.
