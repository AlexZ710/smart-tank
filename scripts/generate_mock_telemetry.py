"""Generate clearly-labeled SYNTHETIC mock telemetry for hardware-free work.

Purpose
-------
No ESP32/sensors are required to exercise the software stack. This script
produces CSV files that are contract-identical to real collector output so
every downstream layer (collector parsing -> cleaning -> rules -> reports ->
experiments -> API/UI seeding) can be validated end to end.

Honesty rules (mandatory):
- Output is SYNTHETIC MOCK DATA, never real telemetry. Default filenames
  start with ``mock_`` and every run prints a banner saying so.
- Values stay inside the measurement boundary (docs/measurement_boundary.md):
  temperature (DS18B20), pH (SEN0161-V2), relative light % (PT550 - never
  lux/PAR/PPFD), optional XKC level state (NA/0/1). No ORP, EC/conductivity,
  ZP4510 float or FS300A flow values are ever produced.
- Deterministic: same seed + options -> byte-identical output (no wall-clock,
  uses ``random.Random(seed)`` only).

Contract
--------
Raw output header matches the serial CSV contract exactly (the collector
refuses header drift)::

    timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,light_voltage_v,xkc_level_state

``timestamp_ms`` simulates ESP32 ``millis()`` (starts at 1000, fixed step).
pH voltage uses the Session-07 *placeholder* slope (explicitly NOT a real
calibration): ``v = 1.50 - 0.17667 * (ph - 7.0)``.

Usage (repo root, conda env ``reef``)::

    python scripts/generate_mock_telemetry.py --scenario all --rows 240 --out data/mock/mock_raw.csv
    python scripts/generate_mock_telemetry.py --scenario baseline --manual-out data/mock/mock_manual.csv

Scenarios
---------
baseline        healthy reef band (temp 24-27 C, pH 8.0-8.4) -> no events
temp_excursion  drifts above warn band, spikes past critical band, recovers
ph_drift        pH sags below warn band then critical band, recovers
sensor_faults   rows that parse but fail cleaning validity flags
                (-127 C DS18B20 sentinel, pH 15, light 150 %)
all             concatenation of the four segments above
"""
from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

HEADER = ("timestamp_ms,temperature_c,ph,ph_voltage_v,"
          "light_relative_pct,light_voltage_v,xkc_level_state")

MANUAL_HEADER = "measured_at,metric_name,value,unit,method,operator_note"

# Session-07 placeholder pH->voltage mapping. Explicitly NOT a calibration.
PH_CAL7_V = 1.50
PH_SLOPE = (1.50 - 2.03) / 3.0  # CAL7/CAL4 placeholders: -0.17667 V per pH


def ph_to_voltage(ph: float) -> float:
    return PH_CAL7_V + PH_SLOPE * (ph - 7.0)


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _xkc(i: int, mode: str, rng: random.Random) -> str:
    if mode == "absent":
        return "NA"
    # toggle mode: mostly dry (0), occasional contact (1)
    return "1" if rng.random() < 0.05 else "0"


def _baseline_row(i: int, rng: random.Random) -> tuple[float, float, float]:
    """Healthy-band (temp, ph, light%)."""
    temp = 25.5 + 0.8 * math.sin(2 * math.pi * i / 120.0) + rng.uniform(-0.15, 0.15)
    ph = 8.2 + 0.10 * math.sin(2 * math.pi * i / 180.0 + 1.0) + rng.uniform(-0.03, 0.03)
    light = _clamp(50.0 + 45.0 * math.sin(2 * math.pi * i / 240.0), 0.0, 100.0)
    return temp, ph, light


def _row_values(scenario: str, i: int, n: int, rng: random.Random) -> tuple[float, float, float]:
    f = i / max(1, n - 1)  # 0..1 through the segment
    if scenario == "baseline":
        return _baseline_row(i, rng)
    if scenario == "temp_excursion":
        temp, ph, light = _baseline_row(i, rng)
        if f < 0.35:
            temp += 6.0 * (f / 0.35)            # ramp 25.5 -> ~31.5 (warn band exit)
        elif f < 0.55:
            temp = 33.5                          # beyond critical band (>32)
        else:
            temp = 33.5 - 8.0 * ((f - 0.55) / 0.45)  # recover toward baseline
        return temp, ph, light
    if scenario == "ph_drift":
        temp, ph, light = _baseline_row(i, rng)
        if f < 0.4:
            ph -= 0.9 * (f / 0.4)               # 8.2 -> ~7.3 (warn band exit)
        elif f < 0.6:
            ph = 6.8                             # beyond critical band (<7.0)
        else:
            ph = 6.8 + 1.4 * ((f - 0.6) / 0.4)  # recover to ~8.2
        return temp, ph, light
    if scenario == "sensor_faults":
        temp, ph, light = _baseline_row(i, rng)
        k = i % 4
        if k == 1:
            temp = -127.0   # DS18B20 error sentinel -> temperature_valid False
        elif k == 2:
            ph = 15.0       # outside physical 0-14 -> ph_valid False
        elif k == 3:
            light = 150.0   # outside 0-100 -> light_valid False
        return temp, ph, light
    raise ValueError(f"unknown scenario: {scenario}")


def format_row(ts_ms: int, temp: float, ph: float, light: float, xkc: str) -> str:
    light = _clamp(light, -1e6, 1e6)  # keep faults (150) visible to the cleaner
    voltage = round(_clamp(light, 0.0, 100.0) / 100.0 * 3.3, 3)
    return (f"{ts_ms},{temp:.3f},{ph:.3f},{ph_to_voltage(ph):.3f},"
            f"{light:.2f},{voltage:.3f},{xkc}")


def generate(scenario: str, rows: int, interval_ms: int = 1000,
             seed: int = 42, xkc: str = "absent") -> list[str]:
    """Return CSV lines (header first) for one scenario, deterministic."""
    rng = random.Random(seed)
    segments = ["baseline", "temp_excursion", "ph_drift", "sensor_faults"] \
        if scenario == "all" else [scenario]
    lines = [HEADER]
    ts = 1000
    per = max(1, rows // len(segments))
    for seg in segments:
        n = per if seg != segments[-1] else rows - per * (len(segments) - 1)
        for i in range(n):
            temp, ph, light = _row_values(seg, i, n, rng)
            lines.append(format_row(ts, temp, ph, light, _xkc(i, xkc, rng)))
            ts += interval_ms
    return lines


def generate_manual(rows: int = 6, seed: int = 42, interval_ms: int = 3_600_000) -> list[str]:
    """Mock manual measurements (salinity SG + ammonia) - manual-only metrics."""
    rng = random.Random(seed)
    lines = [MANUAL_HEADER]
    ts = 1000
    for i in range(rows):
        sg = 1.024 + rng.uniform(-0.002, 0.004)
        nh3 = rng.choice([0.0, 0.0, 0.01, 0.02])
        lines.append(f"{ts},salinity_sg,{sg:.4f},SG,refractometer,mock operator entry")
        lines.append(f"{ts},ammonia_mg_l,{nh3:.2f},mg/L,liquid test kit,mock operator entry")
        ts += interval_ms
    return lines


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate SYNTHETIC mock telemetry (never real data).")
    ap.add_argument("--scenario", default="all",
                    choices=["baseline", "temp_excursion", "ph_drift", "sensor_faults", "all"])
    ap.add_argument("--rows", type=int, default=240)
    ap.add_argument("--interval-ms", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--xkc", default="absent", choices=["absent", "toggle"],
                    help="absent -> NA column value; toggle -> 0/1 states")
    ap.add_argument("--out", type=Path, default=None,
                    help="raw telemetry CSV path (default data/mock/mock_raw_<scenario>.csv)")
    ap.add_argument("--manual-out", type=Path, default=None,
                    help="also write a mock manual-measurements CSV to this path")
    args = ap.parse_args()

    print("=" * 70)
    print("SYNTHETIC MOCK DATA - NOT REAL TELEMETRY - hardware-free validation only")
    print("=" * 70)

    out = args.out or Path("data/mock") / f"mock_raw_{args.scenario}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = generate(args.scenario, args.rows, args.interval_ms, args.seed, args.xkc)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(lines) - 1} mock rows -> {out}")

    if args.manual_out:
        args.manual_out.parent.mkdir(parents=True, exist_ok=True)
        mlines = generate_manual(seed=args.seed)
        args.manual_out.write_text("\n".join(mlines) + "\n", encoding="utf-8")
        print(f"wrote {len(mlines) - 1} mock manual rows -> {args.manual_out}")


if __name__ == "__main__":
    main()
