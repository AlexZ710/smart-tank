"""Session 09 tests: robust serial CSV ingestion, optional XKC, append-only raw."""
import csv

import pytest

from backend.collector.serial_collector import (
    EXPECTED,
    ensure_csv,
    parse_csv_line,
)

VALID_NA = "1000,25.31,8.21,1.5123,42.5,1.4025,NA"
VALID_XKC0 = "1001,25.30,8.20,1.5120,42.4,1.4010,0"
VALID_XKC1 = "1002,25.29,8.19,1.5118,42.3,1.4000,1"


class TestParseCsvLine:
    def test_valid_row_with_xkc_absent(self):
        row = parse_csv_line(VALID_NA)
        assert row is not None
        assert row["xkc_level_state"] == "NA"
        assert row["temperature_c"] == "25.31"

    def test_valid_rows_with_xkc_installed(self):
        assert parse_csv_line(VALID_XKC0)["xkc_level_state"] == "0"
        assert parse_csv_line(VALID_XKC1)["xkc_level_state"] == "1"

    def test_blank_and_banner_lines_skipped(self):
        assert parse_csv_line("") is None
        assert parse_csv_line("   ") is None
        assert parse_csv_line("=== smart-tank S06 ===") is None
        assert parse_csv_line("[STATUS] Provisioning portal active.") is None
        assert parse_csv_line("ERROR: ADS1115 not detected at 0x48") is None

    def test_header_echo_skipped(self):
        assert parse_csv_line(",".join(EXPECTED)) is None

    def test_wrong_field_count_skipped(self):
        assert parse_csv_line("1000,25.31,8.21") is None  # DS18B20-only sketch output
        assert parse_csv_line(VALID_NA + ",extra") is None

    def test_non_numeric_core_field_skipped(self):
        assert parse_csv_line("1000,not-a-number,8.21,1.5,42.5,1.4,NA") is None

    def test_nan_and_inf_rejected(self):
        assert parse_csv_line("1000,nan,8.21,1.5,42.5,1.4,NA") is None
        assert parse_csv_line("1000,25.0,inf,1.5,42.5,1.4,NA") is None

    def test_invalid_xkc_value_skipped(self):
        assert parse_csv_line("1000,25.31,8.21,1.5,42.5,1.4,") is None
        assert parse_csv_line("1000,25.31,8.21,1.5,42.5,1.4,2") is None
        assert parse_csv_line("1000,25.31,8.21,1.5,42.5,1.4,wet") is None


class TestEnsureCsvAppendOnly:
    def test_creates_new_file_with_header(self, tmp_path):
        target = tmp_path / "raw" / "reef_data.csv"
        assert ensure_csv(target) is True
        with target.open(encoding="utf-8") as f:
            assert f.readline().strip().split(",") == EXPECTED

    def test_appends_without_truncating_existing_rows(self, tmp_path):
        target = tmp_path / "reef_data.csv"
        ensure_csv(target)
        row = parse_csv_line(VALID_NA)
        with target.open("a", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=EXPECTED).writerow(row)

        assert ensure_csv(target) is False  # existing file, not recreated
        with target.open(encoding="utf-8") as f:
            lines = [l for l in f.read().splitlines() if l]
        assert len(lines) == 2  # header + preserved row
        assert lines[1].split(",")[1] == "25.31"

    def test_header_drift_refused(self, tmp_path):
        target = tmp_path / "reef_data.csv"
        target.write_text("timestamp_ms,temperature_c,wrong_column\n", encoding="utf-8")
        with pytest.raises(ValueError):
            ensure_csv(target)
