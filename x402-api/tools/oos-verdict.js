// oos-verdict.js [v3] - Curriculum semaine 2 paire 4: composition honnete.
// exits.js (simulation conservatrice) + hyperopt-lite (selection TRAIN-only)
// -> verdict DEPLOY/REFUSE avec regles explicites. Piece adoptee par backtest-v3.js.
const { hyperopt } = require("./hyperopt-lite");

function verdict(bars, grid, opts) {
  opts = opts || {};
  const r = hyperopt(bars, grid, opts);
  if (!r.best) return { decision: "REFUSE", reasons: ["aucun resultat"] };
  const b = r.best;
  const reasons = [];
  if (!r.valid) reasons.push("trades OOS insuffisants");
  if (b.test.pnl <= 0) reasons.push("pnl OOS negatif (" + b.test.pnl + ")");
  const maxGap = (opts.maxGap !== undefined) ? opts.maxGap : Math.max(Math.abs(b.train.pnl) * 0.5, 10);
  if (Math.abs(b.gap) > maxGap) reasons.push("gap train-test " + b.gap);
  return {
    decision: (reasons.length ? "REFUSE" : "DEPLOY"),
    reasons: reasons,
    best: { params: b.params, train: b.train, test: b.test, gap: b.gap }
  };
}

module.exports = { verdict };

if (require.main === module) {
  function mk(seed, n, drift) {
    let s = seed, px = 100;
    const bars = [];
    for (let k = 0; k < n; k++) {
      s = (s * 1103515245 + 12345) % 2147483648;
      const rnd = s / 2147483648;
      const o = px;
      const c = Math.max(1, o + drift + (rnd - 0.5) * 2);
      bars.push({ o: o, h: Math.max(o, c) + rnd * 0.4, l: Math.min(o, c) - rnd * 0.4, c: c });
      px = c;
    }
    return bars;
  }
  const g = [];
  for (const f of [2, 3, 5]) for (const sl of [8, 12, 20]) g.push({ fast: f, slow: sl, sl: 0.03, tp: 0.06 });
  const trap = mk(42, 150, 0.08).concat(mk(99, 150, -0.04));
  console.log("PIEGE:", JSON.stringify(verdict(trap, g, { minTrades: 2 })));
  console.log("TENDUE:", JSON.stringify(verdict(mk(7, 300, 0.15), g, { minTrades: 2 })));
}
