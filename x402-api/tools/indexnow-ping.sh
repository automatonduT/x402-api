#!/bin/bash
# indexnow-ping.sh v1 - ping IndexNow avec backoff 6h + journal append-only
# usage: bash tools/indexnow-ping.sh [FORCE]
set -u
cd "$(dirname "$0")/.." || exit 1
BASE=$(head -1 .public-base 2>/dev/null)
[ -n "${BASE:-}" ] || { echo "PING_FAIL no_base"; exit 1; }
NOW=$(date +%s)
if [ -f .last-indexnow ] && [ "${1:-}" != "FORCE" ]; then
  LAST=$(cat .last-indexnow 2>/dev/null || echo 0)
  if [ $((NOW-LAST)) -lt 21600 ]; then echo "PING_SKIP backoff_$(( (NOW-LAST)/60 ))min"; exit 0; fi
fi
KEYFILE=$(find public -maxdepth 1 -name '*.txt' ! -name 'llms*' ! -name 'robots*' 2>/dev/null | head -1)
[ -n "${KEYFILE:-}" ] || { echo "PING_FAIL no_keyfile"; exit 1; }
KEY=$(basename "$KEYFILE" .txt)
RC=$(curl -s -o /tmp/in.resp -w '%{http_code}' --max-time 20 \
  "https://api.indexnow.org/IndexNow?url=${BASE}/desk.html&url=${BASE}/audit.html&url=${BASE}/pricing.html&url=${BASE}/receipts/&url=${BASE}/agent-manifest.json&key=${KEY}" || echo ERR)
echo "$NOW" > .last-indexnow
echo "$(date -u +%FT%TZ) indexnow rc=$RC urls=5" >> SUBMISSIONS.log
echo "PING_DONE rc=$RC"
