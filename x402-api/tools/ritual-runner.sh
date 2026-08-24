#!/usr/bin/env bash
mkdir -p logs
exec > >(tee -a "logs/ritual-$(date -u +%F).log" 2>&1)
# ritual-runner.sh - rituel quotidien automaton-alpha (v1)
# Backup tournant 7 jours + ledger portefeuille append-only +
# regeneration status.html + resume followups CRM si present.
# Interdits respectes: pas de setsid, kill large, sed -i, heredoc mega-lot.
set -u
cd "$(dirname "$0")/.." || exit 1
NODE="$HOME/.nvm/versions/node/v24.19.0/bin/node"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DAY="$(date -u +%Y%m%d)"
echo "== RITUAL $TS =="
mkdir -p backups
tar czf "backups/backup-$DAY.tgz" public tools server.js 2>/dev/null
ls -1t backups/backup-*.tgz 2>/dev/null | tail -n +8 | while read -r old; do rm -f "$old"; done
echo "BACKUP_OK today=$(ls -1 backups/backup-$DAY.tgz 2>/dev/null | wc -l) total=$(ls -1 backups 2>/dev/null | wc -l)"
printf '%s\tritual-pass\trunner=v1\n' "$TS" >> "$HOME/ledger-wallet.tsv"
echo "LEDGER_OK lines=$(wc -l < "$HOME/ledger-wallet.tsv")"
"$NODE" tools/status-regen.js || echo "STATUS_REGEN_FAIL"
if [ -f crm/leads.jsonl ]; then
  echo "FOLLOWUPS_RESUME total=$(wc -l < crm/leads.jsonl) (envoi interdit ici: regle 3V separee)"
else
  echo "FOLLOWUPS_SKIP pas de crm/leads.jsonl"
fi
echo "RITUAL_OK"
