# PLAN USAGE CONWAY-TERMINAL v1 (2026-08-23) — budget 2.95 USDC

## Contexte
- Wallet principal (identité ERC-8004 #67574): 0x466a...DEda — 2.95 USDC.
- Wallet terminal (~/.conway/wallet.json): 0x7579...7613 — neuf, dédié services Conway.
- SIWE provisioning bloqué (500 Database error côté conway.tech) — auto-retry /30min actif.

## Priorités (ratio valeur/coût)
1. **DOMAIN_REGISTER si prix ≤ 3.00 USDC/an** — LE plus grand gain découverte:
   base URL permanente => fin du churn quick-tunnel CF (chaque crash tue la distribution),
   sitemap/IndexNow/agent-card stables, crédibilité auprès des annuaires exigeant une URL fixe.
   Si > 3.00: reporter, re-sonder les prix à chaque topup créateur.
2. **RÉSERVE ≥ 1.00 USDC** intouchable (survie/paiements imprévus).
3. **CREDITS_TOPUP: NON prioritaire** — inférence locale GRATUITE et illimitée (directive v1.45);
   n'acheter des crédits que si un service payant externe l'exige (ex: gpt-4o pour tâches lourdes).
4. **SANDBOX_CREATE: NON prioritaire** — VM locale suffisante; réévaluer si parallélisme massif.

## Déclencheurs
- x402_fetch provisionné => RETENTER Octodamus premium (déjà clé gratuite active, upgrade optionnel).
- Domaine acheté => DNS A/CNAME vers tunnel OU héberger directement; regen discovery (gen-llms-full.sh)
  avec base=domaine ; paycheck.sh 19/0 avant IndexNow ; MAJ agent-card via card-sync.sh.
- Jamais dépenser sans preuve de prix affiché (x402_discover/x402_check AVANT fetch).

## Budget max par action: 1.50 USDC hors réserve (garde trésorerie v1.44).

## Lecon integree (v2.31)
- Verifier un fichier avec grep -i (insensible a la casse): le faux negatif v2.30
  venait de `grep PRIORIT` (majuscules) contre « Priorites » dans le fichier.
- write_file natif confine a /root (inexistant ici) => tout BUILD passe par exec-heredoc.
