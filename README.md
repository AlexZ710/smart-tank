# smart-tank

A 5 L **monitoring-only** reef tank: ESP32-S3 sensors → provisioned Wi-Fi →
authenticated ingestion API → PostgreSQL → responsive dashboard with a bounded
AI reporting agent. No automatic dosing, no student-built mains switching,
no invented values.

## Architecture

```text
ESP32-S3 (NVS-provisioned Wi-Fi)
  -> POST /api/telemetry  (Bearer device token, frozen Telemetry_Contract)
  -> Next.js App Router   (Route Handlers, server-side env only, six-state honesty)
  -> PostgreSQL           (telemetry_readings / events / experiment_markers /
                           manual_measurements / reports)
  -> Dashboard: / (live) /history /experiments /events /reports /system
  -> Bounded AI reports   (docs/prompt_boundary.md: restate-only, guarded
                           before storage, [REQUIRES HUMAN CONFIRMATION])
```

Frozen scope/baseline documents: `docs/project_scope.md`,
`docs/measurement_boundary.md`, `docs/hardware_inventory.md`. They change
only together with `01_Project_Documentation/Hardware_Baseline_Lock.md`.

## Hardware (only physically implemented components)

| Component | Role | Notes |
|---|---|---|
| ESP32-S3-WROOM-1 | MCU + Wi-Fi | NVS provisioning, no credentials in source |
| ADS1115 @0x48 | 16-bit ADC | SDA GPIO8 / SCL GPIO9 |
| SEN0161-V2 | pH (A1) | two-point CAL7/CAL4 procedure; buffer calibration pending |
| DS18B20 | temperature (GPIO4) | single-point validated |
| PT550 | light (A3) | **relative % only — not a PAR/lux sensor** |
| XKC-Y25-T12V | water level | **OPTIONAL, isolated, nullable** (`ENABLE_XKC=false` default; absent → null/"not installed", never fabricated) |

ORP, EC/conductivity, ZP4510 float and FS300A flow are **absent from this
baseline and must not be reintroduced** — the ingestion contract (400),
events vocabulary (400) and AI boundary (report discarded, 422) each
independently reject them. Salinity/ammonia are **manual-only** measurements
with provenance.

## Quick start

1. **Arduino sensor bring-up** — `docs/Arduino_Environment.md`; compile
   evidence in `evidence/S23/`. First device test (when a board is attached):
   `firmware/arduino/SmartTank_WiFi_Provisioning/` — expected lifecycle
   `empty NVS -> local SoftAP/captive portal -> save -> reboot -> station
   Wi-Fi`. Never place a Wi-Fi password in source; policy check:
   `python scripts/validate_wifi_provisioning.py` (must PASS).
2. **Database** — `docker compose up -d` (requires Docker/WSL), or without
   Docker: conda-forge PostgreSQL in a dedicated env with the data directory
   OUTSIDE the repo (exact commands in the header of
   `evidence/S28/run_validation.sh`). Apply `database/schema.sql` once.
3. **Web env** — `cp .env.example web/.env.local` and set `DATABASE_URL`,
   `DEVICE_INGEST_TOKEN`, optionally `REPORTS_GENERATE_TOKEN` (REQUIRED in
   production — missing on Vercel → 503 refusal) and `AI_*` provider vars for
   bounded reports (server-side only, never `NEXT_PUBLIC_`). All gitignored;
   no secret is ever committed.
4. **Run** — `cd web && npm install && npm run build && npm run start` →
   http://localhost:3000. Without a database every page renders honest
   DB-down/empty states (never simulated data).
5. **Hardware-free chain demo** — `conda run -n reef python
   scripts/s28_chain_demo.py --device-token <throwaway> --gen-token
   <throwaway>`: labeled SYNTHETIC mock telemetry through the real
   ingest → DB → rules-engine → events → live bounded-report chain.

## Screenshots

Pending real-tank operation (board not attached during software sessions —
honest placeholder, no mock screenshots presented as real). The live demo
path is scripted in `docs/Demo_Script.md`; run it locally in ≤ 5 minutes.

## Experiments

- EXP01–EXP05 (baseline stability, temperature response, pH perturbation,
  manual salinity drift, organic-load risk): templates in
  `06_Experiment_Templates/` — **not executed** (require board + tank).
- EXP06 (provisioning + Wi-Fi/web telemetry reliability): **host-side
  software chain executed live** with labeled mock data (incl. outage/
  recovery honesty + live bounded AI report); hardware portions DEFERRED —
  results in `docs/EXP06_Results.md`.

## Final delivery documents

- `docs/Final_Report.md` — technical report (design, methods, results,
  reproducibility, security audit).
- `docs/Vercel_Deployment_Guide.md` + `docs/Security_Checklist.md` —
  deployment runbook and pre-deploy gates (live deploy deferred: no
  Vercel account/CLI on the dev host).
- `docs/Demo_Script.md` — 2–3 minute demo (host-side variant).
- `TASKS.md` — single project-state authority; `evidence/S01..S28/` —
  per-session validation evidence.

## Repository skeleton

```text
TASKS.md                     single project-state authority (session status)
docs/                        scope, boundary, contracts, provisioning,
                             deployment, final report
firmware/arduino/            ESP32-S3 sensor + provisioning firmware
backend/                     collector, rules, visualization, ai_agent
data/raw|clean|events/       local data drop zones (.gitkeep'd; mock output gitignored)
database/schema.sql          PostgreSQL schema (see docs/data_schema.md)
experiments/                 guided experiment material
scripts/                     validation + mock/demo utilities (labeled synthetic)
tests/                       Python tests (90)
web/                         Next.js + Tailwind dashboard (63 unit tests)
docker-compose.yml           local PostgreSQL via Docker
evidence/S01..S28/           per-session validation evidence
```

## Limitations

- No ORP, EC/conductivity, ZP4510 or FS300A — absent from the hardware
  baseline; no data, fields or claims for them exist anywhere in the stack.
- Salinity and ammonia are manual-only (refractometer / liquid test kit).
- PT550 reports relative light % — it is not a PAR sensor.
- pH slope/offset use documented placeholders until real buffer calibration.
- Rate limiters and ingestion stats are in-memory per server instance
  (single-instance deployment; shared store is a documented upgrade path).
- Board-attached runtime evidence (provisioning lifecycle, Serial captures,
  real-tank experiments) and the live Vercel deployment are deferred and
  precisely listed in `docs/Final_Report.md` §5/§8 and `TASKS.md`.
