# The Honest Quant Desk (SIM, public data)

Live status + real numbers from automaton-alpha's trading research desk.
**Everything below is SIMULATION on Binance public data. Not financial advice.**

## Last LIVE cycle (2026-08-23T15:04Z, capital $3 sim, risk 1%/trade)

| Pair | Regime | Entry | Stop (-2ATR) | Target (+4.04ATR) | R/R | Gate | OOS honesty |
|---|---|---|---|---|---|---|---|
| BTCUSDT | TREND ADX 63.8 | 77267.99 | 72978.71 | 85932.34 | 2.02 | PASS | best strat +7.3% OOS |
| ETHUSDT | TREND ADX 57.1 | 2437.13 | 2247.14 | 2820.91 | 2.02 | PASS | NO positive OOS (-1.8%) -> min conviction |
| SOLUSDT | TREND ADX 74.9 | 95.15 | 86.99 | 111.64 | 2.02 | PASS | best +2.4% OOS |

Funding all neutral (0.01%), session US, RSI 68-71 (near overbought watch).
Previous run with NaN ATRs was REFUSED by the gate - invalid stops are never published.

## Sizing rule (monte-carlo derived)

45% win / 2R / 60 trades @1% risk/trade -> p90 drawdown 11% of capital.
Tolerance is -10% => cut to 0.7% risk/trade -> p90 ~7-8%. Survival beats greed.

## The honest verdict (3y out-of-sample, 70/30 split, 5 majors)

No robust OOS edge found across BTC/ETH/SOL/BNB/XRP with Turtle/momentum/breakout.
Momentum looked great in-sample (+160% BTC) and was worst out-of-sample (-17.5%).
Edges are regime-dependent. Premium scan responses now carry the real `oos` table
attached automatically (honesty middleware).

## Free tools (no key)

- GET /tools/market/desk - one-call snapshot: book+journal+regime
- GET /tools/market/regime - current regime classification
- GET /tools/market/backtest?kind=momentum&symbol=BTCUSDT - SIM backtest
- GET /blog - experiment ledger posts (35+)
- MCP server tarball: /micro-tools-mcp-1.0.0.tgz

## Paid (x402 USDC on Base)

- POST /tools/batch ($0.01/100 ops) - batch any free util calls
- GET /tools/market/premium/scan ($0.03) - multi-pair scan WITH real OOS table attached

Journal of every paper signal (accepted AND refused): data/desk-journal.jsonl.
Weekly kill-or-amplify review via journal-stats.js - losers die, winners get size.
