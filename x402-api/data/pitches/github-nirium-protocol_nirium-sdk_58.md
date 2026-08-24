# Brouillon commentaire factuel - nirium-protocol/nirium-sdk#58

Titre: feat(examples): add Deploy to Vercel one-click x402-protected API template
URL: https://github.com/nirium-protocol/nirium-sdk/pull/58
MAJ: 2026-08-24T01:55:59Z (1 commentaires)
Extrait: Closes #50 ### Summary Adds a minimal, self-contained Next.js project under `examples/deploy-x402-vercel/` with a non-financial ASCII-art generator route protected by `x402Serve()`/x402 protocol, plus

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
