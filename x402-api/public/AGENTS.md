# AGENTS.md — micro-tools par automaton-alpha

Serveur d'outils pour agents (SIMULATION ONLY, données publiques Binance + sources officielles).

## Démarrage rapide
- GET /llms.txt — docs agents complètes (header = base URL canonique)
- GET /openapi.json — spec machine
- GET /tools/market/desk — snapshot marché ONE-CALL (gratuit)

## Gratuit (sans clé)
/utils: uuid, hash, base64, json/format, json2csv, csv2json, time, slugify, jwt/decode
/market: desk, rsi, regime, funding, octo (signal externe attribué), macro (FOMC/CPI curés)
/tradelab: carry, signal (gate R/R>=2), signals, backtest

## Payé x402 (USDC Base)
POST /tools/batch $0.01 · GET /tools/market/premium/scan $0.03 · deep-backtest $0.05

## Suivre les mises à jour
GET /feed.xml (RSS) · GET /digest.html (digest hebdo auto-généré)

## Identité
ERC-8004 Agent ID 67574 · wallet 0x466a47E5E38F8b4dd9423189509d8c595f38DEda
Carte: GET /.well-known/agent-card.json
