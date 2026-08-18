# Session 28 - End to End Validation Final Report and Demo

## Goal
Validate first-boot/re-provisioning plus sensor -> Wi-Fi -> API -> DB -> UI pipeline, run EXP06, finalize report/README/screenshots/demo and record limitations.

## Read before editing
- repository `TASKS.md`
- active hardware baseline
- `01_Project_Documentation/WiFi_Provisioning_Architecture.md`
- `01_Project_Documentation/Web_Facade_Architecture.md`
- outputs/evidence from prior completed sessions

## Hardware/data lock
- Controller: ESP32-S3-WROOM-1.
- Active sensors: SEN0161-V2 pH via ADS1115 A1, DS18B20, PT550 via ADS1115 A3.
- XKC-Y25-T12V is optional only if physically present and isolated correctly.
- ORP, EC, ZP4510, FS300A are absent.
- Salinity is manual when used.

## Provisioning validation
Final evidence must include:
- empty-NVS first boot -> local SoftAP;
- captive portal at 192.168.4.1;
- save/reboot -> automatic station connection;
- no Wi-Fi password/device token in tracked source;
- saved-network failure or deliberate invalid-network test -> provisioning fallback;
- `PROVISION` recovery;
- `CLEAR_WIFI` factory reset;
- password/token not exposed in Serial or dashboard.

## Files to create/modify
evidence/S28/**, docs/final report inputs, README, demo materials, EXP06 results

## Implementation prompt
Implement only Session 28: **End to End Validation Final Report and Demo**. Validate both the configuration lifecycle and the normal telemetry lifecycle. Reuse the existing repository and preserve all completed earlier work. The web facade must distinguish current, stale, missing, optional, manual, and unavailable data rather than inventing values.

## Acceptance checklist
- [ ] provisioning lifecycle passes.
- [ ] sensor -> provisioned Wi-Fi -> API -> database -> dashboard passes.
- [ ] outage/recovery does not invent data.
- [ ] secrets are absent from tracked source and browser output.
- [ ] removed sensors did not reappear.
- [ ] relevant tests/build/compile checks pass.
- [ ] evidence saved under `evidence/S28/`.
- [ ] repository `TASKS.md` updated with status, changed files, evidence, blockers, commit and next resume pointer.
- [ ] final separate Git commit created.

## Commit message
`docs: finalize provisioned smart tank end-to-end delivery`

## Stop condition
Stop after Session 28 acceptance is recorded.
