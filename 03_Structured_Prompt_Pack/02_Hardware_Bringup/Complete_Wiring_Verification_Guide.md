# Complete Wiring Verification Guide

## Core integrated map
| Device | Connection |
|---|---|
| ADS1115 SDA | ESP32 GPIO8 |
| ADS1115 SCL | ESP32 GPIO9 |
| ADS1115 VDD | 3.3 V |
| ADS1115 ADDR | GND → `0x48` |
| SEN0161-V2 pH signal | ADS1115 A1 |
| PT550 signal | ADS1115 A3 |
| DS18B20 DATA | GPIO4 + 4.7 kΩ pull-up to 3.3 V |
| XKC isolated output | GPIO7, optional only |

## Deliberately unused
- ADS1115 A0: unused/reserved.
- ADS1115 A2: unused/reserved.
- No ZP4510 pins.
- No FS300A pulse pin.
- No ORP channel.
- No EC channel.

## Staged verification
1. Board-only first boot.
2. I2C scanner: ADS1115 at 0x48.
3. DS18B20 standalone.
4. pH standalone through A1.
5. PT550 standalone through A3.
6. Optional XKC standalone through isolation.
7. Integrated monitor.

Never debug all devices simultaneously before each standalone test passes.
