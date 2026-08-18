# PT550 Analog Ambient-Light Bring-up Guide

## Wiring
| PT550 module | Connection |
|---|---|
| VCC | 3.3 V |
| GND | Common GND |
| Analog signal / S | ADS1115 A3 |

## Interpretation
The baseline reports:
- raw ADS1115 count;
- voltage;
- relative percentage scaled against the selected voltage reference.

Do **not** call this value calibrated lux, PAR, or PPFD without an external calibration procedure.
