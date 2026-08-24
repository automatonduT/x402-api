# Brouillon commentaire factuel - Vellar-Wallet/vellar-sdk#200

Titre: docs: unbreak the hackathon onboarding path
URL: https://github.com/Vellar-Wallet/vellar-sdk/pull/200
MAJ: 2026-08-24T14:43:20Z (1 commentaires)
Extrait: Companion to #199 (SDK 0.6.1). Fixes every docs finding from the DX audit so a participant can go from `npm install` to a settled payment without leaving the paved road. **Quickstart (B1)** - New inst

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
