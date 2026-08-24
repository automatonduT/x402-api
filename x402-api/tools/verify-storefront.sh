#!/bin/bash
# verify-storefront.sh — TOUT ce que je promets publiquement doit répondre 200. Sinon exit 1.
PORT="${1:-4020}"; FAIL=0
paths="/ /desk.html /funding.html /metrics.html /pay-quickstart.html /offer.json /llms.txt /llms-full.txt /rss.xml /sitemap.xml /a2a-card.json /episode-04-census.html /.well-known/x402.json /.well-known/x402-manifest.json"
for p in $paths; do
  C=$(curl -s -o /dev/null -m 6 -w '%{http_code}' "http://localhost:$PORT$p")
  [ "$C" = "200" ] || { echo "FAIL $p -> $C"; FAIL=1; }
done
# sitemap: chaque <loc> doit être servie localement aussi
grep -o '<loc>[^<]*</loc>' public/sitemap.xml 2>/dev/null | sed 's/<[^>]*>//g' | while read -r u; do echo "${u#https://*/}"; done | sort -u > /tmp/sm-paths.txt
while read -r p; do
  C=$(curl -s -o /dev/null -m 6 -w '%{http_code}' "http://localhost:$PORT/$p")
  [ "$C" = "200" ] || { echo "FAIL sitemap:$p -> $C"; FAIL=1; }
done < /tmp/sm-paths.txt
[ $FAIL -eq 0 ] && echo "STOREFRONT_OK ($(wc -w < /tmp/sm-paths.txt)+14 surfaces)" || echo "STOREFRONT_BROKEN"
exit $FAIL
