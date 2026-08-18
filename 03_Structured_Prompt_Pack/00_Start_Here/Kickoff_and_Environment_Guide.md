# Kickoff and Environment Guide - smart-tank

## Hardware development
- Board: ESP32-S3-WROOM-1 development board.
- Arduino IDE is the required firmware IDE.
- Serial Monitor: 115200 baud unless a session explicitly says otherwise.
- Keep pH/ADS1115 electronics dry and away from splash zones.

## Device provisioning baseline
Wi-Fi credentials must not be compiled into firmware.

The required device workflow is:
1. first boot with no stored configuration -> start local SoftAP;
2. user joins `SmartTank-Setup-XXXXXX`;
3. one-time SoftAP password is printed to Serial Monitor;
4. captive portal is served at `http://192.168.4.1`;
5. SSID/password are saved to ESP32 NVS through Arduino `Preferences`;
6. device restarts and connects as a Wi-Fi station;
7. failure to connect to a saved network during boot -> provisioning fallback;
8. Serial `PROVISION` -> reopen portal without deleting saved settings;
9. Serial `CLEAR_WIFI` -> clear device provisioning data and restart into first-boot flow.

Read `01_Project_Documentation/WiFi_Provisioning_Architecture.md` before implementing network code.

## Local web development
```bash
cd web
npm install
```

Copy `.env.example` to `.env.local` and provide `DATABASE_URL`, server-side `DEVICE_INGEST_TOKEN`, and optional AI provider values locally.

The ESP32-side ingest token is provisioned locally through the device portal; do not duplicate it in committed Arduino code.

## PostgreSQL - Docker only
From the starter repository root:
```bash
docker compose up -d postgres
```

Verify:
```bash
docker compose ps
```

Initialize schema using `database/schema.sql` with the documented command in `web/README.md`.

## Local web server
```bash
cd web
npm run dev
```

Default browser target: `http://localhost:3000`.

## Device development path
During sensor bring-up, use Serial first. Session 05 establishes provisioning as a reusable firmware service. Session 23 reuses that service to send actual sensor JSON over Wi-Fi.

Do not replace the provisioning service with:
- source-code `WIFI_SSID` constants;
- committed `secrets.h`;
- a manually edited password inside `.ino`;
- automatic fallback to fake/example credentials.

## Cloud path
The target deployment is Vercel for the Next.js application. PostgreSQL is connected through a managed PostgreSQL provider using `DATABASE_URL`. The ESP32 makes outbound requests; Vercel does not initiate a direct LAN connection to the device.
