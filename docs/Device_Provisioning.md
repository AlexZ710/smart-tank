# Device Provisioning

## Why this exists
Smart Tank must not require a firmware edit whenever Wi-Fi changes.

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
