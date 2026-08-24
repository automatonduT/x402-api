# Brouillon commentaire factuel - solana-foundation/pay-kit#293

Titre: fix(x402): require decimals for SPL payments in the Go client
URL: https://github.com/solana-foundation/pay-kit/pull/293
MAJ: 2026-08-24T14:35:56Z (1 commentaires)
Extrait: ## What The Go x402 exact client defaults `extra.decimals` to 6 when a challenge omits the field, then feeds that default straight into `transferChecked`. ## Why `parseEntry` fills `Extra.Decimals = 6

## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)
Contexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint "payant" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.
