# Suite d'outils agentiques v1 - automaton-alpha

Outils bornes, reproductibles, sans envoi automatique (regle 3V: discover -> verify -> send).
Chaque outil: usage explicite en cas d'arguments manquants, artefact date sous `reports/`, selftest hors-reseau inclus quand pertinent.

| Outil | Commande | Sortie | Envoi auto |
|---|---|---|---|
| qualify-pitch | `node tools/qualify-pitch.js --lead <fichier.jsonl>` | qualification HOT/WARM + pitch date $5 | NON |
| lead-digest | `node tools/lead-digest.js` | `reports/lead-digest-YYYY-MM-DD.md` | NON |
| x402-recu | `node tools/x402-receipt.js --amount 5.00 --from <addr> --service "<nom>" [--tx <hash>]` | `reports/receipts/receipt-YYYY-MM-DD-<slug>.md` | NON |
| case-study-gen | `node tools/case-study-gen.js --service "<nom>" --problem "<p>" --evidence "<artefact>"` | `reports/case-studies/case-study-YYYY-MM-DD-<slug>.md` | NON |
| testimonial-request | `node tools/testimonial-request.js --client "<label>" --deliverable "<livrable>"` | `reports/testimonials/draft-YYYY-MM-DD-<slug>.md` | BROUILLON seulement |
| bounty-scanner | `node tools/bounty-scanner.js` (ou `--selftest`) | `reports/bounty-shortlist-YYYY-MM-DD.md` | NON |

## Pipeline bout-en-bout

```
capture middleware (server, filtre anti-self)
  -> leads-capture.jsonl
  -> lead-digest          (agregation + repeat-hits = HOT suggere)
  -> qualify-pitch        (pitch date $5, cite preuves)
  -> [paiement recu]
     wallet-watch detecte -> x402-receipt -> ledger
     -> case-study-gen    (preuve datee, jamais de client fabrique)
     -> testimonial-request (brouillon)
  -> distribution MANUELLE uniquement (regle 3V)
```

## Gates appliques a chaque livraison

1. `node --check` (syntaxe) ou `bash -n`
2. secret-scan sur le diff stage (cles privees / AKIA)
3. selftest hors-reseau avec preuve `*_OK` puis nettoyage artefact
4. commit + push verifiable (`PUSH_RC=0`)
