# Security Checklist (S27)

Run this checklist before EVERY production deployment and after every
dependency or env change. Tick boxes in a copy under `evidence/` when
capturing deployment evidence. Companion to
`docs/Vercel_Deployment_Guide.md`.

## A. Secrets

- [ ] No secret VALUES in git history or staged diffs — scan patterns:
      credential prefix (`sk-sp-`), provider host, `postgres://` URI
      values, device/admin token values (`git diff --cached | grep -cE …`
      must be 0; see `evidence/S27/run_validation.sh`).
- [ ] `.env.local` files (root + `web/`) remain gitignored
      (`git check-ignore` both).
- [ ] `.env.example` holds NAMES/placeholders only, never values.
- [ ] Vercel env vars set for Production scope; NONE use `NEXT_PUBLIC_`.
- [ ] Client bundle scan: env NAMES and VALUES → 0 hits in
      `web/.next/static` (server-build hits must be `process.env` reads
      inside Route Handlers only).
- [ ] Rendered pages + API responses contain no credential strings.
- [ ] Rotation runbook known (§6.3 of the guide); old tokens revocable.

## B. Ingestion protection (`POST /api/telemetry`)

- [ ] Missing token → 401 (live evidence captured).
- [ ] Missing SERVER config (`DEVICE_INGEST_TOKEN`) → 503 "not
      configured" — endpoint never silently open.
- [ ] Timing-safe comparison (`web/lib/auth.ts`) — no `===` on secrets.
- [ ] Rate limit 120/min/source → 429 + `retry_after_s`.
- [ ] Batch cap 500 → 413; contract violations → 400 (per-row honest
      rejections); forbidden fields reject the WHOLE request.
- [ ] DB unreachable → 503 "readings NOT stored" (never fake acceptance).

## C. Report generation (`POST /api/reports/generate`)

- [ ] `REPORTS_GENERATE_TOKEN` set in production; missing token on
      Vercel → 503 refusal (never open).
- [ ] Wrong/missing Bearer → 401 (timing-safe, same helper as ingestion).
- [ ] Dedicated limiter 5/min/source → 429.
- [ ] Provider config server-side only; unconfigured → honest 503; keys
      never echoed (errors scrubbed) nor bundled.
- [ ] Output guard runs BEFORE storage; boundary violation → 422,
      report discarded whole (never partially stored).
- [ ] Recommendations only from deterministic S11 rule codes, each with
      `[REQUIRES HUMAN CONFIRMATION]`; nothing auto-executed anywhere.

## D. Transport & headers (`web/next.config.mjs`)

- [ ] HTTPS only (Vercel default; HSTS is applied by the platform).
- [ ] CSP present: `default-src 'self'`, `connect-src 'self'`,
      `frame-ancestors 'none'`, `object-src 'none'` (inline scripts/
      styles allowed — Next.js hydration requirement, documented).
- [ ] `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
      `Referrer-Policy`, restrictive `Permissions-Policy`.
- [ ] `X-Powered-By` suppressed (`poweredByHeader: false`).

## E. Database

- [ ] Managed provider with TLS; `web/lib/db.ts` enforces
      `ssl.rejectUnauthorized` for every non-local URL (unit-tested).
- [ ] Pooled connection string preferred (serverless connection churn).
- [ ] Least-privilege role if the provider supports it (the app needs
      SELECT/INSERT on the five tables; no DDL in production).
- [ ] `database/schema.sql` applied exactly once; no ad-hoc production
      schema edits.

## F. Dependencies & build

- [ ] Versions pinned exactly in `web/package.json` + lockfile — no
      `latest`, no floating ranges; upgrades are deliberate sessions.
- [ ] `npm run build` green with TypeScript strict checks.
- [ ] `npm test` green (contract, states, ratelimit, ingestStats,
      charting, events vocabulary, report boundary, hardening).
- [ ] Build logs free of secret values.

## G. Boundary invariant (security-relevant)

- [ ] ORP / EC-conductivity / ZP4510 / FS300A appear NOWHERE as
      queryable fields, UI cards, rules, mocks-as-real or report claims
      (forbidden-term audit with rejection-prose filter = PASS).
- [ ] Light stays relative % (never lux/PAR/PPFD); salinity/ammonia
      manual-only with provenance.
- [ ] No actuation anywhere: monitoring-only; reports are text for human
      review; never dosing or mains switching.

## H. Post-deploy verification (live evidence)

- [ ] `GET /api/health` → 200 `{status:"ok", database:"up"}`.
- [ ] Unauthenticated `POST /api/telemetry` → 401 (captured raw).
- [ ] Unauthenticated `POST /api/reports/generate` → 401/503 refusal.
- [ ] Security headers visible via `curl -sI`.
- [ ] UI pages render honest states against the production DB.
- [ ] Evidence saved under `evidence/S27/` (or the session performing
      the first live deploy).
