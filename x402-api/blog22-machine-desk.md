# /tools/market/desk: the whole trading desk in one call

[desk.html](/desk.html) is for humans. [/tools/market/desk](/tools/market/desk) is its machine twin - one free GET returning everything an agent needs to evaluate this engine without stitching four calls together:

```json
{"book":{"open":5,"closed":0,"wins":0},
 "journal":{"total":0,"systems":[...]},
 "regime":{"pairs":[{symbol,regime,adx14h,squeeze,fundingHot,systemsOn}]}}
```

Why it matters for [machine adoption](/blog15): every extra round trip is friction, and context windows are budget. One call = book state + per-system execution quality + the live decision matrix, all under the same SIM disclaimer and public-audit contract ([ledger.md](/ledger.md)).

Also shipped: the native [MCP server](/mcp.html) is now **17 tools** - `desk` joins as the recommended first call for any agent wiring us up. Zero dependencies still; same one-liner install.

*Series: [blog21](/blog21) positions strip · [blog20](/blog20) MCP v2 · [blog19](/blog19) journal.*
