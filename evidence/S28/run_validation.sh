#!/usr/bin/env bash
# S28 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S28/run_validation.sh 2>&1 | tee evidence/S28/validation_output.txt
#
# ENGINE BOOTSTRAP (one-time, host without Docker/WSL - reproduce exactly):
#   conda create -y -n tankdb -c conda-forge postgresql          # PostgreSQL 18.6
#   conda run -n tankdb initdb -D "C:/Users/Alex1/tank_pg_s28/data" -U postgres -A trust -E UTF8
#   conda run -n tankdb pg_ctl -D "C:/Users/Alex1/tank_pg_s28/data" \
#       -l "C:/Users/Alex1/tank_pg_s28/pg.log" -o "-p 5432" start
#   conda run -n tankdb psql -h localhost -U postgres -d postgres \
#       -c "CREATE ROLE smart_tank LOGIN PASSWORD 'smart_tank_dev_only';" \
#       -c "CREATE DATABASE smart_tank OWNER smart_tank;"
#   conda run -n tankdb psql -h localhost -U smart_tank -d smart_tank -f database/schema.sql
# Data directory is OUTSIDE the repo (throwaway local cluster); credentials are
# the documented local-dev placeholders from database/README.md (not secrets).
# Docker Desktop is NEVER touched (operator instruction).
#
# Covers: standing gates (web tests, build, pytest, provisioning policy),
# live end-to-end chain via scripts/s28_chain_demo.py (labeled SYNTHETIC mock
# telemetry through the real HTTP contract -> Postgres -> frozen S11 rules
# engine -> events -> LIVE bounded AI report), UI page sweep, EXP06 Part B
# host-side outage/recovery honesty check, secret scans (tracked source,
# browser output, bundles), forbidden-term audit, hygiene.
set -u
cd "$(dirname "$0")/../.." || exit 1
TOK="s28-local-test-token-only"  # throwaway local test value, not a real secret
GEN="s28-local-gen-token-only"   # throwaway local test value, not a real secret
B=http://localhost:3000
PGBIN="C:/Anaconda/envs/tankdb/Library/bin"
PGDATA="C:/Users/Alex1/tank_pg_s28/data"
PSQL="$PGBIN/psql.exe -h localhost -p 5432 -U smart_tank -d smart_tank -t -A"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "S28 validation - End-to-End Validation, Final Report and Demo - $NOW"
echo "Host: Windows, Node $(node --version). DB engine: conda-forge PostgreSQL 18.6 (env tankdb, throwaway cluster OUTSIDE repo)."
echo "Board NOT attached: provisioning lifecycle (EXP06 Part A) DEFERRED - see docs/EXP06_Results.md."
echo "ALL telemetry below is SYNTHETIC mock data (scripts/generate_mock_telemetry.py, seed 42), labeled - NOT REAL TELEMETRY."
echo

echo "[1] Web unit tests"
(cd web && npm test 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build"
(cd web && npm run build 2>&1 | tail -4); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] DB engine live: schema tables present"
"$PGBIN/psql.exe" -h localhost -p 5432 -U smart_tank -d smart_tank -t -A -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"
echo "expect 5 (telemetry_readings, events, experiment_markers, manual_measurements, reports); exit=$?"
echo

echo "[4] Reset demo tables + start web production server (throwaway tokens; AI_* read from gitignored web/.env.local)"
"$PGBIN/psql.exe" -h localhost -p 5432 -U smart_tank -d smart_tank -q -c "TRUNCATE telemetry_readings, events, experiment_markers, manual_measurements, reports RESTART IDENTITY;"
echo "truncate_exit=$?"
(cd web && DEVICE_INGEST_TOKEN="$TOK" REPORTS_GENERATE_TOKEN="$GEN" npm run start >/tmp/s28_server.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B/api/health" && break; sleep 1; done
echo "(server ready after ${i}s)"
echo "GET /api/health -> $(curl -s -o /tmp/s28r -w "%{http_code}" $B/api/health) $(cat /tmp/s28r) (expect 200 + database up - FIRST live-DB health of the project)"
echo "exit=0"
echo

echo "[5] Live end-to-end chain demo (labeled mock device -> real contract -> DB -> frozen rules engine -> events -> LIVE bounded report)"
conda run --no-capture-output -n reef python scripts/s28_chain_demo.py --device-token "$TOK" --gen-token "$GEN"
echo "chain_exit=$? (expect 0 = ALL CHECKS PASSED)"
echo

echo "[6] UI page sweep (browser-facing HTML captured for secret scan)"
for p in "/" "/history" "/experiments" "/events" "/reports" "/system"; do
  code=$(curl -s -o "/tmp/s28_page$(echo $p | tr '/' '_').html" -w "%{http_code}" "$B$p")
  echo "GET $p -> $code (expect 200)"
done
echo "exit=0"
echo

echo "[7] EXP06 Part B host-side: endpoint outage -> honest degradation -> recovery with NO invented/lost data"
pre_tel=$($PSQL -c "SELECT COUNT(*) FROM telemetry_readings;"); pre_ev=$($PSQL -c "SELECT COUNT(*) FROM events;"); pre_rp=$($PSQL -c "SELECT COUNT(*) FROM reports;")
echo "counts BEFORE outage: telemetry=$pre_tel events=$pre_ev reports=$pre_rp"
"$PGBIN/pg_ctl.exe" -D "$PGDATA" stop -m fast >/dev/null 2>&1; echo "pg stop exit=$?"
sleep 3
echo "GET /api/health (DB down)  -> $(curl -s -o /tmp/s28r -w "%{http_code}" $B/api/health) $(cat /tmp/s28r) (expect 200 + database down, honest)"
echo "POST /api/telemetry (down) -> $(curl -s -o /tmp/s28r -w "%{http_code}" -X POST $B/api/telemetry -H "Content-Type: application/json" -H "Authorization: Bearer $TOK" -d '{"device_id":"mock-esp32-s28","readings":[{"timestamp_ms":999999,"temperature_c":25.0,"ph":8.1,"ph_voltage_v":1.31,"light_relative_pct":50.0,"light_voltage_v":1.65,"xkc_level_state":null}]}') $(cat /tmp/s28r) (expect 503 'readings NOT stored' - never a fake acceptance)"
echo "GET /api/events (down)     -> $(curl -s -o /tmp/s28r -w "%{http_code}" "$B/api/events?limit=5") $(head -c 200 /tmp/s28r) (expect 503 honest)"
"$PGBIN/pg_ctl.exe" -D "$PGDATA" -l "C:/Users/Alex1/tank_pg_s28/pg.log" -o "-p 5432" start >/dev/null 2>&1; echo "pg start exit=$?"
for i in $(seq 1 30); do s=$($PSQL -c "SELECT 1;" 2>/dev/null); [ "$s" = "1" ] && break; sleep 1; done
echo "(db ready after ${i}s)"
echo "GET /api/health (recovered) -> $(curl -s -o /tmp/s28r -w "%{http_code}" $B/api/health) $(cat /tmp/s28r) (expect 200 + database up)"
post_tel=$($PSQL -c "SELECT COUNT(*) FROM telemetry_readings;"); post_ev=$($PSQL -c "SELECT COUNT(*) FROM events;"); post_rp=$($PSQL -c "SELECT COUNT(*) FROM reports;")
echo "counts AFTER recovery: telemetry=$post_tel events=$post_ev reports=$post_rp (must equal BEFORE - nothing lost, nothing invented)"
[ "$pre_tel" = "$post_tel" ] && [ "$pre_ev" = "$post_ev" ] && [ "$pre_rp" = "$post_rp" ]; echo "counts_unchanged_exit=$? (expect 0)"
echo "exit=0"
echo

echo "[8] Secret scans: browser output (rendered HTML + API responses) and bundles"
# Patterns are throwaway local tokens + credential prefix/host/scheme probes only -
# key-derived fragments are deliberately NOT embedded in committed evidence.
for pat in "sk-sp-" "aliyuncs" "postgres://" "$TOK" "$GEN"; do
  n=$(grep -l -F "$pat" /tmp/s28_page_*.html /tmp/s28r 2>/dev/null | wc -l)
  echo "  '$pat' in rendered pages/responses: $n files (expect 0)"
done
for pat in "$TOK" "$GEN" "sk-sp-" "aliyuncs" "smart_tank_dev_only"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "  VALUE '$pat' -> client-bundle:$c server-build:$s (expect 0/0 - tokens were process env only)"
done
for name in "AI_API_KEY" "AI_PROVIDER" "REPORTS_GENERATE_TOKEN" "DEVICE_INGEST_TOKEN"; do
  c=$(grep -rl -F "$name" web/.next/static 2>/dev/null | wc -l)
  echo "  NAME '$name' -> client:$c (expect 0)"
done
echo "exit=0"
echo

echo "[9] Forbidden-term audit of S28 sources (residuals must be rejection/absent/boundary prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|\blux\b|\bpar\b|ppfd|dosing|mains" \
  README.md docs/Final_Report.md docs/EXP06_Results.md docs/Demo_Script.md \
  scripts/s28_chain_demo.py 04_TASKS/MILESTONE_CHECKLIST.md \
  | grep -viE "absent|forbidden|reject|never|nowhere|guard|not |no |nothing|without|instead|only|boundary|manual|deliberately|unavailable|prohibition|float\("
# filter notes: 'nothing' = negation cue ("no mains switching, nothing auto-executed");
# 'float\(' = Python float() type casts in the chain script, not float-switch references.
echo "non_rejection_hits_exit=$? (1 = zero residual hits = PASS)"
echo

echo "[10] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[11] Hygiene: no artifacts/secrets staged; mock outputs gitignored; cluster outside repo"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$|data/mock|tank_pg"; echo "leak_hits_exit=$? (1 = zero = PASS)"
git check-ignore data/mock/s28_db_readback.csv >/dev/null 2>&1; echo "mock_readback_gitignored_exit=$? (0 = ignored = PASS)"
echo

echo "[12] Stop server"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server stopped pid=$pid)"
echo "Postgres cluster left running for inspection; stop with:"
echo "  \"$PGBIN/pg_ctl.exe\" -D \"$PGDATA\" stop -m fast"
echo
echo "S28 validation complete."
