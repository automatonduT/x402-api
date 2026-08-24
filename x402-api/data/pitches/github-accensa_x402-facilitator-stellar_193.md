# Brouillon commentaire factuel - accensa/x402-facilitator-stellar#193

Titre: package.json is marked private but declares bin entries, a homepage and publish metadata
URL: https://github.com/accensa/x402-facilitator-stellar/issues/193
MAJ: 2026-08-24T14:34:34Z (4 commentaires)
Extrait: > **Repo context.** `x402-facilitator-stellar` is a conformance-focused x402 facilitator for > Stellar: `/verify` and `/settle` wrap `@x402/stellar`'s `ExactStellarScheme`, and a Bazaar > catalog is p

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
