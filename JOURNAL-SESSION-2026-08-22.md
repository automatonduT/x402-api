# 📖 JOURNAL DE SESSION — automaton-alpha
> Discussion complète avec ox-alpha (DeepSeek Harness) — 22-23 août 2026
> Ce fichier documente TOUTE la mise en place, les incidents et l'état actuel.

---

## 1. 🎯 Objectif initial

Configurer **Automaton** (Conway Research v0.2.1) — l'IA souveraine qui doit gagner sa propre existence — avec :
- Petit capital réel : **3 USDC sur Base** ✅ envoyés
- Cerveau gratuit : **stealth/ox-alpha via OpenRouter** ✅ (le même modèle que ox-alpha !)
- Stratégie : maximiser le gratuit → apprendre le trading (paper) → micro-investissements court terme

## 2. 🔑 Configuration installée

### Fichiers dans `~/.automaton/`
| Fichier | Rôle |
|---|---|
| `.env` (chmod 600) | Clé OpenRouter `sk-or-v1-a6d...e00` (tier gratuit, validée) |
| `inference-providers.json` | ox-alpha (3 tiers, gratuit, 1M ctx, tools) + nemotron fallback |
| `automaton.json` | name=automaton-alpha, wallet `0x466a...DEda`, inferenceModel=stealth/ox-alpha, treasury serré (max 500c/transfert, réserve 200c) |
| `heartbeat.yml` | Sparsé pour le gratuit : health/3h, review/6h, ledger 2x/jour |
| `SOUL.md` | Âme + corrections créateur (URL tunnel, stratégie 3 phases) |
| `state.db` | Mémoire SQLite : 105+ turns, inbox, skills, heartbeats |
| `wallet.json` | Clé privée EVM — adresse `0x466a47E5E38F8b4dd9423189509d8c595f38DEda` |
| `experiments.md` | Ledger public des expériences (aussi sur `/ledger.md`) |

### Wallet
- **3 USDC reçus et vérifiés on-chain sur Base** ✅
- ⚠️ **0 ETH** → aucun envoi on-chain possible tant que pas de gaz (recevoir marche)
- Réserve constitutionnelle $2 → déployable ≈ $1

## 3. 🔧 Les 3 patches appliqués au code (dist/)

Le repo tourne en **mode local dégradé** (pas de clé Conway — leur provisioning SIWE est cassé côté serveur, erreur 401 nonce) :

1. **`dist/index.js`** : clé Conway optionnelle (warn au lieu de `exit(1)`), `effectiveApiKey` partout
2. **`dist/agent/loop.js`** :
   - Sentinelle balance `-1` (→ tier "dead" = bug Conway) remplacée par `200` cents ($2, mode économe)
   - Client unifié **OpenRouter ox-alpha** branché comme exécuteur principal des tours (mapping tiers survie→modèle : high/normal→reasoning, low_compute→fast, critical/dead→cheap)
3. **Scripts** : `start-automaton.sh`, `stop-automaton.sh`, `monitor.sh` (follow/status)

> ⚠️ Si le repo est re-cloné/rebuild : ré-appliquer `/tmp/repatch-automaton.js` puis `node --check`.

## 4. 🌍 Infrastructure

- **Tunnel cloudflared** (quick tunnel, binaire dans `/tmp/cloudflared`) :
  `https://forge-fax-acquired-second.trycloudflare.com` → localhost:4020
- Service du bot : **micro-tools API v1.5** — 29 chemins OpenAPI
  - Gratuits : `/tools/uuid`, `/tools/hash`, `/tools/base64`, `/tools/json/format`, `/tools/json2csv`, `/tools/market/signal`, `/tools/market/quote`, `/health`, `/stats`, `/ledger.md`, `/openapi.json`
  - Payants x402 : endpoints premium (personne n'a encore payé)
- ⚠️ Les quick tunnels trycloudflare sont volatils → si down, relancer :
  `nohup /tmp/cloudflared tunnel --url http://localhost:4020 > /tmp/cloudflared.log 2>&1 &` puis mettre à jour l'URL dans SOUL.md + inbox

## 5. 📈 Stratégie 3 phases (directive créateur, en inbox)

- **Phase A — Gratuit max** : produit, distribution, contenu, inbound $0
- **Phase B — Compétences trading** : paper trading avec vraies données Binance publiques, 20+ trades documentés, module backtest réutilisable (= produit vendable aussi)
- **Phase C — Micro-trading réel** : VERROUILLÉE jusqu'à (1) ETH pour gaz envoyé, (2) espérance positive prouvée sur 20+ trades simulés, (3) règles de risque (max 50% du déployable, stop-loss obligatoire, pas de levier, pas de memecoins)

## 6. 🤖 Ce qu'il a accompli seul (première nuit)

- Produit v1.0 → v1.5 : landing, CORS, docs, blog, JWT decoder, cron explainer, cronlib standalone, ScheduledPing (webhooks cron pour agents sans port), TradeLab
- Trouvé et réparé ses propres bugs (chemins ~/ vs absolu, parser cron MON-FRI, watchdog URL morte, localtunnel binaire disparu)
- Tué EXP#7 (distribution DM) selon sa règle des 2 échecs
- Découvert ses pairs : AgentX, 2 Zyfai rebalancers, registre ERC-8004, ClawNews (injoignable)
- Mis en place son resolver de trades papier auto (heartbeat /30min)

## 7. 🚨 Incident du 23/08 ~00:55

L'utilisateur a **supprimé accidentellement** `automaton-repo/`. Conséquence nulle :
- Le process (PID 58219) tournait depuis la RAM → jamais interrompu
- Repo re-cloné + rebuild + patches ré-appliqués + scripts recréés en ~3 min
- **Leçon** : tout le vital est dans `~/.automaton/` (hors du dossier supprimé)

## 8. 📊 Signaux de déclenchement Phase C (surveillance ox-alpha active, goal 50 rounds)

1. **20+ trades papier résolus avec espérance positive** (compteur : 5 au round 12)
2. **Premier inbound réel non-self ou paiement x402 reçu** ($0.00 à ce jour)
3. **Plan concret bloqué uniquement par l'absence de gaz**

→ Quand un signal apparaît : envoyer **~$1 d'ETH sur Base** à `0x466a47E5E38F8b4dd9423189509d8c595f38DEda`

## 9. 🛠️ Commandes essentielles

```bash
cd "/Users/titouanwajda/open code pentest/geodecrypt/automaton-repo"
./monitor.sh status    # statut complet
./monitor.sh follow    # logs live
./start-automaton.sh   # démarrer
./stop-automaton.sh    # arrêter
node dist/index.js --status
```

Balance on-chain :
```bash
curl -s -X POST https://mainnet.base.org -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","data":"0x70a08231000000000000000000000000466a47E5E38F8b4dd9423189509d8c595f38DEda"},"latest"],"id":1}'
```
(→ diviser le résultat hex par 1e6 = USDC)

## 10. 💡 Notes diverses

- OpenRouter gratuit : ~50 req/jour sur les modèles `:free` (nemotron) — mais **ox-alpha n'y compte pas** (testé : passait avec quota épuisé)
- Coinbase exchange : blocage 72h après achat carte (l'utilisateur a contourné via Coinbase Wallet)
- L'utilisateur finance petit : $3 pour l'instant, posture "essai gratuit de machine à revenus"
- La discussion DSH originale vit dans la session harness ; ce fichier en est l'archive dans le workspace du bot
