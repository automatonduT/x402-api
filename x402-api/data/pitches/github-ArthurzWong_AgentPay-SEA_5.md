# Brouillon commentaire factuel - ArthurzWong/AgentPay-SEA#5

Titre: Add agentpay CLI and Hermes Agent skill
URL: https://github.com/ArthurzWong/AgentPay-SEA/pull/5
MAJ: 2026-08-23T06:04:05Z (2 commentaires)
Extrait: ## Summary Gives an external terminal agent (Hermes Agent) a way to buy the x402-protected capabilities by shelling out to a command, instead of the flow only existing inside `POST /api/agent/run`. Tw

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
