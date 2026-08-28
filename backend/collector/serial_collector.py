"""Collect comma-separated telemetry from ESP32 Serial into append-only raw CSV.

Session 09 contract:
- Input schema is the SmartTank_Integrated_Monitor CSV:
    timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,
    light_voltage_v,xkc_level_state
- `xkc_level_state` is optional hardware: it carries `NA` when the XKC
  sensor is absent (the project default) or `0`/`1` when installed.
- `data/raw/reef_data.csv` is append-only: the collector never truncates or
  rewrites previously collected rows.
- Lines that do not match the schema are skipped and reported; they never
  corrupt the raw file. Malformed input never invents data.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

try:
    import serial
except ImportError:  # allow unit tests without the serial dependency
    serial = None  # type: ignore[assignment]

EXPECTED = [
    "timestamp_ms", "temperature_c", "ph", "ph_voltage_v",
    "light_relative_pct", "light_voltage_v", "xkc_level_state",
]

# Columns that must parse as finite numbers (XKC handled separately).
_NUMERIC = EXPECTED[:6]

# Accepted values for the optional XKC water-level field.
XKC_ABSENT = "NA"
XKC_VALUES = {XKC_ABSENT, "0", "1"}

OUT = Path("data/raw/reef_data.csv")


def parse_csv_line(line: str) -> dict | None:
    """Validate one Serial line against the locked schema.

    Returns a row dict when the line is a valid telemetry record, or None
    when the line must be skipped (blank, banner/log text, header echo, or
    malformed). Never raises and never invents missing values.
    """
    line = line.strip()
    if not line:
        return None
    # Serial banners, status/log lines and the sketch header echo.
    if line.startswith(("timestamp_ms", "[", "ERROR", "WARNING", "===")):
        return None

    parts = [p.strip() for p in line.split(",")]
    if len(parts) != len(EXPECTED):
        return None

    for name, value in zip(_NUMERIC, parts[:6]):
        try:
            number = float(value)
        except ValueError:
            return None
        if number != number or number in (float("inf"), float("-inf")):
            return None  # NaN/Inf from a faulty probe must not enter raw data

    xkc = parts[6]
    if xkc not in XKC_VALUES:
        return None

    return dict(zip(EXPECTED, parts))


def ensure_csv(path: Path) -> bool:
    """Guarantee the append-only CSV exists with the correct header.

    Returns True for a newly created file. Raises ValueError when an
    existing file has a header that does not match the locked schema
    (schema drift must be resolved by a person, never silently overwritten).
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        with path.open("r", newline="", encoding="utf-8") as f:
            header = f.readline().strip()
        if header and header.split(",") != EXPECTED:
            raise ValueError(
                f"{path} header {header!r} does not match locked schema {EXPECTED}; "
                "refusing to append"
            )
        return False

    with path.open("w", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=EXPECTED).writeheader()
    return True


def collect(port: str, baud: int, out_path: Path = OUT) -> None:
    """Read Serial forever and append validated rows to `out_path`."""
    if serial is None:
        raise RuntimeError("pyserial is not installed; run `pip install -r requirements.txt`")

    created = ensure_csv(out_path)
    print(f"Raw CSV: {out_path} ({'created' if created else 'appending to existing file'})")

    with serial.Serial(port, baud, timeout=2) as ser, \
            out_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=EXPECTED)
        while True:
            line = ser.readline().decode("utf-8", errors="replace")
            row = parse_csv_line(line)
            if row is None:
                if line.strip():
                    print(f"SKIP malformed line: {line.strip()}")
                continue
            writer.writerow(row)
            f.flush()
            print(row)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", required=True,
                        help="Serial port, e.g. COM5 or /dev/cu.usbmodem...")
    parser.add_argument("--baud", type=int, default=115200)
    parser.add_argument("--out", type=Path, default=OUT,
                        help=f"Append-only output CSV (default: {OUT})")
    args = parser.parse_args()

    try:
        collect(args.port, args.baud, args.out)
    except KeyboardInterrupt:
        print("\nCollector stopped; raw data preserved.")


if __name__ == "__main__":
    main()
