# smart-tank Starter Repository

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
