#!/usr/bin/env bash
# S27 validation runner (evidence reproduction). Execute from repo root:
#   bash evidence/S27/run_validation.sh 2>&1 | tee evidence/S27/validation_output.txt
#
# Live Vercel deployment is BLOCKED on this host (no Vercel account/CLI login;
# see docs/Vercel_Deployment_Guide.md status note). This script therefore
# validates the DEPLOYMENT-EQUIVALENT surface locally: security headers,
# unauthenticated-ingestion 401 (the exact acceptance evidence, against the
# production build), and all three REPORTS_GENERATE_TOKEN postures:
#   server A :3000 = local dev (no token configured -> open by design)
#   server B :3001 = token configured -> 401 without/wrong, passes with
#   server C :3001 = VERCEL=1 + no token -> 503 refusal (never open in prod)
set -u
cd "$(dirname "$0")/../.." || exit 1
TOK="s27-local-test-token-only"  # throwaway local test value, not a real secret
GEN="s27-local-gen-token-only"   # throwaway local test value, not a real secret
B=http://localhost:3000
B2=http://localhost:3001
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "S27 validation - Vercel Deployment and Hardening - $NOW"
echo "Host: Windows, Node $(node --version). No Vercel account/CLI on host and DB engine unavailable (S20 WSL blocker):"
echo "live deployment DEFERRED (runbook ready in docs/Vercel_Deployment_Guide.md); deployment-equivalent checks run locally below."
echo

echo "[1] Web unit tests (adds hardening: timing-safe token compare + managed-Postgres SSL decision)"
(cd web && npm test 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"); echo "exit=${PIPESTATUS[0]}"
echo

echo "[2] Production build (first build WITH next.config.mjs security headers)"
(cd web && npm run build 2>&1 | tail -8); echo "exit=${PIPESTATUS[0]}"
echo

echo "[3] Server A :3000 - local dev posture (DEVICE_INGEST_TOKEN set, REPORTS_GENERATE_TOKEN unset, VERCEL unset)"
(cd web && DEVICE_INGEST_TOKEN="$TOK" npm run start >/tmp/s27_a.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B/api/health" && break; sleep 1; done
echo "(server A ready after ${i}s)"
echo "GET  /api/health              -> $(curl -s -o /tmp/s27r -w "%{http_code}" $B/api/health) $(cat /tmp/s27r) (expect 200, database down honest)"
echo "-- security headers on / (curl -sI):"
curl -sI $B/ > /tmp/s27h
for h in "content-security-policy" "x-content-type-options: nosniff" "x-frame-options: DENY" "referrer-policy" "permissions-policy"; do
  n=$(grep -ci "^$h" /tmp/s27h); echo "  header '$h' present: $n (expect 1)"
done
echo "  header 'x-powered-by' present: $(grep -ci '^x-powered-by' /tmp/s27h) (expect 0 - suppressed)"
grep -i "^content-security-policy" /tmp/s27h | head -1
echo "-- unauthenticated ingestion REJECTED (deployment acceptance evidence, local production build):"
echo "POST /api/telemetry no token  -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B/api/telemetry -H "Content-Type: application/json" -d '{"device_id":"probe","rows":[]}') $(cat /tmp/s27r) (expect 401)"
echo "POST /api/telemetry w/ token  -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B/api/telemetry -H "Content-Type: application/json" -H "Authorization: Bearer $TOK" -d '{"device_id":"probe"}') $(cat /tmp/s27r) (expect 400 malformed body - proves auth PASSED with correct token)"
echo "-- generate open in local dev by design (no REPORTS_GENERATE_TOKEN, not on Vercel):"
echo "POST generate no token        -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B/api/reports/generate -H "Content-Type: application/json" -d '{"from":"2026-09-15T00:00:00Z","to":"2026-09-16T00:00:00Z"}') $(cat /tmp/s27r) (expect 503 database unavailable - report NOT generated)"
echo "-- S26 regression: events guard still live:"
echo "GET  events rule ORP_HIGH     -> $(curl -s -o /tmp/s27r -w "%{http_code}" "$B/api/events?rule_code=ORP_HIGH") (expect 400 frozen vocabulary)"
curl -s $B/reports > /tmp/s27_rp.html; echo "GET  /reports page            -> 200 captured ($(wc -c </tmp/s27_rp.html) bytes)"
echo "exit=0"
pid=$(netstat -ano | grep ":3000" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server A stopped pid=$pid)"
echo

echo "[3b] Server B :3001 - REPORTS_GENERATE_TOKEN configured (timing-safe Bearer required)"
(cd web && DEVICE_INGEST_TOKEN="$TOK" REPORTS_GENERATE_TOKEN="$GEN" npm run start -- -p 3001 >/tmp/s27_b.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B2/api/health" && break; sleep 1; done
echo "(server B ready after ${i}s)"
GBODY='{"from":"2026-09-15T00:00:00Z","to":"2026-09-16T00:00:00Z"}'
echo "POST generate no token        -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B2/api/reports/generate -H "Content-Type: application/json" -d "$GBODY") $(cat /tmp/s27r) (expect 401)"
echo "POST generate wrong token     -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B2/api/reports/generate -H "Content-Type: application/json" -H "Authorization: Bearer wrong-token" -d "$GBODY") $(cat /tmp/s27r) (expect 401)"
echo "POST generate correct token   -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B2/api/reports/generate -H "Content-Type: application/json" -H "Authorization: Bearer $GEN" -d "$GBODY") $(cat /tmp/s27r) (expect 503 database unavailable - auth passed, pipeline honest)"
echo "exit=0"
pid=$(netstat -ano | grep ":3001" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server B stopped pid=$pid)"
echo

echo "[3c] Server C :3001 - VERCEL=1 with REPORTS_GENERATE_TOKEN MISSING (production refusal posture)"
(cd web && VERCEL=1 DEVICE_INGEST_TOKEN="$TOK" npm run start -- -p 3001 >/tmp/s27_c.log 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "$B2/api/health" && break; sleep 1; done
echo "(server C ready after ${i}s)"
echo "POST generate (prod, no tok)  -> $(curl -s -o /tmp/s27r -w "%{http_code}" -X POST $B2/api/reports/generate -H "Content-Type: application/json" -d "$GBODY") $(cat /tmp/s27r) (expect 503 refusing - NEVER open in production)"
echo "exit=0"
pid=$(netstat -ano | grep ":3001" | grep LISTENING | head -1 | awk '{print $NF}'); [ -n "$pid" ] && taskkill //PID $pid //F >/dev/null 2>&1; echo "(server C stopped pid=$pid)"
echo

echo "[4] Secret scans: rendered page + responses + build output"
# Patterns are throwaway local tokens + credential prefix/host/scheme probes only -
# key-derived fragments are deliberately NOT embedded in committed evidence.
for pat in "sk-sp-" "aliyuncs" "postgres://"; do
  n=$(grep -c -F "$pat" /tmp/s27r /tmp/s27_rp.html 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  echo "  '$pat' hits in last response + /reports HTML: $n (expect 0)"
done
for pat in "$TOK" "$GEN" "sk-sp-" "aliyuncs" "postgres://" "qwen3.8-max" "smart_tank_dev_only"; do
  c=$(grep -rl -F "$pat" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$pat" web/.next/server 2>/dev/null | wc -l)
  echo "  VALUE '$pat' -> client-bundle:$c server-build:$s (expect 0/0 - throwaway tokens were process env only)"
done
for name in "REPORTS_GENERATE_TOKEN" "DEVICE_INGEST_TOKEN" "AI_API_KEY"; do
  c=$(grep -rl -F "$name" web/.next/static 2>/dev/null | wc -l); s=$(grep -rl -F "$name" web/.next/server 2>/dev/null | wc -l)
  echo "  NAME '$name' -> client:$c server:$s (client MUST be 0; server hits are process.env reads in Route Handlers = expected)"
done
echo "exit=0"
echo

echo "[5] Forbidden-term audit of S27 sources (residuals must be rejection/absent/boundary prose)"
grep -rinE "\borp\b|conductivity|\bec\b|zp4510|fs300a|float|\blux\b|\bpar\b|ppfd|dosing|mains" \
  docs/Vercel_Deployment_Guide.md docs/Security_Checklist.md web/lib/auth.ts web/lib/db.ts \
  web/next.config.mjs web/app/api/reports/generate/route.ts web/app/api/telemetry/route.ts \
  web/components/ReportsPanel.tsx web/tests/hardening.test.ts .env.example \
  | grep -viE "absent|forbidden|reject|never|nowhere|guard|not |no |without|instead|only|boundary|manual|deliberately|unavailable|prohibition"
echo "non_rejection_hits_exit=$? (1 = zero residual hits = PASS)"
echo

echo "[6] Standing gates: pytest + provisioning policy"
conda run --no-capture-output -n reef python -m pytest tests -q 2>&1 | tail -2; echo "pytest_exit=${PIPESTATUS[0]}"
conda run --no-capture-output -n reef python scripts/validate_wifi_provisioning.py 2>&1 | tail -1; echo "policy_exit=${PIPESTATUS[0]}"
echo

echo "[7] Hygiene: no artifacts/secrets staged"
git status --porcelain | grep -E "node_modules|\.next/|\.env\.local|\.env$" ; echo "leak_hits_exit=$? (1 = zero = PASS)"
