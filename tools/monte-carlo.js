#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// monte-carlo.js — SIMULATEUR DE SÉRIES & DRAWDOWN (unités R propres)
// Usage: node monte-carlo.js TAUX_WIN% RATIO_RR NB_TRADES [NB_SIM] [RISQUE_%PAR_TRADE]
//   ex: node monte-carlo.js 40 2 50 2000 1
// Répond à LA question du desk: "cette stratégie peut-elle me ruiner
// avant de me rendre riche ?" Tout en R (multiples du risque par trade),
// converti en % du capital si RISQUE_% fourni.
// ─────────────────────────────────────────────
const [winS, rrS, nS, simS, riskS] = process.argv.slice(2).map(Number);
if (!winS || !rrS || !nS) { console.log("Usage: node monte-carlo.js TAUX_WIN% RATIO_RR NB_TRADES [SIMS=2000] [RISQUE%_PAR_TRADE]"); process.exit(1); }
const p = winS / 100, rr = rrS, N = nS, SIMS = simS || 2000;
const riskPct = riskS || null; // ex: 1 => 1R = 1% du capital
const conv = v => riskPct ? `${(Math.abs(v) * riskPct).toFixed(0)}% du capital` : `${v.toFixed(1)}R`;

const expR = p * rr - (1 - p);
const dds = [], finals = [], over10 = { d: 0 }, over20 = { d: 0 };
for (let s = 0; s < SIMS; s++) {
  let eq = 0, peak = 0, mdd = 0; // eq en R cumulés
  for (let i = 0; i < N; i++) {
    eq += Math.random() < p ? rr : -1;
    peak = Math.max(peak, eq);
    mdd = Math.min(mdd, eq - peak);
    if (mdd <= -10) over10.d = 1;
    if (mdd <= -20) over20.d = 1;
  }
  dds.push(mdd); finals.push(eq);
}
dds.sort((a, b) => a - b); finals.sort((a, b) => a - b);
const q = (arr, x) => arr[Math.floor(x * arr.length)];

console.log(`=== MONTE-CARLO (${SIMS} sims × ${N} trades | win ${winS}% | RR ${rr}) ===`);
console.log(`Espérance: ${expR.toFixed(3)}R/trade ${expR > 0.15 ? "✅ positive" : expR > 0 ? "⚠️ marginale" : "🚫 NÉGATIVE — ne pas trader"} | total attendu sur série: ${(expR * N).toFixed(1)}R`);
console.log(`\nDrawdown MAX pendant la série (profondeur depuis le pic):`);
console.log(`  médian:            ${conv(q(dds, .5))}`);
console.log(`  mauvais cas (p90): ${conv(q(dds, .1))}`);
console.log(`  pire cas   (p99):  ${conv(q(dds, .01))}`);
if (riskPct) console.log(`  (conversion: 1R = ${riskPct}% du capital)`);
console.log(`\nProbabilité que le drawdown dépasse 10R: ${over10.d / SIMS * 100}% | 20R: ${over20.d / SIMS * 100}%`);
console.log(`Équité finale médiane: ${q(finals, .5).toFixed(1)}R | p10 (malchance): ${q(finals, .1).toFixed(1)}R`);
console.log(`\nLecture desk: si le drawdown p90 dépasse ta tolérance, réduis le risque par trade — la stratégie ne changera pas, ta survie oui.`);
