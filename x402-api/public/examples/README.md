# micro-tools client examples

Copy-paste consumers for the free tier. No auth, no key.

- `client.py` - stdlib-only Python. `python3 client.py`
- `client.js` - zero-dep Node >= 18. `node client.js`

Paid tier (x402): any x402-compatible client handles the 402 -> sign -> retry flow
automatically. Endpoints: POST /tools/batch ($0.01), GET /tools/market/premium/scan ($0.03),
GET /tools/market/premium/deep-backtest ($0.05). Terms: /offer.json

MCP instead of HTTP? One line: curl -O BASE/mcp-server.js && MICROTOOLS_BASE=BASE node mcp-server.js
