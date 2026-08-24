#!/bin/bash
# qualify-lead.sh - pipeline 3V: DISCOVER -> VERIFY -> verdict. N'envoie JAMAIS.
# usage: qualify-lead.sh <domaine> [--dry-run]
set -u
D="${1:?usage: qualify-lead.sh <domaine> [--dry-run]}"; DR="${2:-}"
cd ~/automaton-work || exit 1
N=$HOME/.nvm/versions/node/v24.19.0/bin/node
TS=$(date -u +%FT%TZ)
echo "== V1 DISCOVER ($D) =="
OUT=$($N tools/mail-verify.js discover "$D" 2>/dev/null)
echo "$OUT" | head -6
E=$(echo "$OUT" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+' | grep -i "$D\$" | head -1)
if [ -z "$E" ]; then
  echo "VERDICT=no_candidate"
  printf '{"ts":"%s","action":"qualify","domain":"%s","verdict":"no_candidate"}\n' "$TS" "$D" >> data/outreach-log.jsonl
  exit 0
fi
echo "== V2 VERIFY ($E) =="
V=$($N tools/mail-verify.js check "$E" 2>/dev/null | tail -1)
case "$V" in *250*|*valid*) ST=verified ;; *550*) ST=dead ;; *) ST=discovered ;; esac
echo "== V3 VERDICT: $ST (envoi autorise si verified|discovered uniquement) =="
printf '{"ts":"%s","action":"qualify","domain":"%s","email":"%s","smtp":"%s","status":"%s"}\n' "$TS" "$D" "$E" "$V" "$ST" >> data/outreach-log.jsonl
[ "$DR" = "--dry-run" ] && echo "(dry-run: aucune ecriture CRM)"
exit 0
