#!/bin/bash
# adopt.sh - find a LIVE existing trycloudflare tunnel and adopt it (NO new tunnel creation).
# Lesson sealed: fresh quick-tunnels stopped mounting (likely CF throttle); established ones stay alive.
set -u
DIR="$HOME/automaton-work/x402-api"; cd "$DIR"
LOG="$DIR/pipeline.log"; ts(){ date -u +%FT%TZ; }
say(){ echo "$(ts) adopt: $*" >> "$LOG"; echo "adopt: $*"; }
probe(){ curl -s -o /dev/null --max-time 8 -w '%{http_code}' "$1/health" 2>/dev/null || echo 000; }
CANDS=$(cat .public-base 2>/dev/null
  grep -rho 'https://[a-z0-9-]*\.trycloudflare\.com' "$DIR"/*.log /tmp/.oldbase "$DIR"/watchdog* 2>/dev/null | sort -u)
LIVE=""; 
for u in $CANDS; do
  c=$(probe "$u"); say "probe $u -> $c"
  if [ "$c" = "200" ]; then LIVE="$u"; break; fi
done
if [ -n "$LIVE" ]; then
  OLD=$(cat .public-base)
  if [ "$LIVE" != "$OLD" ]; then
    say "ADOPTED $LIVE (was $OLD) - migrating refs"
    grep -rl 'trycloudflare\.com' public offer.json skill.md posts.json 2>/dev/null | while read -r f; do
      sed -i "s|https://[a-z0-9-]*\.trycloudflare\.com|$LIVE|g" "$f"
    done
    [ -f gen-llms-full.js ] && node gen-llms-full.js >/dev/null 2>&1
    echo "$LIVE" > .public-base
    say "refs migrated + llms-full regenerated"
  else
    say "current base already live: $LIVE"
  fi
  echo "$(ts) ADOPT VERDICT: OK $LIVE" >> "$LOG"; exit 0
fi
echo "$(ts) ADOPT VERDICT: NONE-LIVE" >> "$LOG"; exit 1
