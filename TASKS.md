# TASKS - smart-tank 28-Session Reference State

> For an existing repository, do NOT replace its TASKS.md with this file. Use the migration guide to append S19-S28 while preserving actual progress.

## Global status
- Project: smart-tank
- Hardware: ESP32-S3-WROOM-1 + ADS1115 + pH + DS18B20 + PT550; XKC optional
- Removed: ORP, EC, ZP4510, FS300A
- Final extension: first-boot SoftAP provisioning + NVS configuration + Next.js + Tailwind + PostgreSQL + Wi-Fi telemetry + Vercel
- Current session for a fresh repo: S28 (S01-S27 complete - core milestone closed, web contract frozen, DB workflow committed, web facade scaffolded, ingestion API live per frozen contract, S23 Wi-Fi telemetry sketch compile-verified (1081077 B flash / 82%, runtime HARDWARE-GATED - no board attached), S24 Live Status + System Health UI live, S25 History charts + experiment timeline live (bounded queries, gaps drawn as breaks - never interpolated, validated chart palette light+dark, read-only /api/experiments with MANUAL provenance), S26 Events + bounded AI reports live (frozen S11 vocabulary guard on /api/events - absent-sensor codes unqueryable, bounded generation with output guard - boundary violations discarded whole with 422, deterministic recommendations keep [REQUIRES HUMAN CONFIRMATION] verbatim, empty window never calls the provider, AI_* server-side env only - client bundle 0 hits), S27 deployment+hardening prepared (Vercel runbook + security checklist + env-var handling docs, security headers via next.config.mjs, TLS enforced for managed Postgres, REPORTS_GENERATE_TOKEN timing-safe auth on generation with production refusal posture - all validated deployment-equivalent locally; live Vercel deploy DEFERRED - no account/CLI on host); DB-backed data paths degrade honestly until an engine exists; S04-S08 carry pending board-verification follow-ups - see their deviation notes; S09-S27 fully validated host-side; S13-S17 prepared/designed-only, execution pending hardware/tank; live Docker DB init still blocked on host (WSL not installed) - DB round-trip + S23 on-device telemetry deferred; web build S28 next)

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
**Status:** COMPLETE (code-verified; standalone Serial capture deferred - see deviation note)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S06/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `firmware/arduino/DS18B20_Bringup/DS18B20_Bringup.ino` (new standalone sketch), `docs/ds18b20_validation.md` (new), `TASKS.md`, `evidence/S06/validation_output.txt` (new)

**Validation evidence:** `evidence/S06/validation_output.txt` (2026-08-28). Standalone sketch is GPIO4/1-Wire/4.7k-consistent with the baseline lock; contains no Wi-Fi/ADS/pH code (standalone-only check PASS); compiles exit=0 for FQBN esp32:esp32:esp32s3 (307250 B flash / 22200 B RAM; OneWire 2.3.8, DallasTemperature 4.0.6); secret scan clean; provisioning policy script still PASSED. Standalone capture procedure with pass criteria (1 probe, valid ROM, 12-bit, 10+ OK readings, no -127 sentinel, disconnect negative check) recorded in `docs/ds18b20_validation.md`.

**Blockers/deviations:** DEVIATION (closure explicitly approved by user decision 2026-08-28): the mandatory standalone Serial evidence (S06 prompt: "Hardware sessions must record the standalone sensor result before integrated testing") is physically unverified - no ESP32-S3 board/probe attached. Capture target: `evidence/S06/serial_capture.txt` using `docs/ds18b20_validation.md` procedure. Sensor drift review: no unavailable sensors touched; DS18B20 remains the sole temperature source.

**Commit:** `S06 ds18b20 temperature bring-up`

**Resume pointer:** Proceed to S07 (ADS1115 and pH Bring-up). Outstanding S06 hardware follow-up when board + probe are attached: upload `DS18B20_Bringup`, capture 115200 Serial output (>=10 OK readings + disconnect negative check) into `evidence/S06/serial_capture.txt`, complete the checklist in `docs/ds18b20_validation.md`, then append the capture to this session's Validation evidence.

## Session 07 - ADS1115 and pH Bring-up
**Status:** COMPLETE (code-verified; physical I2C/buffer validation deferred - see deviation note)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S07/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `firmware/arduino/ADS1115_pH_Bringup/ADS1115_pH_Bringup.ino` (new standalone sketch with two-point CAL7/CAL4/SHOWCAL workflow), `docs/ph_calibration_log.md` (new), `TASKS.md`, `evidence/S07/validation_output.txt` (new)

**Validation evidence:** `evidence/S07/validation_output.txt` (2026-08-28). Sketch + I2C_Scanner compile exit=0 for FQBN esp32:esp32:esp32s3 (bring-up 308689 B / scanner 300509 B). Baseline consistency PASS: ADS1115 0x48, SDA GPIO8, SCL GPIO9, SEN0161-V2 on A1. Two-point workflow implemented (CAL7/CAL4 capture 32-sample averages, SHOWCAL printout, UNCALIBRATED status until both points captured). Starter calibration placeholders (1.50/2.03 V) explicitly labeled as placeholders, not calibrations. Standalone-only check PASS (no Wi-Fi/HTTP); secret scan clean; provisioning policy script PASSED.

**Blockers/deviations:** DEVIATION (closure explicitly approved by user decision 2026-08-28): physical bring-up unverified - no ESP32-S3/ADS1115/SEN0161-V2 attached. Pending on-hardware steps per `docs/ph_calibration_log.md`: I2C scanner shows only 0x48; bring-up sketch detects ADS1115; CAL7/CAL4 captures in pH 7.00/4.00 buffers; +/-0.1 pH verification; constants entered into log + integrated monitor. Capture target: `evidence/S07/serial_capture.txt`. Sensor drift review: pH remains the sole acidity measurement; no unavailable sensors touched.

**Commit:** `S07 ads1115 and ph bring-up`

**Resume pointer:** Proceed to S08 (PT550 and Optional XKC). Outstanding S07 hardware follow-up when attached: run the `docs/ph_calibration_log.md` procedure end-to-end, save the Serial capture to `evidence/S07/serial_capture.txt`, fill the calibration record table, then update the integrated monitor's ph7Voltage/ph4Voltage and append evidence to this session.

## Session 08 - PT550 and Optional XKC
**Status:** COMPLETE (code-verified; PT550 Serial capture deferred - see deviation note; XKC declared NOT INSTALLED)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S08/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `firmware/arduino/PT550_Bringup/PT550_Bringup.ino` (new standalone sketch), `docs/pt550_validation.md` (new), `docs/xkc_optional_status.md` (new), `TASKS.md`, `evidence/S08/validation_output.txt` (new)

**Validation evidence:** `evidence/S08/validation_output.txt` (2026-08-28). PT550 sketch compiles exit=0 for FQBN esp32:esp32:esp32s3 (305689 B flash / 23432 B RAM). Baseline consistency PASS: A3, ADS1115 0x48, SDA GPIO8/SCL GPIO9. Light channel documented as relative-only; the sole lux/PAR/PPFD mention in the session docs is the prohibition caveat. XKC explicitly declared NOT INSTALLED; `ENABLE_XKC = false` confirmed; integrated monitor prints `NA` and no code path depends on the sensor. Standalone-only check PASS; secret scan clean; provisioning policy script PASSED.

**Blockers/deviations:** DEVIATION (closure follows the user-approved pattern established in S05-S07; the closure question was asked this session but the user was unreachable, so the same approved treatment was applied): PT550 standalone Serial capture (dark/light procedure per `docs/pt550_validation.md`) is physically unverified - no ESP32-S3 board attached. Capture target: `evidence/S08/serial_capture.txt`. XKC needs no capture (declared absent). Sensor drift review: PT550 remains relative-only; XKC status frozen as NOT INSTALLED until the flip procedure in `docs/xkc_optional_status.md` is followed.

**Commit:** `S08 pt550 and optional xkc`

**Resume pointer:** Proceed to S09 (Host Serial Collector). Outstanding S08 hardware follow-up when the board is attached: upload `PT550_Bringup`, run the dark/light test per `docs/pt550_validation.md`, save the capture to `evidence/S08/serial_capture.txt`, and append it to this session's Validation evidence. (This also completes the bring-up trio with the S06/S07 follow-ups.)

## Session 09 - Host Serial Collector
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S09/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `backend/collector/serial_collector.py` (rewritten: testable parse_csv_line/ensure_csv/collect, optional XKC NA/0/1 handling, append-only with header-drift refusal, no invented data), `tests/test_serial_collector.py` (new, 11 tests), `TASKS.md`, `evidence/S09/validation_output.txt` (new). `data/raw/reef_data.csv` is created at runtime (header-only demo run recorded) and remains gitignored by design (`data/raw/*.csv`); rows are only ever collected from the physical device.

**Validation evidence:** `evidence/S09/validation_output.txt` (2026-08-28). Host-side session - fully validated without hardware. `python -m pytest tests/` -> 13 passed (2 pre-existing rule tests + 11 new collector tests: XKC NA/0/1, banner/header/malformed line rejection, NaN/Inf rejection, append-only preservation, header-drift refusal). Collector EXPECTED schema byte-matches the SmartTank_Integrated_Monitor CSV header (grep-verified) and the telemetry fields in docs/data_schema.md. ensure_csv demo: create -> True, second call -> False (no truncation). Secret scan clean; provisioning policy script PASSED. Python env: conda env `reef`, pandas 3.0.5, pyserial 3.5, pytest 9.1.1.

**Blockers/deviations:** _none recorded_ (no hardware required; unavailable-sensor drift review: XKC remains NA/optional, no ORP/EC/flow/float fields introduced anywhere)

**Commit:** `S09 host serial collector`

**Resume pointer:** Proceed to S10 (Cleaning and Visualization). Note: live Serial collection still awaits the board (S04 follow-up); the collector is ready to run as `python backend/collector/serial_collector.py --port <COMx>` once it is attached.

## Session 10 - Cleaning and Visualization
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S10/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `backend/collector/clean_data.py` (rewritten: numeric coercion, temperature/pH/light validity flags, raw-row preservation, XKC NA/0/1 passthrough fix), `backend/visualization/visualize.py` (rewritten: valid-only plotting via flags, Agg backend, honest "Relative light (%)" labels, empty-channel skip), `tests/test_clean_data.py` (new, 5 tests), `tests/test_visualize.py` (new, 5 tests), `TASKS.md`, `evidence/S10/` (validation_output.txt + synthetic_demo_*.png)

**Validation evidence:** `evidence/S10/validation_output.txt` (2026-08-28). Host-side session - fully validated without hardware. `python -m pytest tests/` -> 23 passed. End-to-end synthetic pipeline demo (fixture clearly labeled as non-telemetry): 6 rows preserved through clean(); validity flags correct for all three planted invalid values (200 C temp, pH -5, light 150%); XKC "NA" survives pandas' NA-parsing; plot_series wrote temperature.png / ph.png / light_relative.png with invalid rows excluded (copies in evidence/S10/synthetic_demo_*.png). Chart labels contain no lux/PAR/PPFD claims. Secret scan clean; provisioning policy script PASSED. No schema/boundary changes required (*_valid flags are a file-pipeline layer only).

**Blockers/deviations:** _none recorded_ (unavailable-sensor drift review: no ORP/EC/flow/float fields anywhere in the pipeline; XKC absent-tolerant)

**Commit:** `S10 cleaning and visualization`

**Resume pointer:** Proceed to S11 (Deterministic Rule Engine). With real collected data the same commands run unchanged: `python backend/collector/clean_data.py` then `python backend/visualization/visualize.py`.

## Session 11 - Deterministic Rule Engine
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S11/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `backend/rules/rules.py` (rewritten: documented warning/critical threshold bands for temperature 24-27/20-32 C and pH 8.0-8.4/7.0-9.0, stable rule_code vocabulary TEMP_*/PH_* aligned with the `events` table, cleaning-aware `*_valid` flag handling, deterministic row/channel ordering, CLI `python -m backend.rules.rules` writing `data/events/events.csv`), `tests/test_rules.py` (rewritten, 12 tests: determinism, ordering, critical band, missing/invalid precedence, absent-channel skip, boundary inclusivity, forbidden-code audit, run() CSV output), `docs/rules_engine.md` (new: thresholds, rule codes, reproduction commands, change procedure), `.gitignore` (derived `data/clean/*.csv`, `data/events/*.csv` ignored; .gitkeep added), `TASKS.md`, `evidence/S11/validation_output.txt` (new)

**Validation evidence:** `evidence/S11/validation_output.txt` (2026-09-12). Host-side session - fully validated without hardware. `pytest tests/test_rules.py -v` -> 12 passed; full suite `pytest tests -q` -> 33 passed (no regression in S09/S10 tests). Provisioning policy script PASSED. End-to-end pipeline on local raw capture: clean -> rules -> `data/events/events.csv`; raw is header-only (no board attached) so 0 rows / 0 events produced honestly, nothing invented. Determinism proven: two consecutive runs give identical events.csv SHA-256 (a67e50d0...). Forbidden-term audit: ORP/EC/ZP4510/FS300A/flow/float appear in S11 files only as explicit absent/forbidden boundary declarations and as a negative test assertion - zero rule codes for unavailable sensors.

**Blockers/deviations:** _none recorded_ (unavailable-sensor drift review: rules exist only for DS18B20 temperature and SEN0161-V2 pH; PT550 relative light is informational with no alert rules; XKC state is never consumed by the engine; test asserting forbidden rule codes cannot appear is part of the suite)

**Commit:** `S11 deterministic rule engine`

**Resume pointer:** Proceed to S12 (Bounded AI Report). Outstanding hardware follow-ups unchanged (S04 serial capture; S05 portal/reboot/PROVISION/CLEAR_WIFI; S06 DS18B20; S07 I2C scan + CAL7/CAL4 buffers; S08 PT550 dark/light). Once real data lands in `data/raw/reef_data.csv`, rerun `python -m backend.collector.clean_data` then `python -m backend.rules.rules` to regenerate events.

## Session 12 - Bounded AI Report
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S12/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `backend/ai_agent/reef_agent.py` (rewritten: input guard rejecting forbidden-sensor columns with ValueError, valid-reading-only channel stats, optional XKC state reported only when real 0/1 states exist, manual-measurement section, deterministic event counts by rule_code, RECOMMENDATION_MAP producing observation/verification suggestions each with requires_human_confirmation=True rendered under [REQUIRES HUMAN CONFIRMATION], build_llm_prompt() emitting the exact bounded prompt for a future approved provider - no provider wired), `docs/prompt_boundary.md` (new: normative input/output/recommendation/LLM-provider boundaries + reproduction commands), `tests/test_reef_agent.py` (new, 21 tests incl. parametrized forbidden-column rejection fixtures), `scripts/generate_mock_telemetry.py` (pre-existing untracked helper swept into this commit by `git add -A`: deterministic, banner-labeled SYNTHETIC mock telemetry generator for hardware-free validation; complies with no-invented-telemetry rules - output is never presented as real data), `TASKS.md`, `evidence/S12/validation_output.txt` (new)

**Validation evidence:** `evidence/S12/validation_output.txt` (2026-09-12). Host-side session - fully validated without hardware. `pytest tests/test_reef_agent.py -v` -> 21 passed (forbidden-column rejection proven for orp_mv/ec_us_cm/conductivity_ms/flow_lpm/zp4510_state/fs300a_flow/float_switch_state fixtures; confirmation markers enforced; determinism proven). Full suite `pytest tests -q` -> 54 passed (no regressions). Provisioning policy script PASSED. Live agent run on current pipeline state: raw capture is header-only (no board), so the agent honestly prints "No telemetry available." plus the boundary statement and the bounded LLM prompt - nothing invented. Two initial test-assertion false positives ("300" inside "FS300A", "par" inside "parameter") were fixed with line-scoped/word-boundary checks and re-run clean.

**Blockers/deviations:** _none recorded_ (unavailable-sensor drift review: forbidden terms appear only in rejection logic, boundary statements and negative test fixtures; salinity/ammonia manual-only; XKC absent-tolerant; no automatic dosing/mains switching anywhere - recommendations are human-confirmation-gated text only)

**Commit:** `S12 bounded ai report`

**Resume pointer:** Proceed to S13 (Baseline Stability Experiment). NOTE: S13-S17 are experiment sessions requiring a populated tank, the assembled sensor rig and multi-day real captures - none possible until the pending S04-S08 board verifications land; expect blocked/deviation handling with honest no-invented-data closure. Outstanding hardware follow-ups unchanged (S04 serial capture; S05 portal/reboot/PROVISION/CLEAR_WIFI; S06 DS18B20; S07 I2C scan + CAL7/CAL4 buffers; S08 PT550 dark/light).

## Session 13 - Baseline Stability Experiment
**Status:** COMPLETE (prepared; real 24-48 h run pending hardware - see deviation)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S13/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `experiments/EXP01_BASELINE.md` (new: full run-ready protocol - preconditions incl. S04-S08 board verifications and S07 pH calibration, 24-48 h undisturbed capture procedure, acceptance criteria on VALID readings only (temp std <= 0.5 C within 24-27 C; pH within 8.0-8.4; >= 95 % completeness; zero CRITICAL events), optional manual salinity/ammonia entries, Results table left _pending_, integrity rules forbidding mock data in results), `backend/analysis/stability.py` (new: per-channel valid-only stats, 1 Hz completeness, event counts, optional XKC state counts - no fabrication for absent channels; CLI with --label/--out for reuse in S14-S17), `tests/test_stability.py` (new, 10 tests), `scripts/dryrun_pipeline_mock.py` (new: labeled end-to-end dry-run mock-gen -> clean -> rules -> stability; outputs confined to gitignored data/mock/), `.gitignore` (data/mock/*.csv ignored, .gitkeep added), `TASKS.md`, `evidence/S13/validation_output.txt` (new)

**Validation evidence:** `evidence/S13/validation_output.txt` (2026-09-12). Host-side session. `pytest tests/test_stability.py -v` -> 10 passed; full suite -> 64 passed (no regressions). Provisioning policy script PASSED. MOCK DRY-RUN (clearly labeled SYNTHETIC, tool check only, NOT results): baseline scenario 120 rows -> 0 events, temp mean 25.5 C std 0.58, pH mean 8.20; sensor_faults 40 rows -> 20 events, valid_pct 75 % per channel (light faults correctly produce no events - light has no alert rules by design); mock manual rows parse (salinity_sg/ammonia_mg_l). Mock generator determinism proven (identical SHA-256 for same seed) - this also discharges the runtime-verification open item on `scripts/generate_mock_telemetry.py`. Integrity: data/mock gitignored, experiments/results deliberately absent.

**Blockers/deviations:** DEVIATION (per prompt wording "Run/prepare" and the user's full-authority rush directive, closure question not asked): the real 24-48 h baseline CANNOT be run - no ESP32-S3 board, sensor rig or populated tank is attached (PnP scan 2026-09-12 confirms no present serial device; earlier COM7/COM8 entries are stale). Session closed on the PREPARE path: protocol + analysis toolchain complete and validated on labeled mock data; EXP01 Results remain _pending_ with no invented data. Pending on hardware: complete S04-S08 verifications, calibrate pH (S07 log), then execute EXP01 procedure and fill Results from real captures only.

**Commit:** `S13 baseline stability experiment`

**Resume pointer:** Proceed to S14 (Temperature Response Experiment) - also expected to close on the prepare path until hardware exists; reuse `backend/analysis/stability.py` and `scripts/dryrun_pipeline_mock.py` patterns. Outstanding hardware follow-ups unchanged (S04-S08 captures; S13 EXP01 execution).

## Session 14 - Temperature Response Experiment
**Status:** COMPLETE (designed; real run pending hardware - see deviation)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S14/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `experiments/EXP02_TEMP_RESPONSE.md` (new: full design for a manual/external controlled temperature-response run - three permitted manual intervention options (warm-water addition <= 5 % volume, heater's own thermostat setpoint step, passive room cooling), explicit prohibitions (no automated heater control claims, no student-built mains switching, no automatic dosing), hard safety abort limits (28.5 C / 23.0 C / sensor-fault burst), manual experiment markers (pre/intervention/restore), valid-only analysis metrics (max dT/dt per 10 min, time-to-peak, peak delta, recovery-to-band time, TEMP_* event cross-check), acceptance criteria, Results left _pending_, integrity rules), `scripts/dryrun_pipeline_mock.py` (extended: temp_excursion scenario + mock chart generation confined to data/mock), `.gitignore` (data/mock/*.png), `TASKS.md`, `evidence/S14/validation_output.txt` (new)

**Validation evidence:** `evidence/S14/validation_output.txt` (2026-09-12). Design-integrity audit PASS: forbidden-hardware terms appear only in the explicit not-measured prohibition; every 'automated/control/switch' mention is a prohibition or refers to the appliance's own rated control - zero automated-control claims. MOCK DRY-RUN (labeled SYNTHETIC, tool check only): temp_excursion 180 rows -> 152 events (TEMP_OUT_OF_RANGE + TEMP_CRITICAL across the planted 33.5 C spike), metrics show max 33.5 C vs baseline 24.6-26.4 C, charts written and verified gitignored under data/mock. Full suite 64 passed; provisioning policy PASSED.

**Blockers/deviations:** DEVIATION (per user full-authority rush directive; same pattern as S13): real temperature-response run requires the assembled rig, a populated tank and a PASSED EXP01 baseline - none possible without the unattached ESP32-S3 hardware. Session closed on the DESIGN path: complete run-ready protocol + validated toolchain; no invented data, Results _pending_. Pending on hardware: execute EXP02 per protocol after EXP01 passes.

**Commit:** `S14 temperature response experiment`

**Resume pointer:** Proceed to S15 (pH Perturbation Experiment) - expected to close on the design path as well; reuse the EXP02 structure (manual intervention only, markers, valid-only metrics, mock dry-run with the ph_drift scenario). Outstanding hardware follow-ups unchanged (S04-S08 captures; EXP01/EXP02 execution).

## Session 15 - pH Perturbation Experiment
**Status:** COMPLETE (designed; real run pending hardware - see deviation)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S15/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `experiments/EXP03_PH_PERTURBATION.md` (new: controlled small-step MANUAL pH perturbation design - two intervention options (passive aeration change preferred; or one pre-diluted manufacturer-dosed buffer pour for 5 L), explicit HARD stop conditions (pH <= 7.8 or >= 8.6 on 2 consecutive valid readings, any PH_CRITICAL event, > 0.2 pH/10 min rate, sensor-fault burst, livestock stress), abort procedure, mandatory recovery log table, valid-only analysis metrics, calibration-within-48h precondition, Results _pending_, integrity rules banning automatic-dosing claims and mock data in results), `backend/analysis/response.py` (new: shared EXP02/EXP03 response metrics - valid-only series extraction, pre-segment stats, max |rate| per 10 min via two-pointer window, peak deviation + time-to-peak, recovery time with band-hold requirement; all-None outputs for all-invalid input, never fabricated), `tests/test_response.py` (new, 11 tests), `scripts/dryrun_pipeline_mock.py` (extended: ph_drift scenario + EXP02/EXP03-style response_report dry-run), `TASKS.md`, `evidence/S15/validation_output.txt` (new)

**Validation evidence:** `evidence/S15/validation_output.txt` (2026-09-12). `pytest tests/test_response.py -v` -> 11 passed; full suite -> 75 passed (no regressions). Design-integrity audit PASS: forbidden-hardware terms only in the explicit not-measured prohibition; every dosing/control mention is a prohibition or manual-only instruction. Provisioning policy PASSED. MOCK DRY-RUN (labeled SYNTHETIC, tool check only): ph_drift 180 rows -> 146 events; EXP03-style response_report on mock shows pre_mean 8.256, peak_delta -1.456, time_to_peak 1.18 min, max_rate 1.456/10 min; recovery_time None is the honest result (mock segment ends before a full hold window). EXP02-style metrics computed likewise on temp_excursion. Mock outputs verified gitignored.

**Blockers/deviations:** DEVIATION (per user full-authority rush directive; same pattern as S13/S14): real pH perturbation requires the assembled rig, a PASSED EXP01, a populated tank and a freshly calibrated SEN0161-V2 (S07 buffer calibration still pending hardware). Session closed on the DESIGN path: complete run-ready protocol + validated shared response-metric toolchain; no invented data, Results _pending_.

**Commit:** `S15 ph perturbation experiment`

**Resume pointer:** Proceed to S16 (Manual Salinity Drift and Organic Load Risk) - manual-measurement-only session (salinity SG + ammonia via `manual_measurements`); can be prepared host-side with a record template + risk-review protocol, execution still needs a real tank. Outstanding hardware follow-ups unchanged (S04-S08 captures; EXP01-EXP03 execution).

## Session 16 - Manual Salinity Drift and Organic Load Risk
**Status:** COMPLETE (prepared; campaigns pending tank operation - see deviation)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S16/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `experiments/EXP04_MANUAL_SALINITY_DRIFT.md` (new: manual-only salinity campaign - refractometer/hydrometer 2x weekly, top-off/water-change logging, risk thresholds SG 1.024-1.026 target with Watch/Act-now bands, drift-rate analysis without interpolation, explicit ban on EC/automatic-salinity claims), `experiments/EXP05_ORGANIC_LOAD_RISK.md` (new: manual-only organic-load risk review - weekly reagent ammonia + 0-25 structured observation checklist + feeding log, LOW/WATCH/HIGH/CRITICAL risk matrix with manual mitigations only, deterministic pH/temperature events as context overlays never risk drivers, explicit ban on ammonia/ORP sensor claims), `backend/analysis/manual_log.py` (new: append-only manual ledger `data/manual/manual_measurements.csv` mirroring the manual_measurements DB table; validation rejects forbidden-sensor metric names even as manual entries, requires method, rejects NaN values, warns on unit drift; add/list/summary CLI), `tests/test_manual_log.py` (new, 15 tests incl. parametrized forbidden-metric rejection), `.gitignore` (data/manual/*.csv ignored - real operational data stays local like raw telemetry), `TASKS.md`, `evidence/S16/validation_output.txt` (new)

**Validation evidence:** `evidence/S16/validation_output.txt` (2026-09-12). `pytest tests/test_manual_log.py -q` -> 15 passed; full suite -> 90 passed (no regressions). Design-integrity audit PASS: forbidden terms in EXP04/EXP05 appear only in prohibition prose; every 'automatic/estimated' mention is an explicit non-claim. Provisioning policy PASSED. CLI tool check on throwaway gitignored path (demo rows labeled "DEMO ROW - not a real reading"): append-only behavior verified (existing line byte-identical after second add; 3 lines total), summary aggregates per metric. Live rejection demo via real CLI: `add --metric orp_mv` -> ValueError exit=1 BEFORE any write; real ledger `data/manual/` confirmed empty (only .gitkeep). One demo-run mistake was caught and corrected honestly: an initial demo wrote 2 labeled rows into the real ledger path (module-constant rebinding does not override default args); those rows were deleted before any commit and the demo was rerun with explicit paths - the committed real ledger is empty.

**Blockers/deviations:** DEVIATION (per user full-authority rush directive; same pattern as S13-S15): the 4-6 week manual campaigns require a populated, operated tank - none exists yet. Session closed on the PREPARE path: complete protocols + validated ledger tooling; no invented data, Results _pending_. Manual entries begin when the tank is running.

**Commit:** `S16 manual salinity drift and organic-load risk`

**Resume pointer:** Proceed to S17 (Results and Figures) - expected to close on the prepare path: results/figures assembly tooling + templates that consume real EXP01-EXP05 outputs when they exist; with no real data yet, it must produce templates and a mock-labeled dry-run only, never fabricated results. Outstanding hardware follow-ups unchanged (S04-S08 captures; EXP01-EXP05 execution).

## Session 17 - Results and Figures
**Status:** COMPLETE (reproducible skeletons; all result cells PENDING real data - see deviation)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S17/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docs/discussion_draft.md` (new: draft skeleton - reproducibility contract (full regeneration command chain), available-measurements table with claim limits, five per-experiment result sections prepared for real runs, pre-written honest-limitations section, figure conventions (valid-only, honest units)), `docs/results_table.csv` (new, GENERATED: 12 rows, all PENDING - telemetry summary rows pending real capture, manual rows pending ledger entries, five EXP run-status rows pending hardware/tank), `scripts/make_results.py` (new: deterministic regenerator of results_table.csv reading ONLY real pipeline outputs (data/clean, data/events, data/manual ledger) - missing sources yield explicit PENDING rows, never zeros/interpolations; never reads data/mock; direct-execution bootstrap added), `TASKS.md`, `evidence/S17/validation_output.txt` (new)

**Validation evidence:** `evidence/S17/validation_output.txt` (2026-09-12). `python scripts/make_results.py` -> 12 PENDING rows written. Reproducibility proven: consecutive runs give identical SHA-256 (1a19fcc1...). No-fabrication check: zero rows with status computed/recorded while sources are empty. Full suite -> 90 passed; provisioning policy PASSED. Integrity audit: forbidden terms in S17 deliverables appear only in the explicit prohibition prose of the discussion draft. Initial direct-execution failure (ModuleNotFoundError when run as a script) fixed with a repo-root sys.path bootstrap and re-validated.

**Blockers/deviations:** DEVIATION (per user full-authority rush directive; same pattern as S13-S16): figures/tables cannot show real results - no telemetry, no manual entries, no completed experiments exist yet. Session closed on the reproducible-skeleton path: the entire results pipeline is built, deterministic and validated; every value cell honestly reads PENDING. When real data lands, re-running the documented command chain regenerates all figures and the results table without code changes.

**Commit:** `S17 results and figures`

**Resume pointer:** Proceed to S18 (Core System Milestone and Pre-Web Demo) - this is the integration/milestone session: per its prompt it may span prior sessions; verify the full host-side chain (collector -> clean -> rules -> stability/response -> manual ledger -> bounded report -> results table) in one demo run on labeled mock data, confirm compile state of all firmware sketches, and record the milestone status incl. the pending-hardware list. Outstanding hardware follow-ups unchanged (S04-S08 captures; EXP01-EXP05 execution).

## Session 18 - Core System Milestone / Pre-Web Demo
**Status:** COMPLETE (core host-side milestone closed; hardware verification pending as recorded)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S18/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

Acceptance per S18 prompt: sensor/data/experiment core documented (milestone doc §1-§2); unavailable sensors not claimed (§3 + repo-wide audit PASS); known limitations recorded (§4: six items incl. placeholder pH calibration and header-only raw data); web extension readiness/blockers recorded (§5); TASKS points to S19 after this session.

**Changed files:** `docs/milestone_S18_core_system.md` (new: architecture map, S01-S17 phase table, forbidden-sensor non-claim verification, known limitations, web-phase readiness + blockers, milestone validation summary), `TASKS.md`, `evidence/S18/validation_output.txt` (new)

**Validation evidence:** `evidence/S18/validation_output.txt` (2026-09-12). Full suite -> 90 passed. Provisioning policy PASSED. End-to-end labeled-mock dry-run green across all four scenarios (baseline 0 events, faults 20, excursion 152, phdrift 146) with EXP02/EXP03-style response metrics computed. Results-table regeneration deterministic (identical SHA-256 1a19fcc1... twice). Firmware milestone compile: SmartTank_Integrated_Monitor for esp32:esp32:esp32s3 exit=0 (955913 B flash / 72 %, 47880 B RAM / 14 %). Repo-wide forbidden-claim audit over backend/scripts/firmware/tests/database: 11 hits, each manually verified as rejection-term constants, boundary statement, honesty docstring or negative test fixture - zero measurement claims. AUDIT PASS.

**Blockers/deviations:** Milestone deviation (carried, honest): the sensing phase is compile- and audit-verified only - no board has ever been attached, so S04-S08 on-hardware captures, pH buffer calibration and EXP01-EXP05 runs remain pending (milestone doc §4 lists them all). Web phase can proceed host-side against labeled mock data; the real device->API->UI demo is blocked on the same hardware.

**Commit:** `S18 core system milestone`

**Resume pointer:** Proceed to S19 (Web Architecture and Data Contract). Web stack works host-side without hardware: use `scripts/generate_mock_telemetry.py` + `scripts/dryrun_pipeline_mock.py` for labeled synthetic inputs (never presented as real), `database/schema.sql` as the frozen contract, `docs/prompt_boundary.md` for report safety, and secret policy per `docs/Device_Provisioning.md`. Hardware follow-ups unchanged (S04-S08 captures; EXP01-EXP05 execution; S23 runtime verification).

## Session 19 - Web Architecture and Data Contract
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S19/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docs/Web_Facade_Architecture.md` (new FROZEN repo-local copy: stack, topology diagram, six required pages with per-page honesty requirements, frozen API surface, the six data states CURRENT/STALE/MISSING/OPTIONAL_ABSENT/MANUAL/UNAVAILABLE with UI treatment, security boundary (Bearer ingest token server+NVS only, DATABASE_URL server-side, reject-never-clamp validation, rate limiting, no secret read-back, labeled-mock-only seeding), S20-S28 session mapping), `docs/Telemetry_Contract.md` (new FROZEN: POST /api/telemetry JSON shape mirroring the serial CSV contract 1:1, per-field nullability+range table matching clean_data.py, forbidden-field 400 rule, batch cap 500, partial-success response semantics, latest/history/events/reports/health GET contracts incl. state computation and honest-empty rules, manual-measurement separation from device ingestion, S23 device-side NA->null mapping), `docs/Web_Acceptance_Criteria.md` (new FROZEN: global honesty gates + per-session acceptance checklists S20-S28, removed-sensor reappearance as automatic failure, S23 runtime verification explicitly hardware-gated not silently skipped), `TASKS.md`, `evidence/S19/validation_output.txt` (new)

**Validation evidence:** `evidence/S19/validation_output.txt` (2026-09-12). Docs-only freeze session. Consistency vs normative package doc: all stack terms/pages/endpoints present in both (counts recorded). Contract ranges verified identical to `clean_data.py` (-10..85 / 0..14 / 0..100). Forbidden-sensor audit: 4 hits, all prohibition/rejection prose - PASS. Secret scan: all token/secret mentions are policy statements; zero credentials in docs; `.env.local` patterns already gitignored. Full suite -> 90 passed; provisioning policy PASSED. No unrelated refactor performed.

**Blockers/deviations:** _none recorded_ (unavailable-sensor drift review: UNAVAILABLE state defined as must-not-exist; forbidden JSON fields rejected with 400 per contract; acceptance criteria make any reappearance an automatic session failure)

**Commit:** `docs: freeze web facade architecture and telemetry contract`

**Resume pointer:** Proceed to S20 (Docker PostgreSQL and Schema): create committed docker-compose for Postgres (pinned tag), `.env.example` placeholders only, apply `database/schema.sql` idempotently, capture compose config + apply log + table listing as evidence per `docs/Web_Acceptance_Criteria.md` S20 checklist. Hardware follow-ups unchanged.

## Session 20 - Docker PostgreSQL and Schema
**Status:** COMPLETE (static-validated; live engine run blocked on host - see deviations)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test (static: compose config + schema consistency/idempotency checks + policy audits; live compose up BLOCKED)
- [x] Save evidence under `evidence/S20/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docker-compose.yml` (rewritten: pinned `postgres:17.4-alpine`, container `smart_tank_db`, env from `.env` with dev-placeholder defaults, `127.0.0.1:5432` localhost-only binding, named volume + read-only `database/schema.sql` mount at `/docker-entrypoint-initdb.d/01_schema.sql` for first-init auto-apply, `pg_isready` healthcheck), `.env.example` (rewritten: placeholders only - POSTGRES_*, DATABASE_URL, DEVICE_INGEST_TOKEN=replace-with-long-random-local-value, empty AI_PROVIDER/AI_API_KEY, STALE_AFTER_S=180), `database/schema.sql` (appended idempotent contract alignment: `ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS timestamp_ms BIGINT` + `light_relative_pct DOUBLE PRECISION`, with comment referencing frozen `docs/Telemetry_Contract.md`; NULL = not measured, never defaulted), `database/README.md` (rewritten: quick start, idempotent re-apply command, `\dt` verification with 5 expected tables, connection string policy, secrets policy (smart_tank_dev_only = documented local dev placeholder), device-JSON→column contract mapping table, change control, volume reset), `docs/data_schema.md` (telemetry_readings table gains timestamp_ms + light_relative_pct rows; water_level_state note now '0'/'1'/NULL per contract; boundary rule extended to light_relative_pct), `evidence/S20/validation_output.txt` (new), `evidence/S20/check_schema_consistency.py` (new static checker), `TASKS.md`. Untracked/gitignored: `.env.local` received operator-provided AI provider credentials (AI_PROVIDER/AI_API_KEY/AI_MODEL/AI_BASEURL) per user instruction 2026-09-12 - verified ignored via `.gitignore:10`, never committed; repo-tracked files hold placeholders only.

**Validation evidence:** `evidence/S20/validation_output.txt` (2026-09-12). [1] Live-engine attempt: Docker client 29.7.2 present, daemon unreachable ("Docker Desktop is unable to start"; `wsl --status` = WSL not installed) - engine UNAVAILABLE on this host. [2] `docker compose config` client-side parse + env interpolation: exit=0 (pinned image, healthcheck, localhost binding, ro schema mount, named volume all resolve). [3] `evidence/S20/check_schema_consistency.py`: ALL CHECKS PASSED - A1/A2 every CREATE/ALTER uses IF NOT EXISTS (6+2 statements); B2 telemetry_readings columns in schema.sql == docs/data_schema.md exactly (15 columns, zero drift); C all five frozen contract fields stored + xkc_level_state→water_level_state mapping documented; D zero forbidden-sensor columns. [4] Secrets: `.env.example` placeholder-only; `.env`/`.env.local` gitignored (check-ignore proof). [5]+[5a] Forbidden-term audit of touched files: 2 residual hits, both rejection/boundary prose - PASS. [6] Full suite: 90 passed. [7] Provisioning policy: PASSED.

**Blockers/deviations:** (1) BLOCKER: Docker engine cannot run on this host - WSL is not installed and installing it requires admin elevation + Windows feature enablement + reboot, which cannot be completed unattended. The S20 acceptance items "schema apply log" and "`\dt` listing" (docs/Web_Acceptance_Criteria.md) are therefore DEFERRED, not skipped: schema.sql is fully idempotent (verified statically), so `docker compose up -d && docker compose exec postgres psql -U smart_tank -d smart_tank -c "\dt"` on any WSL2-capable host (or after `wsl --install` + reboot here) must show the 5 tables. Live init recorded as a pending follow-up for S21+ (web dev server needs the DB for API routes; S21 scaffold itself does not). (2) Deviation: closed via static validation under the user's rush directive ("we need to rush to complete all the sessions"), consistent with the S05-S08 hardware-blocked pattern. (3) Unavailable-sensor drift review: no ORP/EC/ZP4510/FS300A columns added; schema checker enforces their absence permanently; xkc state stays nullable ('0'/'1'/NULL).

**Commit:** `feat: add local PostgreSQL schema and Docker workflow`

**Resume pointer:** Proceed to S21 (Next.js and Tailwind Scaffold): scaffold `web/` (App Router + Tailwind), six page routes as placeholders per frozen `docs/Web_Facade_Architecture.md`, `npm run build` must pass, scan build artifacts for secrets (DATABASE_URL/token strings must not appear in client bundle), evidence = build log + route list + bundle scan to `evidence/S21/`. Carry forward: live Docker/WSL init follow-up (run compose up + `\dt` once a working engine exists); S04-S08 board captures; EXP01-EXP05 execution; S23 runtime verification.

## Session 21 - Next.js and Tailwind Scaffold
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S21/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `web/package.json` (all deps pinned exactly - next 16.3.5, react 19.3.0, pg 8.23.0, tailwindcss/@tailwindcss/postcss 4.3.3, typescript 6.0.3; removed unconfigured eslint tooling - lint belongs to S27 hardening), `web/package-lock.json` (new, committed for reproducibility), `web/lib/states.ts` (new: frozen six-state semantics - DataState type WITHOUT UNAVAILABLE as renderable, STALE_AFTER_S env-driven default 180, stateForValue() with optional-channel handling, ageLabel(); comments enforce absent-sensor must-not-exist rule), `web/components/SiteHeader.tsx` (new: responsive nav - desktop link row + mobile disclosure menu, active-route highlight, frozen six-page set), `web/components/DataStateBadge.tsx` (new: honest state badges current/stale(age)/no data yet/not installed/manual), `web/components/PlaceholderPage.tsx` (new: shared honest empty-state for S24-S26 pages, never invents values), `web/app/layout.tsx` (SiteHeader + honesty footer: monitoring-only, [REQUIRES HUMAN CONFIRMATION], absent sensors never displayed, relative-% light, manual-only salinity/ammonia), `web/app/page.tsx` (Live Status scaffold: direct DB probe with try/catch - no self-fetch; 4 channel cards Temperature/pH/Relative light %/Water level(optional) each with data-state badge; renders MISSING honestly when no DB; force-dynamic), `web/app/api/health/route.ts` (new: GET /api/health per frozen API surface - reports {status, database:{configured,connected,detail}, checked_at}; credential-scrubbed error detail; degraded not 500), `web/app/{history,events,experiments,reports,system}/page.tsx` (placeholders via PlaceholderPage citing their implementing sessions S24-S26 and honest empty-state copy), `web/README.md` (rewritten: quick start, route/session table, frozen honesty rules, secrets policy, pinning policy), `web/tsconfig.json` (updated by next build itself: jsx react-jsx, .next/dev/types include - standard tooling change), `.gitignore` (added node_modules/, .next/, web/next-env.d.ts, web/*.tsbuildinfo, npm-debug.log*), `TASKS.md`, `evidence/S21/validation_output.txt` (new). NOT touched (S22 scope): `web/lib/validation.ts`, `web/app/api/telemetry/**` starter stubs - they still deviate from the frozen contract (ranges -20..80 vs contract -10..85, no forbidden-field rejection, no batch/timestamp_ms/light_relative_pct); S22 must rewrite them per docs/Telemetry_Contract.md.

**Validation evidence:** `evidence/S21/validation_output.txt` (2026-09-12). [1] `npm run build` -> compiled successfully, all 10 routes in route table (6 pages: / dynamic, 5 static placeholders; API: health + 3 telemetry stubs), exit=0. [2] `npm run start` + curl: all six frozen routes HTTP 200; [2a] /api/health honest degraded JSON (DATABASE_URL not configured in this env - no DB invented); [2b] home renders 4 "no data yet" MISSING badges, 0 fabricated numeric readings; [2c]+[5a] rendered-HTML forbidden-term hits all trace to the layout footer PROHIBITION prose (counts = 6 pages x 2 embeds) - zero affirmative claims, PASS. [3] Client bundle scan (.next/static): 0 files contain AI-key patterns (provider prefix + key fragment, sanitized in evidence)/postgres:///smart_tank_dev_only/replace-with-long-random/DEVICE_INGEST_TOKEN/DATABASE_URL/AI_API_KEY; full-key pattern verified absent from the staged diff (only sanitized scan labels appear). [4] Server bundle actual-secret-value scan: 0 hits. [5]+[5a] source audit residuals = states.ts UNAVAILABLE-definition comment + README honesty rule = rejection prose, PASS. [6] Standing gates: 90 pytest passed; provisioning policy PASSED. [7] Hygiene: web/node_modules, web/.next, next-env.d.ts gitignored; git status shows zero artifact/secret leaks.

**Blockers/deviations:** (1) Carried from S20: Docker engine unavailable on this host (WSL not installed), so the scaffold was validated WITHOUT a live database - by design every page degrades honestly (MISSING badges, /api/health degraded). Once an engine exists: `docker compose up -d` + `DATABASE_URL` in `web/.env.local` lights up real states. (2) Deviation: starter telemetry API stubs left in place (initial-commit skeleton) because rewriting ingestion to the frozen contract is explicitly S22 scope; README marks them as stubs. (3) eslint removed from package.json (script was broken without config; Next 16 does not lint at build) - S27 hardening to decide on lint tooling. (4) Unavailable-sensor drift review: DataState type deliberately excludes UNAVAILABLE; no ORP/EC/ZP4510/FS300A fields, cards or claims anywhere in web/; audits confirm only prohibition prose.

**Commit:** `feat: scaffold responsive smart tank web facade`

**Resume pointer:** Proceed to S22 (Authenticated Telemetry Ingestion API): rewrite `web/app/api/telemetry/route.ts` + `web/lib/validation.ts` to the FROZEN `docs/Telemetry_Contract.md` (Bearer DEVICE_INGEST_TOKEN; per-field nullable ranges -10..85 / 0..14 / 0..100, xkc in {0,1,null}; forbidden fields -> 400; batch cap 500; partial-success {accepted, rejected[]}; store timestamp_ms + light_relative_pct; 401/400/429 semantics), align latest/history routes with contract GET shapes + six-state computation, add rate limiting, test with the engine down (honest degradation) and document the live-DB test as pending Docker/WSL. Evidence to `evidence/S22/`. Hardware follow-ups unchanged (S04-S08 captures; EXP01-EXP05; S23 runtime verification; live compose up + \dt once an engine exists).

## Session 22 - Authenticated Telemetry Ingestion API
**Status:** COMPLETE (live DB round-trip deferred - engine unavailable on host, honest 503 degradation validated instead)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S22/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `web/lib/validation.ts` (REWRITTEN to the frozen contract: CHANNEL_RANGES matching clean_data.py (-10..85 / 0..14 / 0..100, voltages 0..5); required-nullable semantics - missing key row-rejected, never defaulted; timestamp_ms integer >0; xkc_level_state strictly 0|1|null; forbidden-field patterns for ORP/EC/conductivity/flow/ZP4510/FS300A/float/lux/PAR/PPFD/dosing + manual-only salinity/ammonia -> whole-request 400, matched raw AND separator-normalized (fixes \b-vs-underscore bypass, caught by tests); unknown extras ignored; MAX_BATCH=500 -> 413; ph_voltage_v validated but NOT stored per database/README.md mapping; optional firmware_version -> honest 'unknown' marker for the NOT NULL schema column; parseIngestPayload is total (never throws)), `web/lib/ratelimit.ts` (new: sliding-window limiter, injectable clock, 120/min per source, retryAfterS; per-instance limitation documented), `web/lib/scrub.ts` (new: credential-scrubbing for error details), `web/app/api/telemetry/route.ts` (REWRITTEN: Bearer auth with timing-safe compare; 503 when server token unconfigured (never silently open); 429 + retry_after_s; 400 malformed/forbidden; 413 oversize; 200 partial-success {accepted, rejected[{index,error}]}; parameterized multi-row INSERT storing timestamp_ms + light_relative_pct + water_level_state '0'/'1'/NULL, recorded_at/received_at = server clock; DB down -> 503 "readings NOT stored"), `web/app/api/telemetry/latest/route.ts` (REWRITTEN: DISTINCT ON (device_id) newest per device ordered by received_at,id; per-channel {value,state} via lib/states; xkc '0'/'1'->0/1 JSON; {"devices":[]} honest empty; 503 DB down), `web/app/api/telemetry/history/route.ts` (REWRITTEN: from/to required ISO-8601 -> 400; channel whitelist (doubles as SQL-identifier guard); limit 1..5000 default 1000, over-max -> 400; ORDER BY received_at ASC, id ASC; gaps never interpolated; 503 DB down), `web/app/api/health/route.ts` (aligned to contract shape {status ok|degraded, database up|down, version 0.2.0-s22} + scrubbed detail/checked_at extras), `web/tests/validation.test.ts` (new: 15 contract tests incl. boundary-inclusive ranges, forbidden-key matrix, partial success, batch cap), `web/tests/ratelimit.test.ts` (new: 5 deterministic injected-clock tests), `web/tests/states.test.ts` (new: 6 data-state semantics tests), `web/package.json` ("test": node --test glob script), `web/tsconfig.json` (allowImportingTsExtensions for native TS test imports), `web/README.md` (route table now live-status per endpoint, tests, rate-limit + DB-blocker notes), `TASKS.md`, `evidence/S22/run_validation.sh` + `validation_output.txt` (new).

**Validation evidence:** `evidence/S22/validation_output.txt` (2026-09-12, reproducible via run_validation.sh). [1] npm test: 25/25 pass (validation 15, ratelimit 5, states 6 - actually 25 total across 3 files). [2] npm run build: exit=0, all 11 routes. [3] Live curl matrix on production server (token set, DATABASE_URL unset): no/wrong token -> 401; malformed -> 400; orp_mv in reading -> 400 forbidden; conductivity_us top-level -> 400; batch 501 -> 413; valid batch -> 503 "database unavailable - readings NOT stored" (honest, never fake-stored); ph=99 -> 200 {accepted:0, rejected[0] "out of range 0..14 (rejected, never clamped)"}; timestamp_ms=0 -> row-rejected; health -> 200 contract shape degraded/down; latest -> 503 devices:[]; history no args -> 400, limit 9999 -> 400, channel=orp_mv -> 400 unknown-channel (whitelist blocks forbidden column names), valid -> 503 honest; 125 rapid POSTs -> 429 + retry_after_s. [4]+[4a] bundle scans: zero secret VALUES client+server (env-var NAME references server-side only, expected); test token absent from all bundles. [5]+[5a] forbidden-term audit: residuals = contract comment + negative-test fixtures = PASS. [6] Standing gates: pytest 90 passed; provisioning policy PASSED. [7] Hygiene: zero artifact/secret leaks in git status.

**Blockers/deviations:** (1) Carried blocker: Docker engine unavailable (WSL not installed, S20) -> the live INSERT + read-back round-trip against real PostgreSQL is DEFERRED, not skipped; every DB-dependent path was validated to degrade honestly (503, "NOT stored", empty devices) and must be re-run once an engine exists (script provided: evidence/S22/run_validation.sh; add DATABASE_URL to web/.env.local). (2) Deviation: schema's firmware_version NOT NULL vs contract JSON without that field - bridged by accepting an optional firmware_version and storing the honest marker 'unknown' when absent (no schema change, no contract change; flagged for S28 review). (3) Deviation: rate limit is in-memory per instance - fine for single-instance target, documented as an S27 hardening item. (4) 503 (not 401) when the server itself has DEVICE_INGEST_TOKEN unset: contract defines 401 for client-side failures; a misconfigured server must not silently accept - honest 503 chosen and documented. (5) Unavailable-sensor drift review: forbidden-key rejection covers all absent sensors + manual-only metrics; history channel whitelist makes forbidden column names unqueryable; zero forbidden columns in SQL; audits PASS.

**Commit:** `feat: add authenticated telemetry ingestion API`

**Resume pointer:** Proceed to S23 (ESP32 Wi-Fi Telemetry): extend the integrated firmware with Wi-Fi POST of the frozen contract JSON (NA->null mapping, batch buffer flushing on reconnect with original timestamp_ms preserved, token+API URL from NVS st_cfg via the existing provisioning portal - MUST reuse WifiProvisioning.h/.cpp, never hardcode credentials), arduino-cli compile verification for esp32:esp32:esp32s3; runtime verification is HARDWARE-GATED (no board attached) - close compile-verified with honest deviation per S05-S08 pattern. Evidence to `evidence/S23/`. Carry forward: DB round-trip re-run when an engine exists; S04-S08 board captures; EXP01-EXP05 execution.

## Session 23 - ESP32 WiFi Telemetry
**Status:** COMPLETE (compile-verified; runtime verification HARDWARE-GATED - no board attached)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S23/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

- [x] Telemetry reuses Session 05 provisioning; no `WIFI_SSID`/`WIFI_PASSWORD` constants are introduced
- [x] Telemetry URL and device token come from local provisioned configuration
- [x] Wi-Fi outage/recovery preserves credentials and does not fabricate telemetry

**Changed files:** `firmware/arduino/SmartTank_WiFi_Telemetry/SmartTank_WiFi_Telemetry.ino` (REWRITTEN from status-only scaffold: merged the validated S05-S08 sensor path (DS18B20 on GPIO4, ADS1115 @0x48 GAIN_ONE pH A1 + PT550 A3 SDA8/SCL9, ENABLE_XKC=false baseline) with contract JSON POST - {device_id, firmware_version 1.0.0-s23, readings[timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,light_voltage_v,xkc_level_state]}; failed/absent channels -> JSON null + Serial NA (DEVICE_DISCONNECTED_C / isnan guards, never defaults); 240-slot ring buffer (~4 min offline) flushes every 10 s and on reconnect with ORIGINAL timestamp_ms preserved; oldest-drop on overflow with honest Serial note + dropped_oldest counter; bounded HTTP 5 s connect/5 s transfer, exponential backoff to 60 s on 5xx/network errors, 4xx drops batch with logged server reason (401 -> re-provision hint); CONFIGURATION NEEDED state when Wi-Fi up but api_url/token unprovisioned - local sensing continues, nothing sent, nothing fabricated; locked Serial CSV contract preserved in parallel; S07 calibration placeholders 1.50/2.03 V carried with same comment), `docs/Device_Provisioning.md` (new S23 telemetry-behavior section: NVS-only URL/token, state matrix incl. offline buffering, overflow honesty, 401/4xx/5xx handling, bounded timeouts), `evidence/S23/compile_output.txt` + `validation_output.txt` (new), `TASKS.md`. WifiProvisioning.h/.cpp in the sketch dir: VERIFIED byte-identical to the S05 originals (reused, not duplicated, not modified).

**Validation evidence:** `evidence/S23/validation_output.txt` (2026-09-12). [1] arduino-cli compile esp32:esp32:esp32s3: SUCCESS - 1081077 B flash (82%), 59120 B RAM (18%), exit=0. [2]+[2a] credential audit: zero WIFI_SSID/WIFI_PASSWORD/token/Bearer/URL source constants in the sketch; only residual = S05 portal HTML placeholder 'https://your-app.example/api/telemetry' (example text, module unchanged); URL/token/deviceId exclusively via provisioning.telemetryUrl()/deviceToken()/deviceId() (5 call sites listed). [3] Module reuse: diff -q identical to SmartTank_WiFi_Provisioning S05 copies. [4] No-fabrication mapping: DEVICE_DISCONNECTED_C x2, isnan x3, xkcState=-1->null, NA x13, ENABLE_XKC=false confirmed. [5]+[5a] firmware-wide forbidden audit: 4 hits, all lux/PAR/PPFD rejection prose (S08 bringup + S23 comment); zero ORP/EC/ZP4510/FS300A hits. [6] Standing gates: pytest 90 passed; provisioning policy PASSED; web tests 25/25. [7] Contract field spot-check: all 9 payload fields present in builder.

**Blockers/deviations:** (1) HARDWARE-GATED: no ESP32-S3 attached (S04-S08 blocker unchanged), so runtime acceptance items (live POST to the S22 API, first-boot provisioning capture, Wi-Fi-loss buffering/reconnect flush capture) are DEFERRED, not skipped - per docs/Web_Acceptance_Criteria.md S23 is explicitly hardware-gated and must not be silently marked runtime-verified. When a board is available: flash this sketch, provision via portal (SSID/pass + api_url=http://<host>:3000/api/telemetry + token), verify POST 200 {accepted} against the S22 server, then pull the Wi-Fi plug and confirm buffered flush with preserved timestamp_ms. (2) The live DB round-trip (S20/S22 WSL blocker) also gates end-to-end device->API->Postgres verification. (3) Closed compile-verified under the user's rush directive, consistent with the S05-S08 hardware-blocked pattern. (4) Unavailable-sensor drift review: XKC stays ENABLE_XKC=false -> null -> OPTIONAL_ABSENT; no ORP/EC/ZP4510/FS300A code paths exist; light sent as relative % only.

**Commit:** `feat: add provisioned ESP32 WiFi telemetry`

**Resume pointer:** Proceed to S24 (Live Status and Device Health UI): wire `/` and `/system` to real data via the S22 endpoints (latest per device + six-state badges, last-seen/uptime/ingestion errors, XKC "not installed" when null), polling or SSR refresh, honest STALE/MISSING/OPTIONAL_ABSENT treatment per frozen architecture; DB-dependent verification remains degraded-honest until an engine exists (S20 blocker). Evidence to `evidence/S24/`. Carry forward: S23 runtime captures + DB round-trip when hardware/engine available; S04-S08 board captures; EXP01-EXP05 execution.

## Session 24 - Live Status and Device Health UI
**Status:** COMPLETE (UI live + validated; DB-backed data display degraded-honest until an engine exists - S20 blocker)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S24/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `web/app/page.tsx` (REWRITTEN: Live Status now renders `LiveStatusPanel`, no direct DB probe), `web/app/system/page.tsx` (REWRITTEN from placeholder to `SystemHealthPanel`), `web/components/LiveStatusPanel.tsx` (NEW, client: polls GET /api/telemetry/latest every 15 s; per-device last-seen + overall CURRENT/STALE badge; 4 ChannelCards with frozen six-state badges; STALE cards dimmed via opacity; XKC null -> "not installed" + "page works fully without it" hint; empty DB -> "No telemetry received yet" honest empty state; 503 -> "database unavailable... nothing fabricated" notice; fetch failure -> honest error, never fake-green), `web/components/SystemHealthPanel.tsx` (NEW, client: polls /api/health + /api/system/stats + /api/telemetry/latest; app health card (status/database/version/checked_at/scrubbed detail), ingestion card (requests, rows accepted/rejected, by HTTP status, errors by reason, last accepted/error, web process uptime, per-process scope note), devices last-seen table, security-posture card; unreachable sources render "unknown, not assumed ok/zero"), `web/components/ChannelCard.tsx` (NEW, extracted card: value only when stored data exists, null -> em-dash + state badge), `web/lib/ingestStats.ts` (NEW: in-memory per-process ingestion counters, injectable clock, fixed-vocabulary reason keys, immutable snapshots, no bodies/tokens/ids stored), `web/app/api/system/stats/route.ts` (NEW: GET aggregate counters + uptime + explicit per-process scope; secret-free), `web/app/api/telemetry/route.ts` (MODIFIED: every outcome recorded to ingestStats - 503 not_configured, 401, 429, 400 malformed/contract, 413, 503 database_unavailable, 200 with accepted/rejected counts; S22 contract behavior UNCHANGED), `web/tests/ingestStats.test.ts` (NEW: 6 tests), `web/README.md` (route table + stats scope note), `evidence/S24/*` (NEW), `TASKS.md`.

**Validation evidence:** `evidence/S24/validation_output.txt` + `run_validation.sh` (2026-09-15). [1] web tests 31/31 pass (25 prior + 6 new). [2] production build green: 8/8 pages, `/` and `/system` static shells, /api/system/stats dynamic. [3] live matrix (production server, DEVICE_INGEST_TOKEN=throwaway, DATABASE_URL unset): GET / 200 "Live Status"; GET /system 200 "System Health"; stats fresh zeros; POST wrong-token x2 -> 401 401; malformed -> 400; forbidden orp_mv -> 400; valid payload -> 503 {"error":"database unavailable - readings NOT stored"} (honest); stats then exactly requests=5, by_status {400:2,401:2,503:1}, errors_by_reason {unauthorized:2, malformed_json:1, contract_violation:1, database_unavailable:1}, last_accepted_at null; /api/health degraded/down. [3a]+[4a] dispositions: 'Bearer' HTML hit + DATABASE_URL client:1 were security-posture UI PROSE (names/mechanism words, zero values); copy reworded ("database credentials"/"timing-safe token comparison"), rebuilt, rescan client bundle = 0 for DATABASE_URL/Bearer/throwaway token/sk-sp-/postgres://; server-side env NAME refs (9 files) expected. [5] forbidden-term audit of all S24 sources: non_rejection_hits_exit=1 (zero). [6] pytest 90 passed; provisioning policy PASSED. [7] hygiene: no artifacts/.env staged.

**Blockers/deviations:** (1) DB engine still unavailable (S20 WSL blocker): with real telemetry stored, badge transitions (CURRENT->STALE dimming at 180 s, OPTIONAL_ABSENT vs MISSING) could not be exercised against live Postgres - validated instead via unit tests (states.test.ts), the S22 latest-endpoint contract and the honest-degradation live matrix (empty/503 paths). Once the engine exists: start compose, POST the contract sample, confirm badges + last-seen on `/` and `/system`. (2) Ingestion error counts are per-server-process in-memory (resets on restart, per instance) - stated verbatim in the API response and UI card; shared/persistent store deferred to S27 hardening (same limitation as the rate limiter). (3) No schema change was needed (counters are operational stats, not telemetry; nothing invented). (4) Unavailable-sensor drift review: no ORP/EC/ZP4510/FS300A fields, cards or mocks added; XKC renders only via stored water_level_state ('0'/'1'/NULL); light card labeled "Relative % only - never lux/PAR/PPFD".

**Commit:** `feat: add live sensor and device health dashboard`

**Resume pointer:** Proceed to S25 (History Charts and Experiment Markers): wire `/history` to GET /api/telemetry/history (from/to range selection, channel whitelist UI, limit, ascending order, gaps NEVER interpolated - render discontinuities honestly) and `/experiments` to the experiment_markers table (timeline + manual provenance; DB-down -> honest empty). Evidence to `evidence/S25/`. Carry forward: S24 live-badge check when DB engine exists; S23 runtime captures when board attached; S04-S08 board captures; EXP01-EXP05 execution.

## Session 25 - History Charts and Experiment Markers
**Status:** COMPLETE (UI live + validated; DB-backed data display degraded-honest until an engine exists - S20 blocker)

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S25/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `web/lib/charting.ts` (NEW: pure data-prep - segmentByGaps splits ascending series wherever consecutive STORED samples are > GAP_BREAK_S=180 s apart (aligned with frozen STALE_AFTER_S), purely subtractive: concatenated segments == input exactly, never invents/drops/reorders; niceTicks 1/2/5x10^k clean steps, flat series -> single tick (range never invented); groupRowsByDevice order-preserving), `web/components/TimeSeriesChart.tsx` (NEW: inline SVG line chart, no chart library - deps stay pinned; dataviz spec: 2px round-join slot-1-blue line validated >=3:1 on both surfaces, hairline SOLID gridlines, crosshair snapping to nearest STORED sample + value-first tooltip with line key, keyboard focus (arrows/Home/End/Escape) same readout, 8px end marker + 2px surface ring, direct end-label in text ink, table-view twin listing exact stored rows, gaps drawn as line breaks, honest per-card empty note), `web/components/HistoryPanel.tsx` (NEW: one filter row above everything it scopes - date-range presets (1h/24h/7d/30d) first + custom window + limit 500/1000/5000 + device_id; single bounded fetch of GET /api/telemetry/history (all columns), per-device small multiples (temperature °C, pH, relative light %); stored NULLs skipped never zero-filled; truncation at limit stated verbatim (OLDEST rows in window, API never downsamples); refetch holds previous frame at reduced opacity; empty-range/503 honest notices; XKC deliberately NOT line-drawn (binary state - raw via channel=water_level_state)), `web/components/ExperimentsPanel.tsx` (NEW: read-only timeline grouped by experiment_id from GET /api/experiments + manual-measurement table with MANUAL badge, measured_at, method, operator_note; honest empty states citing EXP01-EXP05 pending hardware), `web/app/api/experiments/route.ts` (NEW: READ-ONLY GET - experiment_markers + manual_measurements mirrored, limit <= 2000 -> 400 over, truncation flags, ascending, DB down -> 503 honest empty arrays; never writes raw data), `web/app/history/page.tsx` + `web/app/experiments/page.tsx` (REWRITTEN from placeholders to render panels), `web/app/globals.css` (.viz chart-role CSS vars, both modes SELECTED), `web/tests/charting.test.ts` (NEW: 9 tests), `web/README.md` (route table), `evidence/S25/*` (NEW), `TASKS.md`.

**Validation evidence:** `evidence/S25/validation_output.txt` + `run_validation.sh` (2026-09-15). [1] web tests 40/40 (31 prior + 9 charting: gap-break boundary >180 s exact, no-invention equality, flat-series single tick, device grouping). [2] build green: 8/8 pages, /api/experiments dynamic. [2a] dataviz palette validation BEFORE chart code: #2a78d6 on #ffffff light + #3987e5 on #09090b dark -> ALL CHECKS PASS both modes (validator output recorded). [3] live matrix (production server, DATABASE_URL unset): /history 200, /experiments 200; history no-args 400, bad range 400, channel=orp_mv 400 (whitelist names allowed channels only), limit=9999 400, valid query -> 503 {"rows":[],"error":"database unavailable"}; /api/experiments -> 503 honest empty arrays, limit=99999 -> 400; rendered HTML secret scan 0 hits for all patterns. [4] bundle scan: throwaway token/sk-sp-/postgres:// 0 client + 0 server; env NAMES server-only (expected). [5] forbidden-term audit of all S25 sources: non_rejection_hits_exit=1 (zero). [6] pytest 90 passed; provisioning policy PASSED. [7] hygiene PASS.

**Blockers/deviations:** (1) DB engine still unavailable (S20 WSL blocker): charts/timeline could not be exercised against real stored rows - validated instead via unit tests (segmentation/ticks), the live honest-degradation matrix (400/503/empty paths), and the S22 contract. When the engine exists: seed or ingest rows with a deliberate gap, confirm the line breaks at >180 s and the table view lists only stored rows; insert markers/manual rows and confirm the timeline + MANUAL badges. (2) No schema change needed (read-only session; markers/manual rows already modeled by S20 schema). (3) Unavailable-sensor drift review: no ORP/EC/ZP4510/FS300A anywhere in S25 sources (audit zero); history channel whitelist still rejects orp_mv with 400; light charted as relative % only with "never lux/PAR/PPFD" caption; salinity/ammonia appear ONLY as MANUAL-labeled rows with provenance. (4) XKC history intentionally not line-charted (binary state; drawing it as a continuous line would misrepresent) - documented in the panel caption.

**Commit:** `feat: add history charts and experiment timeline`

**Resume pointer:** Proceed to S26 (Events and AI Report UI): wire /events to GET /api/events (S11 frozen vocabulary TEMP_*/PH_* only, severity filter warning|critical, rule_code filter, limit <= 1000) and /reports to GET /api/reports (bounded agent per docs/prompt_boundary.md, [REQUIRES HUMAN CONFIRMATION] markers preserved verbatim, generated-at + scope window + provenance shown). Evidence to `evidence/S26/`. Carry forward: S25 live-data checks when DB engine exists; S24 live-badge check; S23 runtime captures when board attached; S04-S08 board captures; EXP01-EXP05 execution.

## Session 26 - Events and AI Report UI
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S26/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `web/lib/events.ts` (NEW: frozen S11 rule vocabulary as code - EXACTLY the eight TEMP_*/PH_* codes, severities warning|critical, contract caps MAX 1000/DEFAULT 200, type guards isValidRuleCode/isValidSeverity; absent-sensor codes unqueryable by construction), `web/lib/reports.ts` (NEW: pure TS mirror of frozen docs/prompt_boundary.md + reef_agent.py - CONFIRMATION_MARKER and BOUNDARY_STATEMENT verbatim; RECOMMENDATION_MAP exactly the 8 entries verbatim (recommendations originate ONLY from deterministic rule codes, never model-invented); buildRecommendations dedupes first-seen + ignores unknown codes; renderRecommendations puts [REQUIRES HUMAN CONFIRMATION] on every line; guardGeneratedText scans model output line-by-line BEFORE storage - forbidden claims (orp/conductivity/ec/zp4510/fs300a/lux/par/ppfd/flow/float switch/dosing/mains control) discard the ENTIRE report unless the same line is absence/rejection prose (mirrors repo audit allowance); buildBoundedPrompt embeds whitelisted aggregates only (window, per-channel count/NULL-count/min/max/avg, event counts, manual measurements labeled with method, the deterministic recommendations block, boundary statement) with restate-only rules and no model-authored recommendations section), `web/app/api/events/route.ts` (NEW: GET per frozen contract - severity/rule_code validated against the frozen vocabulary (400 lists allowed values; doubles as forbidden-sensor guard: ORP_/EC_/FLOW_ codes rejected), limit integer 1..1000 default 200 (400 over cap), from/to optional ISO (400 invalid), device_id optional; rows mirror the events table exactly, newest first; DB down -> 503 honest empty), `web/app/api/reports/route.ts` (NEW: GET per contract - rows mirror the reports table (report_date, report_type, source window, content_markdown verbatim, created_at as generated-at), limit <= 500 default 50; never edits report bodies; DB down -> 503 honest empty), `web/app/api/reports/generate/route.ts` (NEW: POST bounded generation - required ISO window <= 7 days (400s), dedicated limiter 5/min/source (429), provider config server-side env only (unconfigured -> 503 "not configured - no report was generated or fabricated"), DB reads select WHITELISTED columns only -> 503 "database unavailable - no data to summarize; report NOT generated", empty window -> honest no-data report stored WITHOUT calling the provider, bounded prompt -> openai-compatible /chat/completions (30 s timeout, max 800 tokens, temp 0.2, Bearer key never echoed, errors scrubbed -> 502), guardGeneratedText BEFORE storage -> violation 422 discarded whole (term + offending line reported), deterministic recommendations + boundary statement appended server-side AFTER the guard, INSERT RETURNING stored row + provenance {generator, provider_type, model, generated_by, confirmation_markers_preserved} - never keys/baseURL), `web/components/EventsPanel.tsx` (NEW: presets 24h/7d/30d/all + custom window, severity + rule_code filters offered ONLY from the frozen lists, limit 100/200/500/1000, newest-first table with RESERVED status-palette badges (warning #fab219 with icon / critical #d03b3b with icon - always icon+label, never color alone), honest empty state ("an empty list is not proof of a healthy tank - if no telemetry is flowing, no rules can fire; check /system"), frame-hold refetch, 503 notice), `web/components/ReportsPanel.tsx` (NEW: generate window picker (default last 24 h, filled client-side) + honest per-status notices (saved / no-data-shortcut / 422 DISCARDED with term+line / 429 retry-after / 503 not-configured / 503 db-down / 502 provider failure), stored-report cards from GET /api/reports showing report_date, type badge, generated-at, scope window, provenance line "bounded agent per docs/prompt_boundary.md", content VERBATIM in <pre> - markers preserved exactly, never rendered as HTML; client never sees or sends credentials), `web/app/events/page.tsx` + `web/app/reports/page.tsx` (REWRITTEN from placeholders to render the panels), `web/tests/events.test.ts` (NEW: 6 tests - vocabulary exactly the 8 frozen codes, absent-sensor/invented codes rejected, severities, contract caps), `web/tests/reports.test.ts` (NEW: 11 tests - map <-> frozen vocabulary equality, dedupe/unknown-ignore, marker on every rec line, guard clean-pass/violation-reject/absence-prose-allow/whole-report-discard, prompt embedding + empty-window wording), `.env.example` (AI block placeholders AI_PROVIDER/AI_API_KEY/AI_MODEL/AI_BASEURL with server-side-only note), `web/README.md` (route table + AI secrets rules + generate-auth S27 item), `evidence/S26/*` (NEW), `TASKS.md`.

**Validation evidence:** `evidence/S26/validation_output.txt` + `run_validation.sh` (2026-09-16, final re-run against the exact committed sources). [1] web tests 57/57 (40 prior + 6 events + 11 reports). [2] build green: 16 routes, /api/events + /api/reports + /api/reports/generate dynamic. [3] live matrix server A (AI configured via gitignored web/.env.local, DB engine dead): /events + /reports pages 200; events bad severity 400, rule_code=ORP_HIGH/FLOW_STUCK/EC_HIGH 400 (frozen-vocabulary guard), limit=9999 400, valid query -> 503 honest empty; reports -> 503 honest, limit=99999 -> 400; generate {} / bad-ISO / to<from / >7d -> 400 x4, valid with DB down -> 503 "report NOT generated" (provider never called without data), 6th POST within a minute -> 429. [3b] server B with AI_PROVIDER blanked (process env overrides .env.local) -> 503 "not configured ... no report was generated or fabricated". [4] secret scans: rendered pages + API responses 0 hits for credential prefix/host/scheme probes (sk-sp- prefix, provider host, postgres:// URI - key-derived fragments deliberately not embedded in committed evidence per the staged-diff rule); build output VALUES client:0 AND server:0 everywhere (keys live only in gitignored env, never in build output); env NAMES AI_* client:0 (not-configured UI notice reworded to keep names out of the client bundle) server:2-3 (process.env reads inside the generate route only = expected). Staged-diff secret scan on the commit itself: 0 hits. [5]+[5a] forbidden-term audit of all S26 sources: single residual is an absence-prose test fixture asserted ok:true (dispositioned PASS). [6] pytest 90 passed; provisioning policy PASSED. [7] hygiene PASS.

**Blockers/deviations:** (1) DB engine still unavailable (S20 WSL blocker): event rows and stored reports could not be exercised against real data - validated instead via the live honest-degradation matrix (every 400/429/503/502 path), unit tests on the vocabulary/guard/prompt logic, and the frozen contract. When an engine exists: seed events, run one generate over a populated window, confirm the stored report keeps markers verbatim and lists in the UI. (2) Bounded provider round-trip not exercised live during validation (the DB guard fires first by design - no data to summarize, and no tokens are ever spent without data); provider path validated by unit tests (prompt build, output guard, provenance). Live generation happens at the first window with data. AI config stays in gitignored .env.local files only (root + web), never committed. (3) POST /api/reports/generate is unauthenticated locally (rate-limited 5/min/source) - MUST gain auth before any public deployment; documented in web/README.md as an S27 hardening item. (4) Unavailable-sensor drift review: ORP/EC/ZP4510/FS300A exist nowhere as queryable or renderable fields - the rule_code vocabulary guard 400s them, the output guard discards model text claiming them (absence prose excepted), and audit residuals are rejection/test fixtures only.

**Commit:** `feat: add event history and bounded AI reports`

**Resume pointer:** Proceed to S27 (Vercel Deployment and Hardening): deploy the web facade with server-side env vars only (DATABASE_URL, DEVICE_INGEST_TOKEN, AI_*), build logs showing no secret leakage, deployed /api/health returning ok, deployed ingestion rejecting unauthenticated POST with live 401 evidence; hardening items carried: auth for POST /api/reports/generate, rate-limiter + ingestStats shared-store limitation (per-process today), security headers, env documentation. Carry forward: S26 stored-report live round-trip + S25 gap-break check + S24 live badges when a DB engine exists; S23 runtime captures when board attached; S04-S08 board captures; S07 CAL7/CAL4 buffer calibration; EXP01-EXP05 execution.

## Session 27 - Vercel Deployment and Hardening
**Status:** COMPLETE

- [x] Read active prompt and baseline locks
- [x] Confirm files to create/modify
- [x] Implement session objective only
- [x] Run validation/build/compile/test
- [x] Save evidence under `evidence/S27/`
- [x] Update docs/schema if required
- [x] Review unavailable-sensor drift
- [x] Git commit created

**Changed files:** `docs/Vercel_Deployment_Guide.md` (NEW: production env-var table - all server-side, none NEXT_PUBLIC_; managed PostgreSQL procedure (schema.sql once, pooled connection string, TLS enforced in code because node-postgres ignores libpq sslmode=); device token handling (NVS via SoftAP, HTTPS Bearer only, rotation runbook); ingestion-protection summary (401/503/429/413/400 matrix); Git + CLI deployment steps with Root Directory web; post-deploy verification commands (health, live 401, headers, secret scans) to capture at first deploy; rollback via Promote-to-Production / vercel rollback with the honest note that env vars and schema are NOT rolled back; monitoring + the in-memory per-instance limitation of rate limiter/ingestStats/generate limiter with the shared-store upgrade path; forbidden-sensor invariant restated for production), `docs/Security_Checklist.md` (NEW: pre-deploy checklist A-H - secrets/bundle scans, ingestion protection, generation auth+guard, transport+headers, database TLS/least-privilege, pinned deps + green build/tests, boundary invariant, post-deploy live evidence), `web/next.config.mjs` (NEW production config: CSP default-src 'self' + connect-src 'self' + frame-ancestors/object-src 'none' ('unsafe-inline' scripts/styles documented as the Next.js hydration requirement), nosniff, X-Frame-Options DENY, Referrer-Policy, restrictive Permissions-Policy, X-DNS-Prefetch-Control off, poweredByHeader false, reactStrictMode), `web/lib/auth.ts` (NEW: shared timing-safe Bearer helpers extracted from the S22 telemetry route so ingestion and generation enforce token handling IDENTICALLY; type-only NextRequest import keeps it testable under plain node --test), `web/app/api/telemetry/route.ts` (imports the shared helpers - behavior byte-identical), `web/app/api/reports/generate/route.ts` (S27 auth gate closing the S26 carry-over: REPORTS_GENERATE_TOKEN required whenever configured (timing-safe, 401); on Vercel (VERCEL=1) a MISSING token -> 503 refusal - generation never open in production; local dev without token open by design), `web/lib/db.ts` (TLS for managed Postgres: ssl.rejectUnauthorized=true for every non-local DATABASE_URL, plain local dev by design; exported pure isLocalDatabaseUrl), `web/components/ReportsPanel.tsx` (admin-token field type=password kept in browser MEMORY only - never persisted; sent as Bearer; honest 401 and production-refusal notices; env NAME strings kept out of client prose), `web/tests/hardening.test.ts` (NEW: 6 tests - timing-safe match/wrong/missing/length-mismatch, local-vs-managed SSL decision incl. spoof-resistant host parsing), `.env.example` (REPORTS_GENERATE_TOKEN placeholder + production-refusal note), `web/README.md` (generate route now S26+S27 with auth, hardening summary + doc pointers), `evidence/S27/*` (NEW), `TASKS.md`.

**Validation evidence:** `evidence/S27/validation_output.txt` + `run_validation.sh` (2026-09-16, final re-run against committed sources). [1] web tests 63/63 (57 + 6 hardening). [2] build green - first with next.config.mjs. [3] server A local-dev posture: /api/health 200 honest degraded (database down); ALL five security headers present on / and X-Powered-By suppressed (live curl -sI); unauthenticated POST /api/telemetry -> 401 {"error":"unauthorized"} (the deployment-acceptance evidence, against the production build); correct token -> 400 malformed-body (auth passed); generate open locally by design -> 503 "report NOT generated"; S26 regression: rule_code=ORP_HIGH still 400. [3b] server B with REPORTS_GENERATE_TOKEN: no token 401, wrong token 401, correct token 503 DB-down (auth passed, pipeline honest). [3c] server C VERCEL=1 without token: 503 "refusing rather than staying open" (production refusal posture). [4] secret scans: throwaway token VALUES 0/0 client+server; credential prefix/host/scheme probes 0 in responses + rendered page + build output; env NAMES client:0 (generate-token notice reworded) server:2-4 (Route Handler process.env reads = expected). [5] forbidden-term audit of all S27 sources: non_rejection_hits_exit=1 (ZERO residuals). [6] pytest 90 passed; provisioning policy PASSED. [7] hygiene PASS. Staged-diff secret scan at commit: 0 hits.

**Blockers/deviations:** (1) LIVE VERCEL DEPLOYMENT DEFERRED - no Vercel account/CLI login exists on this host and no credentials may be invented; the guide contains the exact deploy steps + post-deploy verification commands, and the acceptance evidence (deployed /api/health ok, live unauthenticated 401) was captured DEPLOYMENT-EQUIVALENT against the local production build ([3]); capture the live versions at first real deploy per guide §5. (2) DB engine still unavailable (S20 WSL blocker): production will need a managed Postgres - TLS enforcement for managed hosts implemented + unit-tested now; live DB round-trip still deferred. (3) Rate limiter, ingestStats and the generate limiter remain in-memory PER serverless instance (cold-start reset, per-instance windows) - documented honestly in guide §6.2/§7 and README; shared store (Vercel KV/Upstash) is the documented upgrade path, deliberately NOT added this session (no new deps/accounts). (4) CSP allows 'unsafe-inline' scripts/styles (Next.js hydration requirement) - documented in guide §7 + checklist D; no external origins permitted. (5) Read APIs stay public by design (single-operator dashboard); Vercel Deployment Protection documented as the no-code option if the URL goes public. (6) Unavailable-sensor drift review: zero residuals in S27 sources; the frozen-vocabulary guard regression-checked live (ORP_HIGH -> 400); guide §8 + checklist G restate the invariant for production.

**Commit:** `chore: prepare secure Vercel deployment`

**Resume pointer:** Proceed to S28 (End-to-End Validation, Final Report and Demo): full-chain demo to the extent the engine/hardware blockers allow - (labeled mock OR real device when available) -> ingestion -> DB -> UI states -> events -> bounded report; final report document; evidence to `evidence/S28/`. Carry forward: live Vercel deploy + real deployed evidence (guide §5 commands ready); S26 stored-report live round-trip + S25 gap-break check + S24 live badges when a DB engine exists; S23 runtime captures when board attached; S04-S08 board captures; S07 CAL7/CAL4 buffer calibration; EXP01-EXP05 execution.

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
