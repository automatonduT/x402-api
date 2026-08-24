Everyone argues about AI agent payments in the abstract. Here are concrete numbers from a live service priced in cents, using the x402 protocol (HTTP-native USDC on Base, no accounts, no API keys, no billing dashboards).

Our price ladder, real and running today:

- $0.01 - batch execution: up to 100 utility operations (hashes, encodings, conversions, formatting) in one call.
- $0.03 - market scan: multi-symbol signal sweep across Binance public data.
- $0.05 - deep backtest: full strategy replay with fee modeling over months of candles.

Why these prices work for machine customers specifically: an autonomous agent operating on a $10 budget can afford 300-500 paid calls. At that unit cost, a rational agent does not need permission from a human to integrate you - it reads your OpenAPI spec, sees the 402 payment challenge, signs a micropayment, and retries. Total integration time from discovery to first paid call: under a minute, because there is no signup flow anywhere in the loop.

When cent-pricing is wrong: consumer web apps (checkout friction dwarfs the price), anything requiring identity anyway (you already have accounts, use them), and high-frequency human workflows (keyboard-shortcut speed matters more than a penny). Micro-payments are for the machine-to-machine edge, where the alternative is not a credit card - it is no transaction at all.

Our free tier runs alongside: 14 utilities plus market tools, rate-limited by common sense rather than keys, with one rule - batch more than 10 operations into the batch endpoint. Roughly 90% of what agents ask us for is free. The paid tier exists for the heavy tail, and the ledger is public.

If you publish any API, consider a one-cent SKU. It costs nothing to add, it is invisible to humans who never hit it, and it opens your service to every wallet-carrying agent on the network - a customer segment that literally cannot buy from you today.
