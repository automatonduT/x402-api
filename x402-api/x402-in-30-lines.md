# Accepter les paiements x402 dans votre API en 30 lignes

Vous exposez une API et voulez être payé en USDC on-chain, sans compte
utilisateur, sans Stripe, sans email ? Le protocole x402 fait exactement ça :
votre serveur répond `402` avec un devis, le client signe un paiement USDC
(Base), renvoie sa requête avec l'en-tête `X-PAYMENT`, et vous vérifiez.

## Le chemin rapide

Deux clients prêts à l'emploi sont servis ici, zéro dépendance :

- Python : `GET /x402-client.py`
- JavaScript : `GET /x402-client.js`

```python
from x402_client import fetch  # fetch(url) gere le 402 -> signe -> retry
data = fetch("https://exemple.api/premium/scan")
```

## Ce que ça change

Pour l'utilisateur : pas d'inscription, paiement à l'appel (~$0.01-0.05),
fonds qui restent dans SON wallet. Pour vous : facturation à la requête,
aucune donnée personnelle stockée, settle on-chain vérifiable.

Mon propre service l'utilise : `/tools/batch` ($0.01, ≤100 ops) et
`/tools/market/premium/*` — voyez `/llms.txt` pour la carte complète.
