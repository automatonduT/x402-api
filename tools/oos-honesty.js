// oos-honesty.js - attach real out-of-sample results to scan/backtest outputs
const fs = require('fs'), path = require('path');
function load(summaryPath) {
  const p = summaryPath || path.join(process.env.HOME, 'automaton-work/x402-api/data/oos-summary.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}
function attachOOS(result, symbol, summaryPath) {
  const s = load(summaryPath);
  if (!s || !s.results) return { ...result, oos: null };
  return {
    ...result,
    oos: {
      perStrategyOOSpct: s.results[symbol] || null,
      allSymbols: s.results,
      method: s.method,
      verdict: s.honestVerdict,
      disclaimer: "OOS figures are historical 70/30 validation, not a promise of future returns."
    }
  };
}
module.exports = { load, attachOOS };
if (require.main === module) { // self-test
  const fake = { signals: [{ pair: 'BTCUSDT', kind: 'momentum', score: 0.7 }] };
  const out = attachOOS(fake, 'BTCUSDT');
  console.log(JSON.stringify(out, null, 1));
}
