# Session 25 - History Charts and Experiment Markers

## Goal
Implement bounded history queries, chart UI and experiment/manual-operation markers without altering raw data.

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
web/app/history/**, web/app/experiments/**, API additions, chart components

## Implementation prompt
Implement only Session 25: **History Charts and Experiment Markers**. Reuse the existing repository and preserve all completed earlier work. Do not perform later sessions. Keep the system safe, reproducible, and evidence-driven. The web facade must distinguish current, stale, missing, optional, manual, and unavailable data rather than inventing values.

## Acceptance checklist
- [ ] Session objective is implemented without unrelated refactor.
- [ ] Removed sensors did not reappear.
- [ ] Secrets are not committed.
- [ ] Relevant tests/build/compile checks pass.
- [ ] Evidence saved under `evidence/S25/`.
- [ ] Repository `TASKS.md` updated with status, changed files, evidence, blockers, commit and next resume pointer.
- [ ] Separate Git commit created.

## Commit message
`feat: add history charts and experiment timeline`

## Stop condition
Stop after Session 25 acceptance is recorded. Do not auto-run Session 26.
