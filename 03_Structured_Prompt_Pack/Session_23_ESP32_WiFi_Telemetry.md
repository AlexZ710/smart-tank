# Session 23 - ESP32 Provisioned Wi-Fi Telemetry

## Goal
Extend integrated firmware to send actual pH/temperature/PT550 readings over Wi-Fi **using the existing Session 05 provisioning service**, while retaining Serial diagnostics and offline recovery.

## Read before editing
- repository `TASKS.md`
- active hardware baseline
- `01_Project_Documentation/WiFi_Provisioning_Architecture.md`
- `01_Project_Documentation/Web_Facade_Architecture.md`
- `docs/Device_Provisioning.md`
- outputs/evidence from S05 and prior completed sessions

## Hardware/data lock
- Controller: ESP32-S3-WROOM-1.
- Active sensors: SEN0161-V2 pH via ADS1115 A1, DS18B20, PT550 via ADS1115 A3.
- XKC-Y25-T12V is optional only if physically present and isolated correctly.
- ORP, EC, ZP4510, FS300A are absent. Do not add fields, mocks presented as real data, UI cards, rules, or report claims for them.
- Salinity is manual when used.

## Credential/configuration lock
- Do not add `WIFI_SSID`, `WIFI_PASSWORD`, `DEVICE_TOKEN`, or real endpoint secrets as committed constants.
- Reuse NVS-backed provisioning from Session 05.
- Device token and telemetry URL are read from local provisioned configuration.
- If telemetry URL/token is missing, remain operational in Serial/local sensing mode and report a configuration-needed state; do not send fake values.
- Wi-Fi outage must not erase credentials.
- A changed/unreachable Wi-Fi network must be recoverable by provisioning fallback/re-provisioning.

## Files to create/modify
- `firmware/arduino/SmartTank_WiFi_Telemetry/**`
- `docs/Device_Provisioning.md`
- telemetry validation evidence

## Implementation prompt
Implement only Session 23: **ESP32 Provisioned Wi-Fi Telemetry**. Merge the already-validated sensor read functions into the telemetry sketch and reuse the Session 05 provisioning module. Send only actual current measurements. Preserve Serial output for diagnosis. Implement bounded HTTP timeouts/retry behavior and avoid blocking the sensor loop indefinitely. Never reintroduce source-code Wi-Fi credentials.

## Acceptance checklist
- [ ] Session objective is implemented without unrelated refactor.
- [ ] first-boot/re-provisioning mechanism is reused, not duplicated.
- [ ] no real Wi-Fi/API secret is committed.
- [ ] actual pH/temperature/PT550 values are used.
- [ ] missing endpoint/token is handled without fabricated telemetry.
- [ ] Wi-Fi loss/recovery behavior is recorded.
- [ ] removed sensors did not reappear.
- [ ] relevant tests/build/compile checks pass.
- [ ] evidence saved under `evidence/S23/`.
- [ ] repository `TASKS.md` updated with status, changed files, evidence, blockers, commit and next resume pointer.
- [ ] separate Git commit created.

## Commit message
`feat: add provisioned ESP32 WiFi telemetry`

## Stop condition
Stop after Session 23 acceptance is recorded. Do not auto-run Session 24.
