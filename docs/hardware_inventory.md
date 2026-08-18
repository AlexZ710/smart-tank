# Hardware Inventory - smart-tank

> Frozen in Session 02. This is the actual-build inventory and must remain
> consistent with `../01_Project_Documentation/Hardware_Baseline_Lock.md` and
> `docs/project_scope.md`. Physical bring-up verification happens in later
> sessions (S04-S08); this session freezes the list itself.

## Core inventory (frozen)

| # | Item | Qty | Role | Electrical interface | Status |
|---|---|---|---|---|---|
| 1 | ESP32-S3-WROOM-1 development board | 1 | Main controller, Arduino IDE | USB-C/dev board power | Core - required |
| 2 | ADS1115 16-bit ADC module | 1 | Analog front end | I2C to ESP32-S3 | Core - required |
| 3 | DFRobot SEN0161-V2 pH module + probe | 1 | pH measurement | Analog -> ADS1115 **A1** | Core - required |
| 4 | Waterproof DS18B20 temperature probe | 1 | Water temperature | 1-Wire on **GPIO4** (4.7k pull-up) | Core - required |
| 5 | PT550 analog ambient-light sensor | 1 | Relative light signal | Analog -> ADS1115 **A3** | Core - required |

## Optional inventory (hardware-dependent)

| # | Item | Qty | Role | Electrical interface | Status |
|---|---|---|---|---|---|
| 6 | XKC-Y25-T12V level sensor | 0-1 | Water presence | Optocoupler/level isolation -> GPIO | Optional - nullable in all software |

The project must remain fully runnable when item 6 is absent. No software
path may depend on its presence.

## Explicitly absent - forbidden to reintroduce

| Item | Disposition |
|---|---|
| ORP | Not available; branch removed entirely |
| EC / conductivity | Not available; automated salinity removed (salinity is manual refractometer/hydrometer input) |
| ZP4510 float switches | Not available; dual-float logic and fields removed |
| FS300A flow sensor | Not available; pulse code and flow fields removed |

These absences are permanent constraints, not temporary software disables.
They must not appear as implemented features in code, charts, demos, or
reports. See `docs/hardware_deviation_record.md` for the historical record.

## Supporting (non-sensing) items

- USB data cable for ESP32-S3 (Serial bring-up, provisioning recovery at
  115200 baud).
- Breadboard/jumpers, 4.7 kOhm resistor for the DS18B20 1-Wire bus.
- pH calibration buffers (4.00 / 6.86 / 9.18) for SEN0161-V2 calibration.
- 5 L tank, refractometer/hydrometer (manual salinity only).

## Wiring summary (frozen)

```text
SEN0161-V2  --analog-->  ADS1115 A1
PT550       --analog-->  ADS1115 A3
ADS1115     --I2C-->     ESP32-S3 (SDA/SCL per board pinout)
DS18B20     --1-Wire-->  ESP32-S3 GPIO4 (4.7k pull-up to 3V3)
XKC-Y25-T12V --optocoupler/level-shift--> ESP32-S3 GPIO (OPTIONAL, isolated only)
```

Any wiring change requires updating `Hardware_Baseline_Lock.md` and this
inventory in the same session commit.
