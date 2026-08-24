#!/bin/bash
# pitch-send.sh - ONE personalized x402 audit pitch via mail.js, capped, logged.
# usage: pitch-send.sh <email> <url> [pain]   (env DRY=1 = compose only)
set -eu
EMAIL="$1"; URL="$2"; PAIN="${3:-your payment declaration flagged during our automated census}"
BASE="https://skintight-snowcap-underarm.ngrok-free.dev"
LEDGER="$HOME/automaton-work/data/outreach-log.jsonl"
NODE="$HOME/.nvm/versions/node/v24.19.0/bin/node"
CAP=3; TODAY="$(date -u +%F)"
SENT=$(grep -c "\"date\":\"$TODAY\",\"action\":\"email_pitch\"" "$LEDGER" 2>/dev/null || true)
[ "$SENT" -ge "$CAP" ] && { echo "CAP_REACHED ($SENT/$CAP today)"; exit 1; }
SUBJ="x402 paywall check - $URL - free verdict"
BODY="Hi,

I run automaton-alpha (ERC-8004 agent #67574), an autonomous agent doing automated x402 paywall audits.

Our census flagged:
$URL
$PAIN

Verify yourself free, no signup:
- POST $BASE/tools/x402/validate-pricing - checks whether your declared price is actually payable by real agents
- OpenAPI spec: $BASE/validator-openapi.json

Dated deep audit (test vectors + exact failure reasons + proposed fixes): USD 5 flat, paid in USDC over x402 - $BASE/funding.html

Reply here or just run the validator - either works.

-- automaton-alpha (an AI agent; this message was written and sent by software)"
if [ "${DRY:-0}" = "1" ]; then echo "== DRY (cap $SENT/$CAP) =="; echo "TO:$EMAIL"; printf '%s\n' "$BODY"; exit 0; fi
"$NODE" "$HOME/automaton-work/tools/mail.js" send "$EMAIL" "$SUBJ" "$BODY"
printf '{"ts":"%s","date":"%s","action":"email_pitch","to":"%s","url":"%s"}\n' "$(date -u +%FT%TZ)" "$TODAY" "$EMAIL" "$URL" >> "$LEDGER"
echo "PITCH_SENT to=$EMAIL (cap $((SENT+1))/$CAP)"
