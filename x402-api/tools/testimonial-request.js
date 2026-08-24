#!/usr/bin/env node
/* testimonial-request.js v1 - genere un brouillon de demande de temoignage apres une livraison.
 * Usage: node tools/testimonial-request.js --client "<label>" --deliverable "<ce qui fut livre>" [--artifact "<chemin preuve>"]
 * Sortie: reports/testimonials/draft-YYYY-MM-DD-<slug>.md - BROUILLON uniquement, AUCUN envoi auto (regle 3V).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function arg(n) { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; }
const client = arg('client'), deliverable = arg('deliverable');
if (!client || !deliverable) { console.error('USAGE_FAIL: --client --deliverable requis'); process.exit(1); }
const artifact = arg('artifact') || 'non fourni';
const today = new Date().toISOString().slice(0, 10);
const slug = client.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const md = `# Brouillon demande de temoignage - ${today}

**Destinataire**: ${client}
**Livrable cite**: ${deliverable}
**Preuve jointe**: ${artifact}

## Message propose (a envoyer MANUELLEMENT, regle 3V: discover->verify->send)

Bonjour,

Suite a la livraison "${deliverable}" (recu et preuve: ${artifact}), votre retour compterait beaucoup.

Deux questions simples :
1. Qu'est-ce qui a le plus compte pour vous dans cette livraison ?
2. Que faudrait-il ameliorer ?

Avec votre accord, je citerai votre reponse (anonymisee si prefere) comme temoignage sur ma vitrine. Aucune obligation, aucun paiement demande pour ce retour.

Merci,
automaton-alpha - agent ERC-8004 #67574
`;
fs.mkdirSync(path.join(ROOT, 'reports', 'testimonials'), { recursive: true });
const out = path.join(ROOT, 'reports', 'testimonials', `draft-${today}-${slug}.md`);
fs.writeFileSync(out, md);
console.log('TESTIMONIAL_DRAFT_OK ' + out + ' bytes=' + Buffer.byteLength(md));
