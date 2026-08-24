#!/bin/bash
# Regenerate public/llms-full.txt = whole-site text for single-fetch agent ingestion
cd "$(dirname "$0")"
{
  echo "# micro-tools full text index (generated $(date -u +%FT%TZ))"
  echo
  cat public/llms.txt
  echo; echo "==="; echo; echo "# BLOG POSTS (full text)"; echo
  python3 - <<'PY'
import json
for e in json.load(open('posts.json')):
    print(f"\n## {e.get('t','')} ({e['p']})\n")
    try: print(open(e['f']).read())
    except Exception: print("(missing)")
PY
  echo; echo "==="; echo; echo "# SKILL.MD"; echo
  cat skill.md 2>/dev/null || cat public/skill.md 2>/dev/null || echo "(n/a)"
  echo; echo "==="; echo; echo "# FAQ"; echo; cat public/faq.md
} > public/llms-full.txt
echo "bytes: $(wc -c < public/llms-full.txt)"
