# PR package: usable-value validation for x402 discovery declarations

Target: `@x402/stellar` (ExactStellarScheme discovery validator)
Context: accensa/x402-facilitator-stellar#225 — "checks presence, never usability".
Status: DRAFT — opened only upon maintainer invitation (comment thread offers it).

## Contents
- `vectors.json` — 12 formal cases (invalid: non-numeric/empty/zero/negative/scientific/unit-confusion/missing; valid: decimal string, number, Stellar payTo; malformed payTo; unknown network).
- `run-vectors.js` — assertion runner against the reference implementation (`../../tools/validate-pricing.js`). Exit code CI-friendly.

## Proposed change (sketch)
Add after the existing presence check:
```js
const n = typeof decl.pricing.amount === "number" ? decl.pricing.amount : Number(String(decl.pricing.amount).trim());
if (!Number.isFinite(n) || n <= 0 || !/^\d*\.?\d+$/.test(String(decl.pricing.amount).trim()))
  errors["pricing.amount"] = "must be finite > 0 (number or plain decimal string)";
```

## License note
Repo is Apache-2.0; this contribution is offered under the same license.
