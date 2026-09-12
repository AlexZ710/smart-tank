# Telemetry Contract (FROZEN — Session 19)

JSON contract between the ESP32-S3 device, the Next.js API and the
PostgreSQL schema (`database/schema.sql`). Field set mirrors the locked
serial CSV contract (`timestamp_ms,temperature_c,ph,ph_voltage_v,
light_relative_pct,light_voltage_v,xkc_level_state`) one-to-one.

**Forbidden fields** (absent hardware; rejected on sight with 400):
anything named or meaning ORP, EC/conductivity, flow, ZP4510/FS300A float
state, lux/PAR/PPFD light units, auto-dosing status.

## POST /api/telemetry (device -> server)

Auth: `Authorization: Bearer <INGEST_TOKEN>` (required; 401 otherwise).
Content-Type: `application/json`. Batches allowed (device may buffer and
flush); max 500 readings per request (413/400 above that).

```json
{
  "device_id": "st-a1b2c3d4e5f6",
  "readings": [
    {
      "timestamp_ms": 183456789,
      "temperature_c": 25.43,
      "ph": 8.21,
      "ph_voltage_v": 1.287,
      "light_relative_pct": 42.5,
      "light_voltage_v": 1.403,
      "xkc_level_state": null
    }
  ]
}
```

### Field rules
| Field | Type | Required | Valid range / values | On violation |
|---|---|---|---|---|
| `device_id` | string | yes | non-empty, <= 64 chars | 400 |
| `timestamp_ms` | integer | yes | > 0, device millis() | 400 |
| `temperature_c` | number \| null | yes (nullable) | -10..85 (DS18B20 plausible) | row rejected |
| `ph` | number \| null | yes (nullable) | 0..14 | row rejected |
| `ph_voltage_v` | number \| null | yes (nullable) | 0..5 | row rejected |
| `light_relative_pct` | number \| null | yes (nullable) | 0..100 | row rejected |
| `light_voltage_v` | number \| null | yes (nullable) | 0..5 | row rejected |
| `xkc_level_state` | 0 \| 1 \| null | yes | null = sensor absent (device sends NA on serial -> null in JSON) | row rejected |

- null means "not measured this cycle" — the server stores NULL; the UI
  renders MISSING. Servers/clients must NEVER substitute defaults.
- Unknown extra fields on a reading: ignored (forward compatibility);
  unknown forbidden fields: 400 (see above).
- Ranges match the cleaning layer (`backend/collector/clean_data.py`);
  changing them requires updating both plus tests in one commit.

### Response semantics
- `200` `{"accepted": n, "rejected": [{"index": i, "error": "reason"}]}` —
  payload well-formed; per-row validation independent (partial success).
- `400` — malformed payload / forbidden field / batch too large.
- `401` — missing or wrong token. `429` — rate-limited.
- Server assigns `received_at` (server clock) and stores device
  `timestamp_ms` + `device_id`; history queries order by
  `received_at, id` (device millis alone is not wall-clock).

## GET /api/telemetry/latest
Returns newest reading per device with computed state:
```json
{
  "device_id": "st-a1b2c3d4e5f6",
  "received_at": "2026-09-12T10:00:00Z",
  "age_s": 12,
  "state": "CURRENT",
  "channels": {
    "temperature_c": {"value": 25.4, "state": "CURRENT"},
    "ph": {"value": 8.21, "state": "CURRENT"},
    "light_relative_pct": {"value": 42.5, "state": "CURRENT"},
    "xkc_level_state": {"value": null, "state": "OPTIONAL_ABSENT"}
  }
}
```
State per `docs/Web_Facade_Architecture.md`: CURRENT (age <= STALE_AFTER_S)
/ STALE / MISSING (no row ever). No device rows at all -> `200` with
`{"devices": []}` (honest empty, not 404).

## GET /api/telemetry/history
Query: `from` & `to` (ISO-8601, required), `channel` (optional),
`limit` (default 1000, max 5000), `device_id` (optional).
Returns rows ordered ascending; gaps are NOT interpolated. Over-max limit
-> 400. Missing/invalid `from`/`to` -> 400.

## GET /api/events
Query: `from`, `to`, `severity` (warning|critical), `rule_code`,
`limit` (max 1000). Rows mirror the `events` table:
`{"id", "device_id", "occurred_at", "severity", "rule_code", "message",
"reading_id"}`. rule_code vocabulary frozen by S11 (TEMP_*/PH_* only).

## GET /api/reports
Rows mirror the `reports` table; each report carries its generated-at,
scope window and the bounded-agent provenance. Recommendations inside
report bodies keep `[REQUIRES HUMAN CONFIRMATION]` markers verbatim.

## GET /api/health
`{"status": "ok"|"degraded", "database": "up"|"down", "version": "..."}`
— no secrets, no device tokens, no connection strings.

## Manual measurements (not part of device ingestion)
`manual_measurements` rows enter via host tooling
(`backend/analysis/manual_log.py`) / seeded imports only — never via
`POST /api/telemetry`. UI labels them MANUAL with measured_at + method.
Metric whitelist is the ledger's (salinity_sg, ammonia_mg_l, nitrite_mg_l,
observation_score, note, topoff_ml, water_change_l, feeding_g);
forbidden-sensor metrics are rejected by the ledger itself.

## Device-side mapping (S23)
Serial CSV -> JSON: `NA` in `xkc_level_state` -> JSON null; empty numeric
cell -> null; batching buffer flushes on Wi-Fi reconnect with original
`timestamp_ms` values preserved. Token + API URL come from NVS
(`st_cfg` namespace) configured via the provisioning portal — never from
source code.
