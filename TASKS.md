# TASKS - smart-tank 28-Session Reference State

> For an existing repository, do NOT replace its TASKS.md with this file. Use the migration guide to append S19-S28 while preserving actual progress.

## Global status
- Project: smart-tank
- Hardware: ESP32-S3-WROOM-1 + ADS1115 + pH + DS18B20 + PT550; XKC optional
- Removed: ORP, EC, ZP4510, FS300A
- Final extension: first-boot SoftAP provisioning + NVS configuration + Next.js + Tailwind + PostgreSQL + Wi-Fi telemetry + Vercel
- Current session for a fresh repo: S02 (S01 complete)

## Session 01 - Project Scope and Measurement Boundary
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S01/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docs/project_scope.md` (new), `docs/measurement_boundary.md` (new), `TASKS.md` (status update), `evidence/S01/validation_output.txt` (new)

**Validation evidence:** `evidence/S01/validation_output.txt` (2026-08-18). Baseline pin/channel consistency PASS (ADS1115, SEN0161-V2 on A1, PT550 on A3, DS18B20 on GPIO4, ESP32-S3). Forbidden hardware (ORP, EC, ZP4510, FS300A) appears only in explicit forbidden/unavailable sections - no reintroduction. PT550 documented as relative light signal only, never PAR/PPFD/lux unless calibrated. No Wi-Fi credentials/secrets in the new docs. `python scripts/validate_wifi_provisioning.py` -> PASSED. No code/build applies in this documentation-only session.

**Blockers/deviations:** _none recorded_ (unavailable-sensor drift reviewed: ammonia and salinity remain manual-only; XKC remains optional/nullable)

**Commit:** `S01 project scope and measurement boundary`

**Resume pointer:** Session 01 is complete and committed. Next session is S02 (Hardware Inventory Freeze) - read `03_Structured_Prompt_Pack/Session_02_Hardware_Inventory_Freeze.md` and `TASKS.md` before starting. Do not modify the S01 scope/boundary docs except via the change-control rule in `docs/project_scope.md`.

## Session 02 - Hardware Inventory Freeze
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S02/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 03 - Repository and Data Schema
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S03/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 04 - Arduino ESP32-S3 Environment
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S04/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

- [ ] ESP32 Arduino provisioning headers compile (`WiFi`, `Preferences`, `WebServer`, `DNSServer`)
- [ ] No real Wi-Fi credential or device token exists in tracked code
**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 05 - Shared Firmware Framework
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S05/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

- [ ] Empty-NVS first boot starts `SmartTank-Setup-XXXXXX` SoftAP
- [ ] Captive portal is reachable at `192.168.4.1`
- [ ] Wi-Fi/device configuration persists in Preferences/NVS
- [ ] Failed saved-network connection falls back to provisioning
- [ ] `PROVISION` and `CLEAR_WIFI` recovery paths are verified
- [ ] Password/token values are never printed to logs
**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 06 - DS18B20 Temperature Bring-up
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S06/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 07 - ADS1115 and pH Bring-up
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S07/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 08 - PT550 and Optional XKC
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S08/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 09 - Host Serial Collector
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S09/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 10 - Cleaning and Visualization
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S10/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 11 - Deterministic Rule Engine
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S11/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 12 - Bounded AI Report
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S12/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 13 - Baseline Stability Experiment
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S13/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 14 - Temperature Response Experiment
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S14/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 15 - pH Perturbation Experiment
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S15/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 16 - Manual Salinity Drift and Organic Load Risk
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S16/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 17 - Results and Figures
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S17/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 18 - Core System Milestone / Pre-Web Demo
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S18/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 19 - Web Architecture and Data Contract
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S19/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 20 - Docker PostgreSQL and Schema
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S20/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 21 - Next.js and Tailwind Scaffold
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S21/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 22 - Authenticated Telemetry Ingestion API
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S22/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 23 - ESP32 WiFi Telemetry
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S23/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

- [ ] Telemetry reuses Session 05 provisioning; no `WIFI_SSID`/`WIFI_PASSWORD` constants are introduced
- [ ] Telemetry URL and device token come from local provisioned configuration
- [ ] Wi-Fi outage/recovery preserves credentials and does not fabricate telemetry
**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 24 - Live Status and Device Health UI
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S24/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 25 - History Charts and Experiment Markers
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S25/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 26 - Events and AI Report UI
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S26/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 27 - Vercel Deployment and Hardening
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S27/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_

## Session 28 - End to End Validation Final Report and Demo
**Status:** NOT_STARTED

- [ ] Read active prompt and baseline locks
- [ ] Confirm files to create/modify
- [ ] Implement session objective only
- [ ] Run validation/build/compile/test
- [ ] Save evidence under `evidence/S28/`
- [ ] Update docs/schema if required
- [ ] Review unavailable-sensor drift
- [ ] Git commit created

- [ ] First-boot + reconnect + fallback + re-provision + factory-reset evidence complete
- [ ] Repository secret scan confirms no real Wi-Fi password/device token is tracked
**Changed files:** _pending_

**Validation evidence:** _pending_

**Blockers/deviations:** _none recorded_

**Commit:** _pending_

**Resume pointer:** _pending_
