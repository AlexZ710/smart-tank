# Wi-Fi Provisioning Architecture

## Purpose
The Smart Tank must be deployable without editing or recompiling firmware whenever the school/home Wi-Fi network changes.

## Required behavior

### First boot
If no Smart Tank Wi-Fi configuration exists in NVS:

```text
ESP32 boots
  -> creates SoftAP `SmartTank-Setup-XXXXXX`
  -> prints one-time AP password to Serial
  -> serves captive portal at 192.168.4.1
  -> user submits SSID/password
  -> ESP32 stores credentials in Preferences/NVS
  -> ESP32 restarts
  -> connects in station mode
```

### Normal boot
If configuration exists:
1. read configuration from `Preferences`;
2. try station-mode connection for a bounded timeout;
3. if successful, stop provisioning services and continue normal operation;
4. if unsuccessful, start the local provisioning portal.

### Re-provisioning
At 115200 baud:
- `PROVISION` opens the portal without deleting existing saved values.
- `CLEAR_WIFI` clears the Smart Tank provisioning namespace and restarts into first-boot mode.

The project must not require a dedicated hardware button for recovery. A future board-specific button may be added only as an optional convenience.

## Captive portal network
- AP SSID: `SmartTank-Setup-XXXXXX`, suffix derived from device identity.
- AP IPv4: `192.168.4.1`.
- DNS wildcard redirects local hostname requests to the ESP32.
- AP passphrase: generated at boot; printed to Serial; never committed.
- Maximum clients should remain small for a provisioning-only network.

## Persisted values
Namespace: `st_cfg`

Typical keys:
- `ssid`
- `pass`
- `api_url`
- `token`

All are local device configuration. `Preferences` persists values in ESP32 NVS across restart/power loss.

## Secret-handling requirements
- Never hardcode real Wi-Fi credentials.
- Never commit a `secrets.h` containing real credentials.
- Never print submitted Wi-Fi password or device token.
- Never expose stored secrets through a diagnostic web endpoint.
- Device-side NVS is a local persistence mechanism, not a hardware security module; physical possession of the controller remains a trust boundary.

## Provisioning vs final web facade
The captive portal is only a local setup/recovery interface. It is **not** the final Smart Tank web dashboard.

```text
Provisioning portal: phone -> ESP32 SoftAP -> local configuration
Final facade:       ESP32 -> normal Wi-Fi -> API/DB -> Next.js dashboard
```

## Acceptance evidence
Save:
- Serial screenshot showing first-boot SoftAP SSID and IP;
- screenshot of captive portal;
- evidence that no Wi-Fi password exists in tracked source;
- reboot evidence showing automatic station connection;
- failed-network/re-provisioning evidence;
- `CLEAR_WIFI` factory-reset evidence.
