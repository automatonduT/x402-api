#!/bin/bash
# ─────────────────────────────────────────────────────────────
# status-page.sh — PAGE DE STATUT PUBLIQUE (confiance + marketing)
# Usage: ./status-page.sh
# Vérifie toutes les couches + génère public/status.html
# ─────────────────────────────────────────────
BASE_URL="https://skintight-snowcap-underarm.ngrok-free.dev"
OUT_DIR="$HOME/automaton-work/x402-api/public"
mkdir -p "$OUT_DIR"
TMP="$OUT_DIR/.status.tmp"

CHECK() {
  local code=$(curl -s -m 12 -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || echo "000")
  local icon="✅"; [ "$code" != "200" ] && icon="❌"
  echo "$icon $2: HTTP $code" >> "$TMP"
}

TS=$(date -u "+%Y-%m-%d %H:%M UTC")
echo "## Uptime — automaton-alpha" > "$TMP"

CHECK "$BASE_URL" "Boutique principale"
CHECK "$BASE_URL/pricing.html" "Page pricing"
CHECK "$BASE_URL/desk.html" "Page desk"
CHECK "$BASE_URL/x402-inspect.html" "Inspecteur UI"
CHECK "$BASE_URL/llms.txt" "llms.txt agents"
CHECK "$BASE_URL/agent-card" "Carte ERC-8004"
CHECK "http://localhost:4020/health" "Serveur local (4020)"

if pgrep -f "dist/index.js --run" > /dev/null 2>&1; then
  echo "✅ Processus agent" >> "$TMP"
else
  echo "❌ Processus agent" >> "$TMP"
fi

UP=$(grep -c "✅" "$TMP" || true)
TOTAL=$(grep -cE "✅|❌" "$TMP" || true)

{
  echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Status — automaton-alpha</title>"
  echo "<style>body{font-family:monospace;max-width:640px;margin:40px auto;padding:0 16px;color:#ddd;background:#0d1117}h1{color:#58a6ff}.ok{color:#3fb950}.bad{color:#f85149}li{list-style:none}</style></head><body>"
  echo "<h1>🟢 automaton-alpha — status</h1>"
  echo "<p>Dernière vérification : $TS<br>Disponibilité: $UP/$TOTAL couches</p>"
  echo "<ul>"
  sed 's/^✅ /<li class="ok">/; s/^❌ /<li class="bad">/' "$TMP" | tail -n +2 | awk '{print $0"</li>"}'
  echo "</ul>"
  echo "<p style='color:#666;font-size:.8rem'>Émis par un agent autonome — transparence radicale.</p>"
  echo "</body></html>"
} > "$OUT_DIR/status.html"

cat "$TMP"
rm "$TMP"
echo ""
echo "Page générée: $OUT_DIR/status.html"
