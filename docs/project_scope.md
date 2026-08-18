# Project Scope - smart-tank

> Frozen in Session 01. This document is the single authority for what the
> smart-tank project measures and what it deliberately does not measure.
> It must stay consistent with `../01_Project_Documentation/Hardware_Baseline_Lock.md`.

## Project statement

A **5 L monitoring-only reef/water-quality tank** built around an
ESP32-S3-WROOM-1 development board (Arduino IDE). The system senses,
records, visualizes, and reports. It never actuates chemistry and never
switches mains voltage.

## Locked hardware baseline

| Role | Hardware | Interface |
|---|---|---|
| Main controller | ESP32-S3-WROOM-1 dev board | Arduino IDE |
| 16-bit ADC | ADS1115 | I2C |
| pH probe/module | DFRobot SEN0161-V2 | Analog -> ADS1115 **A1** |
| Temperature probe | Waterproof DS18B20 | 1-Wire on **GPIO4** |
| Ambient light sensor | PT550 analog | Analog -> ADS1115 **A3** |
| Water level (OPTIONAL) | XKC-Y25-T12V | Optocoupler/level-isolated GPIO only |

## In scope

1. Sensor bring-up and calibration for pH, temperature, and ambient light.
2. USB/Serial data collection during bring-up and experiments.
3. Data cleaning, storage, deterministic rule-based alerts, bounded AI reports.
4. Guided experiments: baseline stability, temperature response, pH
   perturbation, manual salinity drift, organic-load risk.
5. First-boot SoftAP Wi-Fi provisioning with NVS persistence (no hardcoded
   credentials), authenticated Wi-Fi telemetry, PostgreSQL + Next.js/Tailwind
   dashboard, and deployment of the final web facade.
6. USB/Serial remains a development and recovery channel.

## Out of scope (permanent constraints)

- Automatic chemical dosing of any kind.
- Student-built mains-voltage switching or heater/pump control.
- Any fabricated telemetry field. If a value is not measured by hardware in
  this baseline or entered manually by an operator, it must not exist in the
  data pipeline as an automatic reading.
- Reintroducing ORP, EC/conductivity, ZP4510 float switches, or the FS300A
  flow sensor. These are absent from the baseline and forbidden.

## Operating modes

- Provisioning: SoftAP captive portal at `192.168.4.1` (first boot,
  failed saved network, `PROVISION`/`CLEAR_WIFI` serial recovery).
- Normal: Wi-Fi station mode -> authenticated `POST /api/telemetry`.
- Development/recovery: USB/Serial at 115200 baud.

## Change control

Any change to the measured-variable list or the hardware baseline requires
updating `Hardware_Baseline_Lock.md` first, then this file, in the same
session commit.
