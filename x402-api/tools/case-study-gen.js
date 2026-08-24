#!/usr/bin/env node
/* case-study-gen.js v1 - transforme une livraison reelle en etude de cas honnete.
 * Usage: node tools/case-study-gen.js --service "<nom>" --problem "<probleme resolu>" \
 *          --evidence "<chemin artefact ou fait date>" [--result "<resultat mesure>"] [--client "<label>"]
 * Sans --client -> mode auto-evaluation interne explicite (JAMAIS de client fabrique).
 * Sortie: reports/case-studies/case-study-YYYY-MM-DD-<slug>.md - AUCUN envoi auto (regle 3V).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function arg(n) { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; }
const service = arg('service'), problem = arg('problem'), evidence = arg('evidence');
if (!service || !problem || !evidence) { console.error('USAGE_FAIL: --service --problem --evidence requis'); process.exit(1); }
const result = arg('result') || 'non mesure (a completer apres observation reelle)';
const client = arg('client');
const today = new Date().toISOString().slice(0, 10);
const slug = service.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
let evBlock = `- Preuve citee: ${evidence}`;
try { const st = fs.statSync(path.isAbsolute(evidence) ? evidence : path.join(ROOT, evidence)); evBlock += ` (existe, modifie ${st.mtime.toISOString()})`; } catch (e) { evBlock += ' (reference declarative - verifier avant publication externe)'; }
const md = `# Etude de cas: ${service} - ${today}

**Contexte**: ${client ? `Client/usage: ${client}` : 'Auto-evaluation interne - aucun client externe implique a ce jour.'}

## Probleme
${problem}

## Approche
Livraison par automaton-alpha (agent ERC-8004 #67574): petit outil borde, gates automatiques (node --check / bash -n, secret-scan), push verifiable sur git public.

## Preuves (datees)
${evBlock}

## Resultat
${result}

## Lecon generalisable
Ce que ce cas apprend a toute equipe qui outille des workflows agentiques: mesurer avant de promettre, citer des artefacts dates, assumer publiquement les zeros (honnetete radicale = differenciation).

---
Offre associee: audit x402 a $5 (paiement au protocole, recu fourni). Contact on-chain: 0x466a47E5E38F8b4dd9423189509d8c595f38DEda
`;
fs.mkdirSync(path.join(ROOT, 'reports', 'case-studies'), { recursive: true });
const out = path.join(ROOT, 'reports', 'case-studies', `case-study-${today}-${slug}.md`);
fs.writeFileSync(out, md);
console.log('CASESTUDY_OK ' + out + ' bytes=' + Buffer.byteLength(md) + ' mode=' + (client ? 'client' : 'auto-eval'));
