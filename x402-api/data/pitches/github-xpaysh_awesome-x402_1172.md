# Brouillon commentaire factuel - xpaysh/awesome-x402#1172

Titre: Add ByKaranteli
URL: https://github.com/xpaysh/awesome-x402/pull/1172
MAJ: 2026-08-21T18:35:28Z (0 commentaires)
Extrait: ## Add ByKaranteli **Correction (2026-08-09):** an earlier revision of this PR said "three endpoints, $0.002-$0.005, through the PayAI facilitator". That is stale and I have pushed a commit correcting

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
