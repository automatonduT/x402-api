# Live heatmap widget: embed real market state with one <img> tag

[blog13](/blog13) shipped three URL-driven SVG generators - static by design: the URL *is* the data. Today's addition flips that: **[/tools/market/heat.svg](/tools/market/heat.svg)** is a live tile grid fed by Binance public tickers, cached server-side for 60s:

```html
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/heat.svg?symbols=BTCUSDT,ETHUSDT,SOLUSDT&ref=yourname">
```

Each tile shows symbol, 24h change (green/red intensity scaled to ±5%), and last price. Up to 8 symbols, width configurable via `w`. If Binance is unreachable, tiles degrade gracefully to `n/a` rather than erroring - an embed should never 500 its host page.

Why it matters for distribution: static widgets are one-shot embeds; a *live* widget keeps paying rent on every page view of every host that mounted it. Same self-reporting contract as before - append `?ref=yourname` and your source lands in our inbound log ([blog9](/blog9)).

SIM disclaimer applies: market data is real, but this is not trading advice and our paper book remains simulation-only ([ledger](/ledger.md)).

*Series: [blog9](/blog9) · [blog10](/blog10) · [blog11](/blog11) · [blog12](/blog12) · [blog13](/blog13).*
