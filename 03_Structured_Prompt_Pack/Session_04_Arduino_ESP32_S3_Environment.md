# Session 04 — Arduino ESP32-S3 Environment

## Objective
Establish the Arduino ESP32-S3 toolchain and verify the controller, Serial Monitor, and required built-in networking/persistence capabilities.

## Context to read first
- `01_Project_Documentation/Hardware_Baseline_Lock.md`
- `01_Project_Documentation/WiFi_Provisioning_Architecture.md`
- `04_TASKS/TASKS.md`
- current repository state

## Files to create or modify
- environment/setup evidence;
- Arduino board-selection notes;
- `docs/Arduino_Environment.md` if the repository does not already contain an equivalent.

## Hardware Lock — mandatory
- Main controller: ESP32-S3-WROOM-1 based development board; Arduino IDE.
- Core: ADS1115, SEN0161-V2 pH on A1, DS18B20, PT550 on A3.
- XKC-Y25-T12V is optional and isolated; implementation must not depend on it.
- Unavailable: ORP, EC, ZP4510, FS300A.

## Provisioning lock
Confirm the installed ESP32 Arduino core provides the required facilities used by the project:
- `WiFi.h`;
- `Preferences.h`;
- `WebServer.h`;
- `DNSServer.h`.

Do not add real Wi-Fi credentials to any test sketch.

## Implementation Prompt
You are the implementation agent for **Session 04 only**. Establish the ESP32-S3 Arduino environment, verify upload + 115200 Serial output, record exact board/core settings, and confirm that a minimal compile can include WiFi, Preferences, WebServer, and DNSServer without hardcoded credentials. Do not implement sensors or the full captive portal yet. Preserve the hardware lock and update TASKS with evidence.

## Acceptance Criteria
- [ ] ESP32-S3 upload works.
- [ ] 115200 Serial output works.
- [ ] required provisioning headers compile.
- [ ] no real SSID/password/token appears in tracked code.
- [ ] environment versions/settings are recorded.
- [ ] evidence saved under `evidence/S04/`.
- [ ] TASKS updated and session commit created.

## Required Git Checkpoint
```bash
git add .
git commit -m "S04 ESP32-S3 Arduino environment"
```
