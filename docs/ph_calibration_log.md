# pH Calibration Log - Session 07

> Two-point calibration record for the DFRobot SEN0161-V2 pH module read
> through ADS1115 **A1**, consistent with
> `01_Project_Documentation/Hardware_Baseline_Lock.md` and
> `02_Hardware_Bringup/SEN0161_pH_Bringup_Guide.md`.
>
> **Rule:** displayed/recorded pH values are trustworthy only after both
> buffer points below are measured and entered. Until then the bring-up
> sketch reports `status=UNCALIBRATED`.

## Hardware chain (locked)

```text
SEN0161-V2 module (powered per its guide)
    analog out -> ADS1115 A1
ADS1115: VDD 3.3V, GND, SDA GPIO8, SCL GPIO9, ADDR -> GND  =>  0x48
```

## Pre-checks (before calibration)

- [ ] `I2C_Scanner` (10_Sensor_Coding_Pack .../00_Common/I2C_Scanner) shows
      exactly `0x48` before analog sensors are trusted.
- [ ] `ADS1115_pH_Bringup` prints `ADS1115 detected at 0x48, gain=1`.
- [ ] Probe + interface board: BNC board dry zone, probe wet zone.
- [ ] A1 voltage with probe in air/buffer stays inside ADC range (< 4.096 V
      at gain 1).

## Calibration procedure

1. Rinse probe with clean water; blot dry.
2. Immerse in **pH 7.00** buffer; wait for the voltage to stabilize.
3. Send `CAL7` over Serial (115200). The sketch averages 32 samples and
   prints the captured voltage.
4. Rinse probe again.
5. Immerse in **pH 4.00** buffer; wait for stability.
6. Send `CAL4`; the sketch captures and prints the second point.
7. `SHOWCAL` prints both constants - enter them in the table below and into
   `firmware/arduino/SmartTank_Integrated_Monitor/SmartTank_Integrated_Monitor.ino`
   (`ph7Voltage` / `ph4Voltage`) before integrated pH readings are trusted.
8. Verify: readings in each buffer should sit within +/-0.1 pH of nominal.

## Calibration record

| Field | Value |
|---|---|
| Date | _pending hardware session_ |
| Operator | _pending_ |
| Buffers used | pH 7.00 / pH 4.00 |
| Probe condition | _pending (new / used, storage solution OK)_ |
| ph7Voltage (V) | _pending capture (starter placeholder 1.50)_ |
| ph4Voltage (V) | _pending capture (starter placeholder 2.03)_ |
| Verification in pH 7 buffer | _pending: measured pH within +/-0.1_ |
| Verification in pH 4 buffer | _pending: measured pH within +/-0.1_ |
| Entered into integrated monitor | _pending yes/no_ |

Placeholders 1.50 / 2.03 V are **starter defaults only** - they are not a
calibration and must be replaced by measured values.

## Build verification (done 2026-08-28, no board required)

```text
ADS1115_pH_Bringup: FQBN esp32:esp32:esp32s3, exit=0
  308689 B flash (23%), 23488 B RAM (7%)
I2C_Scanner:        FQBN esp32:esp32:esp32s3, exit=0
  300509 B flash (22%), 23024 B RAM (7%)
```

## Rules carried forward

- Recalibrate before each experiment session and whenever the probe was dry
  or stored improperly.
- pH is measured only through this chain; do not infer pH from any other
  signal. No dosing follows from pH readings - monitoring only.
