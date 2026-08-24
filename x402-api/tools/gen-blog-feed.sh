#!/usr/bin/env bash
# gen-blog-feed.sh - genere public/blog/feed.xml (RSS 2.0) pour la serie du journal
# Sources: public/blog/episode-*.md ET public/episode-*.html - compatible bash 3.2
# N'ecrase PAS public/rss.xml existant. Usage: bash tools/gen-blog-feed.sh [--selftest]
set -eu
ROOT="${ROOT_OVERRIDE:-$(pwd)}"
cd "$ROOT"
BASE="${BASE_URL:-https://skintight-snowcap-underarm.ngrok-free.dev}"
OUT="${OUT:-public/blog/feed.xml}"

if [ "${1:-}" = "--selftest" ]; then
  T=$(mktemp -d); mkdir -p "$T/public/blog"
  printf '# Episode 01 - test un\n\n corps\n' > "$T/public/blog/episode-01-a.md"
  printf '<html><head><title>Episode 02 - test deux</title></head><body></body></html>' > "$T/public/episode-02-b.html"
  if ROOT_OVERRIDE="$T" OUT="$T/feed.xml" BASE_URL="https://example.test" bash "$0" >/dev/null 2>&1 \
     && grep -q 'episode-01-a.md' "$T/feed.xml" && grep -q 'test deux' "$T/feed.xml"; then
    echo SELFTEST_OK
  else
    echo SELFTEST_FAIL; rm -rf "$T"; exit 1
  fi
  rm -rf "$T"; exit 0
fi

NOW=$(date -u +%FT%TZ)
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<rss version="2.0"><channel>'
  echo '<title>Journal agent autonome</title>'
  echo "<link>$BASE/blog/index.html</link>"
  echo '<description>Serie honnete: un agent qui paie son compute en USDC (x402).</description>'
  echo "<lastBuildDate>$NOW</lastBuildDate>"
  for f in public/blog/episode-*.md public/episode-*.html; do
    [ -f "$f" ] || continue
    case "$f" in
      *.md)   TITLE=$(head -1 "$f" | sed -e 's/^#[[:space:]]*//' -e 's/[<>]//g') ;;
      *.html) TITLE=$(grep -o '<title>[^<]*' "$f" | head -1 | sed 's/<title>//') ;;
    esac
    HREF="/${f#public/}"
    echo '<item>'
    echo "<title>${TITLE:-$f}</title>"
    echo "<link>$BASE$HREF</link>"
    echo "<guid>$BASE$HREF</guid>"
    echo "<pubDate>$NOW</pubDate>"
    echo '</item>'
  done
  echo '</channel></rss>'
} > "$OUT"
N=$(grep -c '<item>' "$OUT")
echo "BLOG_FEED_OK items=$N out=$OUT bytes=$(wc -c < "$OUT")"
