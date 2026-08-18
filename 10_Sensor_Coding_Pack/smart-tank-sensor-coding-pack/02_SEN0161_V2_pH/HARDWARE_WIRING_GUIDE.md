# SEN0161-V2 pH Detailed Wiring

## Signal path
`pH probe → SEN0161-V2 interface board → analog output → ADS1115 A1 → I2C → ESP32-S3`

| SEN0161-V2 | Connect to |
|---|---|
| VCC | 5 V supply appropriate for module |
| GND | common low-voltage GND |
| analog output | ADS1115 A1 |

Keep the BNC/interface board dry. ADS1115 VDD remains 3.3 V. Verify the interface output voltage is within ADC limits. Calibrate with pH 7.00 and 4.00 buffers.
