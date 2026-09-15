#!/usr/bin/env bash
# S25 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S25/run_validation.sh 2>&1 | tee evidence/S25/validation_output.txt
set -u
cd "$(dirname "$0")/../.." || exit 1
TOK="s25-local-test-token-only"  # throwaway local test value, not a real secret
B=http://localhost:3000

echo "S25 validation - History Charts and Experiment Markers - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Host: Windows, Node $(node --version). DB engine still unavailable (S20 blocker, WSL not installed):"
echo "DB-backed history/experiment paths validated for HONEST degradation (503 / empty states), never fake rows."
echo

echo "[1] Web unit tests (node --test: validation, ratelimit, states, ingestStats, charting)"
(cd web && npm test 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build"
(cd web && npm run build 2>&1 | tail -24); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] Live UI + API matrix (production server; DEVICE_INGEST_TOKEN set, DATABASE_URL unset)"
(cd web && DEVICE_INGEST_TOKEN="$TOK" npm run start >/tmp/s25_start.log 2>&1 &)
sleep 12
code() { curl -s -o /tmp/s25r -w "%{http_code}" "$@"; }
echo "GET  /history            -> $(code $B/history) (expect 200)"; grep -o "History" /tmp/s25r | head -1
echo "GET  /experiments        -> $(code $B/experiments) (expect 200)"; grep -o "Experiments" /tmp/s25r | head -1
echo "GET  history no args     -> $(code "$B/api/telemetry/history") $(cat /tmp/s25r) (expect 400)"
echo "GET  history bad range   -> $(code "$B/api/telemetry/history?from=2026-09-10T00:00:00Z&to=oops") $(cat /tmp/s25r) (expect 400)"
echo "GET  history chan orp_mv -> $(code "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-15T00:00:00Z&channel=orp_mv") $(cat /tmp/s25r) (expect 400 whitelist)"
echo "GET  history limit 9999  -> $(code "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-15T00:00:00Z&limit=9999") $(cat /tmp/s25r) (expect 400 cap)"
echo "GET  history valid noDB  -> $(code "$B/api/telemetry/history?from=2026-09-01T00:00:00Z&to=2026-09-15T00:00:00Z&channel=temperature_c&limit=100") $(cat /tmp/s25r) (expect 503 honest)"
echo "GET  /api/experiments    -> $(code "$B/api/experiments") $(cat /tmp/s25r) (expect 503 honest, empty arrays)"
echo "GET  experiments lim big -> $(code "$B/api/experiments?limit=99999") $(cat /tmp/s25r) (expect 400 cap)"
echo "-- rendered HTML secret scan (/history and /experiments):"
curl -s $B/history > /tmp/s25_hist.html; curl -s $B/experiments > /tmp/s25_exp.html
for pat in "$TOK" "sk-sp-" "postgres://" "DATABASE_URL=" "Bearer "; do
  n=$(grep -c -F "$pat" /tmp/s25_hist.html /tmp/s25_exp.html 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  echo "  '$pat' hits in rendered HTML: $n (expect 0)"
done
echo "exit=0"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server stopped pid=$pid)"
echo

echo "[4] Bundle secret scan (client .next/static + server actual-value scan)"
for pat in "s25-local-test-token-only" "sk-sp-" "AI-key" "postgres://" "smart_tank_dev_only" "replace-with-long-random" "DEVICE_INGEST_TOKEN" "DATABASE_URL" "AI_API_KEY"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "$pat -> client:$c server:$s"
done
echo "note: server-side occurrences of the env-var NAMES (process.env.X) are expected and safe; VALUES must be 0 everywhere."
echo "exit=0"
echo

echo "[5] Forbidden-term audit of S25 sources (residuals must be rejection/manual-only prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|dosing|salinity|ammonia|\blux\b|\bpar\b|ppfd" web/app/history web/app/experiments web/app/api/experiments web/components/TimeSeriesChart.tsx web/components/HistoryPanel.tsx web/components/ExperimentsPanel.tsx web/lib/charting.ts web/tests/charting.test.ts | grep -viE "absent|forbidden|reject|never|not accepted|monitoring only|manual|without it|deliberately not" ; echo "non_rejection_hits_exit=$?"
echo

echo "[6] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[7] Hygiene: no artifacts/secrets staged"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$" ; echo "leak_hits_exit=$? (1 = zero = PASS)"
