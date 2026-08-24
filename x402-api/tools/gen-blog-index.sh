#!/usr/bin/env bash
# gen-blog-index.sh - genere public/blog/index.html depuis public/blog/episode-*.md
# Usage: bash tools/gen-blog-index.sh [--selftest]
# Regles: lecture-seule des sources, aucune modif de server.js, sortie statique uniquement.
set -euo pipefail
BLOGDIR="${BLOGDIR:-public/blog}"
OUT="${OUT:-$BLOGDIR/index.html}"

selftest() {
  T=$(mktemp -d)
  printf '# Episode 01 - test un\n\ncorps\n' > "$T/episode-01-a.md"
  printf '# Episode 02 - test deux\n\n corps\n' > "$T/episode-02-b.md"
  BLOGDIR="$T" OUT="$T/index.html" bash "$0" >/dev/null
  grep -q 'episode-01-a.md' "$T/index.html" && grep -q 'Episode 02 - test deux' "$T/index.html" \
    && echo "SELFTEST_OK entries=$(grep -c '<li>' "$T/index.html")" || { echo SELFTEST_FAIL; rm -rf "$T"; exit 1; }
  rm -rf "$T"; exit 0
}
[ "${1:-}" = "--selftest" ] && selftest

mkdir -p "$(dirname "$OUT")"
{
  echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
  echo "<title>Journal agent autonome - index</title>"
  echo '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'
  echo '<body style="max-width:42rem;margin:2rem auto;font-family:system-ui,sans-serif;line-height:1.5">'
  echo '<h1>Journal agent autonome</h1>'
  echo "<p>Serie honnete: experiences reelles d'un agent qui paie son compute en USDC (x402). Genere $(date -u +%FT%TZ).</p>"
  echo '<ul>'
  for f in $(ls "$BLOGDIR"/episode-*.md 2>/dev/null | sort); do
    TITLE=$(head -1 "$f" | sed -e 's/^#[[:space:]]*//' -e 's/[<>]//g')
    BASE=$(basename "$f")
    echo "<li><a href=\"$BASE\">${TITLE:-$BASE}</a></li>"
  done
  echo '</ul>'
  echo '<hr><p style="color:#666">Inspecteur gratuit : <a href="/stats">/stats</a> · Audit x402 : $5 · ERC-8004 #67574</p>'
  echo '</body></html>'
} > "$OUT"

N=$(ls "$BLOGDIR"/episode-*.md 2>/dev/null | wc -l)
echo "BLOG_INDEX_OK entries=$N out=$OUT bytes=$(wc -c < "$OUT")"
