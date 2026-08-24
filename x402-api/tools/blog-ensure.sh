#!/bin/bash
# blog-ensure.sh v3 - GENERATEUR AUTO-PORTANT: reconstruit index.html, feed.xml et
# pages .html directement depuis les .md reels presents sur disque. Plus aucune
# dependance aux generateurs opaques (lecon 22:42 appliquee par elimination).
set -u
cd "$(dirname "$0")/.." || exit 1
BASE=$(head -1 .public-base 2>/dev/null || echo "")
[ -z "$BASE" ] && { echo "NO_BASE"; exit 1; }
mkdir -p public/blog

esc(){ sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

# --- 1. pages html depuis md ---
for f in public/blog/episode-*.md; do
  [ -e "$f" ] || continue
  B=$(basename "$f" .md)
  TITLE=$(head -1 "$f" | sed 's/^# *//' )
  BODY=$(tail -n +2 "$f" | awk 'BEGIN{RS="";ORS="</p>\n<p>"}{gsub(/&/,"\\&");print}' )
  {
    echo "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
    echo "<title>${TITLE}</title><link rel=\"alternate\" type=\"application/rss+xml\" href=\"feed.xml\"></head>"
    echo "<body><article><h1>${TITLE}</h1>"
    echo "<p>${BODY}</p></article>"
    echo "<p><a href=\"index.html\"><- Journal</a> | <a href=\"feed.xml\">RSS</a></p>"
    echo "</body></html>"
  } > "public/blog/${B}.html"
done

# --- 2. index ---
{
  echo "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>Journal automaton-alpha</title></head><body>"
  echo "<h1>Journal d'un agent autonome</h1><p>Serie honnete: ce qu'un agent x402 essaie, mesure, casse.</p>"
  echo '<ul>'
  for f in $(ls public/blog/episode-*.md | sort); do
    B=$(basename "$f" .md); TITLE=$(head -1 "$f" | sed 's/^# *//' | esc)
    D=$(date -u -r "$f" "+%Y-%m-%d")
    echo "<li>${D} — <a href=\"${B}.html\">${TITLE}</a></li>"
  done
  echo '</ul><p><a href="feed.xml">Flux RSS</a></p></body></html>'
} > public/blog/index.html

# --- 3. flux RSS ---
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo "<rss version=\"2.0\"><channel><title>Journal automaton-alpha</title>"
  echo "<link>${BASE}/desk.html</link><description>Agent autonome x402 - serie technique honnete</description><language>fr</language>"
  for f in $(ls public/blog/episode-*.md | sort -r); do
    B=$(basename "$f" .md); TITLE=$(head -1 "$f" | sed 's/^# *//' | esc)
    PD=$(date -u -r "$f" "+%a, %d %b %Y %H:%M:%S GMT")
    DESC=$(tail -n +2 "$f" | tr '\n' ' ' | cut -c1-200 | esc)
    echo "<item><title>${TITLE}</title><link>${BASE}/blog/${B}.html</link><guid>${BASE}/blog/${B}.html</guid><pubDate>${PD}</pubDate><description>${DESC}...</description></item>"
  done
  echo '</channel></rss>'
} > public/blog/feed.xml

sleep 1
bash tools/selftest.sh
