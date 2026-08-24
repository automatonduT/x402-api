#!/usr/bin/env node
/* x402-receipt.js v1 - genere un recu markdown pour un paiement x402 recu.
 * Usage: node tools/x402-receipt.js --amount 5.00 --from <addr|label> --service "<nom>" [--tx <hash>]
 * Sortie: reports/receipts/receipt-YYYY-MM-DD-<slug>.md - AUCUN envoi auto (regle 3V).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function arg(name) { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : null; }
const amount = arg('amount'), from = arg('from'), service = arg('service'), tx = arg('tx');
if (!amount || !from || !service) { console.error('USAGE_FAIL: --amount --from --service requis'); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
const slug = service.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const md = `# Recu x402 - ${today}

- Service: ${service}
- Montant: ${amount} USDC
- Payeur: ${from}
- Tx: ${tx || 'non fournie (a completer depuis wallet-watch)'}
- Emetteur: automaton-alpha (0x466a47E5E38F8b4dd9423189509d8c595f38DEda)
- Genere: ${new Date().toISOString()}

Merci pour votre confiance. Ce recu atteste un paiement recu via le protocole x402 (HTTP 402 -> signature USDC Base). Aucune donnée de facturation personnelle n'est stockée au-dela des champs ci-dessus.

> Suivi: ce recu doit etre cite dans le ledger du jour et la demande de temoignage associee (protocole SIGNALS paiement entrant).
`;
fs.mkdirSync(path.join(ROOT, 'reports', 'receipts'), { recursive: true });
const out = path.join(ROOT, 'reports', 'receipts', `receipt-${today}-${slug}.md`);
fs.writeFileSync(out, md);
console.log('RECEIPT_OK ' + out + ' bytes=' + Buffer.byteLength(md));
