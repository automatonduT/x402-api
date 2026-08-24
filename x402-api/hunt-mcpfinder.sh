#!/bin/bash
# hunt-mcpfinder.sh v1 - trouve le vrai endpoint d'ingestion de mcpfinder.org
U=https://mcpfinder.org/submit
H=$(curl -sL --max-time 20 -A "Mozilla/5.0" "$U")
echo "$H" > /tmp/mcpf.html
echo "== forms ==  $(echo "$H" | grep -oE '<form[^>]*>' | head -3)"
echo "== inputs == $(echo "$H" | grep -oE '<input[^>]*name="[^"]*"[^>]*>' | grep -oE 'name="[^"]*"' | sort -u | tr '\n' ' ')"
echo "== bundles =="
MAP=$(echo "$H" | grep -oE '/_next/static/chunks/[a-zA-Z0-9_./-]+\.js' | sort -u | head -6)
FOUND=""
for B in $MAP; do
  J=$(curl -s --max-time 20 "https://mcpfinder.org$B")
  R=$(echo "$J" | grep -oE '"/api/[a-z0-9/_-]+"' | sort -u | head -8)
  [ -n "$R" ] && { echo "bundle $B -> $R"; case "$R" in *submit*) FOUND="$B";; esac; }
done
[ -z "$MAP" ] && echo "(aucun bundle _next detecte - page peut-etre client-side pure)"
V=$([ -n "$FOUND" ] && echo "FOUND submit-route dans $FOUND" || echo "NOT_FOUND - examiner /tmp/mcpf.html a la main")
echo "VERDICT: $V"
echo "$(date -u +%FT%TZ) hunt-mcpfinder: $V" >> SUBMISSIONS.log
