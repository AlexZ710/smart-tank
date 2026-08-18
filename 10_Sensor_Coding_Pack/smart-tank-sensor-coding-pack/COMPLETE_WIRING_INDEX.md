# Complete Wiring Index

## ESP32-S3 ↔ ADS1115
| ADS1115 | ESP32-S3 |
|---|---|
| VDD | 3.3 V |
| GND | GND |
| SDA | GPIO8 |
| SCL | GPIO9 |
| ADDR | GND → 0x48 |

## Analog channels
| Channel | Device |
|---|---|
| A0 | unused/reserved |
| A1 | SEN0161-V2 pH |
| A2 | unused/reserved |
| A3 | PT550 analog light |

## Direct GPIO
| GPIO | Device |
|---|---|
| GPIO4 | DS18B20 DATA + 4.7 kΩ pull-up to 3.3 V |
| GPIO7 | optional XKC optocoupler output |

Removed: ORP, EC, ZP4510 and FS300A.
