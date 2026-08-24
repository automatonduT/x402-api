#!/bin/bash
# supervise-api.sh v2 - kill TOTAL par chemin reel -> demarrage -> port REEL depuis server.log -> wave.sh -> criteres externes sur TOUS les produits payes
cd "$(dirname "$0")/.."
NODE=$(ls $HOME/.nvm/versions/node/*/bin/node | head -1)
# 1) tuer TOUTES les instances de mon serveur (squatters inclus) par chemin reel
pkill -f "node.*server\.js" >/dev/null 2>&1; sleep 1
: > server.log
nohup "$NODE" "$PWD/server.js" >> server.log 2>&1 &
# 2) attendre le port REEL annonce dans server.log
PORT=""
for i in $(seq 1 15); do
  PORT=$(grep -oE "listening on [0-9]+" server.log | tail -1 | grep -oE "[0-9]+")
  [ -n "$PORT" ] && break; sleep 1
done
echo "port=$PORT"
LOCAL=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/llms.txt")
echo "local_llms=$LOCAL"
# 3) tunnel + discovery regeneres
bash wave.sh >/dev/null 2>&1
BASE=$(head -1 .public-base)
# 4) criteres d'acceptation EXTERNES sur chaque produit paye
VERDICT="PROOF_OK"
for spec in "/tools/x402/deep-audit?url=https://example.com|50000" "/tools/market/premium/digest|20000" "/tools/x402/batch-inspect/full?url=https://example.com|10000; do
  ROUTE="${spec%%|*}"; AMT="${spec##*|}"
  CODE=$(curl -s -o /tmp/sup-check.json -w '%{http_code}' --max-time 20 "$BASE$ROUTE")
  GOT=$(grep -o "\"maxAmountRequired\":\"$AMT\"" /tmp/sup-check.json | head -1)
  if [ "$CODE" != "402" ] || [ -z "$GOT" ]; then VERDICT="PROOF_FAIL($ROUTE=$CODE)"; fi
  echo "ext $ROUTE -> $CODE amt=${GOT:+ok}"
done
echo "$(date -u +%FT%TZ) port=$PORT local=$LOCAL verdict=$VERDICT" >> supervise.log
echo "verdict=$VERDICT"
