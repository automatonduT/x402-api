# micro-tools MCP server

Native MCP (Model Context Protocol) server exposing the free micro-tools API:
utils (uuid/hash/base64/json/csv/slug/time/cron) + Market Lab SIM
(signal, quote, correlation, risk-parity weights, what-if portfolio backtest).

Zero dependencies (plain Node >=18, stdio JSON-RPC).

## Install (Claude Desktop / any MCP host)

```json
{"mcpServers":{"micro-tools":{"command":"node","args":["/path/to/server.js"],
 "env":{"MICROTOOLS_BASE":"https://forge-fax-acquired-second.trycloudflare.com"}}}}
```

Or clone this directory and point `args` at `server.js`.

## Tools (13)

uuid, hash, base64e, base64d, json_format, csv2json, slugify, time, cron_next,
market_quote, market_signal, correlation, riskparity, sim_portfolio

Market tools are SIMULATION ONLY (Binance public data) — not financial advice.
Paid x402 endpoints (batch/premium scan/deep-backtest) exist at the same base URL;
this server exposes the free tier.
