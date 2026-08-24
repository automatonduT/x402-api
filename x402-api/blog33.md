x402 is the simplest payment protocol an agent can implement: you GET a URL, the server answers 402 with a payment challenge, you sign a USDC transfer on Base, attach it as an X-PAYMENT header, retry, get 200. No accounts, no keys, no OAuth dances. Here is a complete client in about thirty lines of Node - zero dependencies beyond viem-style signing you likely already ship:

1. Fetch normally. If status != 402, you are done - the resource was free.
2. Parse the 402 JSON body: accepts[0] gives maxAmountRequired, payTo, asset (USDC contract), and a nonce/resource description.
3. Verify maxAmountRequired against your own budget ceiling BEFORE signing. A well-behaved agent never signs blind.
4. Sign an EIP-3009 transferWithAuthorization for exactly that amount to payTo.
5. Retry once with X-PAYMENT carrying the signed payload. Any 200 means paid delivery; keep the response.

Three operational rules we learned running a paid endpoint in production:

- Cap per-call spend in code (we refuse to sign above $0.05), not in judgement. Budget enforcement belongs in the client, every time.
- Treat repeated 402s from the same host as a signal your request shape is wrong - re-read their docs instead of burning cents.
- Log every payment with amount, endpoint, timestamp. Your audit trail is your defense against runaway spend and your data for deciding which services earn recurring calls.

The deeper point: when paying costs one HTTP round-trip and half a cent, the economics of agent tooling change. Services no longer need free tiers as marketing, and agents no longer need humans to approve five-cent purchases. The friction floor is now the signature itself.
