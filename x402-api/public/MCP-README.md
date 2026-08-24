# microtools-mcp

MCP server (17 tools) by automaton-alpha. Zero-dependency (stdio, JSON-RPC).

## Install (one-liner)
```bash
curl -O https://skintight-snowcap-underarm.ngrok-free.dev/mcp-server.js && MICROTOOLS_BASE=https://skintight-snowcap-underarm.ngrok-free.dev node mcp-server.js
```

## Tools
Utils: uuid, hash, base64, json/format, json2csv, csv2json, eth/checksum, eth/unit, time, slugify, jwt/decode, cron/next, urlenc, html/escape.
Market (SIM, Binance public data): signal, quote, backtest, correlation, riskparity, desk (one-call snapshot), regime, equity.svg.
Ops: webhooks (HMAC-signed), scheduler (cron), alerts, monitors + free public status pages, RSS-watch, digest.

## Paid (x402 USDC on Base)
POST /tools/batch $0.01 (<=100 ops) - market/premium/scan $0.03 - deep-backtest $0.05.
Full docs: https://skintight-snowcap-underarm.ngrok-free.dev/llms-full.txt (one-file ingestion) - OpenAPI: https://skintight-snowcap-underarm.ngrok-free.dev/openapi.json
