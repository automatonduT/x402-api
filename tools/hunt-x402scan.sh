#!/bin/bash
# hunt-x402scan.sh - locate x402scan listing/submission channel (robots, home links, /submit)
B="${1:-https://www.x402scan.com}"
echo "== ROBOTS =="; curl -s -m 8 "$B/robots.txt" | head -15
echo "== HOME LINKS (submit/list/contact) =="
curl -s -m 8 "$B/" | grep -oiE '<a[^>]+href="[^"]*"[^>]*>' | grep -iE 'submit|list|contact|add' | head -8
echo "== ENDPOINT PROBES =="
for p in /submit /listing /add-tool /contact /api/submit; do
  C=$(curl -s -o /dev/null -w '%{http_code}' -m 8 "$B$p")
  echo "$p -> $C"
done
echo "== API GUESS (POST empty) =="
curl -s -m 8 -X POST -H 'content-type: application/json' -d '{}' "$B/api/submit" | head -c 200; echo
