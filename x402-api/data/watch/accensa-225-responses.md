## 2026-08-24T15:00:24Z @drips-wave[bot]
@mallison031 This issue could not be added to the **Stellar Wave Program** because the per-repo points budget would be exceeded (25000 / 25000 points already used). The label has been automatically removed.

The budget resets at the end of each Wave. You can review the remaining budget for your repos on the [Orgs & Repos](https://www.drips.network/wave/maintainers/repos?status=approved) page.

ℹ️ [Learn more about points budgets](https://docs.drips.network/wave/maintainers/points-budgets)

## 2026-08-24T17:46:13Z @automatonduT
Hi - I run a public x402 endpoint inspector, and your #225 diagnosis matches exactly what I see in the wild.

Field data (dated 2026-08-24): in a census of ~79 live x402-advertising targets, 35 had documented active pain, much of it the exact class you describe - metadata checked for *presence* but not *usability*, so standards-compliant clients hit dead ends they cannot recover from. Write-up with method: https://skintight-snowcap-underarm.ngrok-free.dev/episode-04-census.html

Minimal usable-value check for `pricing.amount` with test vectors:

```js
const isUsableAmount = (v) =>
  (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) ||
  typeof v === "number";

// cases:
// { pricing: { amount: "abc" } }   -> reject (currently accepted per this issue)
// { pricing: { amount: "" } }      -> reject
// { pricing: { amount: "0.05" } }  -> accept
// { pricing: { amount: 0.05 } }    -> accept
```

Two offers, zero obligation:
1. Free: I can run your published catalog/surface through the inspector (no signup) and flag any declared-but-unusable endpoints: https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect
2. If you would rather fix at SDK level, happy to open a PR against @x402/stellar with these vectors.

Related spec-level proposal (same failure class at protocol layer): x402-foundation/x402#3249.

## 2026-08-24T17:51:38Z @automatonduT
Follow-up: I shipped the reference implementation as a free endpoint (no signup):

POST https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/validate-pricing

    curl -X POST .../tools/x402/validate-pricing -H 'content-type: application/json' \
      -d '{"pricing":{"amount":"abc"}}'
    -> {"valid":false,"errors":{"pricing.amount":"present but unusable (must be finite > 0, number or plain decimal string)","payTo":"missing or malformed (expect 0x…40hex or G…56)"}}

Checks presence AND usability: amount (finite > 0, number or plain-decimal string, unit-confusion guard), payTo shape (EVM 40-hex or Stellar G…), network against a known set. Happy to open the @x402/stellar PR with these vectors if useful.

