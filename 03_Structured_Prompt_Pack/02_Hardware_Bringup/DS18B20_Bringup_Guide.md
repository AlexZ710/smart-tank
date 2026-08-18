# DS18B20 Bring-up Guide

## 3-wire wiring
| Probe function | ESP32-S3 |
|---|---|
| VCC | 3.3 V |
| GND | GND |
| DATA | GPIO4 |

Add a **4.7 kΩ resistor between DATA and 3.3 V**.

## Validation
Run the standalone DS18B20 serial sketch. A typical room/water reading should be stable and should not continuously report the DS18B20 disconnected sentinel value.
