# Web Facade Architecture (FROZEN — Session 19)

Repository-local frozen copy. Normative source:
`01_Project_Documentation/Web_Facade_Architecture.md`. Any change to this
file requires a change-control note in TASKS.md in the same commit.

## Stack (frozen)
- Next.js (App Router) + Tailwind CSS — `web/`
- Next.js Route Handlers for ingestion/read APIs (no separate backend)
- PostgreSQL via `DATABASE_URL` (local: Docker Desktop; deployed: Vercel +
  managed Postgres), schema frozen in `database/schema.sql`
- Vercel deployment for the final web application

## Topology
```
ESP32-S3 (station mode, provisioned via local SoftAP portal only)
   |  HTTPS POST /api/telemetry  (Bearer ingest token, outbound-only)
   v
Next.js on Vercel ──> PostgreSQL (telemetry_readings, events,
   |                   experiment_markers, manual_measurements, reports)
   v
Browser UI (reads via GET route handlers; never sees any secret)
```

The dashboard NEVER contains Wi-Fi credentials; provisioning stays local
on-device (`docs/Device_Provisioning.md`,
`01_Project_Documentation/WiFi_Provisioning_Architecture.md`).

## Required pages (frozen)
| Route | Purpose | Data honesty requirement |
|---|---|---|
| `/` | overview / live status | per-channel state badge: current / stale / missing / optional-absent |
| `/history` | historical charts + ranges | plot stored readings only; gaps render as gaps |
| `/events` | rule-engine events/alerts | events come from the deterministic engine only (S11 codes) |
| `/experiments` | experiment timeline/markers | markers are manual records; never auto-generated |
| `/reports` | bounded AI reports | reports follow `docs/prompt_boundary.md`; recommendations keep [REQUIRES HUMAN CONFIRMATION] |
| `/system` | device + sensor health | last-seen, uptime, ingestion errors, XKC shown as "not installed" when null |

## Required API surface (frozen — contract in docs/Telemetry_Contract.md)
- `POST /api/telemetry` — authenticated ESP32 ingestion (Bearer token)
- `GET /api/telemetry/latest` — latest reading per channel + state
- `GET /api/telemetry/history` — bounded historical query
- `GET /api/events` — deterministic events
- `GET /api/reports` — bounded reports
- `GET /api/health` — application/database health

## Data-state semantics (frozen; the facade must distinguish all six)
| State | Meaning | UI treatment |
|---|---|---|
| CURRENT | last valid reading age <= `STALE_AFTER_S` (default 180 s = 3× 1 Hz interval; configurable via env) | normal display |
| STALE | last reading older than `STALE_AFTER_S` | value shown dimmed + "stale (age)" badge; never presented as live |
| MISSING | channel never received a reading | "no data yet" — never zero, never blank-as-normal |
| OPTIONAL_ABSENT | `xkc_level_state` is null / device reports NA | "not installed" — the page works fully without it |
| MANUAL | salinity/ammonia from `manual_measurements` | always labeled "manual · <measured_at> · <method>" |
| UNAVAILABLE | ORP, EC/conductivity, ZP4510 float, FS300A flow | must not exist as fields, cards, mocks, rules or claims anywhere |

## Security boundary (frozen)
- Ingestion: `Authorization: Bearer <INGEST_TOKEN>`; token stored ONLY in
  deployment env (server side) and device NVS — never in the repo, never
  in browser code.
- `DATABASE_URL` server-side only (Route Handlers); never exposed to the
  client bundle.
- Validate JSON shape and ranges before insert (contract ranges in
  `docs/Telemetry_Contract.md`); reject, never clamp-and-store.
- Rate-limit ingestion before public demonstration (S22 acceptance item).
- No read-back endpoint for stored secrets; GET endpoints return
  observation data only.
- Mock/synthetic data may seed local development ONLY when labeled
  (S20-S21 acceptance item); production DB is never seeded with mock rows
  presented as real.

## Session mapping
S20 Docker Postgres + schema · S21 Next.js/Tailwind scaffold ·
S22 authenticated ingestion API · S23 ESP32 Wi-Fi telemetry (reuses
`WifiProvisioning.h/.cpp`) · S24 live status + device health UI ·
S25-S26 remaining pages · S27 Vercel deployment · S28 final verification.
