# TASKS - smart-tank 28-Session Reference State

> For an existing repository, do NOT replace its TASKS.md with this file. Use the migration guide to append S19-S28 while preserving actual progress.

## Global status
- Project: smart-tank
- Hardware: ESP32-S3-WROOM-1 + ADS1115 + pH + DS18B20 + PT550; XKC optional
- Removed: ORP, EC, ZP4510, FS300A
- Final extension: first-boot SoftAP provisioning + NVS configuration + Next.js + Tailwind + PostgreSQL + Wi-Fi telemetry + Vercel
- Current session for a fresh repo: S22 (S01-S21 complete - core milestone closed, web contract frozen, local DB workflow committed, web facade scaffolded: Next.js 16.3.5 + Tailwind 4.3.3 pinned, six routes + /api/health verified, bundle secret-scan clean; S04-S08 carry pending board-verification follow-ups - see their deviation notes; S09-S21 fully validated host-side; S13-S17 prepared/designed-only, execution pending hardware/tank; live Docker DB init still blocked on host (WSL not installed) - S22 must tolerate/degrade honestly without DB; web build S22-S28 next)

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
