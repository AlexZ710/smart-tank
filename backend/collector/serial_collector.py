"""Collect comma-separated telemetry from ESP32 Serial into append-only raw CSV."""
from __future__ import annotations
from pathlib import Path
import argparse
import csv
import serial

EXPECTED = [
    "timestamp_ms", "temperature_c", "ph", "ph_voltage_v",
    "light_relative_pct", "light_voltage_v", "xkc_level_state",
]
OUT = Path("data/raw/reef_data.csv")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", required=True, help="Serial port, e.g. COM5 or /dev/cu.usbmodem...")
    parser.add_argument("--baud", type=int, default=115200)
    args = parser.parse_args()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    new_file = not OUT.exists()

    with serial.Serial(args.port, args.baud, timeout=2) as ser, OUT.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=EXPECTED)
        if new_file:
            writer.writeheader()
        while True:
            line = ser.readline().decode("utf-8", errors="replace").strip()
            if not line or line.startswith("timestamp_ms") or line.startswith("ERROR"):
                continue
            parts = line.split(",")
            if len(parts) != len(EXPECTED):
                print(f"SKIP malformed line: {line}")
                continue
            row = dict(zip(EXPECTED, parts))
            writer.writerow(row)
            f.flush()
            print(row)

if __name__ == "__main__":
    main()
