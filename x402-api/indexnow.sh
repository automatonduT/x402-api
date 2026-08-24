#!/bin/bash
# IndexNow batch submitter v2 - state-gated, submits ALL blog urls as ONE batch POST
# Format verified live: HTTP 202 Accepted (2026-08-23). Replaces old single-URL GET ping.
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/pipeline.log"
STATE="$DIR/.indexnow-state"
ts(){ date -u +%FT%TZ; }

BASE=$(cat "$DIR/.public-base" 2>/dev/null)
[ -z "$BASE" ] && exit 0

KEY=$(ls "$DIR/public/"*.txt 2>/dev/null | grep -E '/[a-f0-9]{32}\.txt$' | head -1 | xargs -r basename .txt)
[ -z "$KEY" ] && { echo "$(ts) indexnow: no key file" >> "$LOG"; exit 0; }

SUM=$(md5sum "$DIR/sitemap.xml" 2>/dev/null | cut -d' ' -f1 || md5 -q "$DIR/sitemap.xml" 2>/dev/null)
MD5="$BASE:$SUM"
[ -f "$STATE" ] && [ "$(cat "$STATE")" = "$MD5" ] && exit 0

# politeness backoff: at most ONE submit attempt per 6h unless this exact md5 already succeeded above
ATT="$DIR/.indexnow-last-attempt"
NOW=$(date +%s)
LAST=$([ -f "$ATT" ] && cat "$ATT" || echo 0)
if [ $((NOW - LAST)) -lt 21600 ]; then
  echo "$(ts) indexnow: skipped (backoff <6h since last attempt)" >> "$LOG"
  exit 0
fi
echo "$NOW" > "$ATT"

node -e '
const fs=require("fs");
const b=process.argv[1],k=process.argv[2],dir=process.argv[3];
const p=JSON.parse(fs.readFileSync(dir+"/posts.json","utf8"));
fs.writeFileSync("/tmp/in-batch.json",JSON.stringify({host:b.replace("https://",""),key:k,keyLocation:b+"/"+k+".txt",urlList:p.map(x=>b+x.p)}));
' "$BASE" "$KEY" "$DIR" || { echo "$(ts) indexnow: payload build failed" >> "$LOG"; exit 0; }

CODE=$(curl --max-time 25 -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @/tmp/in-batch.json 'https://api.indexnow.org/indexnow')

N=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1]+"/posts.json")).length)' "$DIR")
if [ "$CODE" = "200" ] || [ "$CODE" = "202" ]; then
  echo "$(ts) indexnow: batch-success code=$CODE urls=$N" >> "$LOG"
  echo "$MD5" > "$STATE"
else
  echo "$(ts) indexnow: batch-rejected code=$CODE (retry next run)" >> "$LOG"
fi
