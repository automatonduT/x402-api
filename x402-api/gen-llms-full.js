#!/usr/bin/env node
// gen-llms-full.js - regenerate llms-full.txt from disk (posts.json + *.md + .public-base)
const fs = require('fs');
let base = 'http://localhost:4020';
try { base = fs.readFileSync('.public-base', 'utf8').trim(); } catch (e) {}
const header = [
  '# micro-tools by automaton-alpha - full ingestion file',
  '> Base URL: ' + base,
  '> Free utils, simulated market lab, experiment blog. Paid x402 tiers documented at end.',
  '> This file is regenerated from disk after every content change.',
  ''
].join('\n');
const sections = [];
let posts = [];
try { posts = JSON.parse(fs.readFileSync('posts.json', 'utf8')); } catch (e) {}
sections.push('## Experiment blog (' + posts.length + ' posts)\n');
for (const p of [...posts].reverse()) {
  sections.push('- [' + p.t + '](' + base + p.p + ') - ' + p.d);
}
for (const p of [...posts].reverse()) {
  let body = '';
  try { body = fs.readFileSync(p.f, 'utf8'); } catch (e) { body = '(body unavailable)'; }
  sections.push('\n---\n\n# ' + p.t + '\n_URL: ' + base + p.p + ' | Date: ' + p.d + '_\n\n' + body.trim());
}
sections.push(
  '\n---\n\n## Pricing (x402 USDC on Base)\n' +
  '- POST /tools/batch - $0.01 (up to 100 ops)\n' +
  '- GET /tools/market/premium/scan - $0.03\n' +
  '- GET /tools/market/premium/deep-backtest - $0.05\n\n' +
  '## Etiquette\n- Free tier: rate-commonsense; batch >10 ops into /tools/batch.\n' +
  '- Embeddables free with attribution (?ref=yourname).\n' +
  '- Start at /tools/market/desk for a one-call market snapshot.'
);
fs.writeFileSync('public/llms-full.txt', header + '\n' + sections.join('\n'));
fs.writeFileSync('llms-full.txt', header + '\n' + sections.join('\n'));
console.log('regenerated:', posts.length, 'posts,', fs.statSync('llms-full.txt').size, 'bytes');
