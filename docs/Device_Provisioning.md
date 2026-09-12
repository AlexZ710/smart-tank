# Device Provisioning

## Why this exists
Smart Tank must not require a firmware edit whenever Wi-Fi changes.

## Related guides
- `01_Project_Documentation/WiFi_Provisioning_Architecture.md` - normative
  architecture (SoftAP, captive portal, NVS keys, secret-handling rules);
- `02_Hardware_Bringup/First_Boot_WiFi_Provisioning_Guide.md` - student
  step-by-step workflow (upload -> join SoftAP -> save -> station boot) and
  the recovery matrix;
- `docs/Arduino_Environment.md` - toolchain, FQBN and upload commands used
  for all provisioning sketches;
- `scripts/validate_wifi_provisioning.py` - automated policy check run in
  every session (no hardcoded credentials, module present in all Wi-Fi
  sketches).

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

## Telemetry behavior (Session 23, `SmartTank_WiFi_Telemetry`)

The S23 sketch sends the frozen `docs/Telemetry_Contract.md` JSON to
`POST /api/telemetry` with `Authorization: Bearer <token>` — URL and token
come ONLY from NVS (`api_url` / `token`), never from source.

| Device state | Behavior |
|---|---|
| Wi-Fi connected + URL/token provisioned | 1 Hz sensing; batches flush every 10 s (`{device_id, firmware_version, readings[]}`) |
| Wi-Fi connected + URL/token missing | **CONFIGURATION NEEDED** reported on Serial every 5 s; local sensing + Serial CSV continue; **nothing is sent, nothing fabricated** |
| Wi-Fi lost | Credentials are NEVER erased (S05 guarantee); readings buffer (240 slots ≈ 4 min) and flush on reconnect with their ORIGINAL `timestamp_ms` values |
| Buffer overflow while offline | Oldest readings dropped with an honest Serial note + cumulative `dropped_oldest` counter — loss is never silent |
| Sensor failed/absent (DS18B20 fault, ADS1115 absent, XKC disabled) | Field sent as JSON `null` / Serial `NA` — never a default or fake value |
| HTTP 401 | Batch dropped (retrying identical bytes cannot succeed) + Serial hint to re-provision the token |
| HTTP 4xx (400/413) | Batch dropped, rejection body logged (server-side reason, e.g. out-of-range row) |
| HTTP 5xx / network error | Batch KEPT in buffer; exponential backoff up to 60 s |

Transport is bounded: 5 s connect + 5 s transfer timeouts, so the 1 Hz
sensor loop and the provisioning portal are never blocked indefinitely.
Serial output preserves the locked CSV contract
(`timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,light_voltage_v,xkc_level_state`,
`NA` for absent channels) for the host collector in parallel with Wi-Fi.

## Security checks
- search tracked firmware for `WIFI_SSID` and `WIFI_PASSWORD`; there should be no credential constants;
- do not print form password/token values;
- do not expose a read-back endpoint for stored secrets;
- server-side ingest token must also be stored in web deployment environment, not browser code.
