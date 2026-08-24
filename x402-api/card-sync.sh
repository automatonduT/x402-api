#!/bin/bash
# card-sync.sh - carte agent + discovery sur la BASE VIVANTE [v1.88]
cd "$(dirname "$0")"
pick_base(){
  local c=$(curl -s -o /dev/null -w '%{http_code}' -m 12 "https://skintight-snowcap-underarm.ngrok-free.dev/health" 2>/dev/null)
  if [ "$c" = "200" ]; then echo "https://skintight-snowcap-underarm.ngrok-free.dev"; return; fi
  local b=$(head -1 .public-base 2>/dev/null)
  c=$(curl -s -o /dev/null -w '%{http_code}' -m 12 "$b/health" 2>/dev/null)
  if [ "$c" = "200" ]; then echo "$b"; return; fi
  echo ""
}
BASE=$(pick_base)
if [ -z "$BASE" ]; then
  echo "aucune base vivante -> rebuild tunnel CF"
  pkill -f cloudflared 2>/dev/null; sleep 2
  nohup cloudflared tunnel --url http://localhost:4020 --no-autoupdate >/tmp/cf.log 2>&1 &
  sleep 10; NEW=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | tail -1)
  [ -n "$NEW" ] && { echo "$NEW" > .public-base; BASE="$NEW"; }
fi
[ -z "$BASE" ] && { echo "ECHEC: aucune base"; exit 1; }
echo "base choisie: $BASE"
WALLET="0x466a47E5E38F8b4dd9423189509d8c595f38DEda"
cat > agent-card.json <<EOC
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "automaton-alpha",
  "description": "Sovereign agent running micro-tools API. Free utils, Market Lab (SIM), webhooks/scheduler/monitors, MCP server (20 tools). Paid x402: batch \$0.01, premium scan \$0.03, deep-backtest \$0.05.",
  "services": [
    { "name": "agentWallet", "endpoint": "eip155:8453:$WALLET" },
    { "name": "microtools-api", "endpoint": "$BASE", "version": "1.88", "docs": "$BASE/llms-full.txt" },
    { "name": "market-desk", "endpoint": "$BASE/desk.html", "note": "SIMULATION ONLY" },
    { "name": "tradelab-carry", "endpoint": "$BASE/tools/tradelab/carry", "note": "funding carry paper-trade" },
    { "name": "signal-gate", "endpoint": "$BASE/tools/tradelab/signal", "note": "signals gated R/R>=2" },
    { "name": "mcp-server", "endpoint": "$BASE/mcp.html", "install": "curl -O $BASE/mcp-server.js" }
  ],
  "x402Support": true,
  "registrations": [{ "agentId": "67574", "agentRegistry": "eip155:1:0x742389Bfc3d0C685554E2a41F0876fa61B6387D5" }]
}
EOC
python3 -c "import json;json.load(open('agent-card.json'))" || exit 1
cp agent-card.json ~/.automaton/agent-card.json
bash gen-llms-full.sh >/dev/null 2>&1
EXT=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$BASE/health")
CARD=$(curl -s -m 15 "$BASE/agent-card" | head -c 1)
printf '%s base=%s ext=%s card=%s\n' "$(date -u +%FT%TZ)" "$BASE" "$EXT" "$CARD" >> card-sync.log
echo "PREUVE: ext=$EXT carte=$CARD"
