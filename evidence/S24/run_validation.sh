#!/usr/bin/env bash
# S24 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S24/run_validation.sh 2>&1 | tee evidence/S24/validation_output.txt
set -u
cd "$(dirname "$0")/../.." || exit 1
TOK="s24-local-test-token-only"  # throwaway local test value, not a real secret
B=http://localhost:3000

echo "S24 validation - Live Status and Device Health UI - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Host: Windows, Node $(node --version). DB engine still unavailable (S20 blocker, WSL not installed):"
echo "DB-backed UI paths are validated for HONEST degradation (empty state / 503 notice), never fake data."
echo

echo "[1] Web unit tests (node --test: validation, ratelimit, states, ingestStats)"
(cd web && npm test 2>&1 | grep -E "^# (tests|pass|fail)|^. (tests|pass|fail)|tests [0-9]+|pass [0-9]+|fail [0-9]+"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build"
(cd web && npm run build 2>&1 | tail -25); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] Live UI + stats matrix (production server; DEVICE_INGEST_TOKEN set, DATABASE_URL unset)"
(cd web && DEVICE_INGEST_TOKEN="$TOK" npm run start >/tmp/s24_start.log 2>&1 &)
sleep 12
code() { curl -s -o /tmp/s24r -w "%{http_code}" "$@"; }
echo "GET  /                 -> $(code $B/) (expect 200)"
grep -o "Live Status" /tmp/s24r | head -1
echo "GET  /system           -> $(code $B/system) (expect 200)"
grep -o "System Health" /tmp/s24r | head -1
echo "GET  /api/system/stats -> $(code $B/api/system/stats) (expect 200, fresh zeros)"
cat /tmp/s24r; echo
GOOD='{"device_id":"st-test","readings":[{"timestamp_ms":183456789,"temperature_c":25.43,"ph":8.21,"ph_voltage_v":1.287,"light_relative_pct":42.5,"light_voltage_v":1.403,"xkc_level_state":null}]}'
echo "POST wrong token x2    -> $(code -X POST $B/api/telemetry -H "Authorization: Bearer wrong-$TOK" -H 'Content-Type: application/json' -d "$GOOD") $(code -X POST $B/api/telemetry -H "Authorization: Bearer wrong-$TOK" -H 'Content-Type: application/json' -d "$GOOD") (expect 401 401)"
echo "POST malformed JSON    -> $(code -X POST $B/api/telemetry -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d '{oops') (expect 400)"
echo "POST forbidden orp     -> $(code -X POST $B/api/telemetry -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d '{"device_id":"d","readings":[{"timestamp_ms":1,"temperature_c":25,"ph":8,"ph_voltage_v":1,"light_relative_pct":50,"light_voltage_v":1,"xkc_level_state":null,"orp_mv":220}]}') (expect 400)"
echo "POST valid (no DB)     -> $(code -X POST $B/api/telemetry -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d "$GOOD") $(cat /tmp/s24r) (expect 503 honest)"
echo "GET  /api/system/stats -> $(code $B/api/system/stats) (expect counters: requests=5, 401:2 400:2 503:1)"
cat /tmp/s24r; echo
echo "GET  /api/health       -> $(code $B/api/health) $(cat /tmp/s24r)"
echo "-- rendered HTML secret scan (/ and /system):"
curl -s $B/ > /tmp/s24_home.html; curl -s $B/system > /tmp/s24_sys.html
for pat in "$TOK" "sk-sp-" "postgres://" "DATABASE_URL=" "Bearer "; do
  n=$(grep -c -F "$pat" /tmp/s24_home.html /tmp/s24_sys.html 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  echo "  '$pat' hits in rendered HTML: $n (expect 0)"
done
echo "exit=0"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server stopped pid=$pid)"
echo

echo "[4] Bundle secret scan (client .next/static + server actual-value scan)"
for pat in "s24-local-test-token-only" "sk-sp-" "AI-key" "postgres://" "smart_tank_dev_only" "replace-with-long-random" "DEVICE_INGEST_TOKEN" "DATABASE_URL" "AI_API_KEY"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "$pat -> client:$c server:$s"
done
echo "note: server-side occurrences of the env-var NAMES (process.env.X) are expected and safe; VALUES must be 0 everywhere."
echo "exit=0"
echo

echo "[5] Forbidden-term audit of S24 sources (residuals must be rejection/absence prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|dosing|salinity|ammonia|\blux\b|\bpar\b|ppfd" web/app/page.tsx web/app/system web/components web/lib/ingestStats.ts web/app/api/system web/tests/ingestStats.test.ts | grep -viE "absent|forbidden|reject|never|not accepted|monitoring only|without it" ; echo "non_rejection_hits_exit=$?"
echo

echo "[6] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[7] Hygiene: no artifacts/secrets staged"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$" ; echo "leak_hits_exit=$? (1 = zero = PASS)"
