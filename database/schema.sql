CREATE TABLE IF NOT EXISTS telemetry_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  temperature_c DOUBLE PRECISION,
  ph DOUBLE PRECISION,
  light_raw INTEGER,
  light_voltage_v DOUBLE PRECISION,
  water_level_state TEXT,
  wifi_rssi_dbm INTEGER,
  firmware_version TEXT NOT NULL,
  experiment_id TEXT,
  event_flag TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS telemetry_device_time_idx ON telemetry_readings(device_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  message TEXT NOT NULL,
  reading_id BIGINT REFERENCES telemetry_readings(id)
);

CREATE TABLE IF NOT EXISTS experiment_markers (
  id BIGSERIAL PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  marker_type TEXT NOT NULL,
  label TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS manual_measurements (
  id BIGSERIAL PRIMARY KEY,
  experiment_id TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  metric_name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  method TEXT NOT NULL,
  operator_note TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL,
  source_window_start TIMESTAMPTZ,
  source_window_end TIMESTAMPTZ,
  content_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
