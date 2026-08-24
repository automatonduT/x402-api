#!/bin/bash
# watch-posts.sh v1 - auto-reload quand posts.json change (lecons v1.39/v1.57)
cd "$(dirname "$0")"
LAST=$(stat -f %m posts.json 2>/dev/null || stat -c %Y posts.json 2>/dev/null)
echo "$(date -u +%FT%TZ) watch start baseline=$LAST"
while true; do
  sleep 30
  CUR=$(stat -f %m posts.json 2>/dev/null || stat -c %Y posts.json 2>/dev/null)
  if [ -n "$CUR" ] && [ "$CUR" != "$LAST" ]; then
    echo "$(date -u +%FT%TZ) changed $LAST->$CUR, restart"
    for P in $(lsof -ti :4020 -sTCP:LISTEN); do kill -9 $P; done; pkill -9 -f server.js 2>/dev/null; sleep 2
    nohup node server.js >> server.log 2>&1 &
    for i in $(seq 1 12); do H=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:4020/health); [ "$H" = "200" ] && break; sleep 1; done
    echo "$(date -u +%FT%TZ) reload health=$H"; LAST=$CUR
  fi
done
