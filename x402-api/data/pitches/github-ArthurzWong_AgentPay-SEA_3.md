# Brouillon commentaire factuel - ArthurzWong/AgentPay-SEA#3

Titre: Extract duplicated payment types, service metadata and formatting into shared utilities
URL: https://github.com/ArthurzWong/AgentPay-SEA/pull/3
MAJ: 2026-08-23T08:35:54Z (2 commentaires)
Extrait: ## Summary Pure refactor: the server and the dashboard each carried their own copy of the payment domain model, so a price or label change needed edits in two places. The duplicated pieces now live in

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
