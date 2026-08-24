#!/bin/bash
# Garantit le serveur UP - compatible CET hote (pas de setsid/ss/fuser; lsof natif; binaire absolu)
NODE="$(cat "$HOME/automaton-work/x402-api/.node-bin")"
cd "$HOME/automaton-work/x402-api" || exit 1
if ! curl -s -o /dev/null --max-time 5 http://localhost:4020/stats; then
  for pid in $(lsof -ti :4020 2>/dev/null); do kill -9 "$pid" 2>/dev/null; done
  pkill -9 -f "node.*server.js" 2>/dev/null; sleep 1
  nohup "$NODE" server.js >> server.log 2>&1 < /dev/null &
  for i in 1 2 3 4 5 6 7 8; do sleep 1; curl -s -o /dev/null --max-time 3 http://localhost:4020/stats && exit 0; done
fi
curl -s -o /dev/null --max-time 5 http://localhost:4020/stats
