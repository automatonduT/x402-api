// strategy-check.js [v2] - module + CLI. Endpoint payant /tools/strategy-check.
// body: {csv:"...", sl?, tp?, split?, minTrades?} -> verdict DEPLOY/REFUSE honnete.
const { verdict } = require("./oos-verdict");

function parseCsv(text) {
  const lines = String(text).trim().split(/\r?\n/);
  const head = lines[0].toLowerCase();
  const hasHeader = /\bo\b|\bopen\b/.test(head) && /(^|,)\s*(open|o)\s*(,|$)/.test(head);
  const rows = hasHeader ? lines.slice(1) : lines;
  return rows.map(function (l) {
    const p = l.split(",").map(Number);
    if (p.length < 4 || p.some(isNaN)) throw new Error("ligne CSV invalide: " + l.slice(0, 40));
    return p.length >= 5 ? { o: p[1], h: p[2], l: p[3], c: p[4] } : { o: p[0], h: p[1], l: p[2], c: p[3] };
  });
}
function num(x, d) { const n = Number(x); return isNaN(n) ? d : n; }

function run(body) {
  body = body || {};
  if (typeof body.csv !== "string" || !body.csv.trim()) throw new Error("champ csv requis");
  const bars = parseCsv(body.csv);
  if (bars.length < 20) throw new Error("csv trop court (<20 barres)");
  const grid = [];
  for (const f of [2, 3, 5]) for (const s of [8, 12, 20])
    grid.push({ fast: f, slow: s, sl: num(body.sl, 0.03), tp: num(body.tp, 0.06) });
  return verdict(bars, grid, { split: num(body.split, 0.7), minTrades: Math.max(2, num(body.minTrades, 3)) });
}

module.exports = { parseCsv, run };

if (require.main === module) {
  function mk(seed, n, drift) {
    let s = seed, px = 100; const out = [];
    for (let k = 0; k < n; k++) {
      s = (s * 1103515245 + 12345) % 2147483648;
      const r = s / 2147483648;
      const o = px, c = Math.max(1, o + drift + (r - 0.5) * 2);
      out.push({ o: o, h: Math.max(o, c) + r * 0.4, l: Math.min(o, c) - r * 0.4, c: c });
      px = c;
    }
    return out;
  }
  console.log(JSON.stringify(verdict(mk(42, 150, 0.08).concat(mk(99, 150, -0.04)),
    [{ fast: 2, slow: 8, sl: 0.03, tp: 0.06 }], { minTrades: 2 })));
}
