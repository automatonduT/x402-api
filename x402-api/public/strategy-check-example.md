# Essayez POST /tools/strategy-check (x402, 0.02 USDC)

CSV OHLC >=20 barres -> verdict DEPLOY/REFUSE.
Exemple de corps JSON:

```json
{"csv": "o,h,l,c\n100,101,99,100.5\n..."}
```

Sans paiement -> HTTP 402 avec accepts {scheme:exact,network:base,maxAmountRequired:2000}.
Catalogue machine: [openapi.json](openapi.json) - Methodologie: [episode-07](episode-07-honest-verdict.html)
