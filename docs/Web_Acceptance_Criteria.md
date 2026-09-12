# Web Acceptance Criteria (FROZEN — Session 19)

Per-session acceptance for the web phase (S20–S28). Every session must
also keep the standing gates: root TASKS.md updated, evidence under
`evidence/Sxx/`, provisioning policy script PASSED, no secrets committed,
removed sensors never reappear (fields, mocks-as-real, UI cards, rules or
report claims for ORP/EC/ZP4510/FS300A are automatic failures).

## Global honesty gates (apply to every web session)
- [ ] Six data states distinguishable wherever data renders: CURRENT /
      STALE / MISSING / OPTIONAL_ABSENT / MANUAL / UNAVAILABLE-absent.
- [ ] No value is ever invented: null stays null, gaps stay gaps.
- [ ] Mock/synthetic data used in dev/demo is labeled as such in the UI or
      seed script banner and is never committed as real data.
- [ ] Light is "Relative light (%)"; no lux/PAR/PPFD anywhere.
- [ ] Salinity/ammonia render with MANUAL label + measured_at + method.
- [ ] Reports keep [REQUIRES HUMAN CONFIRMATION] markers verbatim.

## S20 — Docker PostgreSQL + schema
- [ ] `docker compose up` starts Postgres pinned by digest/tag in a
      committed compose file; `DATABASE_URL` via `.env.local` (gitignored;
      `.env.example` with placeholders only).
- [ ] `database/schema.sql` applies cleanly to the fresh container
      (idempotent `IF NOT EXISTS`).
- [ ] Evidence: compose config, schema apply log, `\dt` listing.

## S21 — Next.js + Tailwind scaffold
- [ ] `web/` builds (`npm run build`) and dev server serves all six page
      routes (placeholder content allowed).
- [ ] Tailwind configured; no secrets in client bundle (build-artifact
      scan for `DATABASE_URL`/token strings).
- [ ] Evidence: build log, route list, bundle scan output.

## S22 — Authenticated telemetry ingestion API
- [ ] `POST /api/telemetry` enforces Bearer token (401 without), validates
      every field/range per `docs/Telemetry_Contract.md` (400 on forbidden
      fields incl. any ORP/EC/flow/float name; per-row rejection report).
- [ ] Batch cap 500 enforced; rate limit active (429 demonstrable).
- [ ] GET endpoints implemented per contract incl. state computation
      (CURRENT/STALE/MISSING/OPTIONAL_ABSENT) and honest empty results.
- [ ] Tests: auth, validation matrix, partial-success batches, history
      bounds, forbidden-field rejection. All pass via `npm test` or pytest
      equivalents recorded in evidence.
- [ ] INGEST_TOKEN only in `.env.local` (gitignored) — never committed.

## S23 — ESP32 Wi-Fi telemetry
- [ ] Reuses `WifiProvisioning.h/.cpp` (policy script gate); no second
      credential path; token/API URL from NVS only.
- [ ] Compiles for `esp32:esp32:esp32s3`; serial CSV->JSON mapping per
      contract (NA->null); buffered flush preserves timestamp_ms.
- [ ] Runtime POST verification is a hardware-gated follow-up (no board):
      recorded as pending with capture procedure, not silently skipped.

## S24 — Live status + device health UI
- [ ] `/` shows per-channel values with state badges; stale dimmed with
      age; missing shows "no data yet"; XKC card renders "not installed"
      when null and disappears/badges honestly — page fully works without it.
- [ ] `/system` shows last-seen, ingestion error counts, health endpoint
      status; no secrets rendered.

## S25-S26 — History / Events / Experiments / Reports pages
- [ ] `/history`: range selection, bounded queries, gaps not interpolated.
- [ ] `/events`: filter by severity/rule_code; only S11 vocabulary.
- [ ] `/experiments`: timeline from experiment_markers; manual provenance.
- [ ] `/reports`: bounded reports with confirmation markers preserved.

## S27 — Vercel deployment
- [ ] Deploys with server-side env vars only (DATABASE_URL, INGEST_TOKEN);
      build logs show no secret leakage; deployed `/api/health` returns ok.
- [ ] Deployed ingestion rejects unauthenticated POST (live 401 evidence).

## S28 — Final verification
- [ ] Full chain demo: (labeled mock OR real device when available) ->
      ingestion -> DB -> UI states -> events -> bounded report.
- [ ] All standing gates + per-session criteria above re-checked;
      final TASKS.md status and evidence complete.
