# Session 27 - Vercel Deployment and Hardening

## Goal
Prepare production environment variables, managed PostgreSQL connection, device token handling, ingestion protection, deployment and rollback documentation.

## Read before editing
- repository `TASKS.md`
- active hardware baseline
- `01_Project_Documentation/Web_Facade_Architecture.md`
- outputs/evidence from prior completed session

## Hardware/data lock
- Controller: ESP32-S3-WROOM-1.
- Active sensors: SEN0161-V2 pH via ADS1115 A1, DS18B20, PT550 via ADS1115 A3.
- XKC-Y25-T12V is optional only if physically present and isolated correctly.
- ORP, EC, ZP4510, FS300A are absent. Do not add fields, mocks presented as real data, UI cards, rules, or report claims for them.
- Salinity is manual when used.

## Files to create/modify
docs/Vercel_Deployment_Guide.md, web production config, security checklist

## Implementation prompt
Implement only Session 27: **Vercel Deployment and Hardening**. Reuse the existing repository and preserve all completed earlier work. Do not perform later sessions. Keep the system safe, reproducible, and evidence-driven. The web facade must distinguish current, stale, missing, optional, manual, and unavailable data rather than inventing values.

## Acceptance checklist
- [ ] Session objective is implemented without unrelated refactor.
- [ ] Removed sensors did not reappear.
- [ ] Secrets are not committed.
- [ ] Relevant tests/build/compile checks pass.
- [ ] Evidence saved under `evidence/S27/`.
- [ ] Repository `TASKS.md` updated with status, changed files, evidence, blockers, commit and next resume pointer.
- [ ] Separate Git commit created.

## Commit message
`chore: prepare secure Vercel deployment`

## Stop condition
Stop after Session 27 acceptance is recorded. Do not auto-run Session 28.
