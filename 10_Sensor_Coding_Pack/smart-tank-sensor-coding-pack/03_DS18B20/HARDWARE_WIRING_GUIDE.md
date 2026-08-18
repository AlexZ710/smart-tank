# DS18B20 Detailed Wiring

| DS18B20 | ESP32-S3 |
|---|---|
| VCC | 3.3 V |
| GND | GND |
| DATA | GPIO4 |

Install a **4.7 kΩ pull-up resistor from DATA to 3.3 V**. Do not omit it. Verify your probe's actual wire colors from its datasheet/listing because cable colors can vary.
