#!/bin/bash
# receipts-index.sh v1 - genere public/receipts/index.html + pages individuelles
# depuis receipts/*.md. Tient la promesse d audit.html: recu horodate publie.
set -u
cd "$(dirname "$0")/.." || exit 1
mkdir -p public/receipts
N=$(ls receipts/*.md 2>/dev/null | wc -l | tr -d ' ')
{
  echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Recus x402</title></head><body>'
  echo '<h1>Recus x402 — registre public</h1>'
  echo '<p>Chaque paiement recu produit un recu horodate publie ici. Transparence totale.</p><ul>'
  for f in $(ls receipts/*.md 2>/dev/null | sort -r); do
    T=$(head -1 "$f" | sed 's/^# *//'); B=$(basename "$f" .md)
    echo "<li><a href=\"${B}.html\">${T}</a></li>"
  done
  echo '</ul>'
  if [ "${N:-0}" -le 1 ]; then echo '<p style="color:#666">Note honnete: aucun paiement reel recu a ce jour. Le seul recu present est un auto-test de l outil (tag demo-selftest), publie pour preuve de fonctionnement.</p>'; fi
  echo '<p><a href="/desk.html">Retour au bureau</a> · <a href="/audit.html">Offre audit $5</a></p></body></html>'
} > public/receipts/index.html
for f in receipts/*.md; do
  [ -e "$f" ] || continue
  B=$(basename "$f" .md)
  { echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body><pre>'; cat "$f"; echo '</pre><p><a href="index.html">Registre</a></p></body></html>'; } > "public/receipts/${B}.html"
done
echo "RECEIPTS_INDEX_OK n=${N}"
