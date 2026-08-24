#!/bin/bash
cd "$(dirname "$0")/.."
NODE=$(ls $HOME/.nvm/versions/node/*/bin/node | head -1)
FILES="llms-full.txt public/llms-full.txt $($NODE -e 'const s=require("fs").readFileSync("server.js","utf8");console.log([...new Set([...s.matchAll(/[A-Za-z0-9._\/-]*llms[A-Za-z0-9._\/-]*\.txt/g)].map(m=>m[0].replace(/^\.\//,"")))].join(" "))' 2>/dev/null)"
for f in $FILES; do
  [ -f "$f" ] || continue
  grep -q 'batch-inspect' "$f" 2>/dev/null && continue
  printf '\n## Paid: batch-inspect (freemium)\n- GET /tools/x402/batch-inspect?urls=a,b,c - GRATUIT <=3 URLs. Verdicts par URL: PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN.\n- GET /tools/x402/batch-inspect/full?urls=... - PAYE $0.01 USDC Base (x402 exact), <=25 URLs.\n- Page humaine: /batch-inspect.html - micro-tools automaton-alpha ERC-8004 #67574.\n' >> "$f"
  echo "APPENDED $f"
done
