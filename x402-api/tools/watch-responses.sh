#!/bin/bash
# watch-responses.sh v2 - passe unique: reponses externes + metrique genese. 1 exec = 1 verdict attribuable.
cd "$(dirname "$0")/.." || exit 1
N=$HOME/.nvm/versions/node/v24.19.0/bin/node
BASE=$(head -1 .public-base 2>/dev/null)
echo "== WATCH $(date -u +%FT%TZ) =="

echo "-- github issues --"
# slugs reels dans tools/issue-map.txt (format repo:num par ligne); sinon skip honnete
if [ ! -f tools/issue-map.txt ]; then echo "SKIP pas de issue-map.txt (creds/slug createur #6)"; fi
while read -r pair; do
  [ -z "$pair" ] && continue
  repo="${pair%:*}"; num="${pair#*:}"
  out=$(curl -sS --max-time 8 "https://api.github.com/repos/${repo}/issues/${num}" 2>/dev/null | $N -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
try{const j=JSON.parse(d);
if(j.number!==undefined){console.log("#"+j.number+" comments="+j.comments+" updated="+(j.updated_at||"?"));}
else{console.log("ERR:"+(j.message||"reponse inattendue").slice(0,60));}
}catch(e){console.log("ERR:parse");}});' 2>&1)
  echo "${repo}#${num} -> $out"
done < <(cat tools/issue-map.txt 2>/dev/null)

echo "-- stats delta (metrique genese) --"
[ -f .stats-snapshot ] && PREV=$(cat .stats-snapshot) || PREV=0
CUR=$(curl -sS --max-time 8 "$BASE/stats" 2>/dev/null | $N -e '
let d="";process.stdin.on("data",c=>c&&(d+=c)).on("end",()=>{try{const j=JSON.parse(d);
const t=(j.totalRequests??j.total_requests??j.requests??j.count??j.total)??null;
console.log(t===null?"ERR:"+JSON.stringify(j).slice(0,60):t);}catch(e){console.log("ERR:pas-du-json");}});' 2>/dev/null)
echo "prev=$PREV cur=${CUR:-?}"
case "$CUR" in ""|ERR*) echo "NO_DELTA(stats injoignable)";;
  *) if [ "$CUR" != "$PREV" ]; then echo "DELTA_DETECTED cur=$CUR prev=$PREV"; else echo "NO_DELTA"; fi; echo "$CUR" > .stats-snapshot;; esac

echo "-- paid x402 --"
grep -qE '"paid":\s*[1-9]' data/leads.jsonl 2>/dev/null && echo "PAID_EVENT_IN_LEADS" || echo "paid=0"

echo "== FIN WATCH =="
