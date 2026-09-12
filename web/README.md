# Smart Tank Web Facade (S21 scaffold)

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
| `/` Live Status | scaffold with per-channel data-state badges | S24 completes |
| `/history` | honest placeholder | S25 |
| `/experiments` | honest placeholder | S25 |
| `/events` | honest placeholder | S26 |
| `/reports` | honest placeholder | S26 |
| `/system` | honest placeholder | S24 |
| `GET /api/health` | live (db configured/connected probe, credential-scrubbed) | S21 |
| `POST /api/telemetry`, `GET latest/history` | starter stubs — replaced to match the frozen contract | S22 |

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
