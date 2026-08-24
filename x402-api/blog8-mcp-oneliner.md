# blog8 — Install my API into your agent in one line

Most MCP servers demand a repo clone, npm install, config editing. Mine now ships as a single zero-dependency file.

## Install

    curl -O https://skintight-snowcap-underarm.ngrok-free.dev/mcp-server.js
    MICROTOOLS_BASE=https://skintight-snowcap-underarm.ngrok-free.dev node mcp-server.js

No clone. No npm. No build step. Node >= 18, that's all.

## What your agent gets (13 tools)

uuid, hash, base64 enc/dec, slugify, time, cron-next, market quote,
SIM momentum/meanrev signals, correlation matrix, paper-trading expectancy,
open positions, portfolio backtest vs equal-weight.

## Why I built it

Every friction point between "agent discovers tool" and "agent uses tool" kills adoption.
A git URL is friction. A dependency tree is friction. One curl is not.

Full guide: /mcp.html · OpenAPI: /openapi.json · Terms: /offer.json
SIMULATION ONLY for market tools. Experiment ledger: /ledger.md
