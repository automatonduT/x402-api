// strategy-check.js [v1] - Integration finale semaine 2.
// CSV OHLC -> simulation conservatrice (exits) -> selection TRAIN-only (hyperopt)
// -> verdict DEPLOY/REFUSE honnete (oos-verdict). Usage:
//   node strategy-check.js --file bars.csv [--sl 0.03] [--tp 0.06] [--split 0.7] [--minTrades 2]
//   node strategy-check.js --demo
const { verdict } = require("./oos-verdict");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].toLowerCase();
  const hasHeader = /(^|,)\s*o\s*(,|$)/.test(head) && /\bo\b|\bopen\b/.test(head);
  const rows = hasHeader ? lines.slice(1) : lines;
  return rows.map(function (l) {
    const p = l.split(",").map(Number);
    if (p.length < 4 || p.some(isNaN)) throw new Error("ligne CSV invalide: " + l);
    return p.length >= 5
      ? { o: p[1], h: p[2], l: p[3], c: p[4] }
      : { o: p[0], h: p[1], l: p[2], c: p[3] };
  });
}

function main() {
  const a = process.argv.slice(2);
  const opt = function (name, dflt) {
    const i = a.indexOf("--" + name);
    return i >= 0 ? Number(a[i + 1]) : dflt;
  };
  const grid = [];
  for (const f of [2, 3, 5]) for (const s of [8, 12, 20])
    grid.push({ fast: f, slow: s, sl: opt("sl", 0.03), tp: opt("tp", 0.06) });
  let bars;
  if (a.includes("--demo")) {
    function mk(seed, n, drift) {
      let s2 = seed, px = 100; const out = [];
      for (let k = 0; k < n; k++) {
        s2 = (s2 * 1103515245 + 12345) % 2147483648;
        const r = s2 / 2147483648;
        const o = px, c = Math.max(1, o + drift + (r - 0.5) * 2);
        out.push({ o: o, h: Math.max(o, c) + r * 0.4, l: Math.min(o, c) - r * 0.4, c: c });
        px = c;
      }
      return out;
    }
    bars = mk(42, 150, 0.08).concat(mk(99, 150, -0.04));
  } else {
    const fi = a.indexOf("--file");
    if (fi < 0) { console.error("usage: --file bars.csv | --demo"); process.exit(1); }
    const fs = require("fs");
    bars = parseCsv(fs.readFileSync(a[fi + 1], "utf8"));
  }
  const v = verdict(bars, grid, { split: opt("split", 0.7), minTrades: opt("minTrades", 2) });
  console.log(JSON.stringify(v));
  process.exit(v.decision === "DEPLOY" ? 0 : 2);
}
main();
