#!/bin/bash
# wave.sh v2 - cycle complet: serveur -> tunnel -> discovery -> inbound -> verdict [v1.80]
cd "$(dirname "$0")"
VERDICT="NO"; REASONS=""
echo "== 1. SERVEUR LOCAL =="
if ! curl -s -o /dev/null -m 5 localhost:4020/health; then
  nohup node server.js >> server.log 2>&1 & sleep 3
  echo "serveur redemarre: $(curl -s -o /dev/null -w '%{http_code}' -m 5 localhost:4020/health)"
else echo "serveur OK"; fi

echo "== 2. TUNNEL CF =="
BASE=$(head -1 .public-base 2>/dev/null)
EXT=$(curl -s -o /dev/null -w '%{http_code}' -m 12 "$BASE/health" 2>/dev/null)
if [ "$EXT" != "200" ]; then
  echo "tunnel mort ($EXT) -> rebuild..."
  pkill -f "cloudflared" 2>/dev/null; sleep 2
  nohup cloudflared tunnel --url http://localhost:4020 --no-autoupdate >/tmp/cf.log 2>&1 &
  sleep 10
  NEW=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | tail -1)
  if [ -n "$NEW" ]; then
    echo "$NEW" > .public-base
    BASE="$NEW"; REASONS="$REASONS tunnel-rebuilt;"
    # attendre que le tunnel soit pret
    for i in 1 2 3 4 5 6; do sleep 5; EXT=$(curl -s -o /dev/null -w '%{http_code}' -m 12 "$BASE/health" 2>/dev/null); [ "$EXT" = "200" ] && break; done
    echo "nouvelle base: $BASE ($EXT)"
  fi
fi
[ "$EXT" = "200" ] && echo "tunnel OK: $BASE"

echo "== 3. DISCOVERY =="
bash gen-llms-full.sh >/dev/null 2>&1 && echo "llms-full.txt regenere ($(wc -l < public/llms-full.txt 2>/dev/null || echo '?') lignes)"
bash "$(cd "$(dirname "$0")" && pwd)/tools/append-batch.sh" >/dev/null 2>&1

echo "== 4. INBOUND =="
curl -s -m 8 localhost:4020/stats > /tmp/stats_now.json 2>/dev/null
if [ -s /tmp/stats_now.json ] && python3 -c "import json;json.load(open('/tmp/stats_now.json'))" 2>/dev/null; then
  python3 - <<PY
import json
try:
  now=json.load(open('/tmp/stats_now.json')); last=json.load(open('/tmp/stats_last.json'))
  f=now.get('freeCalls',0)-last.get('freeCalls',0); p=now.get('paidCalls',0)-last.get('paidCalls',0)
  print(f'delta free={f} paid={p}')
  print('INBOUND!' if (f>0 or p>0) else 'aucun inbound')
except Exception as e: print('compare:',e)
PY
  cp /tmp/stats_now.json /tmp/stats_last.json
else echo "stats indisponible"; fi

echo "== 5. INDEXNOW POLI =="
LAST=$(cat .last-indexnow 2>/dev/null || echo 0); NOW=$(date +%s); DIFF=$((NOW-LAST))
if [ $DIFF -gt 21600 ] && [ "$EXT" = "200" ]; then
  KEY=$(cat .indexnow-key 2>/dev/null)
  HOST=$(echo "$BASE" | sed 's|https://||')
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    -d "{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"$BASE/$KEY.txt\",\"urlList\":[\"$BASE/\",\"$BASE/tools/market/desk\",\"$BASE/desk.html\",\"$BASE/tools/market/alerts\"]}" \
    https://api.indexnow.org/indexnow -m 15)
  echo "ping=$CODE"; date +%s > .last-indexnow
  [ "$CODE" = "200" ] || [ "$CODE" = "202" ] && REASONS="$REASONS indexnow-ping;"
elif [ $DIFF -le 21600 ]; then echo "backoff $((DIFF/60))min - skip"
else echo "tunnel down - skip"; fi

echo "== VERDICT =="
echo "base=$BASE ext=$EXT verdict=$VERDICT reasons=$REASONS"
printf '%s wave.sh: ext=%s %s\n' "$(date -u +%FT%TZ)" "$EXT" "$REASONS" >> wave.log
