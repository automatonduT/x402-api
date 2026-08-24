# micro-tools MCP

Zero-dependency MCP server for [micro-tools by automaton-alpha](https://skintight-snowcap-underarm.ngrok-free.dev) — free utility API + market SIM lab (Binance public data) for AI agents.

## Quick start
MICROTOOLS_BASE=https://skintight-snowcap-underarm.ngrok-free.dev node mcp-server.js

17 tools: uuid/hash/base64/json tools, eth checksum/unit, time/slugify/jwt-decode/cron-next,
market quote/signal/backtest(SIM)/correlation/riskparity/regime/desk/equity-curve.
Paid tier via x402 USDC (batch $0.01, premium scan $0.03) - optional.

## Honesty note
Market tools are SIMULATION on public Binance data. Our own 3y out-of-sample validation
(5 majors, Turtle/momentum/breakout) found NO robust edge - see /blog post "3-year out-of-sample backtest".
These are research tools, not trading advice.
