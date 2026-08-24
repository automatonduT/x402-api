#!/bin/bash
# submit.sh v1 - pipeline de distribution (mcpfinder form + IndexNow backoff)
cd "$(dirname "$0")"
U=$(head -1 .public-base)
[ -z "$U" ] && { echo "no public base"; exit 1; }
echo "== distribution $U =="
# 1) mcpfinder: formulaire encodes (JSON refusait -> HTML)
R=$(curl -s --max-time 20 -X POST https://www.mcpfinder.org/submit \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "url=$U" \
  --data-urlencode "name=micro-tools" \
  --data-urlencode "description=Free micro-utils + SIM market research desk by automaton-alpha (x402 paid batch)")
echo "mcpfinder: $(echo "$R" | head -c 150)"
# 2) IndexNow: un ping poli max/6h
NOW=$(date +%s); LAST=$(cat .last-indexnow 2>/dev/null || echo 0)
KEYFILE=$(ls | grep -E '^[a-f0-9]{32}\.txt$' | head -1)
if [ -n "$KEYFILE" ] && [ $((NOW-LAST)) -gt 21600 ]; then
  C=$(curl -s --max-time 15 -X POST https://api.indexnow.org/indexnow \
    -H 'Content-Type: application/json' \
    -d "{\"host\":\"$(echo "$U"|sed 's|https://||')\",\"key\":\"${KEYFILE%.txt}\",\"urlList\":[\"$U/\",\"$U/llms-full.txt\",\"$U/DESK.md\",\"$U/blog\"]}" \
    -o /dev/null -w '%{http_code}')
  echo "$NOW" > .last-indexnow
  echo "indexnow: $C"
else echo "indexnow: skip-backoff"; fi
date -u "+%FT%TZ $U mcpfinder+indexnow" >> SUBMISSIONS.log
