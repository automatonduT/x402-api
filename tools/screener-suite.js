#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// screener-suite.js — SCREENERS DE MARCHÉ
// Usage: movers [n] · vol-regime · funding-all · spread-watch A B · volume-spike · dist-ath SYM
// ─────────────────────────────────────────────
const https = require("https");
function getJSON(url) { return new Promise((res, rej) => { https.get(url, { headers: { "User-Agent": "scr/1" } }, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error("réponse invalide")); } }); }).on("error", rej); }); }

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  try {
    if (cmd === "movers") {
      const n = +(a[0] || 10);
      const t = await getJSON("https://api.binance.com/api/v3/ticker/24hr");
      const usdc = t.filter(x => x.symbol.endsWith("USDC") && !/UP|DOWN|BULL|BEAR/.test(x.symbol) && +x.quoteVolume > 100000);
      const sorted = [...usdc].sort((x, y) => +y.priceChangePercent - +x.priceChangePercent);
      console.log(`🟢 TOP HAUSSES:`);
      sorted.slice(0, n).forEach(x => console.log(`   ${x.symbol.padEnd(14)} ${(+x.priceChangePercent).toFixed(1)}%  vol ${(+$x?.quoteVolume / 1e6 || +x.quoteVolume / 1e6).toFixed(1)}M`));
      console.log(`🔴 TOP BAISSES:`);
      sorted.slice(-n).reverse().forEach(x => console.log(`   ${x.symbol.padEnd(14)} ${(+x.priceChangePercent).toFixed(1)}%`));
    } else if (cmd === "vol-regime") {
      const k = await getJSON(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=31`);
      const trs = k.map(x => Math.max(+x[2] - +x[3], Math.abs(+x[2] - +x[4]), Math.abs(+x[3] - +x[4])));
      const today = trs.at(-1) / +k.at(-1)[4] * 100;
      const med = [...trs.slice(0, -1)].sort((x, y) => x - y)[15] / +k.at(-2)[4] * 100;
      const ratio = today / med;
      console.log(`Volatilité BTC aujourd'hui: ${today.toFixed(2)}% vs médiane ${med.toFixed(2)}% (${ratio.toFixed(1)}x) → ${ratio > 2 ? "🔥 MARCHÉ AGITÉ — divise le sizing par 2" : ratio < 0.6 ? "😴 calme — conditions normales OK" : "⚪ normal"}`);
    } else if (cmd === "funding-all") {
      try {
        const f = await getJSON("https://fapi.binance.com/fapi/v1/premiumIndex");
        const rows = (Array.isArray(f) ? f : []).filter(x => x.symbol.endsWith("USDT")).slice(0, 15);
        rows.sort((x, y) => +y.lastFundingRate - +x.lastFundingRate);
        rows.forEach(r => console.log(`${r.symbol.padEnd(16)} funding ${(+r.lastFundingRate * 100).toFixed(4)}% → ${+r.lastFundingRate > 0 ? "longs paient shorts" : "shorts paient longs"}`));
        if (!rows.length) throw new Error();
      } catch (e) { console.log("⚠️ futures API indisponible depuis cette machine — utilise funding-carry.js avec les données spot ou réessaie plus tard"); }
    } else if (cmd === "spread-watch") {
      const [ta, tb] = await Promise.all([a[0], a[1]].map(s => getJSON(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}USDC`)));
      const diff = +ta.priceChangePercent - +tb.priceChangePercent;
      console.log(`24h: ${a[0]} ${(+ta.priceChangePercent).toFixed(1)}% vs ${a[1]} ${(+tb.priceChangePercent).toFixed(1)}% → écart ${Math.abs(diff).toFixed(1)} pts${Math.abs(diff) > 8 ? "\n💡 écart large: si corrélation historique forte, pair-trade à étudier (long faible/short fort)" : ""}`);
    } else if (cmd === "volume-spike") {
      const syms = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
      for (const s of syms) {
        const k = await getJSON(`https://api.binance.com/api/v3/klines?symbol=${s}&interval=1d&limit=21`);
        const vols = k.map(x => +x[5]); const avg = vols.slice(0, -1).reduce((s, x) => s + x, 0) / 20;
        const ratio = vols.at(-1) / avg;
        console.log(`${s.padEnd(10)} volume ${ratio.toFixed(1)}x la moyenne${ratio > 3 ? " 🚨 SPIKE — quelque chose se passe" : ratio > 1.5 ? " 📈 élevé" : ""}`);
      }
    } else if (cmd === "dist-ath") {
      const k = await getJSON(`https://api.binance.com/api/v3/klines?symbol=${a[0]}USDT&interval=1d&limit=1000`);
      const ath = Math.max(...k.map(x => +x[2])); const c = +k.at(-1)[4];
      console.log(`${a[0]}: ${(100 * (1 - c / ath)).toFixed(1)}% sous son plus haut ${ath.toFixed(2)} → ${100 * (1 - c / ath) < 10 ? "🔥 zone ATH — momentum fort mais risque de rejet" : 100 * (1 - c / ath) > 70 ? "🩸 deep value ou chute continue?" : "zone médiane"}`);
    } else {
      console.log("Usage: movers [n] · vol-regime · funding-all · spread-watch A B · volume-spike · dist-ath SYM");
    }
  } catch (e) { console.error("❌", e.message); process.exit(1); }
})();
