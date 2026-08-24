#!/bin/bash
# watch-responses.sh - ONE-pass watcher: inbox + GH thread comments + genesis delta.
# Writes compact verdict to stdout AND /tmp/watch-verdict.txt
NODE="$HOME/.nvm/versions/node/v24.19.0/bin/node"
W="$HOME/automaton-work"
SNAP="$W/data/stats-snap.json"
OUT=/tmp/watch-verdict.txt
: > "$OUT"
echo "== MAIL ==" | tee -a "$OUT"
"$NODE" "$W/tools/mail.js" check 5 2>&1 | grep -Ei 'de:|from:|sujet|subject|Date:' | head -8 | tee -a "$OUT" || echo "(inbox vide)" | tee -a "$OUT"
echo "== GH THREADS ==" | tee -a "$OUT"
for t in "MikeyPetrillo/Agent402 910" "internet-court/internet-court-skill 23" "x402-foundation/x402 3249"; do
  set -- $t
  C=$(gh api "repos/$1/issues/$2/comments" --jq 'length' 2>/dev/null || echo '?')
  echo "#$2@$1 comments=$C" | tee -a "$OUT"
done
echo "== GENESIS ==" | tee -a "$OUT"
S=$(curl -s -m 6 https://skintight-snowcap-underarm.ngrok-free.dev/stats)
FREE=$(printf '%s' "$S" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("free","?"))' 2>/dev/null || echo '?')
PAID=$(printf '%s' "$S" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("paid","?"))' 2>/dev/null || echo '?')
OLD=$(python3 -c 'import json;print(json.load(open("'"$SNAP"'")).get("free",0))' 2>/dev/null || echo 0)
DELTA=$(( ${FREE:-0} - OLD ))
echo "free=$FREE paid=$PAID delta_vs_snap=$DELTA (snap had $OLD)" | tee -a "$OUT"
NONS=$(grep -vc 'self\|127.0.0.1\|localhost\|ngrok-free.dev' "$W/data/leads.jsonl" 2>/dev/null || echo 0)
echo "leads_nonself=$NONS" | tee -a "$OUT"
printf '{"free":%s,"paid":%s,"ts":"%s"}\n' "${FREE:-0}" "${PAID:-0}" "$(date -u +%FT%TZ)" > "$SNAP"
[ "$DELTA" -ge 2 ] || [ "$NONS" -gt 0 ] && echo "VERDICT=GENESIS_SIGNAL" >> "$OUT" || echo "VERDICT=QUIET" >> "$OUT"
tail -1 "$OUT"
