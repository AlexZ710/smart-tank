# SEN0161-V2 pH Bring-up Guide

## Wiring
| pH interface board | Connection |
|---|---|
| VCC | 5 V supply as required by the module |
| GND | Common low-voltage GND |
| Analog output | ADS1115 A1 |

ADS1115 itself remains powered from 3.3 V. Confirm the sensor output remains within the ADC input range before connection.

## Physical placement
- BNC/interface board: dry zone.
- Probe: wet zone.
- Use pH 7.00 and pH 4.00 buffers for calibration.

## Validation sequence
1. Read raw A1 voltage first.
2. Record stable voltage in pH 7.00 buffer.
3. Rinse probe.
4. Record stable voltage in pH 4.00 buffer.
5. Enter measured calibration voltages into the sketch.
6. Only then trust displayed pH values.
