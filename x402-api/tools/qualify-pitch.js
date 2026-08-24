#!/usr/bin/env node
/* qualify-pitch.js - qualification de leads + draft de pitch date regle 3V.
 * N'ENVOIE RIEN: ecrit des drafts dans outbox/, l'envoi reste une decision
 * separee (verify->discover->send du createur). Preuves citees = lignes JSONL datees.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const LEADS = process.argv[2] || path.join(ROOT, 'leads-capture.jsonl');
const OUTBOX = path.join(ROOT, 'outbox');

function readLeads(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);
}

function qualify(lead) {
  const ageH = (Date.now() - (lead.ts || Date.now())) / 36e5;
  let score = 0;
  if (ageH < 48) score += 2; else if (ageH < 168) score += 1;
  if (/x402|paywall|mcp|api/i.test(lead.url || '')) score += 2;
  if (lead.verdict && /DOWN|404|DEAD|unreachable/i.test(lead.verdict)) score += 2; // endpoint mort = douleur max
  if (lead.src === 'self') return null; // anti-self obligatoire
  return { tier: score >= 4 ? 'HOT' : score >= 2 ? 'WARM' : 'DROP', score, ageH: Math.round(ageH) };
}

function pitchDraft(lead, q) {
  const d = new Date().toISOString().slice(0, 10);
  const slug = String(lead.url || 'lead').replace(/[^a-z0-9]+/gi, '-').slice(-40);
  return {
    slug,
    md: `# Pitch - ${d} - cible ${lead.url}\n\n` +
        `Tier: ${q.tier} (score ${q.score}, age ${q.ageH}h)\n\n` +
        `## Fait observe\n- ${new Date(lead.ts || Date.now()).toISOString()} - probe de "${lead.url}" depuis src=${lead.src}` +
        (lead.verdict ? ` - verdict: ${lead.verdict}` : '') + `\n\n` +
        `## Draft (regle 3V - verify avant tout envoi)\n` +
        `Bonjour,\n\nNotre sonde gratuite x402-inspector a enregistre le ${d} que votre endpoint ` +
        `${lead.url} ${lead.verdict ? 'renvoyait: ' + lead.verdict : 'a ete probe'}. ` +
        `Si vous voulez un diagnostic complet (verdict DEPLOY/REFUSE sur vos series OHLC, paywall x402, docs machine), ` +
        `l'audit paye coute 0.02 USDC via POST /tools/strategy-check ou 5 USDC pour l'audit complet.\n\n` +
        `-- automaton-alpha (agent ERC-8004 #67574)\n`
  };
}

const leads = readLeads(LEADS);
if (!leads.length) { console.log('NO_LEADS ' + LEADS); process.exit(0); }
fs.mkdirSync(OUTBOX, { recursive: true });
let hot = 0, warm = 0, drop = 0;
for (const lead of leads) {
  const q = qualify(lead);
  if (!q) continue;
  if (q.tier === 'DROP') { drop++; continue; }
  q.tier === 'HOT' ? hot++ : warm++;
  const p = pitchDraft(lead, q);
  fs.writeFileSync(path.join(OUTBOX, p.slug.slice(0, 50) + '.md'), p.md);
}
console.log(`QUALIFY_OK total=${leads.length} hot=${hot} warm=${warm} drop=${drop} drafts=${fs.readdirSync(OUTBOX).length}`);
