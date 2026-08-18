# Session 05 — Shared Firmware Framework + First-Boot Provisioning

## Objective
Create a compilable integrated firmware framework and a reusable first-boot Wi-Fi provisioning service before sensor-specific integration.

## Context to read first
- `01_Project_Documentation/Hardware_Baseline_Lock.md`
- `01_Project_Documentation/WiFi_Provisioning_Architecture.md`
- `02_Hardware_Bringup/First_Boot_WiFi_Provisioning_Guide.md`
- `04_TASKS/TASKS.md`
- current repository state

## Files to create or modify
- `firmware/arduino/SmartTank_Integrated_Monitor/SmartTank_Integrated_Monitor.ino`
- `firmware/arduino/SmartTank_WiFi_Provisioning/**`
- reusable provisioning module files under the Wi-Fi firmware path
- `docs/Device_Provisioning.md`
- provisioning validation script/test if available

## Hardware Lock — mandatory
- Main controller: ESP32-S3-WROOM-1 based development board; Arduino IDE.
- Core: ADS1115, SEN0161-V2 pH on A1, DS18B20, PT550 on A3.
- XKC-Y25-T12V is optional and isolated; implementation must not depend on it.
- Unavailable and forbidden to reintroduce: ORP, EC/conductivity, ZP4510 float switches, FS300A flow sensor.
- No automatic dosing, no student-built mains switching, no invented telemetry.

## Mandatory provisioning behavior
Implement a reusable device configuration layer with these properties:

1. no real Wi-Fi SSID/password in source code;
2. no saved configuration -> local SoftAP + captive portal;
3. AP SSID `SmartTank-Setup-XXXXXX`;
4. one-time AP password generated at boot and printed to Serial;
5. portal reachable at `192.168.4.1`;
6. submitted Wi-Fi credentials stored using Arduino `Preferences` / ESP32 NVS;
7. normal boot tries saved credentials for a bounded timeout;
8. connection failure falls back to the portal;
9. `PROVISION` reopens the portal;
10. `CLEAR_WIFI` clears Smart Tank provisioning NVS and restarts;
11. Wi-Fi password and device token are never echoed to logs;
12. telemetry URL and device token can be persisted locally without source-code secrets.

## Implementation Prompt
You are the implementation agent for **Session 05 only**. Build the shared firmware framework and implement the first-boot provisioning foundation described above. Use ESP32 Arduino-core WiFi/Preferences/WebServer/DNSServer APIs; do not introduce a third-party provisioning dependency unless there is a documented blocker. Preserve earlier accepted work. Do not implement later sensor sessions. Keep provisioning modular so Session 23 reuses it instead of creating another Wi-Fi credential mechanism.

## Acceptance Criteria
- [ ] first boot with empty NVS exposes SoftAP/captive portal;
- [ ] configuration persists across restart;
- [ ] saved-network failure falls back to portal;
- [ ] `PROVISION` works;
- [ ] `CLEAR_WIFI` works;
- [ ] source contains no hardcoded real Wi-Fi credentials/device token;
- [ ] passwords/tokens are not logged;
- [ ] no unavailable sensor code is added;
- [ ] evidence saved under `evidence/S05/`;
- [ ] TASKS updated with files, validation, blockers, commit, resume pointer.

## Required Git Checkpoint
```bash
git add .
git commit -m "S05 shared firmware and WiFi provisioning"
```

If validation fails, record the blocker and use a WIP checkpoint only when needed.
