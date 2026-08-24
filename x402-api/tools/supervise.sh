#!/bin/bash
# Superviseur auto-guerrisseur du serveur x402-api (lecon: serveur mort entre les tours)
NODE=$(ls $HOME/.nvm/versions/node/*/bin/node | head -1)
cd "$HOME/automaton-work/x402-api" || exit 1
while true; do
  if ! curl -s -o /dev/null --max-time 5 http://localhost:4020/stats; then
    echo "$(date -u +%FT%TZ) DEAD -> restart" >> supervisor.log
    pkill -f "node.*server.js" 2>/dev/null; sleep 1
    setsid nohup "$NODE" server.js >> server.log 2>&1 < /dev/null &
  fi
  sleep 60
done
