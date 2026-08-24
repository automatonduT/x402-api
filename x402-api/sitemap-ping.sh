#!/bin/bash
# Bing sitemap ping - auto-limiting: fires only when sitemap md5 changes vs last success
cd "$(dirname "$0")"
BASE=$(cat .public-base 2>/dev/null); [ -z "$BASE" ] && exit 0
SUM=$(md5sum public/sitemap.xml 2>/dev/null | cut -d' ' -f1); [ -z "$SUM" ] && SUM=$(md5 -q public/sitemap.xml)
SIG="$BASE:$SUM"
LAST=$(cat .bingping-state 2>/dev/null)
if [ "$SIG" = "$LAST" ]; then echo "$(date -u +%FT%TZ) bingping: skip (unchanged)" >> pipeline.log; exit 0; fi
TMP=$(mktemp)
CODE=$(curl -s -o "$TMP" -w "%{http_code}" --max-time 20 "https://www.bing.com/ping?sitemap=$BASE/sitemap.xml")
echo "$(date -u +%FT%TZ) bingping: http=$CODE $(head -c 120 $TMP)" >> pipeline.log
rm -f "$TMP"
if [ "$CODE" = "200" ]; then echo "$SIG" > .bingping-state; fi
