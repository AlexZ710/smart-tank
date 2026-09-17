# EXP06 Results — Provisioning, Wi-Fi and Web Telemetry Reliability (S28)

Status: **PARTIALLY EXECUTED — host-side software chain COMPLETE; all
board/Wi-Fi hardware portions DEFERRED** (no ESP32-S3 board is attached to
this host; see `TASKS.md` S23 and the hardware deviation record).

Template: `06_Experiment_Templates/EXP06_WEB_TELEMETRY_RELIABILITY.md`.
Runner: `scripts/s28_chain_demo.py` (labeled SYNTHETIC mock telemetry, seed 42,
deterministic — NOT REAL TELEMETRY). Evidence: `evidence/S28/`.

## Part A — provisioning lifecycle: DEFERRED (hardware-gated)

Items 1–9 (empty-NVS first boot, SoftAP, captive portal at 192.168.4.1,
save+reboot, station connect, saved-network failure, fallback, `PROVISION`
recovery, `CLEAR_WIFI` factory reset) require the physical board and cannot be
honestly recorded without it. What IS validated on the host:

- **Item 10 (secret scan)**: PASS — `scripts/validate_wifi_provisioning.py`
  PASSED (re-run in S28 evidence), staged-diff secret scans 0 hits across
  S22–S28 commits, no Wi-Fi password or device token is tracked anywhere
  (credentials live only in gitignored `.env.local` / NVS-by-design).
- Firmware provisioning source compiles cleanly (S23 evidence:
  `evidence/S23/` arduino-cli compile PASS) and the provisioning state
  machine is unit-tested host-side (pytest suite, 90 tests).

Resume pointer: when a board is attached, execute Part A items 1–9 per
`docs/Device_Provisioning.md` and append Serial excerpts + captive-portal
screenshot here.

## Part B — telemetry reliability: host-side software chain EXECUTED

Real ESP32 firmware over real Wi-Fi is deferred (no board), but the full
**software chain the firmware feeds** was exercised live on 2026-09-16 with
labeled mock telemetry through the actual HTTP contract:

| Step | Result |
|---|---|
| Mock device batch (240 rows, scenario `all`) → `POST /api/telemetry` (Bearer auth, frozen contract) | 200 — **accepted 195, rejected 45** |
| Rejection detail | every rejection is an out-of-contract fault row (`temperature_c=-127` sentinel, `ph=15`, `light_relative_pct=150`): rejected with per-row errors, **never clamped, never stored** |
| Delivery success rate (contract-valid rows) | **195/195 = 100 %** of in-contract rows stored; 45/240 = 18.75 % of the batch was deliberately faulty mock data (sensor_faults segment) |
| Postgres read-back | stored row count == accepted count (195) |
| Frozen S11 rules engine on the DB read-back | 98 events (17 TEMP_CRITICAL, 33 TEMP_OUT_OF_RANGE, 15 PH_CRITICAL, 33 PH_OUT_OF_RANGE), inserted keyed to their source `reading_id`/`recorded_at` |
| Unauthenticated ingest | 401 (no token / wrong token) |
| Absent-sensor field probe (`orp_mv`) | 400 whole-request rejection — forbidden fields can never enter the DB |
| Oversized batch (501 rows) | 413 |
| Endpoint outage (Postgres stopped mid-run) | `/api/health` → `"database":"down"` (still 200, honest); ingest → 503 `readings NOT stored`; `/api/events` → 503 honest; UI pages render DB-down notices |
| Recovery (Postgres restarted) | health → `"up"`; row counts **unchanged** (195/98/2 before vs after) — nothing lost, nothing invented during the outage |
| Duplicates/missing rows | none: `accepted` == DB count exactly; missing mock-fault rows are the 45 documented rejections above |
| Bounded AI report over the live window | 200 — live provider round-trip (model `qwen3.8-max`), 4 deterministic recommendations with `[REQUIRES HUMAN CONFIRMATION]` markers verbatim, boundary statement present; one earlier attempt returned an honest 502 when provider latency exceeded the frozen 30 s cap ("report NOT generated" — never fabricated) |
| Empty window | honest no-data report stored WITHOUT calling the provider (`generated_by: no-data-shortcut`) |

Serial-vs-database timestamp comparison and Wi-Fi-outage behavior (device
side: retry/backoff, credential retention during ordinary Wi-Fi loss) are
firmware-runtime checks and remain DEFERRED with Part A; the host-side
equivalent (API/DB outage above) shows the server never invents data during
outages — satisfying the acceptance criterion "The UI never invents data
during outages" for the software chain.

## Acceptance criteria status

- *Wi-Fi changes do not require a firmware recompile* — validated at source
  level (NVS/Preferences provisioning, `validate_wifi_provisioning.py`
  PASSED); runtime demonstration DEFERRED (no board).
- *The UI never invents data during outages* — **PASS** (live outage/recovery
  above; six-state badges S24; honest 503s everywhere).
- *Device distinguishes provisioning/offline/config-needed/connected states* —
  implemented + unit-tested in firmware source (S23); runtime DEFERRED.
- *No submitted password/token appears in Serial output, tracked source, or
  browser dashboard* — **PASS** for tracked source + browser output (S28
  evidence secret scans: rendered HTML + API responses 0 hits for credential
  probes; throwaway local test tokens never embedded); Serial portion DEFERRED
  with Part A.
