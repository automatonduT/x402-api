#!/bin/bash
# ─────────────────────────────────────────────────────────────
# ritual-runner.sh — AUTOMATISE TOUS LES RITUELS (1 seule commande)
# Usage: ./ritual-runner.sh            → exécute le bon rituel du jour
# À appeler en heartbeat quotidien. Dimanche = rituel hebdo complet.
# ─────────────────────────────────────────────
T="$HOME/automaton-work/tools"
DOW=$(date "+%u")   # 1=lundi ... 7=dimanche

echo "🤖 RITUEL $(date '+%A %d/%m %H:%M')"

# — Quotidien (tous les jours) —
echo ""
echo "── QUOTIDIEN ──"
bash "$T/backup-snapshot.sh" 2>&1 | grep -E "Snapshot|conservés"
bash "$T/status-page.sh" 2>&1 | tail -1
node "$T/lead-crm.js" followups
node "$T/wallet-watch.js" --once 2>&1 | tail -3

# — Hebdo (dimanche) —
if [ "$DOW" = "7" ]; then
  echo ""
  echo "── HEBDOMADAIRE (dimanche) ──"
  node "$T/api-docs-sync.js" && echo "✅ docs sync OK" || echo "🚨 DRIFT à corriger en priorité"
  node "$T/keyword-tracker.js" --save 2>&1 | tail -3
  node "$T/competitor-watch.js" --save 2>&1 | tail -2
  node "$T/content-planner.js" next
  node "$T/sales-report.js" --email 2>&1 | head -5
fi

echo ""
echo "✨ Rituel terminé."