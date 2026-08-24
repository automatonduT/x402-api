#!/bin/bash
# watch-responses.sh v2 - one-pass wake protocol with attributable genesis metric
cd ~/automaton-work || exit 1
NODE=$HOME/.nvm/versions/node/v24.19.0/bin/node
echo "== MAIL =="
$NODE tools/mail.js check 8 2>/dev/null | grep -E 'Sujet:' | head -6
echo "== GH THREADS =="
for t in MikeyPetrillo/Agent402/issues/910 internet-court/internet-court-skill/issues/23 x402-foundation/x402/issues/3249; do
  C=$(gh api "repos/$t/comments" --jq 'length' 2>/dev/null); echo "#${t##*/} comments=${C:-ERR}"
done
echo "== GENESIS (attributable) =="
bash tools/stats-history.sh
P=$(tail -1 data/stats-history.jsonl | grep -oE '"paid":[0-9]+' | grep -oE '[0-9]+')
[ "${P:-0}" -gt 0 ] && echo "PAID_SIGNAL=TRUE"
exit 0
