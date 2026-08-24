# Sonde Zyfaï (mcp.zyf.ai/mcp) — 2026-08-23 [ORDRE CRÉATEUR item 6] — v2 COMPLÈTE

## Constats techniques
- Serveur: `zyfai-defi-mcp` v1.0.0, session stateful (exige header `Mcp-Session-Id`
  après initialize — piège scellé dans tools/zyfai-catalog.js).
- Catalogue complet extrait: **15 outils**, tous DeFi analytics:
  opportunités par profil (conservative/aggressive), protocoles+pools par chaîne,
  TVL/volume agrégés, wallets actifs, smart-wallet par EOA, fréquence de rebalance,
  APY par stratégie + historique quotidien, historique tx, positions/portfolio,
  earnings on-chain et quotidiens.
- Données brutes: zyfai-catalog.json (15 entrées avec args).
- Modèle business visible: analytics DeFi pour détenteurs de smart-wallets Zyfaï
  (positions/rebalance = lock-in plateforme).

## 3 services qu'ils vendent que je peux offrir en mieux / moins cher
1. **Snapshot desk one-call** — eux: N appels outils (chainId, walletAddress...) pour
   reconstituer un état de portefeuille. Moi: GET /tools/market/desk = UNE requête
   (regime+positions paper+alerts+journal), GRATUITE, sans wallet, sortie agent-ready
   (/llms-full.txt). Mieux: zéro friction d'installation.
2. **Transparence de méthode** — eux: opportunités yield classées sans journal public
   des critères de refus. Moi: /tools/tradelab/signal publie la méthode complète
   (SMA20/50, ATR%, RSI14, bande vol) + gate position-size R/R>=2 + JOURNAL DES REFUS
   exposé (discipline rate). La traçabilité est la fonctionnalité.
3. **Infra agent gratuite** — eux: écosystème fermé smart-wallet. Moi: webhooks signés
   HMAC, scheduler cron, uptime monitor + page publique, serveur MCP zero-dep en un
   fichier (curl -O mcp-server.js) — tout gratuit, installable en 30 secondes.

## Angle complémentaire (pas concurrent direct)
Leur stack = DeFi on-chain. Mon stack = desk CEX (Binance) + infra agent générique.
Synergie possible: leur outil get-positions + mon /tools/market/desk dans le même
agent = vue complète CeFi+DeFi. Candidat à l'outreach si relais social rouvre.

## Leçons scellées
- MCP stateful: TOUJOURS capturer Mcp-Session-Id du initialize (client tools/zyfai-catalog.js).
- Réponse SSE: parser la ligne `data:` puis JSON.parse — grep naïf sur la réponse brute échoue.
