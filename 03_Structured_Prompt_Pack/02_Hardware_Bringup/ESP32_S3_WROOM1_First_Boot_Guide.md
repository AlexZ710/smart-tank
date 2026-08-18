# ESP32-S3-WROOM-1 First Boot Guide

## Goal
Verify the controller and then validate the project's required first-boot provisioning behavior before sensor integration.

## 1. Board bring-up
- Arduino IDE 2.x.
- Select the appropriate ESP32-S3 development-board profile for the physical board.
- Serial Monitor: 115200 baud.
- Upload a minimal Serial sketch first if the board/USB path has not already been verified.

## 2. Provisioning starter
Open:

```text
05_Starter_Repository/smart-tank/firmware/arduino/
SmartTank_WiFi_Provisioning/SmartTank_WiFi_Provisioning.ino
```

The sketch uses only ESP32 Arduino-core facilities:
- Wi-Fi SoftAP / station mode;
- Preferences / NVS;
- WebServer;
- DNSServer.

## 3. Expected first boot
With an empty Smart Tank provisioning namespace, Serial should show values similar to:

```text
[PROVISION] Portal active
SSID: SmartTank-Setup-12AB34
Password: <generated one-time password>
Portal: http://192.168.4.1
```

Do not copy the generated password into source code.

## 4. Configure from phone/laptop
1. Join the printed `SmartTank-Setup-XXXXXX` network.
2. Use the one-time password shown in Serial Monitor.
3. If the operating system does not open the captive portal automatically, browse to:
   `http://192.168.4.1`
4. Select/type the target Wi-Fi network.
5. Enter its password.
6. Telemetry URL and device token may be left blank during early hardware bring-up and added later through re-provisioning.
7. Save.

The ESP32 stores configuration in NVS and restarts.

## 5. Expected second boot
The device should attempt station-mode connection using the NVS values and print its local IP without revealing the password.

## 6. Recovery tests

### Re-provision without deleting current values
At 115200 baud:

```text
PROVISION
```

### Factory reset
At 115200 baud:

```text
CLEAR_WIFI
```

The device clears Smart Tank provisioning data and restarts into first-boot portal mode.

### Changed/unavailable Wi-Fi
If stored Wi-Fi cannot be reached during the bounded boot connection window, the device must fall back to its SoftAP/captive portal rather than hanging forever.

## Acceptance
- [ ] no real SSID/password exists in the sketch;
- [ ] first boot creates local SoftAP;
- [ ] captive portal loads;
- [ ] saved credentials survive power cycle;
- [ ] normal boot connects without manual recompilation;
- [ ] failed saved network triggers provisioning fallback;
- [ ] `PROVISION` works;
- [ ] `CLEAR_WIFI` works;
- [ ] submitted passwords/tokens never appear in Serial logs.
