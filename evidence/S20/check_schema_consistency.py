"""S20 static validation helper.

Checks (no Docker engine required):
  A. database/schema.sql is fully idempotent (every CREATE TABLE / CREATE
     INDEX / ALTER TABLE ADD COLUMN uses IF NOT EXISTS).
  B. telemetry_readings columns in schema.sql match the human-readable
     table in docs/data_schema.md exactly (set equality).
  C. Frozen-contract fields (docs/Telemetry_Contract.md) have a storage
     home: timestamp_ms, temperature_c, ph, light_relative_pct,
     light_voltage_v -> telemetry_readings; xkc_level_state ->
     water_level_state ('0'/'1'/NULL per database/README.md).
  D. No forbidden-sensor columns anywhere in schema.sql
     (orp / conductivity / ec / flow / zp4510 / fs300a / float / par / lux).

Run: conda run --no-capture-output -n reef python evidence/S20/check_schema_consistency.py
Exit code 0 = all checks passed.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = (ROOT / "database" / "schema.sql").read_text(encoding="utf-8")
DOC = (ROOT / "docs" / "data_schema.md").read_text(encoding="utf-8")
CONTRACT = (ROOT / "docs" / "Telemetry_Contract.md").read_text(encoding="utf-8")

failures = []


def check(name, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(name)


# --- A. Idempotency -------------------------------------------------------
creates = re.findall(r"CREATE\s+(?:TABLE|INDEX)(?:\s+IF\s+NOT\s+EXISTS)?", SCHEMA, re.I)
non_idem = [c for c in creates if "IF NOT EXISTS" not in c.upper()]
alters = re.findall(r"ALTER\s+TABLE[^;]*", SCHEMA, re.I)
alter_bad = [a for a in alters if "IF NOT EXISTS" not in a.upper()]
check("A1 CREATE TABLE/INDEX all use IF NOT EXISTS", not non_idem, f"{len(creates)} statements")
check("A2 ALTER TABLE ... ADD COLUMN all use IF NOT EXISTS", not alter_bad, f"{len(alters)} statements")

# --- B. schema.sql <-> docs/data_schema.md (telemetry_readings) -----------
m = re.search(r"CREATE TABLE IF NOT EXISTS telemetry_readings \((.*?)\);", SCHEMA, re.S)
sql_cols = set()
if m:
    for line in m.group(1).splitlines():
        line = line.strip().rstrip(",")
        if not line or line.startswith("--"):
            continue
        tok = line.split()[0].lower()
        if tok not in ("primary", "unique", "foreign", "constraint"):
            sql_cols.add(tok)
for a in re.findall(r"ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS (\w+)", SCHEMA, re.I):
    sql_cols.add(a.lower())

doc_section = re.search(r"## telemetry_readings\n(.*?)\n\n", DOC, re.S)
doc_cols = set()
if doc_section:
    for row in re.findall(r"^\|\s*(\w+)\s*\|", doc_section.group(1), re.M):
        if row.lower() != "column":
            doc_cols.add(row.lower())

check("B1 telemetry_readings columns extracted from schema.sql", bool(sql_cols), f"{len(sql_cols)} columns")
check("B2 docs table matches schema.sql exactly", sql_cols == doc_cols,
      f"schema-only={sorted(sql_cols - doc_cols)} docs-only={sorted(doc_cols - sql_cols)}")

# --- C. Frozen contract fields have storage ------------------------------
contract_fields = ["timestamp_ms", "temperature_c", "ph", "light_relative_pct", "light_voltage_v"]
for f in contract_fields:
    check(f"C contract field `{f}` present in schema.sql", re.search(rf"\b{f}\b", SCHEMA) is not None)
check("C contract field `xkc_level_state` mapped to water_level_state",
      re.search(r"water_level_state", SCHEMA) is not None
      and "xkc_level_state" in CONTRACT
      and re.search(r"xkc_level_state.*water_level_state", (ROOT / "database" / "README.md").read_text(encoding="utf-8")) is not None)

# --- D. No forbidden-sensor columns ---------------------------------------
forbidden = ["orp", "conductivity", "ec_us", "ec_ms", "zp4510", "fs300a", "flow_", "_flow", "float_state", "par_", "lux"]
hits = [t for t in forbidden if t in SCHEMA.lower()]
check("D no forbidden-sensor columns in schema.sql", not hits, f"hits={hits}")

print()
print(f"RESULT: {'ALL CHECKS PASSED' if not failures else 'FAILURES: ' + ', '.join(failures)}")
sys.exit(0 if not failures else 1)
