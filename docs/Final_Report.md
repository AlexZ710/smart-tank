# Smart Tank — Final Technical Report (S28)

5 L monitoring-only reef tank: ESP32-S3 sensors → provisioned Wi-Fi →
authenticated ingestion API → PostgreSQL → responsive web dashboard with a
bounded AI reporting agent. Prepared per `07_Report_Templates/Technical_Report_Template.md`.

Honesty statement: no ESP32-S3 board was attached to the development host for
the software sessions (S14–S28). Every runtime result below is either (a) live
host software evidence using **clearly labeled SYNTHETIC mock telemetry**
(`scripts/generate_mock_telemetry.py`, deterministic seed 42 — NOT REAL
TELEMETRY, never committed as data) or (b) explicitly marked DEFERRED until a
board is available. No measurement is fabricated anywhere in this report.

## 1. Introduction

Small reef systems (≈5 L) drift fast: temperature, pH and light can leave safe
bands between manual checks. This project builds an always-on, agent-friendly
monitoring stack that (1) samples the measured baseline channels, (2) stores
them with full provenance, (3) evaluates a frozen deterministic rule engine,
and (4) surfaces state honestly in a web dashboard — with AI assistance that
is bounded to restating observed data and deterministic recommendations, each
marked `[REQUIRES HUMAN CONFIRMATION]`. It is monitoring-only: no dosing, no
mains switching, nothing auto-executed.

## 2. System Design

### 2.1 Physical hardware (locked baseline)

ESP32-S3-WROOM-1; ADS1115 16-bit ADC at 0x48 (SDA GPIO8 / SCL GPIO9);
SEN0161-V2 pH on A1; DS18B20 temperature on GPIO4; PT550 relative light on A3
(**relative % only — not a PAR/lux sensor**); XKC-Y25-T12V water level
**optional, isolated, nullable** (`ENABLE_XKC=false` by default). Frozen in
`docs/hardware_inventory.md` / `01_Project_Documentation/Hardware_Baseline_Lock.md`.

### 2.2 Removed/unavailable sensors

ORP, EC/conductivity, ZP4510 float and FS300A flow are **absent from this
hardware baseline and were not implemented**. No results, fields, cards, mock
values or API surface exist for them anywhere in the stack; the ingestion
contract rejects such fields with 400 (whole request), the events API rejects
non-vocabulary rule codes with 400, and the AI report boundary treats claims
about them as forbidden (violations discard the entire report, 422). Salinity
and ammonia exist **only as manual measurements** (refractometer / liquid test
kit) with `measured_at` + method provenance.

### 2.3 First-boot provisioning architecture

Implemented and unit-tested in firmware source (S23): empty-NVS first boot →
local SoftAP `SmartTank-Setup-XXXXXX` → captive portal at 192.168.4.1 →
credentials saved to NVS (Preferences) → reboot → bounded station connect →
saved-network failure fallback → `PROVISION` re-provision and `CLEAR_WIFI`
factory-reset commands. Wi-Fi changes never require a firmware recompile.
Secret-handling boundary: credentials are never logged, never tracked
(`scripts/validate_wifi_provisioning.py` PASSED; no hardcoded Wi-Fi
credentials anywhere in the repo). Runtime lifecycle evidence is DEFERRED
(no board attached) — see `docs/EXP06_Results.md` Part A.

### 2.4 Network and web architecture

ESP32 → provisioned Wi-Fi → HTTPS `POST /api/telemetry` (Bearer
`DEVICE_INGEST_TOKEN`, timing-safe compare, frozen `docs/Telemetry_Contract.md`:
required keys with explicit nulls, contract ranges, batch ≤ 500, per-row
partial success, forbidden-field 400) → Next.js App Router (Route Handlers,
server-side env only) → PostgreSQL (`database/schema.sql`: telemetry_readings,
events, experiment_markers, manual_measurements, reports) → dashboard pages
(`/`, `/history`, `/experiments`, `/events`, `/reports`, `/system`) and the
bounded report agent (`POST /api/reports/generate`). Deployment runbook:
`docs/Vercel_Deployment_Guide.md` (live deploy DEFERRED — no Vercel
account/CLI on the host; deployment-equivalent surface validated locally).

## 3. Methods

- **Calibration**: DS18B20 validated against reference (`docs/ds18b20_validation.md`);
  pH two-point CAL7/CAL4 procedure documented (`docs/ph_calibration_log.md`) —
  **buffer calibration DEFERRED** (placeholder slope 1.50/2.03 V in mock
  generator is explicitly NOT a calibration); PT550 relative-only validation
  (`docs/pt550_validation.md`).
- **Sampling**: firmware fixed-interval sampling with device `millis()`
  timestamp stored as sent (`timestamp_ms`), server clock authoritative
  (`recorded_at`/`received_at`).
- **Data validation**: `backend/collector/clean_data.py` (validity flags,
  sentinel detection) mirrored exactly by the API's `CHANNEL_RANGES`
  (single source of truth, range drift = contract violation).
- **Manual measurements**: salinity SG (refractometer) and ammonia (liquid
  test kit) recorded with measured_at + method; rendered MANUAL, never as
  sensor data.
- **Event rules**: frozen S11 engine (`backend/rules/rules.py`) — 8 codes
  (TEMP_/PH_ × MISSING/INVALID/OUT_OF_RANGE/CRITICAL), severities
  warning/critical, deterministic (same rows → same events), documented bands
  (temp warn 24–27 °C, crit 20–32 °C; pH warn 8.0–8.4, crit 7.0–9.0).
- **AI boundary** (`docs/prompt_boundary.md`, frozen): whitelisted SQL
  aggregates only in the prompt; output line-guarded BEFORE storage
  (forbidden claim → entire report discarded, 422); recommendations only from
  the 8-entry verbatim RECOMMENDATION_MAP, each line marked
  `[REQUIRES HUMAN CONFIRMATION]`; boundary statement always appended;
  provider env server-side only; nothing auto-executed.
- **Provisioning/network test method**: EXP06 (`docs/EXP06_Results.md`) —
  Part A hardware DEFERRED; Part B executed host-side with labeled mock
  telemetry through the real HTTP contract, including a live endpoint
  outage/recovery timeline.

## 4. Web Facade

Pages: Live Status (six-state badges CURRENT/STALE/MISSING/OPTIONAL_ABSENT/
MANUAL/UNAVAILABLE-absent, 15 s polling, stale dimmed with age); History
(bounded queries, per-device small-multiple SVG charts, gaps drawn as breaks,
never interpolated); Experiments (read-only markers + manual provenance);
Events (frozen-vocabulary filters only, newest-first, honest empty state —
"not proof of a healthy tank"); Reports (generation with admin token kept in
browser memory only; stored content shown VERBATIM, never rendered as HTML);
System (health, per-process ingestion counters, per-device last-seen).
Ingestion stats and rate limiters are in-memory per instance (documented
single-instance limitation; shared store = documented upgrade path).
The local provisioning portal (SoftAP captive page) is a separate, device-local
surface — deliberately distinct from this server-rendered dashboard.

## 5. Experiments

- **EXP01–EXP05** (baseline stability, temperature response, pH perturbation,
  manual salinity drift, organic-load risk observation): **NOT EXECUTED —
  require the physical board + tank**. Templates ready in
  `06_Experiment_Templates/`; the mock pipeline (`scripts/dryrun_pipeline_mock.py`)
  validates the analysis chain they will feed, with labeled synthetic data only.
- **EXP06** (provisioning + Wi-Fi/web telemetry reliability): **partially
  executed** — full host-side software chain live (ingest → DB → rules →
  events → UI APIs → bounded AI report), endpoint outage/recovery honesty
  proven; hardware/Wi-Fi portions DEFERRED. Results: `docs/EXP06_Results.md`.

## 6. Results (labeled mock chain, 2026-09-16 — SYNTHETIC, not tank measurements)

Live local stack: conda-forge PostgreSQL 18.6 (throwaway cluster outside the
repo) + Next.js production build. From `scripts/s28_chain_demo.py`
(evidence/S28):

- Ingest: 240 mock rows → **195 accepted / 45 rejected**; every rejection an
  out-of-contract fault row (−127 °C sentinel, pH 15, light 150 %) rejected
  per-row with an error, never clamped or stored. Delivery success rate for
  in-contract rows: **100 %** (195/195 read back from Postgres).
- Rules engine on the DB read-back: **98 events** (17 TEMP_CRITICAL,
  33 TEMP_OUT_OF_RANGE, 15 PH_CRITICAL, 33 PH_OUT_OF_RANGE) inserted keyed to
  their source reading_id/recorded_at.
- Security paths: no/wrong token → 401; absent-sensor field probe → 400 whole
  request; 501-row batch → 413; events API frozen-vocabulary violations → 400.
- Outage/recovery: Postgres stopped → health `"database":"down"`, ingest 503
  "readings NOT stored", events 503, UI honest; restarted → `"up"`, counts
  unchanged. **Nothing invented during the outage.**
- Bounded AI report (LIVE provider round-trip, model `qwen3.8-max`): stored
  verbatim with 4 deterministic recommendations (verbatim map entries, each
  `[REQUIRES HUMAN CONFIRMATION]`), the not-measured absence prose, and the
  boundary statement. One transient 502 when provider latency exceeded the
  frozen 30 s cap — "report NOT generated", never fabricated; retry succeeded.
  Empty window → honest no-data report without calling the provider.
- Figures: the dashboard charts these mock rows live; they are labeled mock
  output and must not be quoted as tank measurements. Units/time ranges on all
  charts; missing data drawn as gaps.

## 7. Discussion

- **Sensor limitations**: PT550 is relative light only (never lux/PAR/PPFD);
  pH calibration uses placeholder slope until real buffer calibration
  (DEFERRED); DS18B20 single-point validated. Absent sensors are never
  queryable or reportable (ORP, EC, ZP4510, FS300A — absent by baseline
  lock; rejection enforced at contract, API, vocabulary and AI-boundary
  layers, not by convention).
- **Provisioning/NVS trust boundary**: credentials live in NVS + gitignored
  env only; validated by source policy scan; runtime lifecycle evidence is
  the main hardware-gated gap.
- **Network/database failure modes**: every layer degrades honestly (503 with
  explicit "NOT stored"/"NOT generated" wording; six-state badges; outage
  proven live in EXP06 host-side).
- **False alerts**: warning vs critical bands plus INVALID/MISSING separation
  keep cleaning artifacts from masquerading as tank excursions; the events UI
  states an empty list is not proof of health.
- **Manual vs automatic**: salinity/ammonia are MANUAL by design with
  provenance; the AI agent may restate them but never upgrade them to
  sensor-grade claims.
- **Scalability**: single-instance in-memory limiters/stats are the documented
  ceiling; shared store + multi-instance is the upgrade path (noted, not
  implemented). Serverless caveats documented in the deployment guide.

## 8. Conclusion

The complete software delivery — firmware source (compiles clean), collector/
cleaning/rules/analysis backend, frozen contracts, PostgreSQL schema, full
web facade with six-state honesty, bounded AI reporting with live provider
round-trip, hardened deployment posture — is implemented, tested (63 web unit
tests, 90 pytest, live chain demo all-green) and evidenced. What is left is
physical: board-attached provisioning runtime (EXP06 Part A), real-tank
experiments (EXP01–EXP05), real buffer calibration, and the live Vercel
deploy (runbook ready). No result in this report invents hardware data.

## 9. Reproducibility

- **Wiring/board**: `docs/hardware_inventory.md`, `docs/Arduino_Environment.md`
  (arduino-cli compile evidence: `evidence/S23/`).
- **Database**: `docker compose up -d` (Docker/WSL host) **or** the S28
  host-side alternative: `conda create -n tankdb -c conda-forge postgresql`,
  `initdb -D <dir OUTSIDE repo> -U postgres -A trust`, `pg_ctl ... start`,
  create role `smart_tank` + db `smart_tank`, apply `database/schema.sql`
  (exact commands in `evidence/S28/run_validation.sh` header).
- **Env**: `cp .env.example web/.env.local`; set `DATABASE_URL`,
  `DEVICE_INGEST_TOKEN`, optional `REPORTS_GENERATE_TOKEN` (required in
  production — missing on Vercel → 503 refusal) and `AI_*` provider vars for
  report generation (server-side only; never `NEXT_PUBLIC_`).
- **Web**: `cd web && npm install && npm run build && npm run start` →
  http://localhost:3000.
- **Chain demo**: `conda run -n reef python scripts/s28_chain_demo.py
  --device-token <throwaway> --gen-token <throwaway>` (labeled mock data).
- **Validation**: `bash evidence/S28/run_validation.sh 2>&1 | tee
  evidence/S28/validation_output.txt`; standing gates `cd web && npm test`,
  `conda run -n reef python -m pytest tests -q`.

## 10. Security / reproducibility audit

No real Wi-Fi password, device token, database password or AI API key is
included in the public repository: credentials exist only in gitignored
`.env.local` files and (by design) device NVS. Staged-diff secret scans
(key-prefix/host/scheme probes) returned 0 hits on every S22–S28 commit;
client-bundle scans show 0 credential values and 0 secret env NAMES; rendered
pages and API responses contain no credential material (S27/S28 evidence).
Throwaway tokens used in evidence scripts are labeled "not a real secret".
`smart_tank_dev_only` is a documented local-dev placeholder
(`database/README.md`), not a credential. Deployment hardening (security
headers, TLS enforcement for managed Postgres, timing-safe auth, production
refusal posture) is validated in `evidence/S27/` and re-checked in S28.
