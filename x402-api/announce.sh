#!/bin/bash
# announce.sh v2 - state-gated multi-channel announcer (free channels only)
# State written ONLY when every channel succeeded -> auto-retry otherwise.
cd "$(dirname "$0")"
LOG=pipeline.log
BASE=$(cat .public-base 2>/dev/null); BASE="${BASE%/}"; [ -z "$BASE" ] && exit 0
LASTPOST=$(node -e 'try{const p=JSON.parse(require("fs").readFileSync("posts.json","utf8"));console.log(p[p.length-1].p)}catch(e){console.log("none")}')
NURLS=$(curl -s --max-time 5 http://localhost:${PORT:-4020}/sitemap.xml | grep -o "<loc>" | wc -l | tr -d ' ')
[ -z "$NURLS" ] && NURLS=$(grep -o "<loc>" public/sitemap.xml 2>/dev/null | wc -l | tr -d ' ')
SIG="$BASE|posts=$NURLS|last=$LASTPOST"
LAST=$(cat .announce-state 2>/dev/null)
FORCE="${ANNOUNCE_FORCE:-0}"
if [ "$SIG" = "$LAST" ] && [ "$FORCE" != "1" ]; then echo "$(date -u +%FT%TZ) announce: skip (unchanged)" >> "$LOG"; exit 0; fi

# --- Channel 1: Ping-o-matic (XML-RPC) ---
POM_OK=0
XML='<?xml version="1.0"?><methodCall><methodName>weblogUpdates.extendedPing</methodName><params><param><value>micro-tools by automaton-alpha</value></param><param><value>'"$BASE/"'</value></param><param><value>'"$BASE/blog.xml"'</value></param></params></methodCall>'
POM=$(curl -s --max-time 20 -H 'Content-Type: text/xml' -d "$XML" http://rpc.pingomatic.com/)
echo "$(date -u +%FT%TZ) announce/pingomatic: resp=$(echo "$POM" | tr -d '\n' | head -c 160)" >> "$LOG"
echo "$POM" | grep -q "<flerror>0</flerror>" && POM_OK=1
[ "$POM_OK" != "1" ] && sleep 20   # polite retry once on soft-block
if [ "$POM_OK" != "1" ]; then
  POM=$(curl -s --max-time 20 -H 'Content-Type: text/xml' -d "$XML" http://rpc.pingomatic.com/)
  echo "$POM" | grep -q "<flerror>0</flerror>" && POM_OK=1
  echo "$(date -u +%FT%TZ) announce/pingomatic-retry: $(echo "$POM" | tr -d '\n' | head -c 120)" >> "$LOG"
fi

# --- Channel 2: Wayback snapshots ---
WB_OK=0
for u in "$BASE/" "$BASE$LASTPOST"; do
  CODE=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 45 "https://web.archive.org/save/$u")
  echo "$(date -u +%FT%TZ) announce/wayback $u -> $CODE" >> "$LOG"
  case "$CODE" in 2*|3*) WB_OK=$((WB_OK+1));; esac
  sleep 2
done

echo "$(date -u +%FT%TZ) announce summary: pom_ok=$POM_OK wayback_ok=$WB_OK sig=$SIG" >> "$LOG"
if [ "$POM_OK" = "1" ] && [ "$WB_OK" = "2" ]; then echo "$SIG" > .announce-state; fi
