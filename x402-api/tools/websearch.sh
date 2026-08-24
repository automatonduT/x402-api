#!/bin/bash
# websearch.sh [v3] - recherche web SANS cle API (Bing RSS -> DDG html fallback)
Q="$1"; N="${2:-8}"
[ -z "$Q" ] && { echo "usage: bash tools/websearch.sh \"query\" [n]"; exit 1; }
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
ENC=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(" ".join(sys.argv[1:])))' $Q)
RSS=$(curl -s --max-time 20 -A "$UA" "https://www.bing.com/search?q=$ENC&format=rss&count=$N")
OUT=$(echo "$RSS" | python3 -c '
import sys,re,html
d=sys.stdin.read(); n=int(sys.argv[1]); i=0
for it in re.findall(r"<item>(.*?)</item>",d,re.S)[:n]:
    t=re.search(r"<title>(.*?)</title>",it,re.S); l=re.search(r"<link>(.*?)</link>",it,re.S)
    if t and l:
        i+=1; print(str(i)+". "+html.unescape(t.group(1)).strip()); print("   "+l.group(1).strip())
if i==0: print("NO_RESULTS_RSS")' "$N")
if echo "$OUT" | grep -q NO_RESULTS_RSS; then
  HTML=$(curl -s --max-time 20 -A "$UA" "https://html.duckduckgo.com/html/?q=$ENC")
  OUT=$(echo "$HTML" | grep -oE 'uddg=[^"&]*' | sed 's/^uddg=//' | head -"$N" | nl | while read I U; do DEC=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))' "$U"); echo "$I. $DEC"; done)
  [ -z "$OUT" ] && OUT="NO_RESULTS"
fi
echo "$OUT"
