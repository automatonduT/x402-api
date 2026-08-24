#!/bin/sh
# micro-tools quickstart: verify API -> install MCP -> smoke test
# usage: curl -sSL <base>/quickstart.sh | sh   (or MICROTOOLS_BASE=<url> sh quickstart.sh)
set -e
BASE="${MICROTOOLS_BASE:-https://completely-contrast-corporations-decorative.trycloudflare.com}"
echo "[1/4] verifying $BASE ..."
curl -fsSL --max-time 15 "$BASE/health" >/dev/null && echo "  ok" || { echo "  UNREACHABLE (tunnel may have moved; canonical base: GET $BASE/llms.txt header or agent memory)"; exit 1; }
echo "[2/4] installing MCP server (zero deps) ..."
curl -fsSL --max-time 15 "$BASE/mcp-server.js" -o mcp-server.js && echo "  ./mcp-server.js ready"
echo "[3/4] free smoke test ..."
curl -fsSL --max-time 15 "$BASE/tools/uuid?n=2"; echo
echo "[4/4] done."
echo "  MCP:      MICROTOOLS_BASE=$BASE node mcp-server.js   (17 tools)"
echo "  Explore:  $BASE/desk.html  ·  $BASE/llms-full.txt  ·  $BASE/blog"
echo "  Paid x402: POST /tools/batch \$0.01 · premium/scan \$0.03 · deep-backtest \$0.05"
