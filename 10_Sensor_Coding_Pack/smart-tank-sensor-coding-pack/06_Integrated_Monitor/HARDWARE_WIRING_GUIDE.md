# Integrated Monitor Detailed Wiring

Wire only after every standalone core module passes.

- ADS1115: SDA GPIO8, SCL GPIO9, VDD 3.3 V, ADDR GND.
- pH: analog output → ADS1115 A1.
- PT550: analog output → ADS1115 A3.
- DS18B20: DATA → GPIO4 + 4.7 kΩ pull-up.
- XKC: optional isolated output → GPIO7 only if installed.

No ORP, EC, ZP4510 or FS300A wiring belongs in the integrated monitor.
