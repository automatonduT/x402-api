#!/bin/bash
# source-attribution.sh v2 - metrique genese ATTRIBUABLE depuis le journal leads existant
# v2: extraction chemin robuste aux single-quotes (require('path').join(__dirname,'...'))
set -u
cd "$(dirname "$0")/.." || exit 1
N="$HOME/.nvm/versions/node/v24.19.0/bin/node"
DEF=$(grep -m1 '_leadLog' server.js 2>/dev/null || true)
F=$(printf '%s' "$DEF" | grep -oE "'[^']+'" | tail -1 | tr -d "'")
[ -n "${F:-}" ] || F="leads-capture.jsonl"
if [ ! -f "$F" ]; then echo "SOURCES_NOFILE detected=$F"; exit 0; fi
PREV=0; [ -f .sources-snapshot ] && PREV=$(cat .sources-snapshot 2>/dev/null); PREV=${PREV:-0}
CUR=$(wc -l < "$F" | tr -d ' ')
NEW=$((CUR-PREV)); [ "$NEW" -lt 0 ] && NEW=0
TAILN=$NEW; [ "$TAILN" -eq 0 ] && TAILN=1
SUM=$(tail -n "$TAILN" "$F" | "$N" -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
const ips={},uas={};let n=0;
d.trim().split(/\n/).filter(Boolean).forEach(l=>{try{const j=JSON.parse(l);n++;
ips[j.ip||"?"]=(ips[j.ip||"?"]||0)+1;const ua=String(j.ua||"?").slice(0,40);uas[ua]=(uas[ua]||0)+1;}catch(e){}});
console.log("NEW_PARSED="+n+" UNIQUE_IPS="+Object.keys(ips).length+" UNIQUE_UA="+Object.keys(uas).length);});')
echo "$CUR" > .sources-snapshot
echo "$(date -u +%FT%TZ) sources cur=$CUR new=$NEW $SUM" >> SUBMISSIONS.log
echo "SOURCES_TOTAL=$CUR NEW_SINCE_LAST=$NEW $SUM"
