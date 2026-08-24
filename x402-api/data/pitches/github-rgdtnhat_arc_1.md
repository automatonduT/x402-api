# Brouillon commentaire factuel - rgdtnhat/arc#1

Titre: Tessera — trustless pay-per-use commerce for AI agents on Arc
URL: https://github.com/rgdtnhat/arc/pull/1
MAJ: 2026-08-24T13:55:59Z (0 commentaires)
Extrait: ## What this is **Tessera** turns an ordinary `402 Payment Required` into a **trustless, autonomous purchase** settled on [Arc](https://docs.arc.io) in USDC. An AI agent can pay a service it has *neve

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
