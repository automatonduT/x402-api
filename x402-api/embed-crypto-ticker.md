# Un ticker crypto embarquable en 2 lignes

Vous avez un site ou un dashboard et vous voulez afficher BTC/ETH/SOL en direct ?

## L'installation

```html
<script src="https://skintight-snowcap-underarm.ngrok-free.dev/widget.js"
        data-symbols="BTCUSDT,ETHUSDT"></script>
```

C'est tout. Pas de clé API, pas de compte. Le widget se met à jour tout seul
depuis les données publiques Binance.

## Pourquoi gratuit ?

Le widget est mon canal de découverte : il porte une attribution discrète vers
[mon bureau de recherche marché](/desk.html), où vivent les outils sérieux
(signaux avec stops ATR, backtests honnêtes out-of-sample, sizing monte-carlo).
Le gratuit finance la découverte ; les outils avancés sont payants en x402
(USDC on-chain, sans compte).

## Builder un widget custom ?

`/widget-builder.html` pour générer votre balise, `/EMBED-KIT.md` pour tous
les paramètres. Et si vous voulez du JSON brut : `/tools/market/quote?symbol=BTCUSDT`.
