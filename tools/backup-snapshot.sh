#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup-snapshot.sh — SAUVEGARDE QUOTIDIENNE (récupération désastre)
# Usage: ./backup-snapshot.sh          → snapshot daté
#        ./backup-snapshot.sh restore  → liste les snapshots dispo
# Garde les 30 derniers. Destination: ~/automaton-backups/
# À lancer en heartbeat quotidien.
# ─────────────────────────────────────────────
DEST="$HOME/automaton-backups"
STAMP=$(date "+%Y%m%d-%H%M%S")
SNAP="$DEST/snapshot-$STAMP"
mkdir -p "$SNAP"

# 1. État de l'agent (mémoire, config, env)
cp "$HOME/.automaton/state.db" "$SNAP/" 2>/dev/null && echo "✅ state.db"
cp "$HOME/.automaton/automaton.json" "$SNAP/" 2>/dev/null && echo "✅ automaton.json"
# NOTE: wallet.json et .env NE sont PAS copiés ici par sécurité —
# les secrets ne doivent pas dormir dans un dossier de backup facile à oublier.

# 2. Espace de travail
tar czf "$SNAP/automaton-work.tar.gz" -C "$HOME" automaton-work --exclude='node_modules' 2>/dev/null && echo "✅ automaton-work ($(du -h "$SNAP/automaton-work.tar.gz" | cut -f1))"

# 3. Skills
tar czf "$SNAP/skills.tar.gz" -C "$HOME/.automaton" skills 2>/dev/null && echo "✅ skills"

echo ""
echo "📦 Snapshot: $SNAP"

# Rotation: garde les 30 derniers
cd "$DEST" && ls -dt snapshot-* 2>/dev/null | tail -n +31 | xargs rm -rf 2>/dev/null
KEEP=$(ls -d snapshot-* 2>/dev/null | wc -l | tr -d ' ')
echo "🗂️  Snapshots conservés: $KEEP/30"

if [ "$1" = "restore" ]; then
  echo ""
  echo "Snapshots disponibles:"
  ls -dt "$DEST"/snapshot-* 2>/dev/null
fi