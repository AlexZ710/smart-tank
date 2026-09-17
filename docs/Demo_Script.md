# Demo Script (2–3 minutes) — S28 host-side variant

Adapted from `07_Report_Templates/Demo_Script_Template.md`. This variant runs
WITHOUT the physical board: all telemetry is **clearly labeled SYNTHETIC mock
data** (`scripts/generate_mock_telemetry.py`, deterministic). Say the label
out loud at every data step. Hardware steps are marked DEFERRED — run them
instead once the ESP32-S3 is attached.

## Prep (before the demo)

1. Start local Postgres (Docker `docker compose up -d`, or the conda `tankdb`
   cluster — commands in `evidence/S28/run_validation.sh` header; schema
   applied once via `database/schema.sql`).
2. `cd web && npm run build && DEVICE_INGEST_TOKEN=<throwaway>
   REPORTS_GENERATE_TOKEN=<throwaway> npm run start` → http://localhost:3000.
3. Seed the chain: `conda run -n reef python scripts/s28_chain_demo.py
   --device-token <throwaway> --gen-token <throwaway>` (ingests labeled mock
   rows, writes real rules-engine events, stores one live bounded report).
   Never show real credentials on camera — throwaway local values only.

## Script

1. **[DEFERRED — hardware]** Show the physical 5 L system; identify pH,
   DS18B20, PT550, ESP32-S3, ADS1115. Host-side: show
   `docs/hardware_inventory.md` and the frozen baseline lock instead.
2. **[DEFERRED — hardware]** Provisioning concept: on a clean state the ESP32
   exposes `SmartTank-Setup-XXXXXX` + captive portal. Host-side: walk
   `docs/Device_Provisioning.md` state diagram; state that credentials are
   NVS-only and never tracked (`validate_wifi_provisioning.py` PASSED).
3. **[DEFERRED — hardware]** Serial Monitor as engineering evidence.
   Host-side: show `evidence/S23/` compile log.
4. Open http://localhost:3000 → **Live Status**: six-state badges; point at
   the mock device `mock-esp32-s28`; XKC shows "not installed" (null, honest).
   SAY: "synthetic mock telemetry, labeled — not real tank data."
5. Open **/history**: charts from the stored mock rows; gaps drawn as breaks —
   "missing data is shown as missing, never interpolated."
6. Open **/experiments**: the S28-MOCK-CHAIN marker + MANUAL salinity/ammonia
   entries with measured_at + method — "manual-only metrics, provenance kept."
7. Open **/events**: 98 events from the FROZEN rules engine (TEMP/PH codes
   only); try filtering `rule_code` — mention anything outside the frozen
   vocabulary is a 400: "absent sensors can't even be queried."
8. Open **/reports**: show the stored LIVE bounded report — recommendations
   are verbatim map entries, every line `[REQUIRES HUMAN CONFIRMATION]`,
   boundary statement at the end; "the AI restates observed data only and
   nothing auto-executes." Generate a fresh one for an empty window →
   honest no-data report, provider never called.
9. **Outage honesty** (30 s): stop Postgres live → `/system` and every page
   flip to honest DB-down states, ingest returns 503 "readings NOT stored";
   restart → data unchanged. "The UI never invents data during outages."
10. State unavailable sensors explicitly: **no ORP, EC, ZP4510 or FS300A** —
    absent from the baseline; the stack rejects them at four layers.
11. Close with the chain:
    `local provisioning → ESP32 sensing → Wi-Fi → web/database → human decision`
    — and the honest status: software chain fully validated host-side with
    labeled mock data; board-attached runtime + live Vercel deploy are the
    documented next steps (`docs/Vercel_Deployment_Guide.md`,
    `docs/EXP06_Results.md`).

## Fallbacks

- Provider slow/timeout during step 8: point at the already-stored report;
  explain the frozen 30 s cap returns an honest 502 ("report NOT generated")
  — never a fabricated one.
- No Postgres at all: the dashboard still demos honest degradation (every
  page renders DB-down/empty states) — that IS a feature, not a failure.
