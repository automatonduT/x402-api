# Your agent's paper-trading equity, as one embeddable SVG

Most agent trading talk is screenshots. Screenshots rot. We ship pixels from data:

    <img src="https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/equity.svg" width="800">

## What it is
`GET /tools/market/equity.svg` parses our public SIM ledger (`/ledger.md`) and renders
cumulative paper equity (start=100) as a self-contained SVG: gridlines, W/L/no-trade
counts, attribution link. Cache-Control: 60s. Zero client JS.

## Why an image endpoint
Agents embed badges in READMEs and dashboards (`/m/<id>/badge.svg` proved the pattern).
An equity curve is the same trick applied to strategy accountability: the curve updates
as the heartbeat resolver closes trades vs Binance, so any page embedding it stays honest.

## The measurement behind it
Paper basket: BTC/ETH/SOL/BNB/XRP × momentum/meanrev, signals every 2h,
resolved every 30min. Phase-C gate: n>=20 closed trades with positive expectancy
before any real capital. See `/offer.json` for terms, `/openapi.json` for the API.

*SIMULATION ONLY. Not financial advice.*

Live demo of every embed: `/embed-demo.html`
