#!/usr/bin/env bash
# indexnow-ping.sh [v1] - ping IndexNow conforme: backoff 6h, urlList NEUVE, code capture, stamp sur 200/202 seulement
set -u
cd "$(dirname "$0")/.."
BASE=$(grep -oE 'https://[A-Za-z0-9.-]+' public/sitemap.xml | head -1)
[ -z "$BASE" ] && BASE=$(grep -oE 'https://[A-Za-z0-9.-]+' public/llms.txt | head -1)
[ -z "$BASE" ] && { echo "NO_BASE"; exit 1; }
KEYFILE=$(grep -rlE "^[a-f0-9]{32}$" public --include="*.txt" 2>/dev/null | head -1)
[ -z "$KEYFILE" ] && KEYFILE=$(find public -maxdepth 1 -type f -size -8c ! -name "*.html" | while read f; do grep -qE "^[a-f0-9]{32}$" "$f" && echo "$f" && break; done)
KEY=$(cat "$KEYFILE")
# cle auto-affirmee: generer+herberger si absente (IndexNow n'exige aucun enregistrement)
if [ -z "$KEYFILE" ]; then
  KEY=$(python3 -c "import secrets;print(secrets.token_hex(16))")
  echo -n "$KEY" > "public/$KEY.txt"
  echo "$KEY" > .indexnow-key
  KEYFILE="public/$KEY.txt"
  echo "KEY_GENERATED_HOSTED=/$KEY.txt"
fi
[ -f .indexnow-key ] && KEY=$(cat .indexnow-key)
STAMP=.last-indexnow
NOW=$(date +%s)
AGE=999999
[ -f "$STAMP" ] && AGE=$(( NOW - $(cat "$STAMP") ))
# contenu neuf depuis le dernier stamp? (fichiers modifies apres le stamp)
NEWFILES=$(find public -newer "$STAMP" -type f \( -name '*.html' -o -name '*.json' -o -name '*.xml' -o -name '*.txt' \) 2>/dev/null | head -20)
FORCE=0
[ "${1:-}" = "--force-if-new-content" ] && [ -n "$NEWFILES" ] && FORCE=1
if [ "$AGE" -lt 21600 ] && [ "$FORCE" -eq 0 ]; then echo "BACKOFF age=${AGE}s new_files=${NEWFILES:-none}"; exit 0; fi
if [ -z "$NEWFILES" ]; then echo "NO_NEW_CONTENT_SINCE_STAMP"; exit 0; fi
URLS=""
for f in $NEWFILES; do URLS="$URLS\"$BASE/${f#public/}\","; done
URLS=${URLS%,}
BODY="{\"host\":\"${BASE#https://}\",\"key\":\"$KEY\",\"urlList\":[$URLS]}"
CODE=$(curl -s -o /tmp/in-resp -w '%{http_code}' --max-time 25 -X POST \
  -H 'Content-Type: application/json; charset=utf-8' -d "$BODY" https://api.indexnow.org/indexnow)
echo "PING code=$CODE urls=$URLS"
echo "$(date -u +%FT%TZ) code=$CODE $URLS" >> SUBMISSIONS.log
if [ "$CODE" = "200" ] || [ "$CODE" = "202" ]; then echo "$NOW" > "$STAMP"; echo "STAMPED_OK"; else echo "NOT_STAMPED_code=$CODE"; fi
