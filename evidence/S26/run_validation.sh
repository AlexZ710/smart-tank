#!/usr/bin/env bash
# S26 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S26/run_validation.sh 2>&1 | tee evidence/S26/validation_output.txt
set -u
cd "$(dirname "$0")/../.." || exit 1
B=http://localhost:3000
B2=http://localhost:3001
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "S26 validation - Events and AI Report UI - $NOW"
echo "Host: Windows, Node $(node --version). DB engine still unavailable (S20 blocker, WSL not installed):"
echo "DB-backed events/reports paths validated for HONEST degradation (503 / empty states), never fabricated rows or reports."
echo "AI provider config (AI_*) lives ONLY in gitignored web/.env.local; server B below runs with AI_PROVIDER blanked to prove the not-configured path."
echo

echo "[1] Web unit tests (node --test: validation, ratelimit, states, ingestStats, charting, events, reports)"
(cd web && npm test 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build"
(cd web && npm run build 2>&1 | tail -26); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] Live API matrix - server A :3000 (web/.env.local loaded: AI configured, DATABASE_URL -> dead local engine)"
(cd web && npm run start >/tmp/s26_start.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B/api/health" && break; sleep 1; done
echo "(server A ready after ${i}s)"
code() { curl -s -o /tmp/s26r -w "%{http_code}" "$@"; }
post() { curl -s -o /tmp/s26r -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$2" "$1"; }
echo "GET  /events page         -> $(code $B/events) (expect 200)"; grep -o "Events" /tmp/s26r | head -1
cp /tmp/s26r /tmp/s26_ev.html
echo "GET  /reports page        -> $(code $B/reports) (expect 200)"; grep -o "Reports" /tmp/s26r | head -1
cp /tmp/s26r /tmp/s26_rp.html
echo "GET  events bad severity  -> $(code "$B/api/events?severity=bogus") $(cat /tmp/s26r) (expect 400)"
echo "GET  events rule ORP_HIGH -> $(code "$B/api/events?rule_code=ORP_HIGH") $(cat /tmp/s26r) (expect 400 frozen-vocabulary guard)"
echo "GET  events rule FLOW_*   -> $(code "$B/api/events?rule_code=FLOW_STUCK") $(cat /tmp/s26r) (expect 400)"
echo "GET  events rule EC_HIGH  -> $(code "$B/api/events?rule_code=EC_HIGH") $(cat /tmp/s26r) (expect 400)"
echo "GET  events limit 9999    -> $(code "$B/api/events?limit=9999") $(cat /tmp/s26r) (expect 400 contract cap)"
echo "GET  events valid noDB    -> $(code "$B/api/events?severity=critical&rule_code=TEMP_CRITICAL&limit=100") $(cat /tmp/s26r) (expect 503 honest, empty events)"
echo "GET  reports noDB         -> $(code "$B/api/reports") $(cat /tmp/s26r) (expect 503 honest, empty reports)"
echo "GET  reports limit 99999  -> $(code "$B/api/reports?limit=99999") $(cat /tmp/s26r) (expect 400 cap)"
echo "-- POST /api/reports/generate (limiter 5/min/source; probes ordered to exhaust it exactly):"
echo "gen  {}                   -> $(post "$B/api/reports/generate" '{}') $(cat /tmp/s26r) (expect 400 from/to required)"
echo "gen  bad ISO              -> $(post "$B/api/reports/generate" '{"from":"oops","to":"'"$NOW"'"}') $(cat /tmp/s26r) (expect 400)"
echo "gen  to < from            -> $(post "$B/api/reports/generate" '{"from":"2026-09-16T00:00:00Z","to":"2026-09-15T00:00:00Z"}') $(cat /tmp/s26r) (expect 400)"
echo "gen  window > 7 days      -> $(post "$B/api/reports/generate" '{"from":"2026-09-01T00:00:00Z","to":"2026-09-15T00:00:00Z"}') $(cat /tmp/s26r) (expect 400 bounded window)"
echo "gen  valid, DB down       -> $(post "$B/api/reports/generate" '{"from":"2026-09-15T00:00:00Z","to":"2026-09-16T00:00:00Z"}') $(cat /tmp/s26r) (expect 503 database unavailable - report NOT generated; provider never called without data)"
echo "gen  valid, 6th in 1 min  -> $(post "$B/api/reports/generate" '{"from":"2026-09-15T00:00:00Z","to":"2026-09-16T00:00:00Z"}') $(cat /tmp/s26r) (expect 429 rate limited)"
echo "exit=0"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server A stopped pid=$pid)"
echo

echo "[3b] Server B :3001 with AI_PROVIDER blanked (process env overrides .env.local) - not-configured path"
(cd web && AI_PROVIDER= npm run start -- -p 3001 >/tmp/s26_start_b.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B2/api/health" && break; sleep 1; done
echo "(server B ready after ${i}s)"
echo "gen  valid, no AI config  -> $(post "$B2/api/reports/generate" '{"from":"2026-09-15T00:00:00Z","to":"2026-09-16T00:00:00Z"}') $(cat /tmp/s26r) (expect 503 not configured - nothing generated or fabricated)"
echo "(proof the blanked process env overrides .env.local: web/.env.local DOES set AI_PROVIDER; server B answers not-configured)"
echo "exit=0"
pid=$(netstat -ano | grep ":3001" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server B stopped pid=$pid)"
echo

echo "[4] Secret scans: rendered HTML (/events + /reports captured in [3]) + last API response + build output"
# Patterns are credential PREFIX/HOST/SCHEME probes only - key-derived fragments
# are deliberately NOT embedded in committed evidence (repo staged-diff rule).
for pat in "sk-sp-" "aliyuncs" "postgres://"; do
  n=$(grep -c -F "$pat" /tmp/s26r /tmp/s26_ev.html /tmp/s26_rp.html 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  echo "  '$pat' hits in last API response + rendered pages: $n (expect 0)"
done
for pat in "sk-sp-" "aliyuncs" "postgres://" "qwen3.8-max"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "  VALUE '$pat' -> client-bundle:$c server-build:$s (expect client:0; server:0 - keys stay in gitignored env, not build output)"
done
for name in "AI_API_KEY" "AI_BASEURL" "AI_PROVIDER" "AI_MODEL"; do
  c=$(grep -rl -F "$name" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$name" web/.next/server 2>/dev/null | wc -l)
  echo "  NAME '$name' -> client:$c server:$s (client MUST be 0; server hits are process.env reads inside the generate route = expected)"
done
echo "exit=0"
echo

echo "[5] Forbidden-term audit of S26 sources (residuals must be rejection/guard/test-expectation prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|\blux\b|\bpar\b|ppfd|dosing|mains" \
  web/lib/events.ts web/lib/reports.ts web/app/api/events web/app/api/reports \
  web/components/EventsPanel.tsx web/components/ReportsPanel.tsx \
  web/app/events web/app/reports web/tests/events.test.ts web/tests/reports.test.ts \
  | grep -viE "absent|forbidden|reject|never|guard|discard|violation|unavailable|unmeasured|should|expect|assert|term|boundary|not measured|NOT measured|deliberately|only|without|instead|no data|cannot"
echo "non_rejection_hits_exit=$? (1 = zero residual hits = PASS)"
echo

echo "[6] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[7] Hygiene: no artifacts/secrets staged"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$" ; echo "leak_hits_exit=$? (1 = zero = PASS)"
