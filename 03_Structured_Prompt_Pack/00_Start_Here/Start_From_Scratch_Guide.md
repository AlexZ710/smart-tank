# Start From Scratch Guide - smart-tank

> This entrance is for a **new repository only**. If your project has already kicked off, use `11_Web_Facade_Upgrade/Smart_Tank_Web_Facade_Merge_Guide.md` instead.

## 1. Install prerequisites
- Arduino IDE 2.x with ESP32 board support.
- Git.
- Python 3.11+ for data utilities/tests.
- Node.js LTS and npm.
- Docker Desktop. PostgreSQL runs in Docker for local development; do not install PostgreSQL directly unless Docker is unavailable.
- A code editor/AI coding CLI of your choice.

## 2. Create repository
```bash
mkdir smart-tank
cd smart-tank
git init
```

Copy `05_Starter_Repository/smart-tank/` into this repository.

## 3. Protect secrets
Create `.env.local` from `.env.example` for host/web secrets.

**Do not put Wi-Fi SSID/password in Arduino source code.** The ESP32 uses the first-boot SoftAP provisioning flow defined in `01_Project_Documentation/WiFi_Provisioning_Architecture.md`.

Device-side values are provisioned locally:
- Wi-Fi SSID/password;
- telemetry ingestion URL;
- device ingest token.

They are persisted in ESP32 NVS with `Preferences` and must never be printed back to logs or committed to Git.

## 4. Initialize state
Copy the package-level `04_TASKS/TASKS.md` to the repository root as `TASKS.md` if it is not already present.

## 5. Execute session by session
Read only the active structured prompt. At the end of each session:
1. run validation;
2. save evidence;
3. update TASKS.md;
4. `git add -A`;
5. create the session-specific commit;
6. stop safely.

## 6. First-boot Wi-Fi expectation
The firmware framework created in Session 05 must support:

```text
No saved credentials
  -> ESP32 local SoftAP
  -> captive portal at 192.168.4.1
  -> save credentials in NVS
  -> reboot
  -> station-mode Wi-Fi connection
```

A saved network that no longer connects must fall back to the same provisioning portal.

Re-provisioning/factory-reset recovery must remain available after the final web facade is deployed.

## 7. Final lifecycle
Student entrance -> environment -> provisioning-capable firmware foundation -> sensor/software core -> experiments -> web architecture -> authenticated Wi-Fi ingestion -> database -> dashboard -> Vercel -> end-to-end validation -> report/demo.
