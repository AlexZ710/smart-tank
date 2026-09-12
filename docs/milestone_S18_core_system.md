# Milestone S18 — Core System (Sensing / Data / Experiments) Closed

Date: 2026-09-12 · Commits S01→S17 (see `git log`) · Status: **core
host-side system complete and validated; hardware verification pending.**

## 1. What the core system is

A 5 L, **monitoring-only** reef-tank system:

```
ESP32-S3-WROOM-1 firmware (Arduino)            Host tooling (Python, conda env `reef`)
  DS18B20 temp (GPIO4)          serial CSV       serial_collector -> data/raw (append-only)
  SEN0161-V2 pH (ADS1115 A1)    1 Hz  ->         clean_data -> data/clean (+ *_valid flags)
  PT550 relative light (A3)                      rules -> data/events (deterministic codes)
  XKC level (optional, GPIO7)                    stability/response -> metrics (EXP tooling)
  Wi-Fi provisioning (SoftAP portal, NVS)        manual_log -> data/manual ledger (EXP04/05)
                                                 reef_agent -> bounded report (+ LLM prompt)
                                                 visualize -> docs/figures (valid-only)
                                                 make_results -> docs/results_table.csv
```

## 2. Phase summary (S01–S17)

| Sessions | Deliverable | State |
|---|---|---|
| S01–S03 | scope, hardware inventory/deviation record, data schema | complete (docs frozen) |
| S04 | Arduino toolchain + env check sketch | complete; board upload/serial capture pending |
| S05 | Wi-Fi provisioning framework (portal, NVS, PROVISION/CLEAR_WIFI) | complete (code-audited, compiles); runtime portal checks pending |
| S06 | DS18B20 bring-up | complete (compiles); on-hardware capture pending |
| S07 | ADS1115 + pH bring-up with CAL7/CAL4 workflow | complete (compiles); buffer calibration pending |
| S08 | PT550 bring-up; XKC declared NOT INSTALLED | complete (compiles); dark/light capture pending |
| S09 | host serial collector (contract-enforcing, XKC NA-tolerant) | complete, fully validated host-side |
| S10 | cleaning + visualization (valid-only, raw preserved) | complete, fully validated |
| S11 | deterministic rule engine (TEMP_*/PH_* codes, warn/critical bands) | complete, fully validated |
| S12 | bounded AI report (input guard, human-confirmation gate, LLM prompt) | complete, fully validated |
| S13–S15 | EXP01 baseline / EXP02 temp response / EXP03 pH perturbation | protocols+metrics tooling complete; runs pending hardware |
| S16 | EXP04 salinity drift / EXP05 organic load (manual-only) + ledger | protocols+ledger complete; campaigns pending tank |
| S17 | reproducible results table + discussion skeleton | complete; all cells PENDING real data |

Host-side test suite at milestone: **90 tests passing** (collector, cleaner,
visualizer, rules, agent, stability, response, manual ledger), plus the
standing Wi-Fi provisioning policy check (`scripts/validate_wifi_provisioning.py`).

## 3. Unavailable sensors are not claimed (verified)

- ORP, EC/conductivity, ZP4510 float switches and FS300A flow appear in
  the repository ONLY as explicit absent/forbidden boundary prose, rejection
  logic (agent input guard, manual-ledger metric guard) and negative tests.
- No telemetry field, rule code, chart label or report line implies their
  measurement. Salinity and ammonia exist exclusively as manual ledger
  entries. Light is relative-% only (never lux/PAR/PPFD). XKC is optional;
  the whole pipeline runs with `xkc_level_state = NA`.

## 4. Known limitations at milestone

1. **No physical verification yet**: no ESP32-S3 board has been attached in
   any session; all firmware is compile-verified only. Pending captures:
   S04 heartbeat, S05 portal/reboot/PROVISION/CLEAR_WIFI, S06 DS18B20,
   S07 I2C scan + buffer calibration, S08 PT550 dark/light.
2. **pH uses placeholder calibration voltages** (1.50/2.03 V) until S07
   CAL7/CAL4 runs on real buffers; pH outputs are gated `UNCALIBRATED`
   until then in the bring-up sketch.
3. **No real telemetry exists**: `data/raw` is header-only; every results
   cell is PENDING; experiments EXP01–EXP05 are unrun.
4. Single-point measurements only; small-volume, small-n system — all
   analysis is descriptive, no causality claims (see discussion draft §4).
5. Light channel is uncalibrated relative signal.
6. Reports/recommendations are text-only with mandatory human confirmation;
   the system never actuates anything.

## 5. Web-extension readiness (S19+)

**Ready:**
- Data contract frozen and machine-enforced: 7-column CSV contract,
  `*_valid` flags, deterministic event codes aligned to the `events` table,
  manual ledger aligned to `manual_measurements`.
- `database/schema.sql` already defines all five tables the web API needs
  (telemetry_readings, events, experiment_markers, manual_measurements,
  reports).
- Bounded-report prompt boundary (docs/prompt_boundary.md) gives the web
  layer a safe report source; ingest-token and secret policy already
  documented (docs/Device_Provisioning.md §Security checks).
- Mock generator + dry-run scripts allow API/UI development and testing
  without hardware (labeled synthetic data only, gitignored outputs).

**Blockers for the web phase:**
- S23 (ESP32 Wi-Fi telemetry) cannot be runtime-verified until a board is
  attached; it must reuse `WifiProvisioning.h/.cpp` (policy-enforced).
- Real end-to-end demo (device -> API -> UI) stays pending the same
  hardware captures listed in §4.1; until then the web stack is validated
  against labeled mock data only.
- Deployment credentials (API URL, ingest token, Vercel) are environment
  secrets — must never enter the repo (same policy as Wi-Fi credentials).

## 6. Milestone validation (evidence/S18/validation_output.txt)

- Full pytest suite green; provisioning policy check green.
- End-to-end labeled-mock dry-run (generate -> clean -> rules -> metrics ->
  charts) green; results-table regeneration deterministic (identical hash).
- Integrated monitor firmware re-compiles clean for `esp32:esp32:esp32s3`.
- Forbidden-claim repo audit: no unsupported measurement claims in code,
  charts or docs.
