# DS18B20 Validation - Session 06

> Standalone bring-up validation for the waterproof DS18B20 temperature
> probe, performed **before** any integrated testing, per
> `02_Hardware_Bringup/DS18B20_Bringup_Guide.md` and the Session 06 prompt.
> Consistent with `01_Project_Documentation/Hardware_Baseline_Lock.md`:
> DS18B20 on **GPIO4**, 1-Wire, no other sensors involved here.

## Wiring (locked)

| Probe function | ESP32-S3 |
|---|---|
| VCC | 3.3 V |
| GND | GND |
| DATA | **GPIO4**, with a **4.7 kOhm** resistor between DATA and 3.3 V |

## Sketch under test

`firmware/arduino/DS18B20_Bringup/DS18B20_Bringup.ino`

- Standalone: OneWire + DallasTemperature only; no Wi-Fi, no ADS1115, no pH.
- Reports every 2 s: `timestamp_ms,temperature_c,status`.
- Status values: `OK`, `NO_PROBE`, `DISCONNECT_SENTINEL` (the -127 degC
  DallasTemperature disconnect sentinel), `IMPLAUSIBLE` (< -10 or > 60 degC).

## Build verification (done 2026-08-28, no board required)

```text
FQBN esp32:esp32:esp32s3 (core 3.3.11, arduino-cli 1.5.1)
exit=0; 307250 B flash (23%), 22200 B RAM (6%)
Libraries: OneWire 2.3.8, DallasTemperature 4.0.6
```

## Standalone hardware validation procedure (to be captured with board)

1. Wire the probe per the table above (4.7 k pull-up mandatory).
2. Upload:
   `arduino-cli upload -p <COMx> --fqbn esp32:esp32:esp32s3 firmware/arduino/DS18B20_Bringup`
3. Open Serial Monitor at **115200** and capture to `evidence/S06/serial_capture.txt`.
4. Pass criteria - all must hold:
   - `Devices found on bus: 1`;
   - a valid 64-bit ROM address is printed;
   - `Resolution set to: 12 bit`;
   - at least 10 consecutive readings with `status=OK`;
   - readings plausible for the environment (roughly 15-30 degC indoors,
     or the measured water temperature);
   - no `DISCONNECT_SENTINEL` values during steady observation.
5. Negative check: temporarily disconnect the DATA line and confirm the
   sketch reports `DISCONNECT_SENTINEL`/`NO_PROBE` instead of fabricating a
   value - this proves the no-invented-telemetry rule at sensor level.

## Current status

- [x] Sketch implemented and compiled for the locked FQBN.
- [ ] Standalone Serial capture on physical hardware - **pending board**
      (no ESP32-S3 enumerated on USB during Session 06). Fill this in and
      append the capture path to TASKS.md Session 06 once available.

## Rules carried forward

- This probe is the only temperature source; do not infer or fabricate
  temperature from other signals.
- The integrated monitor reads the same GPIO4 configuration; Session 07+
  must not change the 1-Wire pin without a baseline-lock update.
