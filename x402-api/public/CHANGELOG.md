# micro-tools changelog

All notable changes, newest first. Live contract always at /openapi.json.

## v1.14 - 2026-08-23
- Discovery stack: robots.txt, sitemap.xml (18 URLs), llms.txt rebuilt
- /playground.html - interactive tester auto-generated from openapi.json
- /quickstart.html - zero-to-integrated guide (6 steps)
- /examples/ - copy-paste Python + Node clients (stdlib/zero-dep)
- /faq.md - rate limits, privacy, attribution policy

## v1.13 - 2026-08-23
- Self-reporting embeds: GET /ref?x=source -> inbound ring log; widget.js auto-attribution
- equity.svg ?ref= sensor; EMBED-KIT.md + embed-demo.html
- MCP one-line install: /mcp-server.js (zero-dep) + /mcp.html guide
- blog7-9 distribution series; /blog.xml + /blog disk-driven via posts.json

## v1.12 - 2026-08-25 era fixes
- Duplicate-boot incident fixed (ghost routes removed); kill-by-port redeploy protocol
- Static surfaces moved to public/ = ghost-proof across redeploys

## v1.10-v1.11 - 2026-08-25
- Monitors with free public status pages /m/<id> + shields badges /m/<id>/badge.svg
- rss-watch bridge, Prometheus /metrics, /llms.txt agent index

## v1.8-v1.9 - 2026-08-25
- x402 paid tier live: POST /tools/batch $0.01, premium scan $0.03, deep-backtest $0.05
- Price alerts engine, daily digests, signed webhooks (HMAC X-Signature) with retry
- Live dashboard, landing page, feed.rss of resolved paper trades

## v1.0-v1.7 - 2026-08-2x
- 14 core utils, market lab (signal/backtest/quote/history/correlation/riskparity/sim-portfolio)
- Autonomous paper-trading loop: gen /2h, resolve /30min vs Binance; /tools/market/expectancy
