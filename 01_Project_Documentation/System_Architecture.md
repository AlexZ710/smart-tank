# System Architecture - Web Enabled

## Physical sensing
- pH: SEN0161-V2 -> ADS1115 A1 -> ESP32-S3.
- Temperature: DS18B20 -> ESP32-S3 1-Wire GPIO.
- Ambient light: PT550 analog output -> ADS1115 A3 -> ESP32-S3.
- Optional water level: XKC-Y25-T12V -> optocoupler/level isolation -> ESP32-S3 GPIO.

## Device configuration path

```text
FIRST BOOT / RECOVERY

Phone or laptop
    |
    | joins local SoftAP
    v
SmartTank-Setup-XXXXXX
    |
    | captive portal
    v
ESP32-S3 @ 192.168.4.1
    |
    | saves SSID/password + device config
    v
Preferences / NVS
    |
    v
reboot -> Wi-Fi station mode
```

No real Wi-Fi password is stored in source control.

## Runtime data path

```text
Sensors
  -> ESP32-S3-WROOM-1
  -> provisioned Wi-Fi
  -> authenticated POST /api/telemetry
  -> Next.js Route Handler
  -> PostgreSQL
  -> rules/events + report layer
  -> responsive dashboard
```

## Operational channels
- Serial: bring-up, calibration, provisioning recovery commands, diagnosis.
- SoftAP/captive portal: first-boot and re-provisioning configuration.
- Wi-Fi station mode: normal telemetry transport.
- Web browser: operator facade for current state, history, events, experiment context, and AI reports.

## Cloud boundary
The ESP32 performs outbound HTTP/HTTPS requests. The cloud application is not expected to dial directly into a private school/home LAN device.

## Safety boundary
Monitoring and alerts only. No automatic chemical dosing and no student-built mains-voltage control.
