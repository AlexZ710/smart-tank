"""S28 end-to-end chain demo: mock device -> API -> DB -> rules -> events -> report.

HONESTY BANNER: every reading used here is SYNTHETIC mock data produced by
``scripts/generate_mock_telemetry.py`` (deterministic, seed 42) and is labeled
as such in the database notes and in all printed output. NO ESP32 board is
attached; this exercises the SOFTWARE chain only (the same HTTP contract,
auth, storage, rules engine and bounded-report pipeline a real provisioned
device would use).

Chain proven live (S28, host-local Postgres via conda env ``tankdb``):
  1. unauthenticated ingest REJECTED (401);
  2. forbidden-sensor field probe REJECTED (400, whole request);
  3. oversized batch REJECTED (413);
  4. labeled-mock batch POSTed over the real contract -> partial success
     {accepted, rejected[]} (out-of-contract fault rows rejected, never clamped);
  5. accepted rows read BACK from Postgres via psql (count must match);
  6. the FROZEN S11 rules engine (backend/rules/rules.detect_events) runs on
     the DB read-back -> events INSERTed into the events table (joined to
     their source reading_id / recorded_at - no invented timestamps);
  7. labeled-mock manual measurements + one experiment marker inserted
     (manual-only metrics: salinity SG, ammonia);
  8. GET latest / history / events / experiments read-backs over HTTP;
  9. POST /api/reports/generate over a window containing the ingested mock
     rows -> LIVE bounded-agent report (provider called server-side, output
     guarded before storage, [REQUIRES HUMAN CONFIRMATION] markers checked);
 10. empty window -> honest no-data report WITHOUT calling the provider.

Prerequisites: web production server on :3000 with DEVICE_INGEST_TOKEN and
REPORTS_GENERATE_TOKEN set (throwaway local values), local Postgres up with
database/schema.sql applied, AI_* provider env present server-side.

Usage (repo root, conda env ``reef``):
    python scripts/s28_chain_demo.py --device-token TOK --gen-token TOK
Tokens are throwaway local test values passed by the caller (never hardcoded).
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd  # noqa: E402

from backend.rules.rules import detect_events  # noqa: E402
from scripts.generate_mock_telemetry import generate, generate_manual  # noqa: E402

BASE = "http://localhost:3000"
DEVICE_ID = "mock-esp32-s28"
FIRMWARE = "s28-mock-chain-demo"
PSQL = Path(r"C:\Anaconda\envs\tankdb\Library\bin\psql.exe")
PSQL_ARGS = [str(PSQL), "-h", "localhost", "-p", "5432", "-U", "smart_tank",
             "-d", "smart_tank", "-v", "ON_ERROR_STOP=1", "-q"]
READBACK = Path("data/mock/s28_db_readback.csv")
MOCK_NOTE = "SYNTHETIC mock data (S28 chain demo) - NOT REAL TELEMETRY"

_failures: list[str] = []


def check(name: str, actual, expected) -> None:
    ok = actual == expected
    print(f"  [{'OK ' if ok else 'FAIL'}] {name}: expected {expected!r}, got {actual!r}")
    if not ok:
        _failures.append(name)


def http(method: str, path: str, body: dict | None = None,
         token: str | None = None) -> tuple[int, dict | str]:
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=90) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.startswith(("{", "[")) else raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def psql(sql: str) -> str:
    out = subprocess.run(PSQL_ARGS + ["-c", sql], capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(f"psql failed: {out.stderr.strip()[:400]}")
    return out.stdout


def sql_quote(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--device-token", required=True, help="throwaway local DEVICE_INGEST_TOKEN value")
    ap.add_argument("--gen-token", required=True, help="throwaway local REPORTS_GENERATE_TOKEN value")
    args = ap.parse_args()

    print("=" * 72)
    print("S28 chain demo - ALL TELEMETRY BELOW IS SYNTHETIC MOCK DATA,")
    print("labeled in-DB, generated deterministically (seed 42). NOT REAL.")
    print("=" * 72)

    # ---- 0. health with a live database -----------------------------------
    print("\n[0] GET /api/health (database must be UP - first live-DB health of the project)")
    st, body = http("GET", "/api/health")
    check("health status", st, 200)
    check("health database", body.get("database"), "up")

    # ---- 1-3. rejection paths ---------------------------------------------
    print("\n[1] Auth + contract rejection paths (real HTTP contract)")
    st, body = http("POST", "/api/telemetry",
                    {"device_id": DEVICE_ID, "readings": []})
    check("no token -> 401", st, 401)
    st, body = http("POST", "/api/telemetry",
                    {"device_id": DEVICE_ID, "readings": []}, token="wrong-token")
    check("wrong token -> 401", st, 401)
    # forbidden-sensor probe: a field that must never exist is REJECTED whole (400)
    forbidden_row = {"timestamp_ms": 1, "temperature_c": 25.0, "ph": 8.1,
                     "ph_voltage_v": 1.31, "light_relative_pct": 50.0,
                     "light_voltage_v": 1.65, "xkc_level_state": None,
                     "orp_mv": -120.0}  # absent-sensor field: must be REJECTED
    st, body = http("POST", "/api/telemetry",
                    {"device_id": DEVICE_ID, "readings": [forbidden_row]},
                    token=args.device_token)
    check("forbidden field -> 400 (rejected, never stored)", st, 400)
    probe = [{"timestamp_ms": i + 1, "temperature_c": 25.0, "ph": 8.1,
              "light_relative_pct": 50.0, "light_voltage_v": 1.65,
              "xkc_level_state": None} for i in range(501)]
    st, body = http("POST", "/api/telemetry",
                    {"device_id": DEVICE_ID, "readings": probe}, token=args.device_token)
    check("501-row batch -> 413", st, 413)

    # ---- 4. labeled-mock batch over the real contract ----------------------
    print("\n[2] Labeled-mock batch ingest (scenario 'all', 240 rows, seed 42)")
    lines = generate("all", 240)
    rdr = csv.DictReader(io.StringIO("\n".join(lines)))
    readings = []
    for row in rdr:
        readings.append({
            "timestamp_ms": int(row["timestamp_ms"]),
            "temperature_c": float(row["temperature_c"]),
            "ph": float(row["ph"]),
            "ph_voltage_v": float(row["ph_voltage_v"]),  # required key (null allowed)
            "light_relative_pct": float(row["light_relative_pct"]),
            "light_voltage_v": float(row["light_voltage_v"]),
            # mock generator emits NA when the optional XKC sensor is absent
            "xkc_level_state": None if row["xkc_level_state"] == "NA" else int(row["xkc_level_state"]),
        })
    st, body = http("POST", "/api/telemetry",
                    {"device_id": DEVICE_ID, "firmware_version": FIRMWARE,
                     "readings": readings}, token=args.device_token)
    check("mock batch -> 200", st, 200)
    accepted = body.get("accepted", -1)
    rejected = body.get("rejected", [])
    print(f"  accepted={accepted} rejected={len(rejected)} "
          f"(rejections are out-of-contract fault rows - rejected, never clamped/stored)")
    for r in rejected[:6]:
        print(f"    rejected idx {r.get('index')}: {r.get('error')}")
    if accepted <= 0:
        _failures.append("nothing accepted")

    # ---- 5. DB read-back ----------------------------------------------------
    print("\n[3] Postgres read-back (stored rows must equal accepted count)")
    READBACK.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(PSQL_ARGS + ["-c",
        f"\\copy (SELECT timestamp_ms, temperature_c, ph, light_relative_pct, "
        f"water_level_state FROM telemetry_readings WHERE device_id = "
        f"{sql_quote(DEVICE_ID)} ORDER BY id) TO '{READBACK.as_posix()}' CSV HEADER"],
        capture_output=True, text=True, check=True)
    df = pd.read_csv(READBACK)
    check("DB rows == accepted", len(df), accepted)

    # ---- 6. frozen S11 rules engine on the DB read-back --------------------
    print("\n[4] Frozen S11 rules engine on DB read-back (deterministic, no invention)")
    events = detect_events(df)
    print(f"  engine events: {len(events)}")
    if not events.empty:
        print(events.groupby(["severity", "rule_code"]).size().to_string())
    def count(table: str) -> int:
        o = subprocess.run(PSQL_ARGS + ["-t", "-A", "-c", f"SELECT COUNT(*) FROM {table};"],
                           capture_output=True, text=True, check=True)
        return int(o.stdout.strip())

    before = count("events")
    if not events.empty:
        stmts = []
        for _, ev in events.iterrows():
            stmts.append(
                "INSERT INTO events (device_id, occurred_at, severity, rule_code, message, reading_id) "
                f"SELECT r.device_id, r.recorded_at, {sql_quote(ev['severity'])}, "
                f"{sql_quote(ev['rule_code'])}, {sql_quote(ev['reason'])}, r.id "
                "FROM telemetry_readings r WHERE r.device_id = "
                f"{sql_quote(DEVICE_ID)} AND r.timestamp_ms = {int(ev['timestamp_ms'])} LIMIT 1;")
        out = subprocess.run(PSQL_ARGS + ["-c", "\n".join(stmts)],
                             capture_output=True, text=True)
        if out.returncode != 0:
            print(f"  [FAIL] events insert: {out.stderr.strip()[:300]}")
            _failures.append("events insert")
        else:
            check("events inserted == engine events", count("events") - before, len(events))
    print(f"  events table total: {count('events')}")

    # ---- 7. manual-only metrics + experiment marker (labeled mock) ----------
    print("\n[5] Manual-only measurements + experiment marker (labeled mock)")
    manual = list(csv.DictReader(io.StringIO("\n".join(generate_manual(rows=4)))))
    stmts = ["INSERT INTO experiment_markers (experiment_id, occurred_at, marker_type, label, notes) "
             f"VALUES ('S28-MOCK-CHAIN', NOW(), 'chain_demo', 'S28 labeled-mock chain demo', {sql_quote(MOCK_NOTE)});"]
    for i, m in enumerate(manual):
        stmts.append(
            "INSERT INTO manual_measurements (experiment_id, measured_at, metric_name, value, unit, method, operator_note) "
            f"VALUES ('S28-MOCK-CHAIN', NOW() - make_interval(hours => {i}), {sql_quote(m['metric_name'])}, "
            f"{float(m['value'])}, {sql_quote(m['unit'])}, {sql_quote(m['method'])}, {sql_quote(MOCK_NOTE)});")
    psql("\n".join(stmts))
    print(f"  inserted 1 marker + {len(manual)} manual rows (salinity SG / ammonia - manual-only metrics)")

    # ---- 8. HTTP read-backs the UI consumes --------------------------------
    print("\n[6] API read-backs consumed by the UI pages")
    st, body = http("GET", "/api/telemetry/latest")
    devs = body.get("devices", [])
    check("latest -> 200", st, 200)
    check("latest shows mock device", any(d.get("device_id") == DEVICE_ID for d in devs), True)
    now = datetime.now(timezone.utc)
    frm = (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    to = (now + timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    st, body = http("GET", f"/api/telemetry/history?from={frm}&to={to}&limit=5000")
    check("history -> 200", st, 200)
    print(f"  history points in window: count={body.get('count')}")
    st, body = http("GET", "/api/events?limit=1000")
    check("events -> 200", st, 200)
    evs = body.get("events", [])
    print(f"  events returned: {len(evs)}; codes seen: "
          f"{sorted({e.get('rule_code') for e in evs})}")
    st, body = http("GET", "/api/experiments?limit=100")
    check("experiments -> 200", st, 200)

    # ---- 9. LIVE bounded report --------------------------------------------
    print("\n[7] POST /api/reports/generate - LIVE bounded agent over the mock window")
    st, body = http("POST", "/api/reports/generate",
                    {"from": frm, "to": to}, token=args.gen_token)
    if st == 502 and "timeout" in str(body).lower():
        # Provider latency occasionally exceeds the FROZEN 30 s server cap; the
        # route then honestly returns 502 ("report NOT generated"). One retry
        # is made and both outcomes are reported - nothing is fabricated.
        print("  first attempt 502 (provider exceeded the frozen 30 s cap - report NOT generated); retrying once after 15 s")
        import time
        time.sleep(15)
        st, body = http("POST", "/api/reports/generate",
                        {"from": frm, "to": to}, token=args.gen_token)
    check("generate -> 200 (live provider round-trip)", st, 200)
    if st == 200:
        prov = body.get("provenance", {})
        content = body.get("report", {}).get("content_markdown", "")
        print(f"  generated_by={prov.get('generated_by')} model={prov.get('model')}")
        check("markers preserved", "[REQUIRES HUMAN CONFIRMATION]" in content, True)
        print("  --- report content (first 600 chars, stored VERBATIM) ---")
        print("  " + content[:600].replace("\n", "\n  "))
        print("  --- end excerpt ---")
    else:
        print(f"  body: {str(body)[:300]}")

    print("\n[8] Empty window -> honest no-data report (provider NOT called)")
    st, body = http("POST", "/api/reports/generate",
                    {"from": "2020-01-01T00:00:00Z", "to": "2020-01-02T00:00:00Z"},
                    token=args.gen_token)
    check("no-data generate -> 200", st, 200)
    if st == 200:
        check("generated_by == no-data-shortcut",
              body.get("provenance", {}).get("generated_by"), "no-data-shortcut")
    st, body = http("GET", "/api/reports?limit=50")
    check("reports list -> 200", st, 200)
    print(f"  stored reports: {len(body.get('reports', []))}")

    # ---- summary -------------------------------------------------------------
    print("\n" + "=" * 72)
    if _failures:
        print(f"CHAIN DEMO: {len(_failures)} CHECK(S) FAILED: {_failures}")
        return 1
    print("CHAIN DEMO: ALL CHECKS PASSED - mock device -> auth -> contract -> Postgres")
    print("-> frozen rules engine -> events -> API read-backs -> LIVE bounded report.")
    print("Reminder: all telemetry above is SYNTHETIC mock data, labeled in-DB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
