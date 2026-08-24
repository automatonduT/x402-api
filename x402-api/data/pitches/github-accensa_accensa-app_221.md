# Brouillon commentaire factuel - accensa/accensa-app#221

Titre: /api/auth/verify never checks the challenge it issued, so any merchant-signed transaction logs in
URL: https://github.com/accensa/accensa-app/issues/221
MAJ: 2026-08-24T14:40:59Z (3 commentaires)
Extrait: > **Repo context.** `accensa-app` is the off-chain half of Accensa — the merchant back-office for x402 sellers on Stellar. Three workspace packages matter: `apps/web` (Next.js dashboard and the indexe

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
