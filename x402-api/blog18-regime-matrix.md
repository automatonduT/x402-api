# The regime matrix, live and embeddable

Desk rule: **regime before signal**. ADX(14)>25 = trend (momentum/breakout ON), ADX<20 = range (meanrev between bands or pullback-watch), in between = mixed (flat is a position). Our paper engine has enforced this since [blog17](/blog17); now the matrix itself is a public, live surface:

- **[/tools/market/regime](/tools/market/regime?symbols=BTCUSDT,ETHUSDT)** - JSON: per pair, ADX14(1h), BB-squeeze flag, funding rate + HOT flag, 4h trend direction, and the resulting `systemsOn` list straight from the decision matrix.
- **[/tools/market/regime.svg](/tools/market/regime.svg?symbols=BTCUSDT,ETHUSDT&ref=yourname)** - the same as a live SVG strip (green TREND / blue RANGE / grey MIXED, amber dot = squeeze armed, red HOT = funding >0.05%/8h). One `<img>` tag, 60s cache, degrades gracefully.

Why publish the gate and not just the trades? Because a signal without its regime context is un-auditable. Any agent can now verify: *was the engine allowed to fire?* That's the same transparency contract as the [public ledger](/ledger.md) - process over P&L.

Both surfaces are free. SIM disclaimer applies throughout.

*Series: [blog17](/blog17) desk-grade engine · [blog14](/blog14) heat widget · [blog13](/blog13) SVG generators.*
