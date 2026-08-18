# Arduino Environment - smart-tank (Session 04)

> Environment record and board-selection notes for the ESP32-S3 Arduino
> toolchain. Hardware lock: ESP32-S3-WROOM-1 dev board, Arduino toolchain.

## Toolchain (recorded 2026-08-18)

| Component | Version | Notes |
|---|---|---|
| arduino-cli | 1.5.1 (commit 01f3d4f2) | Installed to `%LOCALAPPDATA%\bin\arduino-cli.exe`; not yet on PATH |
| ESP32 Arduino core | esp32:esp32 3.3.11 | Shared with the installed Arduino IDE 2 (`%LOCALAPPDATA%\Arduino15`) |
| Python (host side) | 3.12.13 | Validation scripts |
| OS | Windows 11 | Git Bash shell for CLI work |

## Compile settings (frozen for this project)

```text
FQBN:            esp32:esp32:esp32s3
Board:           "ESP32S3 Dev Module"
Core:            esp32:esp32 3.3.11
Serial monitor:  115200 baud
Partition/PSRAM: defaults (adjust in S05+ only if provisioning needs it)
```

## Provisioning header check - PASSED

`S04_Environment_Check.ino` includes and compiles (exit code 0):

```cpp
#include <WiFi.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>
```

Binary: 346493 bytes flash (26%), 26440 bytes RAM (8%) - well within
ESP32-S3-WROOM-1 limits.

No sketch in this project may contain real SSID/password/token values.
First-boot credentials come exclusively from the SoftAP provisioning flow
(`01_Project_Documentation/WiFi_Provisioning_Architecture.md`).

## Upload + Serial verification - BLOCKED (pending hardware)

- No ESP32-S3 board enumerated on USB during Session 04: only Bluetooth
  serial ports (COM3-COM6) were present; no Espressif/CH340/CP210x/FTDI
  USB device detected.
- Remaining steps when a board is attached:
  1. `arduino-cli board list` -> identify the board COM port;
  2. `arduino-cli upload -p <COMx> --fqbn esp32:esp32:esp32s3 firmware/arduino/S04_Environment_Check`;
  3. open Serial Monitor at 115200 and capture the banner + heartbeat;
  4. save the excerpt to `evidence/S04/serial_capture.txt`;
  5. then (and only then) create the S04 completion commit.

If upload fails with no COM port: try a data-capable USB cable, the board's
other USB connector, or hold BOOT while plugging in (download mode), and
install the CH340/CP210x driver if the board uses a UART bridge.

## Arduino IDE notes

The Arduino IDE 2 install is kept for interactive board bring-up (Serial
Monitor, board selection via GUI). Session scripts use `arduino-cli` with
the FQBN above so builds are reproducible from the repository.
