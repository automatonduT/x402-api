#!/bin/bash
# doorguard.sh v2 - FIXED DOMAIN ERA (v1.41)
# Public door is now PERMANENT: skintight-snowcap-underarm.ngrok-free.dev (creator-managed).
# Only failure mode left: MY local node process dying. Guard = probe fixed domain,
# on non-200 run heal.sh (restarts local server; door fallbacks are now near-noops).
set -u
DIR="$HOME/automaton-work/x402-api"; cd "$DIR"
LOG="$DIR/pipeline.log"; ts(){ date -u +%FT%TZ; }
BASE=$(cat .public-base)   # source of truth, now the fixed ngrok domain
code=$(curl -s -o /dev/null --max-time 12 -w '%{http_code}' "$BASE/health" || echo 000)
if [ "$code" != "200" ]; then
  echo "$(ts) doorguard: $BASE -> $code, healing" >> "$LOG"
  bash heal.sh >> "$LOG" 2>&1
  code=$(curl -s -o /dev/null --max-time 12 -w '%{http_code}' "$BASE/health" || echo 000)
fi
echo "$(ts) doorguard: OK $BASE -> $code" >> "$LOG"
