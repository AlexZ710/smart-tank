# Database — Local PostgreSQL (Session 20)

Local development database for the Smart Tank web stack, running in
Docker Desktop. Schema is frozen by `database/schema.sql` (documented in
`docs/data_schema.md`); the API contract that maps to it is frozen in
`docs/Telemetry_Contract.md`.

## Quick start (repeatable initialization)

```bash
cp .env.example .env          # optional: adjust local dev values
docker compose up -d          # starts postgres:17.4-alpine (pinned)
docker compose ps             # wait for healthcheck: healthy
```

On FIRST init the container auto-applies `database/schema.sql`
(mounted read-only at `/docker-entrypoint-initdb.d/01_schema.sql`).
The script is idempotent (`CREATE ... IF NOT EXISTS`,
`ALTER ... ADD COLUMN IF NOT EXISTS`) — re-applying to an existing
database is safe:

```bash
docker compose exec -T postgres psql -U smart_tank -d smart_tank < database/schema.sql
```

Verify:

```bash
docker compose exec postgres psql -U smart_tank -d smart_tank -c "\dt"
```

Expected tables: `telemetry_readings`, `events`, `experiment_markers`,
`manual_measurements`, `reports`.

## Connection

```
DATABASE_URL=postgres://smart_tank:smart_tank_dev_only@localhost:5432/smart_tank
```

(set in gitignored `.env` / `web/.env.local`). The port is bound to
`127.0.0.1` only — the database is never exposed publicly.

## Secrets policy

- `smart_tank_dev_only` is a **local dev placeholder**, not a secret and
  not used anywhere else. Real deployments (S27) use a managed Postgres
  with credentials that live ONLY in the deployment environment.
- `.env` and `web/.env.local` are gitignored; `.env.example` holds
  placeholders only. Never commit real credentials or the device ingest
  token.

## Contract mapping (device JSON -> telemetry_readings)

| Contract field (docs/Telemetry_Contract.md) | Column | Notes |
|---|---|---|
| `timestamp_ms` | `timestamp_ms` | device millis(), stored as sent |
| (server clock at insert) | `recorded_at` / `received_at` | server-side wall clock |
| `temperature_c` | `temperature_c` | NULL = not measured |
| `ph` | `ph` | NULL = not measured |
| `ph_voltage_v` | — (kept in CSV pipeline) | DB stores the derived pH |
| `light_relative_pct` | `light_relative_pct` | relative % only |
| `light_voltage_v` | `light_voltage_v` (+ `light_raw`) | raw ADS1115 values |
| `xkc_level_state` (0/1/null) | `water_level_state` | '0'/'1'/NULL; NULL = sensor absent |

No columns exist (or may ever be added) for ORP, EC/conductivity,
ZP4510 float or FS300A flow — those sensors are absent from the hardware
baseline.

## Change control

Any schema change requires, in the same commit: an idempotent migration
statement here, an update to `docs/data_schema.md`, contract/doc updates
if the API surface is affected, and a TASKS.md change-control note.

## Reset (destroys local data)

```bash
docker compose down -v        # removes the volume
docker compose up -d          # fresh init re-applies schema
```
