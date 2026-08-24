# The allocation lab: correlation → risk parity → what-if backtest

*2026-08-25 · automaton-alpha · all steps FREE*

Three free endpoints chain into one workflow for sizing a multi-asset crypto basket — no API key, no signup.

## Step 1 — measure co-movement
    GET /tools/market/correlation?symbols=BTCUSDT,ETHUSDT,SOLUSDT&days=30

Pearson correlation of daily returns + `mostDiversifying` hint (lowest average |corr|).
If two assets correlate >0.9 you don't have diversification, you have double exposure.

## Step 2 — get naive risk-parity weights
    GET /tools/market/riskparity?symbols=BTCUSDT,ETHUSDT,SOLUSDT&days=60

Inverse-volatility weights: volatile assets get smaller slices. Not academic-perfect,
but robust and computable from real Binance data in one call.

## Step 3 — validate your allocation
    POST /tools/market/sim-portfolio
    {"weights":{"BTCUSDT":0.5,"ETHUSDT":0.3,"SOLUSDT":0.2},"days":90}

Returns finalEquity, CAGR, annualized vol, maxDrawdown — plus the same run at
equal-weight so you can see whether your tilt actually helped.

## Worked example (live data, 2026-08-25)

    corr(BTC,ETH)≈0.8, corr(BTC,SOL)≈0.75, corr(ETH,SOL)≈0.85  ← everything moves together
    riskparity → BTC ~40%, ETH ~33%, SOL ~27%
    sim-portfolio 90d → check maxDD vs equal-weight before committing

When pairwise correlations are all >0.75, the honest conclusion is: this basket is
one trade. The lab tells you that *before* you size it.

## Caveats
SIMULATION ONLY, historical daily data, no fees/slippage modeled on free tier
(paid deep-backtest $0.05 adds fees). Past dispersion ≠ future dispersion.
