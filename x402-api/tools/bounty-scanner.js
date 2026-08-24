#!/usr/bin/env node
/* bounty-scanner.js v1 - scan lecture-seule d'opportunites bounty/issues liees x402.
 * Source: API publique GitHub (search/issues, sans auth, User-Agent requis).
 * Sortie: reports/bounty-shortlist-YYYY-MM-DD.md - AUCUN post/commentaire auto (regle 3V).
 * Selftest: node tools/bounty-scanner.js --selftest  (hors-reseau, logique pure)
 */
const https = require('https'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const QUERIES = [
  'x402 state:open sort:updated',
  '"agent payment" OR "HTTP 402" state:open sort:updated'
];
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'automaton-alpha-scan', 'Accept': 'application/vnd.github+json' } }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve({ code: res.statusCode, json: JSON.parse(b) }); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function toRows(items) {
  return (items || []).filter(i => i && i.state === 'open' && i.html_url).slice(0, 10)
    .map(i => ({ title: i.title, url: i.html_url, repo: (i.repository_url || '').split('/').slice(-2).join('/'), updated: i.updated_at }));
}
async function main() {
  const today = new Date().toISOString().slice(0, 10);
  if (process.argv[2] === '--selftest') {
    const rows = toRows([{ state: 'open', title: 'sample bounty', html_url: 'https://github.com/a/b/issues/1', repository_url: 'https://api.github.com/repos/a/b', updated_at: today + 'T00:00:00Z' }, { state: 'closed', title: 'ignore me', html_url: 'x' }]);
    if (rows.length !== 1 || !rows[0].url.includes('issues/1')) { console.error('SELFTEST_FAIL'); process.exit(1); }
    console.log('SHORTLIST_SELFTEST_OK rows=' + rows.length); return;
  }
  const seen = new Map();
  for (const q of QUERIES) {
    try {
      const { code, json } = await fetchJson('https://api.github.com/search/issues?q=' + encodeURIComponent(q.replace(/sort:updated/, '')) + '&sort=updated&per_page=10');
      if (code !== 200) { console.error('SCAN_HTTP_' + code); continue; }
      for (const r of toRows(json.items)) seen.set(r.url, r);
    } catch (e) { console.error('SCAN_ERR ' + e.message); }
  }
  const rows = [...seen.values()];
  let md;
  if (!rows.length) md = `# Bounty shortlist ${today}\n\nAucune issue ouverte pertinente trouvee ce jour (scan honnete, requetes: ${QUERIES.length}).\n`;
  else md = `# Bounty shortlist ${today}\n\n${rows.length} issues ouvertes candidates:\n\n` + rows.map(r => `- [${r.title}](${r.url}) (${r.repo}, maj ${r.updated})`).join('\n') + `\n\n> Prochaine etape MANUELLE regle 3V: mapping repo obligatoire avant tout commentaire. AUCUN post auto.\n`;
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  const out = path.join(ROOT, 'reports', `bounty-shortlist-${today}.md`);
  fs.writeFileSync(out, md);
  console.log('SHORTLIST_OK ' + out + ' rows=' + rows.length);
}
main();
