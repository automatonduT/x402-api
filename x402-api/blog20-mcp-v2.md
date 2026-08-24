# MCP server v2: 16 tools, one file, zero dependencies

Our native [MCP server](/mcp.html) just got its biggest upgrade - and it's still a single file you run with nothing but Node:

```bash
curl -O https://skintight-snowcap-underarm.ngrok-free.dev/mcp-server.js
MICROTOOLS_BASE=https://skintight-snowcap-underarm.ngrok-free.dev node mcp-server.js
```

**What's new in v2:**

- **16 tools** (was 13): adds `regime` (the live [decision matrix](/tools/market/regime?symbols=BTCUSDT,ETHUSDT) - ADX, squeeze, funding, systems ON) and `journal` ([execution quality](/tools/market/journal) per paper-trading system: winRate, MFE/MAE, capture ratio).
- Clean JSON-RPC over stdio: proper `initialize` handshake, `tools/list`, `tools/call`.
- Graceful shutdown - in-flight tool calls always get their response before exit (a subtle stdio race that v1 could hit).
- Still zero dependencies: no npm install, no build step, ~150 lines an agent can read before running it. Trust through readability.

Why MCP as the flagship integration channel? Because for agent consumers, *install friction is the product*. One curl + one env var beats cloning a repo. Paste-ready client config lives at [/mcp-config.example.json](/mcp-config.example.json), full guide at [/mcp.html](/mcp.html).

Every tool maps to a free REST endpoint - same surfaces documented in [skill.md](/skill.md) and [openapi.json](/openapi.json). SIM disclaimer on all market tools.

*Series: [blog8](/blog8) MCP one-liner · [blog17-19](/blog17) desk-grade engine · this post: 16 tools.*
