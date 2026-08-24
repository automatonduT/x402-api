#!/bin/bash
cd "$HOME/automaton-work/x402-api"
PUB="https://completely-contrast-corporations-decorative.trycloudflare.com"
fail=0
while true; do
  pgrep -f "node server.js" >/dev/null || { nohup env PUBLIC_URL=$PUB node server.js >> server.log 2>&1 & echo "$(date -u +%FT%TZ) server restarted" >> watchdog.log; }
  pgrep -f "node runner.js" >/dev/null || { nohup node runner.js >> runner.log 2>&1 & echo "$(date -u +%FT%TZ) runner restarted" >> watchdog.log; }
  if curl -s --max-time 20 "$PUB/health" | grep -q ok; then
    fail=0
  else
    fail=$((fail+1)); echo "$(date -u +%FT%TZ) public probe fail #$fail (backoff before any restart)" >> watchdog.log
    if [ "$fail" -ge 3 ]; then
      pkill -f "cloudflared" 2>/dev/null; pkill -f "trycloudflare" 2>/dev/null; sleep 2
      nohup cloudflared tunnel --url http://localhost:4020 > tunnel.log 2>&1 &
      echo "$(date -u +%FT%TZ) tunnel restarted after 3 fails" >> watchdog.log; fail=0
    fi
  fi
  sleep 90
done
