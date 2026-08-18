# Hardware Baseline Lock - ACTIVE AUTHORITY

This file supersedes unavailable items from earlier procurement documents.

## Required core hardware
- ESP32-S3-WROOM-1 development board.
- ADS1115 16-bit I2C ADC.
- DFRobot SEN0161-V2 pH module/probe, analog output through ADS1115 A1.
- Waterproof DS18B20 temperature probe.
- PT550 analog ambient-light sensor through ADS1115 A3.

## Optional
- XKC-Y25-T12V level sensor only if physically available and only through proper electrical isolation/level conversion.

## Explicitly absent - do not implement
- ORP.
- EC/conductivity.
- ZP4510 float switches.
- FS300A flow sensor.

## Data truth rules
- Never fabricate ORP or EC fields.
- Salinity is manual refractometer/hydrometer input when used in experiments.
- Ammonia is not an automatically measured value unless a future verified sensor is added.
- PT550 is treated as analog light signal / relative trend unless calibrated against a suitable reference; do not call it PAR/PPFD.
- Optional XKC data must be nullable/disabled when hardware is absent.

## Networking
Wi-Fi telemetry is a mandatory final feature. USB/Serial remains a development and recovery channel, not the normal final facade connection.

### Mandatory provisioning rule
- Never hardcode real Wi-Fi SSID/password in firmware.
- First boot with no stored credentials must start a local ESP32 SoftAP and captive portal.
- Wi-Fi credentials persist through Arduino `Preferences` / ESP32 NVS.
- Saved-network connection failure during boot must expose the provisioning portal again.
- Re-provisioning and factory-reset recovery must be documented and testable.
- The provisioning portal must never echo the saved Wi-Fi password or device token back to Serial logs.
- Device ingest token and endpoint configuration must remain outside committed source code.
