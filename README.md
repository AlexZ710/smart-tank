# smart-tank Starter Repository

A 5 L monitoring-only smart tank: ESP32-S3-WROOM-1 + ADS1115 + SEN0161-V2 pH
(A1) + DS18B20 (GPIO4) + PT550 light (A3); XKC-Y25-T12V water level optional
and isolated. ORP, EC/conductivity, ZP4510 and FS300A are absent from the
baseline and must not be reintroduced. Monitoring and alerts only - no
automatic dosing, no student-built mains switching.

## Repository skeleton

```text
TASKS.md                     single project-state authority (session status)
docs/                        project_scope, measurement_boundary,
                             hardware_inventory, hardware_deviation_record,
                             data_schema, Device_Provisioning
firmware/arduino/            ESP32-S3 sensor + provisioning firmware
backend/                     collector, rules, visualization, ai_agent
data/raw|clean|events/       local data drop zones (.gitkeep'd)
database/schema.sql          PostgreSQL schema (see docs/data_schema.md)
experiments/                 guided experiment material
scripts/                     validation utilities
tests/                       Python tests
web/                         Next.js + Tailwind dashboard scaffold
docker-compose.yml           local PostgreSQL via Docker
evidence/S01..S28/           per-session validation evidence
```

Frozen scope/baseline documents: `docs/project_scope.md`,
`docs/measurement_boundary.md`, `docs/hardware_inventory.md`. They change
only together with `01_Project_Documentation/Hardware_Baseline_Lock.md`.

This starter contains:
- Arduino ESP32-S3 sensor firmware;
- standalone first-boot Wi-Fi provisioning firmware;
- NVS-backed provisioning module reused by Wi-Fi telemetry;
- Python local data utilities;
- Next.js/Tailwind web scaffold;
- PostgreSQL schema/Docker local path.

## First device test
Before cloud telemetry, validate:

```text
firmware/arduino/SmartTank_WiFi_Provisioning/
```

Expected lifecycle:
`empty NVS -> local SoftAP/captive portal -> save -> reboot -> station Wi-Fi`.

No Wi-Fi password should be placed in source code.

## Provisioning policy check
From repository root:

```bash
python scripts/validate_wifi_provisioning.py
```

## Networking
The final ESP32 telemetry sketch reads its Wi-Fi and device configuration from local NVS. `SmartTank_WiFi_Telemetry.ino` must not be edited to insert an SSID/password/token.
