# XKC-Y25-T12V Optional Status - Session 08

> Session 08 objective: explicitly mark the optional XKC water-level sensor
> as installed or not-installed **without blocking core progress**.
> Consistent with `01_Project_Documentation/Hardware_Baseline_Lock.md` and
> `docs/hardware_inventory.md` (optional, isolated, nullable).

## Declared status

**NOT INSTALLED.**

The XKC-Y25-T12V is not physically part of the current build. All software
treats it as absent:

- `firmware/arduino/SmartTank_Integrated_Monitor/SmartTank_Integrated_Monitor.ino`
  keeps `ENABLE_XKC = false`;
- the Serial CSV prints `NA` in the `xkc_level_state` column;
- `telemetry_readings.water_level_state` stays NULL.

This declaration does not block any session. If the hardware becomes
available, follow the flip procedure below.

## Electrical boundary (if ever installed)

Per `02_Hardware_Bringup/XKC_Y25_Optional_Optocoupler_Bringup_Guide.md`:

```text
12 V supply -> XKC sensor -> optocoupler input
                           || galvanic / level boundary ||
3.3 V -> optocoupler output pull-up -> ESP32 GPIO7
```

**Never connect the XKC 12 V output directly to GPIO7.** Only a validated
optocoupler or level-conversion interface may cross this boundary.

## Flip procedure (future, only if hardware becomes available)

1. Wire through proper isolation per the guide above.
2. Set `ENABLE_XKC = true` in the integrated monitor and commit as a
   hardware change with evidence.
3. Run the optional bring-up check and record the result here and in TASKS.
4. Only then may `water_level_state` carry non-NULL values; until then it
   must remain nullable/disabled everywhere (schema, charts, reports).

## Rules carried forward

- No code path may require the XKC to be present.
- `water_level_state` must never be fabricated; with the sensor absent it is
  NULL/NA by design (no invented telemetry).
