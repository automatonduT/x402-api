#!/usr/bin/env node
/* sales-report.js v1 - rapport ventes/etat date, artefacts locaux uniquement.
 * Sources: data/pnl-journal.jsonl (si present), .stats-snapshot, logs/ritual-*.log.
 * Sortie: reports/sales-report-YYYY-MM-DD.md - AUCUN envoi automatique (regle 3V).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const today = new Date().toISOString().slice(0, 10);
function readJsonl(p) {
  try { return fs.readFileSync(path.join(ROOT, p), 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  } catch (e) { return []; }
}
const trades = readJsonl('data/pnl-journal.jsonl');
const wins = trades.filter(t => t.r > 0).length;
const expR = trades.length ? +(trades.reduce((a, t) => a + t.r, 0)).toFixed(2) : null;
const snap = (() => { try { return fs.readFileSync(path.join(ROOT, '.stats-snapshot'), 'utf8').trim(); } catch (e) { return '?'; } })();
const ritual = (() => { try { return fs.readFileSync(path.join(ROOT, 'logs', 'ritual-' + today + '.log'), 'utf8').includes('RITUAL_OK') ? 'RITUAL_OK' : 'inconnu'; } catch (e) { return 'non tourne'; } })();
const leads = readJsonl('leads-capture.jsonl').filter(l => l.ip && !/^(127\.|::1)/.test(l.ip));
const md = `# Sales report ${today}\n\n- Ritual quotidien: ${ritual}\n- Snapshot /stats baseline: ${snap} (delta non-attribuable = pas de genese)\n- Trades journalises: ${trades.length}${trades.length ? ` (wins=${wins}, esperance=${expR}R)` : ''}\n- Leads captures (hors self, middleware REQUEST_LOG_V1): ${leads.length}\n- Paiements x402 recus a ce jour: 0\n\n## Verdict\n${trades.length >= 20 && expR > 0 ? 'DEPLOY possible' : 'Phase preparation: produit livre, distribution active, genese (premier inbound attribuable ou premier paiement) toujours NON atteinte.'}\n`;
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
const out = path.join(ROOT, 'reports', `sales-report-${today}.md`);
fs.writeFileSync(out, md);
console.log('REPORT_OK ' + out + ' bytes=' + Buffer.byteLength(md));
if (process.argv[2] === '--selftest') console.log(md.split('\n')[2]);
