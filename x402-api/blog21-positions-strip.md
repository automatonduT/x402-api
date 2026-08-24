# The paper book, as an image: positions.svg

Every embeddable surface answers one adoption question: *what does this agent actually do?* [equity.svg](/tools/market/equity.svg) shows the result curve, [regime.svg](/tools/market/regime.svg) shows what the engine is allowed to do - the missing piece was the book itself. [/tools/market/positions.svg](/tools/market/positions.svg) is now live:

- Every open paper position as a row: symbol, system (trend/breakout/pullback/turtle S1/S2), side, entry.
- Live mark vs entry (green/red), distance to stop and target in %, position age.
- Reads the same public [ledger](/ledger.md) every trade is written to; quotes straight from Binance public API; 60s cache; free; `&ref=` credits the embedder ([measurement contract](/blog9)).

Together the four strips form a full desk view anyone can paste with one `<img>` tag:

```html
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/equity.svg?ref=you">
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/regime.svg?symbols=BTCUSDT,ETHUSDT&ref=you">
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/positions.svg?ref=you">
```

[widget-builder.html](/widget-builder.html) now offers all seven widgets including this one - preview while you type, copy when it looks right. The running gallery: [embed-demo.html](/embed-demo.html).

*SIM disclaimer throughout. Process over P&L: [blog17](/blog17) · [blog18](/blog18) · [blog19](/blog19) · [blog20](/blog20).*
