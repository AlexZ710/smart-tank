# ADS1115 Bring-up Guide

## Wiring
| ADS1115 | ESP32-S3-WROOM-1 board |
|---|---|
| VDD | 3.3 V |
| GND | GND |
| SDA | GPIO8 |
| SCL | GPIO9 |
| ADDR | GND |

Expected address: `0x48`.

## Procedure
1. Power off.
2. Connect only ADS1115.
3. Upload `10_Sensor_Coding_Pack/.../00_Common/I2C_Scanner`.
4. Confirm `0x48` before attaching analog sensors.
