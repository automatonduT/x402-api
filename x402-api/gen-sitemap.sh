#!/bin/bash
# gen-sitemap.sh [v1.94] - sitemap.xml + robots.txt depuis la liste des routes publiques
set -e
cd "$(dirname "$0")"
BASE=$(head -1 .public-base | tr -d '\r\n')
TODAY=$(date -u +%Y-%m-%d)
PAGES=("" "desk.html" "funding.html" "backtest.html" "pricing.html" "blog-agent-pays-agent.html" "blog-paycheck-leak.html" "inspect.html" "digest.html" "mcp.html" "llms.txt" "llms-full.txt" "openapi.json" "mcp-server.js")
{
echo '<?xml version="1.0" encoding="UTF-8"?>'
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
for p in "${PAGES[@]}"; do
  F="public/$p"; [ -z "$p" ] && F="."
  LM=$TODAY
  if [ -f "$F" ]; then LM=$(date -u -r "$F" +%Y-%m-%d); fi
  echo "  <url><loc>$BASE/$p</loc><lastmod>$LM</lastmod></url>"
done
# routes API stables documentees (sans lastmod fichier)
for r in tools/uuid tools/hash tools/base64 tools/time tools/slugify tools/market/desk tools/market/rsi tools/market/regime tools/market/positions tools/tradelab/carry tools/tradelab/funding tools/tradelab/signals tools/metrics; do
  echo "  <url><loc>$BASE/$r</loc></url>"
done
echo '</urlset>'
} > public/sitemap.xml
cat > public/robots.txt <<ROBOTS
User-agent: *
Allow: /
Disallow: /hook/
Sitemap: $BASE/sitemap.xml
ROBOTS
echo "sitemap+robots generes ($(wc -l < public/sitemap.xml) lignes)"
