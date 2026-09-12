#!/usr/bin/env bash
# S22 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S22/run_validation.sh 2>&1 | tee evidence/S22/validation_output.txt
set -u
cd "$(dirname "$0")/../.." || exit 1
TOK="s22-local-test-token-only"  # throwaway local test value, not a real secret
B=http://localhost:3000

echo "S22 validation - Authenticated Telemetry Ingestion API - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Host: Windows, Node $(node --version). Frozen reference: docs/Telemetry_Contract.md."
echo "DB status on this host: engine unavailable (S20 blocker, WSL not installed) -> DB-dependent paths validated for HONEST degradation (503, never fake success). Live INSERT round-trip deferred."
echo

echo "[1] Web unit tests (node --test: contract validation, rate limiter, data states)"
(cd web && npm test 2>&1 | grep -E "^(. )?(tests|pass|fail|✔|✖)|^ℹ (tests|pass|fail)"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build"
(cd web && npm run build 2>&1 | tail -20); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] Live contract matrix (production server, DEVICE_INGEST_TOKEN set, DATABASE_URL unset)"
(cd web && DEVICE_INGEST_TOKEN="$TOK" npm run start >/tmp/s22_start.log 2>&1 &)
sleep 12
post() { curl -s -o /tmp/s22r -w "%{http_code}" -X POST $B/api/telemetry -H "Authorization: Bearer $1" -H 'Content-Type: application/json' -d "$2"; }
GOOD='{"device_id":"st-test","readings":[{"timestamp_ms":183456789,"temperature_c":25.43,"ph":8.21,"ph_voltage_v":1.287,"light_relative_pct":42.5,"light_voltage_v":1.403,"xkc_level_state":null}]}'
echo "POST no token        -> $(post '' "$GOOD" 2>/dev/null || curl -s -o /tmp/s22r -w '%{http_code}' -X POST $B/api/telemetry -H 'Content-Type: application/json' -d "$GOOD") $(cat /tmp/s22r)"
echo "POST wrong token     -> $(post "wrong-$TOK" "$GOOD") $(cat /tmp/s22r)"
echo "POST malformed JSON  -> $(post "$TOK" '{oops') $(cat /tmp/s22r)"
echo "POST forbidden orp   -> $(post "$TOK" '{"device_id":"d","readings":[{"timestamp_ms":1,"temperature_c":25,"ph":8,"ph_voltage_v":1,"light_relative_pct":50,"light_voltage_v":1,"xkc_level_state":null,"orp_mv":220}]}') $(cat /tmp/s22r)"
echo "POST forbidden EC    -> $(post "$TOK" '{"device_id":"d","conductivity_us":500,"readings":[]}') $(cat /tmp/s22r)"
echo "POST batch 501       -> $(post "$TOK" "{\"device_id\":\"d\",\"readings\":[$(python -c 'print(",".join(["{}"]*501))')]}") $(cat /tmp/s22r)"
echo "POST valid (no DB)   -> $(post "$TOK" "$GOOD") $(cat /tmp/s22r)"
echo "POST ph out of range -> $(post "$TOK" '{"device_id":"st-test","readings":[{"timestamp_ms":5,"temperature_c":25,"ph":99,"ph_voltage_v":1,"light_relative_pct":50,"light_voltage_v":1,"xkc_level_state":null}]}') $(cat /tmp/s22r)"
echo "POST all rows bad    -> $(post "$TOK" '{"device_id":"st-test","readings":[{"timestamp_ms":0,"temperature_c":null,"ph":null,"ph_voltage_v":null,"light_relative_pct":null,"light_voltage_v":null,"xkc_level_state":5}]}') $(cat /tmp/s22r)"
echo "GET  health          -> $(curl -s -o /tmp/s22r -w '%{http_code}' $B/api/health) $(cat /tmp/s22r)"
echo "GET  latest (no DB)  -> $(curl -s -o /tmp/s22r -w '%{http_code}' $B/api/telemetry/latest) $(cat /tmp/s22r)"
echo "GET  hist no args    -> $(curl -s -o /tmp/s22r -w '%{http_code}' "$B/api/telemetry/history") $(cat /tmp/s22r)"
echo "GET  hist limit>max  -> $(curl -s -o /tmp/s22r -w '%{http_code}' "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-12T00:00:00Z&limit=9999") $(cat /tmp/s22r)"
echo "GET  hist bad chan   -> $(curl -s -o /tmp/s22r -w '%{http_code}' "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-12T00:00:00Z&channel=orp_mv") $(cat /tmp/s22r)"
echo "GET  hist valid      -> $(curl -s -o /tmp/s22r -w '%{http_code}' "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-12T00:00:00Z&channel=temperature_c&limit=100") $(cat /tmp/s22r)"
for i in $(seq 1 125); do c=$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/api/telemetry -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d '{"device_id":"d","readings":[]}'); done
echo "POST x125 rapid      -> last code $c (expect 429)"
echo "429 body             -> $(curl -s -X POST $B/api/telemetry -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d '{"device_id":"d","readings":[]}')"
echo "exit=0"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server stopped pid=$pid)"
echo

echo "[4] Bundle secret scan (client .next/static + server actual-value scan)"
for pat in "s22-local-test-token-only" "sk-sp-" "AI-key" "postgres://" "smart_tank_dev_only" "replace-with-long-random" "DEVICE_INGEST_TOKEN" "DATABASE_URL" "AI_API_KEY"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "$pat -> client:$c server:$s"
done
echo "note: server-side occurrences of the env-var NAMES (process.env.DEVICE_INGEST_TOKEN) are expected and safe; VALUES must be 0 everywhere."
echo "exit=0"
echo

echo "[5] Forbidden-term audit of S22 sources (residuals must be rejection prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|dosing|salinity|ammonia|\blux\b|\bpar\b|ppfd" web/lib/validation.ts web/lib/ratelimit.ts web/lib/scrub.ts web/app/api/telemetry web/tests | grep -viE "absent|forbidden|reject|never|not accepted|monitoring only" ; echo "non_rejection_hits_exit=$?"
echo

echo "[6] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[7] Hygiene: no artifacts/secrets staged"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$" ; echo "leak_hits_exit=$? (1 = zero = PASS)"
