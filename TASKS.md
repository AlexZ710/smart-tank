# TASKS - smart-tank 28-Session Reference State

> For an existing repository, do NOT replace its TASKS.md with this file. Use the migration guide to append S19-S28 while preserving actual progress.

## Global status
- Project: smart-tank
- Hardware: ESP32-S3-WROOM-1 + ADS1115 + pH + DS18B20 + PT550; XKC optional
- Removed: ORP, EC, ZP4510, FS300A
- Final extension: first-boot SoftAP provisioning + NVS configuration + Next.js + Tailwind + PostgreSQL + Wi-Fi telemetry + Vercel
- Current session for a fresh repo: S06 (S01-S05 complete; S04/S05 closed by user instruction - see S04/S05 deviation notes for pending board verification)

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
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S02/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docs/hardware_inventory.md` (new), `docs/hardware_deviation_record.md` (new), `TASKS.md` (status update), `evidence/S02/validation_output.txt` (new)

**Validation evidence:** `evidence/S02/validation_output.txt` (2026-08-18). Inventory consistency with baseline lock PASS (ESP32-S3-WROOM-1, ADS1115, SEN0161-V2->A1, DS18B20->GPIO4, PT550->A3, XKC optional). Pin assignments identical to S01 docs. Forbidden hardware appears only in absent/forbidden/replaced context; repo-wide code scan found one text boundary declaration in `backend/ai_agent/reef_agent.py:18` (verified: declaration, not implementation) and zero forbidden telemetry fields in code. Dispositions cross-checked against package-level `01_Project_Documentation/Hardware_Deviation_Record.md`: MATCH. No unsupported measurement claims. `python scripts/validate_wifi_provisioning.py` -> PASSED. Documentation-only session; no build applies.

**Blockers/deviations:** _none recorded_ (deviation record reviewed; no new deviations discovered)

**Commit:** `S02 hardware inventory freeze`

**Resume pointer:** Sessions 01-02 complete and committed. Next session is S03 (Repository and Data Schema) - read `03_Structured_Prompt_Pack/Session_03_Repository_and_Data_Schema.md`, `TASKS.md`, and the frozen `docs/` set before starting. Inventory/deviation docs may only change together with `Hardware_Baseline_Lock.md`.

## Session 03 - Repository and Data Schema
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S03/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `README.md` (repository skeleton + baseline summary), `docs/data_schema.md` (new), `data/raw/.gitkeep` (verified pre-existing), `TASKS.md` (status update), `evidence/S03/validation_output.txt` (new)

**Validation evidence:** `evidence/S03/validation_output.txt` (2026-08-18). docs/data_schema.md covers all 5 tables of `database/schema.sql` (PASS) and all 13 telemetry_readings columns (PASS). No ORP/EC/conductivity/flow/float fields defined anywhere - only prose exclusion statements. `water_level_state` nullable and documented as optional-XKC-only. Repo skeleton present (README, schema doc, data drop zones, schema.sql). `python scripts/validate_wifi_provisioning.py` -> PASSED. Documentation session; no DB instance required.

**Blockers/deviations:** _none recorded_ (schema already excludes unavailable-sensor fields; manual salinity confined to `manual_measurements`)

**Commit:** `S03 repository and data schema`

**Resume pointer:** Sessions 01-03 complete and committed. Next session is S04 (Arduino ESP32-S3 Environment) - read `03_Structured_Prompt_Pack/Session_04_Arduino_ESP32_S3_Environment.md` and `TASKS.md` first. Schema changes must update `database/schema.sql` + `docs/data_schema.md` together and never reintroduce excluded fields.

## Session 04 - Arduino ESP32-S3 Environment
**Status:** COMPLETE (by user instruction 2026-08-18; see deviation note)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S04/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git completion commit created (user instruction 2026-08-18)

- [x] ESP32 Arduino provisioning headers compile (`WiFi`, `Preferences`, `WebServer`, `DNSServer`)
- [x] No real Wi-Fi credential or device token exists in tracked code
**Changed files:** `docs/Arduino_Environment.md` (new), `firmware/arduino/S04_Environment_Check/S04_Environment_Check.ino` (new), `TASKS.md` (status update), `evidence/S04/validation_output.txt` (new)

**Validation evidence:** `evidence/S04/validation_output.txt` (2026-08-18). arduino-cli 1.5.1 + esp32:esp32 core 3.3.11 established and recorded in `docs/Arduino_Environment.md`. Provisioning-header compile for FQBN `esp32:esp32:esp32s3` exit code 0 (346493 B flash / 26440 B RAM). Secret scan on sketch: no credentials. `python scripts/validate_wifi_provisioning.py` -> PASSED.

**Blockers/deviations:** DEVIATION (user decision 2026-08-18): session closed with toolchain + provisioning-header compile verified, but "ESP32-S3 upload works" and "115200 Serial output works" remain physically unverified (no board enumerated on USB; only Bluetooth COM3-COM6). Board verification is deferred to the follow-up recorded in the Resume pointer and must be performed before any hardware evidence is claimed in later sessions. Closing steps recorded in `docs/Arduino_Environment.md`.

**Commit:** `S04 ESP32-S3 Arduino environment` (completion commit created by user instruction; earlier WIP safe-pause commit `fcf1e63` retained in history)

**Resume pointer:** Proceed to S05. Outstanding S04 follow-up when hardware is attached: (1) `arduino-cli board list` to find the COM port; (2) upload `firmware/arduino/S04_Environment_Check` with FQBN `esp32:esp32:esp32s3`; (3) capture 115200 Serial banner + heartbeat into `evidence/S04/serial_capture.txt`; (4) append that evidence to this session's Validation evidence. This is a hardware verification follow-up, not a session revert.

## Session 05 - Shared Firmware Framework
**Status:** COMPLETE (code-verified; hardware runtime verification deferred - see deviation note)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S05/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

- [x] Empty-NVS first boot starts `SmartTank-Setup-XXXXXX` SoftAP (code-verified: begin() -> startPortal(); runtime pending board)
- [x] Captive portal is reachable at `192.168.4.1` (code-verified: kPortalIp + softAPConfig; runtime pending board)
- [x] Wi-Fi/device configuration persists in Preferences/NVS (code-verified: st_cfg namespace, ssid/pass/api_url/token)
- [x] Failed saved-network connection falls back to provisioning (code-verified: tryStation bounded 15 s -> startPortal)
- [x] `PROVISION` and `CLEAR_WIFI` recovery paths are verified (code-verified via pollSerial()/clearAllAndRestart(); runtime pending board)
- [x] Password/token values are never printed to logs (code-verified: handleSave prints SSID only; explicit not-logged note)
**Changed files:** `firmware/arduino/SmartTank_Integrated_Monitor/SmartTank_Integrated_Monitor.ino` (provisioning integrated, non-blocking sensor loop), `firmware/arduino/SmartTank_Integrated_Monitor/WifiProvisioning.cpp/.h` (new module copies), `scripts/validate_wifi_provisioning.py` (extended for telemetry + monitor module copies), `docs/Device_Provisioning.md` (framework location section), `TASKS.md`, `evidence/S05/validation_output.txt` (new)

**Validation evidence:** `evidence/S05/validation_output.txt` (2026-08-28). All 12 mandatory provisioning behaviors audited against S05 prompt: PASS at code level. Extended `python scripts/validate_wifi_provisioning.py` -> PASSED (no WIFI_SSID/WIFI_PASSWORD/SET_LOCALLY anywhere; module present in all three Wi-Fi sketches; monitor uses provisioning.begin/loop). Compile exit=0 for all three sketches on FQBN esp32:esp32:esp32s3 (core 3.3.11): Provisioning 899324 B, Monitor 955913 B, Telemetry 899648 B. Secret scan: no matches.

**Blockers/deviations:** DEVIATION (same class as S04; closure explicitly approved by user decision 2026-08-28): hardware runtime checks (actual first-boot portal, persistence across reboot, failed-network fallback, PROVISION/CLEAR_WIFI on a live board, no-log runtime capture) are physically unverified - no ESP32-S3 enumerated on USB during Session 05. Must be verified with the board before any session claims provisioning evidence. Sensor sessions S06-S08 not implemented (monitor retains non-blocking scaffold only).

**Commit:** `S05 shared firmware and WiFi provisioning`

**Resume pointer:** Proceed to S06 (DS18B20 Temperature Bring-up). Outstanding S05 hardware follow-up when the board is attached: upload `SmartTank_WiFi_Provisioning`, capture first-boot SoftAP banner + 192.168.4.1 portal + save/reboot station connect + PROVISION + CLEAR_WIFI Serial captures into `evidence/S05/hardware/`, then append to this session's Validation evidence.

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
