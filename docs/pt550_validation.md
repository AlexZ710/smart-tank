# PT550 Validation - Session 08

> Standalone bring-up validation for the PT550 analog ambient-light sensor,
> performed **before** integrated testing, per
> `02_Hardware_Bringup/PT550_Analog_Light_Bringup_Guide.md` and the Session 08
> prompt. Consistent with
> `01_Project_Documentation/Hardware_Baseline_Lock.md`: PT550 on ADS1115
> **A3**.

## Measurement claim boundary (mandatory)

The PT550 value is a **relative light signal / trend only**. It must never be
reported as calibrated lux, PAR, or PPFD unless an external calibration
procedure against a suitable reference is added to the project baseline
first.

## Wiring (locked)

| PT550 module | Connection |
|---|---|
| VCC | 3.3 V |
| GND | Common GND |
| Analog signal / S | ADS1115 **A3** |

ADS1115 remains at 0x48 (SDA GPIO8 / SCL GPIO9, ADDR -> GND) as locked in
Session 07.

## Sketch under test

`firmware/arduino/PT550_Bringup/PT550_Bringup.ino`

- Standalone: ADS1115 A3 only; no Wi-Fi, no pH, no temperature.
- Reports every 1 s: `timestamp_ms,light_raw_counts,light_voltage_v,light_relative_pct`.
- `light_relative_pct` = voltage scaled against the 3.3 V reference, clamped
  to 0-100%.

## Build verification (done 2026-08-28, no board required)

```text
FQBN esp32:esp32:esp32s3 (core 3.3.11, arduino-cli 1.5.1)
exit=0; 305689 B flash (23%), 23432 B RAM (7%)
```

## Standalone hardware validation procedure (to be captured with board)

1. Wire the PT550 per the table above; confirm ADS1115 still detected at 0x48.
2. Upload:
   `arduino-cli upload -p <COMx> --fqbn esp32:esp32:esp32s3 firmware/arduino/PT550_Bringup`
3. Open Serial Monitor at **115200**; capture to `evidence/S08/serial_capture.txt`.
4. Pass criteria - all must hold:
   - `ADS1115 detected at 0x48`;
   - dark test: cover the sensor; relative percent drops toward 0% and stays
     stable;
   - light test: expose the sensor to a lamp/window; relative percent rises
     and tracks the change smoothly;
   - readings stay within 0-100% and never present lux/PAR/PPFD units.

## Current status

- [x] Sketch implemented and compiled for the locked FQBN.
- [ ] Standalone Serial capture on physical hardware - **pending board**
      (no ESP32-S3 enumerated on USB during Session 08). Fill in and append
      the capture path to TASKS.md Session 08 once available.

## Rules carried forward

- PT550 is the sole light measurement source; do not infer light from any
  other signal.
- Charts/reports must label this channel as relative light (e.g. "light,
  relative %"), never lux/PAR/PPFD.
