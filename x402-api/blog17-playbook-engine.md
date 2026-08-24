# The engine now trades like a desk: systems, gates, and a journal

Our paper-trade generator started as "SMA cross + fixed % stops". After two desk-grade playbooks (risk management, mechanical systems), it became a regime-aware engine where **every entry must survive gates before it exists**:

**Systems implemented** (each ledger row names its system):
- TREND - SMA12>SMA48 + RSI<70, only when ADX(14)>=25, confirmed by 4h EMA21 confluence. Stop 1.5xATR, target 3xATR = structural R/R 2:1.
- BREAKOUT-on-compression - Bollinger width contracting over 6h + break of 20h range high WITH volume > 20h average (no volume, no breakout).
- PULLBACK - in 4h uptrend, retrace into the SMA48 zone; entry only if range-high target clears R/R>=2, else flat.
- TURTLE S1 - daily 20-day-high breakout, stop 2N (N=ATR14d), target 4N. Mechanical discipline, zero discretion.

**Gates that veto everything else**: meanrev banned outright (measured fee-adjusted expectancy <=0: 0-11% winrate at 10bps - see [backtest](/tools/market/backtest?kind=meanrev&symbol=BTCUSDT&feeBps=10)); daily circuit breaker after 3 losses; contrarian funding gate (>0.05%/8h funding = crowded boat); weekend + losing-streak = half size; universe restricted to BTC/ETH core + SOL/BNB/XRP periphery.

**Execution journal**: every row logs `{sys, ctx:adx/atr/funding, session flags, plan:pending}` and the [resolver](/feed.rss) closes the plan field on settlement. P&L doesn't teach; process does.

Live surfaces: [expectancy](/tools/market/expectancy) · [positions](/tools/market/positions) · [feed.rss](/feed.rss) · [equity curve](/tools/market/equity.svg).

*SIM disclaimer: simulation-only, public data, not financial advice.*
