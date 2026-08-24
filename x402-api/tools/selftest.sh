#!/bin/bash
# selftest.sh v1 (2026-08-24) - coherence de la chaine de publication AVANT toute distribution.
# Lecons institutionnalisees: ep09 (selftest obligatoire avant push) + montage hote (exit 0 != preuve).
set -u
cd "$(dirname "$0")/.." || exit 1
FAILS=0
fail(){ echo "FAIL: $1"; FAILS=$((FAILS+1)); }
ok(){ echo "OK: $1"; }

EPS_FILES=$(ls public/blog/episode-*.md 2>/dev/null | wc -l | tr -d ' ')
[ "${EPS_FILES:-0}" -ge 1 ] && ok "C1 episodes=$EPS_FILES" || fail "C1 episodes=0"

IDX_LINKS=$(grep -o 'href="[^"]*episode-[^"]*\.html"' public/blog/index.html 2>/dev/null | sort -u | wc -l | tr -d ' ')
[ "${IDX_LINKS:-0}" -eq "$EPS_FILES" ] && ok "C2 index_links=$IDX_LINKS" || fail "C2 index_links=$IDX_LINKS != episodes=$EPS_FILES"

FEED_ITEMS=$(grep -c '<item>' public/blog/feed.xml 2>/dev/null); FEED_ITEMS=${FEED_ITEMS:-0}
[ "$FEED_ITEMS" -eq "$EPS_FILES" ] && ok "C3 feed_items=$FEED_ITEMS" || fail "C3 feed_items=$FEED_ITEMS != episodes=$EPS_FILES"

{ head -1 public/blog/feed.xml 2>/dev/null | grep -q '<?xml'; } && { grep -q '</rss>' public/blog/feed.xml; } && ok "C4 xml_shape" || fail "C4 xml_shape"

BAD_TITLES=0
for f in public/blog/episode-*.md; do
  head -1 "$f" 2>/dev/null | grep -q '^# [^[:space:]]' || BAD_TITLES=$((BAD_TITLES+1))
done
[ "$BAD_TITLES" -eq 0 ] && ok "C5 titles_all_valid" || fail "C5 titles_bad=$BAD_TITLES"

BASE=$(head -1 .public-base 2>/dev/null)
echo "$BASE" | grep -q '^https://[a-z0-9.-]' && ok "C6 base=$BASE" || fail "C6 base_invalid='$BASE'"

if [ -f leads-capture.jsonl ]; then
  NODE="$HOME/.nvm/versions/node/v24.19.0/bin/node"
  BAD_JSON=$("$NODE" -e 'let n=0;require("fs").readFileSync("leads-capture.jsonl","utf8").split("\n").filter(Boolean).forEach(l=>{try{JSON.parse(l)}catch(e){n++}});console.log(n)' 2>/dev/null)
  [ "${BAD_JSON:-9}" -eq 0 ] && ok "C7 jsonl_valid" || fail "C7 jsonl_bad_lines=${BAD_JSON:-unknown}"
else
  ok "C7 jsonl_absent_legit"
fi

echo "---"
if [ "$FAILS" -eq 0 ]; then echo "SELFTEST_OK"; exit 0; else echo "SELFTEST_FAILED fails=$FAILS"; exit 1; fi
