# Vercel Deployment Guide (S27)

Production deployment for the Smart Tank web facade (`web/`, Next.js App
Router). This guide is deployment-preparation documentation: every step is
written to be executed verbatim once a Vercel account and a managed
PostgreSQL provider exist. Nothing in it loosens the frozen measurement
boundary or the honesty rules.

> Status note (2026-09-16): live deploy DEFERRED at S27 (no Vercel
> account/CLI on host; local Docker engine unavailable). All deployable
> artifacts, env handling, protections and local deployment-equivalent
> checks were in place (see `evidence/S27/`).
>
> Status note (2026-09-19): **LIVE — deployed and verified.** Project
> `smart-tank` (`prj_47i5keeMpV7I2ihwF3mD1xrE6tfK`, Root Directory `web`,
> framework `nextjs`) is connected to the GitHub repo; production alias
> `https://smart-tank-one.vercel.app` (Neon pooled `DATABASE_URL`). Deploy
> driven via the Vercel REST API (CLI login fetch broken through the host
> proxy). Acceptance evidence captured live: `/api/health` →
> `{"status":"ok","database":"up"}`; security headers present (CSP, HSTS,
> `X-Frame-Options: DENY`, nosniff, permissions-policy) and `x-powered-by`
> absent; all six pages 200; telemetry no/wrong token → 401, forbidden field
> `orp_mv` → 400 ("absent from hardware baseline"), non-vocabulary
> `rule_code=ORP_HIGH` → 400; reports/generate no token → 401, empty window
> with admin token → 200 `no-data-shortcut` (provider NOT called); labeled
> smoke ingest (device `e2e-smoke-test`, 2 rows) → `accepted:2`, read back,
> then DELETEd from Neon and re-verified gone (0 rows). Response secret
> scans (AI-key prefix/host/scheme probes + both device and admin tokens) →
> 0 hits. Production secrets live ONLY in Vercel env (7 vars) + operator's
> gitignored `.env.local`; never committed or printed.

## 1. Architecture recap

- **Client (browser)**: static UI + client components. Talks ONLY to
  same-origin `/api/*`. Holds NO secrets (CSP `connect-src 'self'` in
  `web/next.config.mjs` enforces this at runtime).
- **Server (Vercel functions)**: Route Handlers read all secrets from
  environment variables at request time. The AI provider is called ONLY
  from `POST /api/reports/generate` (server-side).
- **Database**: managed PostgreSQL (see §3). The web app never exposes
  credentials to the client bundle (verified by the S24–S27 bundle scans:
  VALUES client:0).

## 2. Environment variables (server-side only)

Set ALL of these in Vercel → Project → Settings → Environment Variables
for the **Production** (and optionally Preview) scope. None may use the
`NEXT_PUBLIC_` prefix — that would embed them in the client bundle.

| Variable | Required | Purpose | Handling |
|---|---|---|---|
| `DATABASE_URL` | yes | Managed Postgres connection string | TLS enforced automatically for non-local hosts (`web/lib/db.ts` sets `ssl.rejectUnauthorized` — node-postgres ignores libpq `sslmode=`, so this is done in code). |
| `DEVICE_INGEST_TOKEN` | yes | Bearer token for `POST /api/telemetry` (devices) | Timing-safe compare. Missing on server → 503 "not configured" (never silently open). |
| `REPORTS_GENERATE_TOKEN` | yes (production) | Bearer token for `POST /api/reports/generate` (admins) | Timing-safe compare. On Vercel (`VERCEL=1`) a MISSING token → 503 refusal — generation is never open in production. |
| `AI_PROVIDER` | only for AI reports | e.g. `openai-compatible`; empty disables generation (honest 503) | Server-side only. |
| `AI_API_KEY` | only for AI reports | Provider key | NEVER logged/echoed; provider errors are scrubbed; bundle scans must stay 0. |
| `AI_MODEL` | only for AI reports | Provider model id | Server-side only. |
| `AI_BASEURL` | only for AI reports | Provider base URL (`.../v1`) | No embedded credentials in the URL. |

Rules (frozen):
- Secrets live ONLY in Vercel env vars and the gitignored local `.env.local`
  files. `.env.example` holds placeholders without values.
- Any secret suspected leaked: rotate immediately (§6.3), then redeploy.
- Verify after every deploy: build logs and rendered pages contain no secret
  values (scan patterns in `evidence/S27/run_validation.sh`).

## 3. Managed PostgreSQL

The local Docker stack (`docker/`) is for development. Production needs a
managed provider (Neon, Supabase, Vercel Marketplace Postgres, RDS…).

1. Create the database and run `database/schema.sql` exactly once
   (provider SQL editor or `psql "$DATABASE_URL" -f database/schema.sql`).
2. Use a **pooled** connection string if the provider offers one
   (pgbouncer-style): serverless functions open many short-lived
   connections. Keep `sslmode=require` semantics — TLS is enforced in
   `web/lib/db.ts` regardless.
3. Connection failures must degrade honestly: every DB-backed route
   already returns 503 with an explicit "NOT stored/generated" message —
   never a fake success. Do not add client-side caching to paper over
   outages.
4. Store the string in `DATABASE_URL` (Production scope). Rotate per §6.3
   if ever exposed.

## 4. Device token handling

- One `DEVICE_INGEST_TOKEN` per deployment (single-operator system). The
  ESP32-S3 stores it in NVS via the SoftAP provisioning flow
  (`docs/Device_Provisioning.md`) — it is entered over the local
  provisioning portal, never hardcoded in firmware or committed.
- The token is sent as `Authorization: Bearer <token>` over HTTPS only.
- Ingestion protections (already implemented, S22/S24): timing-safe
  compare → 401; missing server config → 503; per-source rate limit
  120/min → 429 with `retry_after_s`; batch cap 500 → 413; contract
  violations → 400 per row/request; aggregate outcomes visible (secret-
  free) at `GET /api/system/stats`.
- After rotating the token: update the Vercel env var, redeploy, then
  re-provision each device via SoftAP (NVS overwrite). Old token stops
  working at redeploy time.

## 5. Deployment steps

Prerequisites: Vercel account; repository pushed to a Git remote (Vercel
deploys from Git) or Vercel CLI (`npm i -g vercel`, `vercel login`).

**Git integration (recommended):**
1. Vercel → Add New → Project → import the repository.
2. Framework: Next.js is auto-detected. Root Directory: `web`.
   Build `npm run build`, output defaults — no overrides needed
   (`web/next.config.mjs` carries the production config).
3. Add ALL §2 env vars (Production scope) BEFORE the first deploy.
4. Deploy. Vercel sets `VERCEL=1` automatically — this arms the
   generate-endpoint refusal when `REPORTS_GENERATE_TOKEN` is missing.

**CLI alternative:** from `web/`: `vercel link`, then `vercel --prod`.
Env vars still must be set in the dashboard (or via `vercel env add`).

### Post-deploy verification (capture into `evidence/S27/` at first deploy)

```bash
BASE=https://<your-deployment>.vercel.app
curl -s  $BASE/api/health                     # expect {"status":"ok",...} 200
curl -si $BASE/ | grep -iE "content-security-policy|x-frame-options|nosniff"
curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/api/telemetry \
     -H "Content-Type: application/json" -d '{"device_id":"probe","rows":[]}'
#   expect 401 (unauthenticated ingestion rejected — live evidence)
curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/api/reports/generate \
     -H "Content-Type: application/json" -d '{"from":"2026-01-01T00:00:00Z","to":"2026-01-02T00:00:00Z"}'
#   expect 401 (token configured) or 503 refusal (token missing) — never 200 unauthenticated
# Secret scan of build output + rendered pages (must all be 0):
#   see evidence/S27/run_validation.sh section [4]/[5] patterns
```

## 6. Operations

### 6.1 Rollback
- Vercel → Project → Deployments → ⋯ on the last-known-good deployment →
  **Promote to Production**. Instant, no rebuild.
- CLI: `vercel rollback` (or `vercel promote <deployment-url>`).
- Rollback does NOT roll back env vars or the database schema; if a bad
  migration was applied, restore/repair the DB separately (schema is
  additive so far — no destructive migrations exist).

### 6.2 Monitoring
- `GET /api/health` (status + database up/down) — external uptime checks.
- `GET /api/system/stats` — aggregate ingestion counters. NOTE: in-memory
  PER serverless instance: counters reset on cold start and are per
  instance, exactly as stated in the API response. Treat them as
  directional, not as durable accounting. A shared store (Vercel KV /
  Upstash) is the documented upgrade path before any multi-instance
  public demo; the same limitation applies to the in-memory rate limiter
  (per-instance windows).

### 6.3 Secret rotation
1. Generate a new random value (≥ 32 chars), e.g.
   `openssl rand -hex 32`.
2. Update the Vercel env var → redeploy (env changes require redeploy).
3. `DEVICE_INGEST_TOKEN`: re-provision devices (SoftAP NVS overwrite).
   `REPORTS_GENERATE_TOKEN`: update the admin's copy (UI keeps it in
   browser memory only). `AI_API_KEY`: revoke the old key at the provider.
4. Confirm the old value fails with 401 and the new one works; capture
   both in evidence.

## 7. Known limitations (honest, carried in TASKS.md)

- In-memory rate limiter + ingestion stats are per serverless instance
  (§6.2) — undercounting across instances/cold starts is expected.
- AI generation spends provider tokens; the 5/min/source limiter is also
  per instance. For public exposure, put a shared limiter (Upstash/
  Vercel KV) in front — documented upgrade, not yet implemented.
- CSP allows `'unsafe-inline'` scripts/styles (Next.js hydration
  requirement); no external origins are permitted.
- Read APIs (`latest/history/events/reports/experiments`) are public by
  design (single-operator monitoring dashboard). If the deployment URL
  becomes public and that is unwanted, enable Vercel Deployment
  Protection (SSO gate) — no code change needed.

## 8. Forbidden-sensor invariant (applies to deployment too)

Deploying changes nothing about the measurement boundary: ORP,
EC/conductivity, ZP4510 float and FS300A flow are absent from the
hardware baseline and must not reappear as env vars, fields, mocks, UI
cards, rules or report claims. The S26 guards (frozen rule vocabulary on
`/api/events`, output guard on generation) run identically in production.
