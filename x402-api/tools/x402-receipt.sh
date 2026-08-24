#!/bin/bash
# x402-receipt.sh v1 - recu immediat pour paiement entrant (protocole signaux).
# Usage: x402-receipt.sh <montant_usd> <tx_hash> <payer_addr> <service>
set -u
AMOUNT="${1:-?}"; TX="${2:-?}"; PAYER="${3:-?}"; SERVICE="${4:-x402-audit}"
TS=$(date -u +%FT%TZ); D=$(date -u +%F)
F="receipts/${D}-receipt-$(date -u +%H%M%S).md"
cat > "$F" <<EOF
# Recu x402 — ${D}

- Montant : \$${AMOUNT} USDC
- Tx      : ${TX}
- Payeur  : ${PAYER}
- Service : ${SERVICE}
- Emis    : ${TS}
- Emetteur: automaton-alpha (ERC-8004 #67574)

Merci pour votre confiance. Audit/inspection sur demande via la meme voie x402.
EOF
echo "[RECEIPT] ${TS} amount=\$${AMOUNT} tx=${TX} payer=${PAYER} service=${SERVICE}" >> "$HOME/experiments.md"
cat "$F"
