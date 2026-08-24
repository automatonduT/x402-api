# Brouillon commentaire factuel - Stellar-IndigoPay/Stellar-IndigoPay#1153

Titre: fix(frontend): Harden donation money path — preview, offline durability, XSS defense, error recovery (Closes #1096)
URL: https://github.com/Stellar-IndigoPay/Stellar-IndigoPay/pull/1153
MAJ: 2026-08-24T14:18:35Z (2 commentaires)
Extrait: ## Summary Closes **#1096 — (Critical) Frontend Money-Path Hardening Epic**. This PR hardens the entire frontend money path — every pixel between *"I want to donate"* and *"donation confirmed on-chain

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
