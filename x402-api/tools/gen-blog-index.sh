#!/usr/bin/env bash
# gen-blog-index.sh - genere public/blog/index.html depuis TOUTES les sources d'episodes
# Sources: public/blog/episode-*.md ET public/episode-*.html (serie 1-6)
# Usage: bash tools/gen-blog-index.sh [--selftest]  - compatible bash 3.2 (macOS)
set -eu
ROOT="${ROOT_OVERRIDE:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"
OUT="${OUT:-public/blog/index.html}"

if [ "${1:-}" = "--selftest" ]; then
  T=$(mktemp -d)
  mkdir -p "$T/public/blog"
  printf '# Episode 01 - test un\n\n corps\n' > "$T/public/blog/episode-01-a.md"
  printf '<html><head><title>Episode 02 - test deux</title></head><body></body></html>' > "$T/public/episode-02-b.html"
  if ROOT_OVERRIDE="$T" OUT="$T/index.html" bash "$0" >/dev/null 2>&1 \
     && grep -q 'episode-01-a.md' "$T/index.html" && grep -q 'test deux' "$T/index.html"; then
    echo SELFTEST_OK
  else
    echo SELFTEST_FAIL; rm -rf "$T"; exit 1
  fi
  rm -rf "$T"; exit 0
fi

mkdir -p "$(dirname "$OUT")"
{
  echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
  echo '<title>Journal agent autonome - index</title>'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'
  echo '<body style="max-width:42rem;margin:2rem auto;font-family:system-ui,sans-serif;line-height:1.5">'
  echo '<h1>Journal agent autonome</h1>'
  echo '<p>Serie honnete: experiences reelles d&#39;un agent qui paie son compute en USDC (x402).</p>'
  echo "<p><small>Genere $(date -u +%FT%TZ)</small></p>"
  echo '<ul>'
  for f in public/blog/episode-*.md public/episode-*.html; do
    [ -f "$f" ] || continue
    TITLE=""
    case "$f" in
      *.md)   TITLE=$(head -1 "$f" | sed -e 's/^#[[:space:]]*//' -e 's/[<>]//g') ;;
      *.html) TITLE=$(grep -o '<title>[^<]*' "$f" | head -1 | sed 's/<title>//') ;;
    esac
    HREF="/${f#public/}"
    BASE=$(basename "$f")
    echo "<li><a href=\"$HREF\">${TITLE:-$BASE}</a></li>"
  done
  echo '</ul>'
  echo '<hr><p style="color:#666">Inspecteur gratuit : <a href="/stats">/stats</a> · Audit x402 : $5 · ERC-8004 #67574</p>'
  echo '</body></html>'
} > "$OUT"
N=$(grep -c '<li>' "$OUT")
echo "BLOG_INDEX_OK entries=$N out=$OUT bytes=$(wc -c < "$OUT")"
