#!/usr/bin/env node
/* pnl-journal.js v1 - journal de trades append-only -> stats reelles.
 * Chaque ligne JSONL: {"ts":ms,"sym":"BTC","r":2.5}  (r = resultat en R, +/-)
 * Stats: n, winrate, payoff moyen (gains moyens / pertes moyennes), esperance en R.
 * Ces stats alimentent size-guard.js (bankroll, winRate, payoff) - mesures, pas hypotheses.
 * Usage: add '{"ts":..,"sym":"..","r":..}' [fichier] | stats [fichier] | --selftest
 */
const fs = require('fs');
const DEFAULT = require('path').join(__dirname, '..', 'data', 'pnl-journal.jsonl');
function load(f) {
  const p = f || DEFAULT;
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch (e) { return null; } })
    .filter(x => x && typeof x.r === 'number');
}
function stats(trades) {
  const n = trades.length;
  if (!n) return { n: 0, verdict: 'REFUSE', raison: 'aucun trade journalise' };
  const wins = trades.filter(t => t.r > 0);
  const losses = trades.filter(t => t.r <= 0);
  const winrate = wins.length / n;
  const avgWin = wins.length ? wins.reduce((a, t) => a + t.r, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((a, t) => a + t.r, 0) / losses.length) : 0;
  const payoff = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0);
  const expectancy = avgWin * wins.length / n - avgLoss * losses.length / n;
  return {
    n, winrate: +winrate.toFixed(3),
    payoff: payoff === Infinity ? 'inf' : +payoff.toFixed(2),
    esperanceR: +expectancy.toFixed(3),
    verdict: n >= 20 && expectancy > 0 && winrate > 0 && payoff !== Infinity ? 'DEPLOY' : (expectancy <= 0 ? 'REFUSE: esperance<=0' : 'INSUFFISANT: <20 trades')
  };
}
if (process.argv[2] === '--selftest') {
  const mk = rs => rs.map((r, i) => ({ ts: i, sym: 'T', r }));
  const s1 = stats(mk([1, 1, 1, -1].concat(Array(16).fill(0.5)))); // 20 trades gagnants
  const s2 = stats(mk([-1, -1]));                                   // que des pertes
  const ok = s1.n === 20 && s1.verdict === 'DEPLOY' && s2.verdict.startsWith('REFUSE') && s2.esperanceR < 0;
  console.log((ok ? 'SELFTEST_OK' : 'SELFTEST_FAIL') + ' deploy=' + s1.esperanceR + ' refuse=' + s2.esperanceR);
} else if (process.argv[2] === 'stats') {
  console.log(JSON.stringify(stats(load(process.argv[3]))));
} else if (process.argv[2] === 'add') {
  const p = process.argv[4] || DEFAULT;
  fs.mkdirSync(require('path').dirname(p), { recursive: true });
  const rec = JSON.parse(process.argv[3]);
  if (typeof rec.r !== 'number') { console.error('REFUSE r non numerique'); process.exit(1); }
  rec.ts = rec.ts || Date.now();
  fs.appendFileSync(p, JSON.stringify(rec) + '\n');
  console.log('ADDED n=' + load(p).length);
} else { console.log('Usage: add \'{"ts":..,"sym":"..","r":..}\' | stats | --selftest'); }
