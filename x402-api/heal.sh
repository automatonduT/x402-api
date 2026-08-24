#!/bin/bash
# heal.sh v2 - self-heal: local server + public door.
# Truth sources: local curl for server; cloudflared OWN log line for tunnel URL.
set -u
DIR="$HOME/automaton-work/x402-api"; cd "$DIR"
LOG="$DIR/pipeline.log"; ts(){ date -u +%FT%TZ; }
say(){ echo "$(ts) heal: $*" >> "$LOG"; echo "heal: $*"; }
probe(){ curl -s -o /dev/null --max-time 10 -w '%{http_code}' "$1/health" 2>/dev/null || echo 000; }

# --- 1) serveur local ---
H=$(probe http://localhost:4020)
if [ "$H" != "200" ]; then
  say "local down ($H) - clean restart"
  pkill -f "node server.js" 2>/dev/null; sleep 2
  for i in 1 2 3 4 5; do fuser 4020/tcp >/dev/null 2>&1 || break; sleep 1; done
  nohup node server.js >> server.log 2>&1 &
  for i in $(seq 1 12); do sleep 1; H=$(probe http://localhost:4020); [ "$H" = "200" ] && break; done
fi
say "local: $H"

# --- 2) porte : verifier base actuelle (poll long, les quick tunnels montent lentement) ---
B=$(cat .public-base); ok=000
for i in $(seq 1 4); do ok=$(probe "$B"); [ "$ok" = "200" ] && break; sleep 8; done

# --- 3) si morte : la verite = derniere URL dans les logs cloudflared ---
if [ "$ok" != "200" ] && [ "$H" = "200" ]; then
  LOGURL=$(grep -ho 'https://[a-z0-9-]*\.trycloudflare\.com' "$DIR"/cloudflared*.log "$DIR"/tunnel*.log /tmp/cf*.log 2>/dev/null | tail -1)
  say "base $B dead; cloudflared log says: ${LOGURL:-none}"
  if [ -n "${LOGURL:-}" ] && [ "$LOGURL" != "$B" ]; then
    echo "$LOGURL" > .public-base; B="$LOGURL"
    ok=$(probe "$B")
    if [ "$ok" = "200" ]; then
      # migration complete des refs comme door.sh
      OLD=$(grep -rl "$(cat /tmp/.oldbase 2>/dev/null || echo 'trycloudflare')" public/*.json public/*.md offer.json skill.md 2>/dev/null | head -20)
      say "log-truth URL live ($ok) - running door.sh migration for refs"
      bash door.sh >/dev/null 2>&1; B=$(cat .public-base); ok=$(probe "$B")
    fi
  fi
fi

# --- 3b) ANTI-CHURN: essayer d'ADOPTER un tunnel existant avant d'en creer un neuf ---
if [ "$ok" != "200" ] && [ "$H" = "200" ]; then
  if bash adopt.sh >> "$LOG" 2>&1; then B=$(cat .public-base); ok=$(probe "$B"); fi
fi

# --- 4) dernier recours : UNE migration door.sh fraiche ---
if [ "$ok" != "200" ] && [ "$H" = "200" ]; then
  cp .public-base /tmp/.oldbase
  say "all candidates dead - fresh door.sh"
  bash door.sh >/dev/null 2>&1; B=$(cat .public-base)
  for i in $(seq 1 4); do ok=$(probe "$B"); [ "$ok" = "200" ] && break; sleep 8; done
fi

if [ "$ok" = "200" ]; then V="OK"; else V="DEGRADED"; fi
say "VERDICT: $V local=$H door=$ok $B"
echo "$(ts) HEAL VERDICT: $V local=$H door=$ok $B" >> "$LOG"
