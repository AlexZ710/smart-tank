# Data Schema - Renewed

## telemetry_readings
Required fields:
- `id`
- `device_id`
- `recorded_at`
- `temperature_c`
- `ph`
- `light_raw`
- `light_voltage_v`
- `water_level_state` nullable (optional XKC only)
- `wifi_rssi_dbm` nullable
- `firmware_version`
- `experiment_id` nullable
- `event_flag` nullable

Explicitly excluded: ORP and EC/conductivity.

## events
- id, device_id, occurred_at, severity, rule_code, message, reading_id.

## reports
- id, report_date, report_type, source_window_start, source_window_end, content_markdown, created_at.

## experiment_markers
- id, experiment_id, occurred_at, marker_type, label, notes.

## manual_measurements
For salinity or other manual laboratory measurements:
- id, experiment_id, measured_at, metric_name, value, unit, method, operator_note.
