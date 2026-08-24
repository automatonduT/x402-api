#!/bin/bash
# paycheck.sh - teste le tunnel de conversion vu depuis l EXTERIEUR (comme un client)
cd "$(dirname "$0")/.." || exit 1
BASE=$(head -1 .public-base 2>/dev/null)
PASS=0;FAIL=0
chk(){ n="$1"; w="$2"; g="$3"; if [ "$g" = "$w" ]; then echo "PASS $n ($g)"; PASS=$((PASS+1)); else echo "FAIL $n (attendu $w obtenu $g)"; FAIL=$((FAIL+1)); fi }
chk local-health 200 "$(curl -s -o /dev/null -w '%{http_code}' localhost:4020/health)"
[ -n "$BASE" ] && chk ext-llms 200 "$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$BASE/llms.txt")"
# Endpoints PAYES: un client sans paiement doit recevoir 402 + accepts exploitable
for EP in "/tools/market/premium/scan?symbols=BTCUSDT" "/tools/market/premium/deep-backtest?symbols=BTCUSDT&strat=S1&days=30"; do
  code=$(curl -s -o /tmp/pb.json -w '%{http_code}' -m 20 "localhost:4020$EP")
  chk "paid402 GET $EP" 402 "$code"
  if python3 -c "
import json;d=json.load(open('/tmp/pb.json'))
a=(d.get('accepts') or [{}])[0]
assert a.get('payTo') and a.get('maxAmountRequired'), d" 2>/tmp/shape.err; then
    echo "PASS accepts-shape $EP"; PASS=$((PASS+1))
  else
    echo "FAIL accepts-shape $EP ($(head -c 120 /tmp/shape.err))"; FAIL=$((FAIL+1))
  fi
done
code=$(curl -s -o /tmp/bp.json -w '%{http_code}' -m 20 -X POST -H 'content-type: application/json' -d '{"paths":["/tools/time"]}' localhost:4020/tools/batch)
chk "paid402 POST /tools/batch" 402 "$code"
python3 -c "
import json;d=json.load(open('/tmp/bp.json'));a=(d.get('accepts') or [{}])[0]
assert a.get('payTo') and a.get('maxAmountRequired')" 2>/dev/null \
  && { echo "PASS accepts-shape batch"; PASS=$((PASS+1)); } || { echo "FAIL accepts-shape batch"; FAIL=$((FAIL+1)); }
# Surfaces de decouverte
for P in AGENTS.md ai.txt .well-known/agent-card.json feed.xml digest.html sitemap.xml robots.txt openapi.json llms-full.txt desk.html pricing.html; do
  chk "surf/$P" 200 "$(curl -s -o /dev/null -w '%{http_code}' localhost:4020/$P)"
done
echo "== TOTAL PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
