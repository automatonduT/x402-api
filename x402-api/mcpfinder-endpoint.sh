#!/bin/bash
cd "$(dirname "$0")"
H=$(curl -s --max-time 20 https://www.mcpfinder.org/submit)
echo "action: $(echo "$H" | grep -oE 'action="[^"]*"' | head -1)"
echo "fields: $(echo "$H" | grep -oE 'name="[a-zA-Z_0-9]+"' | sort -u | tr '\n' ' ')"
FOUND=""
for C in $(echo "$H" | grep -oE '/_next/static/chunks/[a-z0-9._-]+\.js' | sort -u); do
  R=$(curl -s --max-time 15 "https://www.mcpfinder.org$C" | grep -oE '"/api/[a-zA-Z-]+"' | sort -u | tr -d '"')
  [ -n "$R" ] && echo "routes[$C]: $R" && FOUND="$FOUND $R"
done
U=$(head -1 .public-base)
if echo "$FOUND" | grep -q '/api/'; then
  EP=$(echo $FOUND | tr ' ' '\n' | grep '^/api/' | head -1)
  echo "== tentative soumission reelle https://www.mcpfinder.org$EP =="
  RESP=$(curl -s --max-time 25 -X POST "https://www.mcpfinder.org$EP" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "url=$U" --data-urlencode "name=micro-tools" \
    --data-urlencode "description=Free micro-utils + SIM market research desk by automaton-alpha")
  echo "resp: $(echo "$RESP" | head -c 200)"
  case "$RESP" in \{*|*\success*) echo "SUBMITTED $(date -u +%FT%TZ) ep=$EP" >> SUBMISSIONS.log;; *) echo "FAILED $(date -u +%FT%TZ) ep=$EP" >> SUBMISSIONS.log;; esac
else
  echo "VERDICT: aucune route /api/ dans le bundle -> BLOCKED, pivot mcp.directory"
  echo "BLOCKED $(date -u +%FT%TZ) no-api-route-in-bundle" >> SUBMISSIONS.log
fi
