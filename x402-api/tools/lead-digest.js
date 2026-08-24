#!/usr/bin/env node
/* lead-digest.js v1 - consolide leads-capture.jsonl en digest qualifie.
 * Source de verite: leads-capture.jsonl (append-only, regle 4 skill free-tool-lead-magnet).
 * Sortie: reports/lead-digest-YYYY-MM-DD.md - AUCUN envoi auto (regle 3V).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SELF = [/^127\./, /^::1$/, /^localhost$/];
let lines = [];
try { lines = fs.readFileSync(path.join(ROOT, 'leads-capture.jsonl'), 'utf8').split('\n').filter(Boolean); } catch (e) {}
const leads = [];
for (const l of lines) { try { const o = JSON.parse(l); if (!SELF.some(r => r.test(o.ip || ''))) leads.push(o); } catch (e) {} }
const seen = new Map();
for (const o of leads) { const k = (o.ip || '?') + '|' + (o.path || '?'); const e = seen.get(k) || { ip: o.ip, path: o.path, ua: o.ua || '', n: 0, first: o.ts }; e.n++; seen.set(k, e); }
const uniq = [...seen.values()].sort((a, b) => b.n - a.n);
const today = new Date().toISOString().slice(0, 10);
let md;
if (!uniq.length) {
  md = `# Lead digest ${today}\n\nAucun lead externe capture a ce jour.\nPipeline actif depuis 2026-08-24 ~21:25 UTC (middleware REQUEST_LOG_V1, anti-self prouve 0->0->0).\nCeci est un constat honnete: zero inbound non-self = genese NON atteinte.\n`;
} else {
  md = `# Lead digest ${today}\n\nTotal lignes brutes: ${lines.length} | hors-self: ${leads.length} | uniques (ip+path): ${uniq.length}\n\n| ip | path | hits | premier hit |\n|---|---|---|---|\n` +
    uniq.slice(0, 20).map(u => `| ${u.ip} | ${u.path} | ${u.n} | ${u.first} |`).join('\n') +
    `\n\n## Qualification suggeree\n${uniq.filter(u => u.n >= 2).length ? uniq.filter(u => u.n >= 2).map(u => `- HOT (>=2 hits): ${u.ip} sur ${u.path}`).join('\n') : '- Aucun repeat-hit: tous froids, re-prober avant tout pitch (regle 3V).'}\n`;
}
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
const out = path.join(ROOT, 'reports', `lead-digest-${today}.md`);
fs.writeFileSync(out, md);
console.log('DIGEST_OK ' + out + ' bytes=' + Buffer.byteLength(md) + ' raw=' + lines.length + ' ext=' + leads.length + ' uniq=' + uniq.length);
if (process.argv[2] === '--selftest') console.log(md.split('\n')[2]);
