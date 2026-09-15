# Smart Tank Web Facade (S24: live status + device health)

Next.js (App Router) + Tailwind CSS v4 + PostgreSQL (`pg`), per the FROZEN
`docs/Web_Facade_Architecture.md`. Monitoring-only observation dashboard for
the 5 L reef tank — no dosing, no mains control, no invented values.

## Quick start

```bash
cp ../.env.example .env.local    # then set real local values (gitignored)
npm install
npm run dev                      # http://localhost:3000
```

The database is optional at scaffold time: every page renders honest state
badges (`no data yet` / `not installed`) when Postgres is unreachable.
For full functionality start the S20 stack first (`docker compose up -d`
from the repo root) and set `DATABASE_URL` in `.env.local`.

## Routes

| Route | Status | Session |
|---|---|---|
| `/` Live Status | live — polls `/api/telemetry/latest` every 15 s; per-channel six-state badges, stale dimmed with age, XKC "not installed" when null, honest empty/DB-down states | S24 |
| `/history` | live — bounded range queries (presets + custom window + limit ≤ 5000), per-device small-multiple SVG charts, gaps drawn as breaks (never interpolated), table-view twin, honest truncation/empty/DB-down states | S25 |
| `/experiments` | live — read-only timeline from `experiment_markers` + manual-measurement provenance (MANUAL badge, measured_at + method) | S25 |
| `/events` | honest placeholder | S26 |
| `/reports` | honest placeholder | S26 |
| `/system` | live — app health, per-process ingestion error counts, per-device last-seen; secret-free | S24 |
| `GET /api/health` | live — contract shape `{status, database: up/down, version}` (S22) | S21+S22 |
| `GET /api/system/stats` | live — aggregate ingestion counters + web process uptime; per-process scope stated in the response (shared store is an S27 item) | S24 |
| `GET /api/experiments` | live — READ-ONLY markers + manual measurements (limit ≤ 2000, truncation flags); never writes raw data; honest 503 when DB down | S25 |
| `POST /api/telemetry` | live — Bearer DEVICE_INGEST_TOKEN (timing-safe), contract ranges, forbidden fields → 400, batch cap 500 → 413, rate limit → 429, partial success `{accepted, rejected[]}`, null stored as NULL, honest 503 when DB down ("readings NOT stored") | S22 |
| `GET /api/telemetry/latest` | live — newest per device + six-state channels; `{"devices": []}` when empty | S22 |
| `GET /api/telemetry/history` | live — `from`/`to` required, channel whitelist, limit ≤ 5000, ascending, gaps never interpolated | S22 |

Tests: `npm test` (node:test, no extra deps) — contract validation matrix,
rate limiter, data-state semantics, ingestion stats counters. Live DB
round-trip (actual INSERT + read-back) is pending a working Docker engine on
the host (S20 blocker: WSL not installed); all DB-dependent paths are
validated to degrade honestly with 503 instead of fabricating success.

Ingestion stats (`/api/system/stats`, S24) are in-memory per server process
— they reset on restart and are per instance, exactly like the rate limiter;
a shared/persistent store is an S27 hardening item. The UI states this scope
instead of implying durable history.

Rate limit: 120 req/min per source, in-memory per instance (single-instance
deployment; a shared store is required before multi-instance public demo —
S27 hardening item).

## Honesty rules (frozen, apply to every page)

- Six data states are distinguished: CURRENT / STALE / MISSING /
  OPTIONAL_ABSENT / MANUAL / UNAVAILABLE-absent (`lib/states.ts`).
- UNAVAILABLE sensors (ORP, EC/conductivity, ZP4510 float, FS300A flow)
  must never exist as fields, cards, mocks or claims — not even as
  "unavailable" widgets.
- Light is **relative %** (PT550) — never lux/PAR/PPFD.
- Salinity/ammonia render only as MANUAL entries with measured_at + method.
- AI reports keep `[REQUIRES HUMAN CONFIRMATION]` markers verbatim.
- Mock/synthetic data must be labeled and is never committed as real.

## Secrets

- `DATABASE_URL` and `DEVICE_INGEST_TOKEN` are server-side only (Route
  Handlers / server components); they must never appear in the client
  bundle. `.env.local` is gitignored; `.env.example` holds placeholders.
- Dependencies are pinned exactly in `package.json` (+ lockfile) — upgrade
  deliberately, never via `latest`.
