#!/bin/bash
curl -s -o /dev/null --max-time 5 http://localhost:4020/stats || {
  NODE=$(ls $HOME/.nvm/versions/node/*/bin/node | head -1)
  cd "$HOME/automaton-work/x402-api" || exit 0
  fuser -k 4020/tcp 2>/dev/null
  setsid nohup "$NODE" server.js >> server.log 2>&1 < /dev/null &
}
