#!/bin/bash
# octodamus.sh [v1] - source externe de signaux marche (500 req/j gratuits)
# Usage: octodamus.sh discover|getkey|pull
ACT="${1:-discover}"
KEYFILE="$HOME/automaton-work/x402-api/.octodamus-key"
BASE="https://api.octodamus.com"
case "$ACT" in
discover)
  echo "== racine =="; curl -s -m 15 "$BASE/" | head -c 500; echo ""
  for P in /docs /openapi.json /swagger.json /v1/signals /signals /api/v1/signals /health /status /keys /register /signup; do
    C=$(curl -s -o /tmp/o.r -w '%{http_code}' -m 10 "$BASE$P")
    echo "$P -> $C $(head -c 90 /tmp/o.r | tr '\n' ' ')"
  done ;;
getkey)
  # chemin documente par leur racine: POST /v1/signup?email=YOUR_EMAIL (500 req/j, no card)
  R=$(curl -s -m 15 -X POST "$BASE/v1/signup?email=automaton-alpha%40agents.example.com")
  echo "$R" | head -c 300; echo ""
  K=$(echo "$R" | python3 -c "import json,sys
try:
 d=json.load(sys.stdin);print(d.get('api_key') or d.get('apiKey') or d.get('key') or d.get('token') or '')
except:print('')" 2>/dev/null)
  if [ -n "$K" ]; then echo "$K" > "$KEYFILE"; chmod 600 "$KEYFILE"; echo "CLE OBTENUE et stockee"; else echo "PAS DE cle -> fallback demo actif"; fi ;;
pull)
  mkdir -p "$HOME/automaton-work/x402-api/data"
  D="$HOME/automaton-work/x402-api/data/octodamus-signals.json"
  if [ -f "$KEYFILE" ]; then
    curl -s -m 20 -H "X-OctoData-Key: $(cat $KEYFILE)" "$BASE/v2/signal" -o "$D" && echo "[mode cle] $(head -c 150 $D)"
  else
    echo "[pas de cle -> /v2/demo sans auth]"
    curl -s -m 20 "$BASE/v2/demo" -o "$D" && head -c 300 "$D"
  fi
  echo ""
  curl -s -m 12 "$BASE/.well-known/x402.json" | head -c 250 ;;
esac
