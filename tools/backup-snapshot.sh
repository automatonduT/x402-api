#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup-snapshot.sh v2 — SAUVEGARDE INTELLIGENTE (rotation GFS)
# Usage:
#   ./backup-snapshot.sh           → snapshot quotidien
#   ./backup-snapshot.sh restore   → liste les snapshots dispo
#
# Rotation Grandfather-Father-Son :
#   • 30 snapshots quotidiens ("son")
#   • 12 archives mensuelles conservées 1 AN ("father" — le 1er de chaque mois)
#
# Exclus (inutiles et lourds): node_modules, binaires cloudflared, caches.
# Les SECRETS (wallet.json, .env) ne sont JAMAIS copiés.
# ─────────────────────────────────────────────
DEST="$HOME/automaton-backups"
STAMP=$(date "+%Y%m%d-%H%M%S")
DAY=$(date "+%d")
SNAP="$DEST/snapshot-$STAMP"
mkdir -p "$SNAP"

echo "📦 Backup $STAMP"

# 1. Mémoire de l'agent (le plus précieux — rien d'autre ne la remplace)
cp "$HOME/.automaton/state.db" "$SNAP/" && echo "✅ state.db ($(du -h "$SNAP/state.db" | cut -f1))"

# 2. Config agent (sans secrets)
cp "$HOME/.automaton/automaton.json" "$SNAP/" 2>/dev/null && echo "✅ automaton.json"

# 3. Espace de travail SANS les lourdeurs régénérables
#    (bsdtar macOS: --exclude DOIT précéder les chemins)
tar czf "$SNAP/automaton-work.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='cloudflared' \
    --exclude='*.log' \
    -C "$HOME" automaton-work 2>/dev/null && echo "✅ automaton-work ($(du -h "$SNAP/automaton-work.tar.gz" | cut -f1))"

# 4. Skills
tar czf "$SNAP/skills.tar.gz" -C "$HOME/.automaton" skills 2>/dev/null && echo "✅ skills"

TOTAL=$(du -sh "$SNAP" | cut -f1)
echo "📦 Snapshot total: $TOTAL → $SNAP"

# ── ROTATION GFS ──
cd "$DEST" || exit 1

# "Father": le 1er du mois, le dernier snapshot devient archive mensuelle
if [ "$DAY" = "01" ]; then
  MONTH=$(date "+%Y-%m")
  cp -R "$(ls -dt snapshot-* | head -1)" "monthly-$MONTH" 2>/dev/null
  echo "🏛️  Archive mensuelle créée: monthly-$MONTH"
fi

# "Son": garde 30 quotidiens
ls -dt snapshot-* 2>/dev/null | tail -n +31 | xargs rm -rf 2>/dev/null

# "Father": garde 12 mensuels
ls -dt monthly-* 2>/dev/null | tail -n +13 | xargs rm -rf 2>/dev/null

DAILY_N=$(ls -d snapshot-* 2>/dev/null | wc -l | tr -d ' ')
MONTHLY_N=$(ls -d monthly-* 2>/dev/null | wc -l | tr -d ' ')
SPACE=$(du -sh "$DEST" 2>/dev/null | cut -f1)
echo "🗂️  Rétention: $DAILY_N quotidiens + $MONTHLY_N mensuels = $SPACE au total"

if [ "$1" = "restore" ]; then
  echo ""
  echo "Quotidiens:"
  ls -dt snapshot-* 2>/dev/null | head -30
  echo ""
  echo "Mensuels:"
  ls -dt monthly-* 2>/dev/null
fi