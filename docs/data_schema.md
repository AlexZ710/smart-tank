# Data Schema - smart-tank

> Frozen in Session 03. Authoritative implementation is
> `database/schema.sql` (PostgreSQL); this document is its human-readable
> contract. Consistent with `01_Project_Documentation/Data_Schema.md`,
> `docs/measurement_boundary.md`, and `docs/hardware_inventory.md`.

## Boundary rules

- **No ORP and no EC/conductivity fields exist anywhere in the schema.** These
  sensors are absent from the hardware baseline and must never be added as
  automatic fields.
- Salinity and other lab values live only in `manual_measurements` (manual
  refractometer/hydrometer input), never in `telemetry_readings`.
- `light_raw` / `light_voltage_v` are the PT550 relative light signal. They
  must never be presented as lux/PAR/PPFD without a documented calibration.
- `water_level_state` is nullable: present only when the optional XKC-Y25-T12V
  hardware is installed. All consumers must tolerate NULL.
- Ammonia has no automatic field. Any ammonia value is a
  `manual_measurements` entry or explicit literature assumption.

## telemetry_readings

| Column | Type | Constraint | Notes |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| device_id | TEXT | NOT NULL | Source device identity |
| recorded_at | TIMESTAMPTZ | NOT NULL | Device-side reading time |
| temperature_c | DOUBLE PRECISION | | DS18B20, degC |
| ph | DOUBLE PRECISION | | SEN0161-V2 via ADS1115 A1 |
| light_raw | INTEGER | | PT550 raw ADC counts (ADS1115 A3) |
| light_voltage_v | DOUBLE PRECISION | | PT550 converted voltage |
| water_level_state | TEXT | nullable | Optional XKC only |
| wifi_rssi_dbm | INTEGER | nullable | Link quality when Wi-Fi transport used |
| firmware_version | TEXT | NOT NULL | Traceability |
| experiment_id | TEXT | nullable | Experiment association |
| event_flag | TEXT | nullable | Rule-engine flag |
| received_at | TIMESTAMPTZ | NOT NULL, default NOW() | Server receive time |

Index: `telemetry_device_time_idx (device_id, recorded_at DESC)`.

## events

Deterministic rule-engine output.

| Column | Type | Constraint |
|---|---|---|
| id | BIGSERIAL | PK |
| device_id | TEXT | NOT NULL |
| occurred_at | TIMESTAMPTZ | NOT NULL |
| severity | TEXT | NOT NULL |
| rule_code | TEXT | NOT NULL |
| message | TEXT | NOT NULL |
| reading_id | BIGINT | FK -> telemetry_readings(id), nullable |

## experiment_markers

| Column | Type | Constraint |
|---|---|---|
| id | BIGSERIAL | PK |
| experiment_id | TEXT | NOT NULL |
| occurred_at | TIMESTAMPTZ | NOT NULL |
| marker_type | TEXT | NOT NULL |
| label | TEXT | NOT NULL |
| notes | TEXT | nullable |

## manual_measurements

Manual laboratory entries (salinity, ammonia test kits, etc.). These are
operator inputs, never automatic telemetry.

| Column | Type | Constraint |
|---|---|---|
| id | BIGSERIAL | PK |
| experiment_id | TEXT | nullable |
| measured_at | TIMESTAMPTZ | NOT NULL |
| metric_name | TEXT | NOT NULL |
| value | DOUBLE PRECISION | NOT NULL |
| unit | TEXT | NOT NULL |
| method | TEXT | NOT NULL (e.g. refractometer, test kit) |
| operator_note | TEXT | nullable |

## reports

Bounded AI report output.

| Column | Type | Constraint |
|---|---|---|
| id | BIGSERIAL | PK |
| report_date | DATE | NOT NULL |
| report_type | TEXT | NOT NULL |
| source_window_start | TIMESTAMPTZ | nullable |
| source_window_end | TIMESTAMPTZ | nullable |
| content_markdown | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() |

## Change control

Schema changes require updating `database/schema.sql` and this document in
the same session commit, and may not reintroduce excluded fields
(ORP, EC/conductivity, ZP4510 float state, FS300A flow).
