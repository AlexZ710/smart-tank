# Deterministic Rule Engine (Session 11)

`backend/rules/rules.py` turns cleaned readings into reproducible alert
events. It is fully deterministic: the same input rows always produce the
same events, in the same order, with the same codes and messages. No
randomness, no wall-clock, no network.

## Scope

Rules exist only for the measured baseline channels:

| Channel   | Sensor      | Warning band | Critical band |
|-----------|-------------|--------------|---------------|
| Temperature | DS18B20   | 24-27 C      | 20-32 C       |
| pH        | SEN0161-V2  | 8.0-8.4      | 7.0-9.0       |

Relative light (PT550, 0-100 %) is informational only and generates no
alert rules. The optional XKC-Y25-T12V level state is never used by the
rule engine; everything works when that hardware is absent.

There are deliberately **no** flow, ORP, EC/conductivity or float-switch
rules: those sensors are absent/forbidden in this hardware baseline and no
telemetry for them may be invented.

## Rule codes

| rule_code          | severity | trigger                                             |
|--------------------|----------|-----------------------------------------------------|
| `TEMP_MISSING`     | warning  | temperature value is NaN and no validity flag says otherwise |
| `TEMP_INVALID`     | warning  | `temperature_valid` flag is False (cleaning rejected the reading) |
| `TEMP_OUT_OF_RANGE`| warning  | temperature outside 24-27 C but within 20-32 C       |
| `TEMP_CRITICAL`    | critical | temperature outside 20-32 C                          |
| `PH_MISSING`       | warning  | pH value is NaN                                      |
| `PH_INVALID`       | warning  | `ph_valid` flag is False                             |
| `PH_OUT_OF_RANGE`  | warning  | pH outside 8.0-8.4 but within 7.0-9.0                |
| `PH_CRITICAL`      | critical | pH outside 7.0-9.0                                   |

At most one event per channel per row; a flagged-invalid reading raises
`*_INVALID` instead of being range-checked. Rows are processed in input
order; within a row temperature is evaluated before pH.

## Output

`detect_events(df)` returns a DataFrame with columns
`timestamp_ms, severity, rule_code, reason`, aligned with the `events`
table in `database/schema.sql` (severity / rule_code / message).

CLI usage from the repository root (after `backend/collector/clean_data.py`
has produced the cleaned CSV):

```bash
python -m backend.rules.rules
```

This reads `data/clean/reef_data_clean.csv` and writes
`data/events/events.csv` (regenerated deterministically on every run; the
file is derived data, not raw telemetry).

## Reproducing

```bash
python -m backend.collector.clean_data   # raw -> clean (+ validity flags)
python -m backend.rules.rules            # clean -> events
pytest tests/test_rules.py -q            # rule unit tests
```

## Changing thresholds

Thresholds live in the module constants `TEMP_WARN`, `TEMP_CRIT`,
`PH_WARN`, `PH_CRIT`. Any change must update this table, the tests in
`tests/test_rules.py`, and the TASKS.md entry in the same commit.
