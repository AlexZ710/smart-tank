# Device Provisioning

## Why this exists
Smart Tank must not require a firmware edit whenever Wi-Fi changes.

## Where the framework lives (Session 05)
The reusable provisioning module `WifiProvisioning.h/.cpp`
(class `SmartTankProvisioning`) exists as identical copies in every
Wi-Fi-capable sketch:

- `firmware/arduino/SmartTank_WiFi_Provisioning/` - standalone provisioning test;
- `firmware/arduino/SmartTank_Integrated_Monitor/` - integrated framework (S05);
- `firmware/arduino/SmartTank_WiFi_Telemetry/` - telemetry scaffold, reused by Session 23.

All sketches share one credential mechanism: `provisioning.begin()` on boot
(saved network with bounded timeout, else SoftAP portal) and
`provisioning.loop()` from `loop()` (portal, DNS wildcard, `PROVISION` /
`CLEAR_WIFI` Serial commands). Session 23 must reuse this module, not create
a second Wi-Fi credential path. The monitor sketch keeps sensor reads
millis()-based so the portal is never blocked by `delay()`.

## Stored locally in ESP32 NVS
Using Arduino `Preferences` namespace `st_cfg`:
- `ssid`
- `pass`
- `api_url`
- `token`

These values are not source files.

## First boot
If no SSID is stored, firmware starts:
- SoftAP `SmartTank-Setup-XXXXXX`;
- one-time AP password shown only in Serial;
- captive portal at `192.168.4.1`.

After configuration is saved, the device restarts.

## Normal boot
Firmware attempts the saved network for a bounded timeout. Success enters normal station mode.

Failure enters local provisioning mode instead of looping forever.

## Re-provision
Serial at 115200:

```text
PROVISION
```

Portal opens without clearing existing configuration.

## Factory reset
Serial at 115200:

```text
CLEAR_WIFI
```

The Smart Tank `Preferences` namespace is cleared and the device restarts.

## Telemetry configuration
The same local portal can store:
- telemetry URL;
- device ingest token.

During early sensor sessions these may be blank. Session 23 configures them before cloud/API telemetry.

## Security checks
- search tracked firmware for `WIFI_SSID` and `WIFI_PASSWORD`; there should be no credential constants;
- do not print form password/token values;
- do not expose a read-back endpoint for stored secrets;
- server-side ingest token must also be stored in web deployment environment, not browser code.
