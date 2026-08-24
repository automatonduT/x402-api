#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// trade-suite.js — ANALYSE TECHNIQUE COMPLÈTE (données Binance publiques)
// Usage:
//   node trade-suite.js rsi BTCUSDT [period]     macd SYM        bollinger SYM
//   stochastic SYM    atr SYM     adx SYM         obv SYM         vwap SYM
//   ema-cross SYM     levels SYM  correlation A B drawdown SYM    kelly WR AW AL
//   seasonality SYM   regime SYM
// ─────────────────────────────────────────────
const https = require("https");
function getJSON(url) { return new Promise((res, rej) => { https.get(url, { headers: { "User-Agent": "ts/1" } }, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error("réponse invalide")); } }); }).on("error", rej); }); }
async function klines(sym, limit = 200, interval = "1d") {
  const k = await getJSON(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
  return k.map(x => ({ o: +x[1], h: +x[2], l: +x[3], c: +x[4], v: +x[5] }));
}
const closes = k => k.map(x => x.c);
const sma = (a, p) => a.slice(-p).reduce((s, x) => s + x, 0) / p;
function emas(a, p) { const k = 2 / (p + 1); const out = [a[0]]; for (let i = 1; i < a.length; i++) out.push(a[i] * k + out[i - 1] * (1 - k)); return out; }
function rsiCalc(cl, p = 14) {
  let g = 0, l = 0;
  for (let i = cl.length - p; i < cl.length; i++) { const d = cl[i] - cl[i - 1]; d > 0 ? g += d : l -= d; }
  const ag = g / p, al = l / p; if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  try {
    if (cmd === "rsi") {
      const p = +(a[1] || 14); const cl = closes(await klines(a[0]));
      const r = rsiCalc(cl, p);
      console.log(`RSI(${p}) ${a[0]}: ${r.toFixed(1)} → ${r > 70 ? "🔴 surachat" : r < 30 ? "🟢 survente" : "⚪ neutre"}${r > 60 ? " biais haussier" : r < 40 ? " biais baissier" : ""}`);
    } else if (cmd === "macd") {
      const cl = closes(await klines(a[0]));
      const e12 = emas(cl, 12), e26 = emas(cl, 26);
      const macd = cl.map((_, i) => e12[i] - e26[i]);
      const sig = emas(macd, 9);
      const h = macd[macd.length - 1] - sig[sig.length - 1];
      const prevH = macd[macd.length - 2] - sig[sig.length - 2];
      console.log(`MACD ${a[0]}: ligne ${(macd.at(-1)).toFixed(2)}, signal ${(sig.at(-1)).toFixed(2)}, hist ${h.toFixed(2)} → ${h > 0 ? "🟢 momentum haussier" : "🔴 baissier"}${Math.sign(h) !== Math.sign(prevH) ? " ⚡ CROISEMENT CETTE BOUGIE" : ""}`);
    } else if (cmd === "bollinger") {
      const cl = closes(await klines(a[0])); const p = +(a[1] || 20);
      const m = sma(cl, p); const sd = Math.sqrt(cl.slice(-p).reduce((s, x) => s + (x - m) ** 2, 0) / p);
      const up = m + 2 * sd, lo = m - 2 * sd; const pb = (cl.at(-1) - lo) / (up - lo);
      console.log(`Bollinger ${a[0]}: [${lo.toFixed(2)} · ${m.toFixed(2)} · ${up.toFixed(2)}] %B=${(pb * 100).toFixed(0)}% → ${pb > 1 ? "🔴 au-dessus bande haute (extension)" : pb < 0 ? "🟢 sous bande basse" : "⚪ dans les bandes"}`);
    } else if (cmd === "stochastic") {
      const k = await klines(a[0]); const p = +(a[1] || 14);
      const slice = k.slice(-p); const hh = Math.max(...slice.map(x => x.h)), ll = Math.min(...slice.map(x => x.l));
      const K = 100 * (k.at(-1).c - ll) / (hh - ll || 1);
      console.log(`Stochastic %K ${a[0]}: ${K.toFixed(1)} → ${K > 80 ? "🔥 zone haute" : K < 20 ? "❄️ zone basse" : "⚪ médiane"}`);
    } else if (cmd === "atr") {
      const k = await klines(a[0]); const p = +(a[1] || 14);
      const trs = k.slice(-p).map(x => Math.max(x.h - x.l, Math.abs(x.h - x.c), Math.abs(x.l - x.c)));
      const atr = trs.reduce((s, x) => s + x, 0) / p;
      console.log(`ATR(${p}) ${a[0]}: ${atr.toFixed(2)} (${(100 * atr / k.at(-1).c).toFixed(2)}% du prix) → stop conseillé ≥ ${atr.toFixed(2)} sous l'entrée`);
    } else if (cmd === "adx") {
      const k = await klines(a[0]); const p = +(a[1] || 14);
      let pdm = 0, ndm = 0, tr = 0;
      for (let i = k.length - p; i < k.length; i++) {
        const up = k[i].h - k[i - 1].h, dn = k[i - 1].l - k[i].l;
        if (up > dn && up > 0) pdm += up; if (dn > up && dn > 0) ndm += dn;
        tr += Math.max(k[i].h - k[i].l, Math.abs(k[i].h - k[i - 1].c), Math.abs(k[i].l - k[i - 1].c));
      }
      const dip = 100 * pdm / (tr || 1), din = 100 * ndm / (tr || 1);
      const dx = 100 * Math.abs(dip - din) / ((dip + din) || 1);
      console.log(`ADX ${a[0]}: ${dx.toFixed(1)} (+DI ${dip.toFixed(0)} / -DI ${din.toFixed(0)}) → ${dx > 25 ? (dip > din ? "📈 TENDANCE HAUSSIÈRE forte" : "📉 baissière forte") : "↔️ RANGE (pas de tendance exploitable)"}`);
    } else if (cmd === "obv") {
      const k = await klines(a[0]); let obv = 0; const arr = [];
      for (let i = 1; i < k.length; i++) { obv += k[i].c > k[i - 1].c ? k[i].v : k[i].c < k[i - 1].c ? -k[i].v : 0; arr.push(obv); }
      const priceUp = k.at(-1).c > k.at(-21).c, obvUp = arr.at(-1) > arr.at(-21);
      console.log(`OBV ${a[0]}: ${priceUp && obvUp ? "✅ volume confirme la hausse" : !priceUp && !obvUp ? "✅ volume confirme la baisse" : "⚠️ DIVERGENCE prix/volume — méfiance"}`);
    } else if (cmd === "vwap") {
      const k = await klines(a[0], 30); let pv = 0, vv = 0;
      k.forEach(x => { pv += ((x.h + x.l + x.c) / 3) * x.v; vv += x.v; });
      const vwap = pv / vv; const above = k.at(-1).c > vwap;
      console.log(`VWAP30 ${a[0]}: ${vwap.toFixed(2)} — prix ${above ? "au-dessus 🟢 (biais acheteur)" : "en-dessous 🔴 (biais vendeur)"}`);
    } else if (cmd === "ema-cross") {
      const cl = closes(await klines(a[0])); const f = emas(cl, +(a[1] || 9)), s = emas(cl, +(a[2] || 21));
      let cross = -1; for (let i = cl.length - 1; i > 0; i--) if (Math.sign(f[i] - s[i]) !== Math.sign(f[i - 1] - s[i - 1])) { cross = cl.length - 1 - i; break; }
      console.log(cross >= 0 ? `Dernier cross EMA9/21 ${a[0]}: il y a ${cross} bougies (${f.at(-1) > s.at(-1) ? "haussier 🟢" : "baissier 🔴"})` : "pas de cross récent");
    } else if (cmd === "levels") {
      const k = await klines(a[0], 90); const c = k.at(-1).c;
      const highs = [...new Set(k.map(x => x.h))].sort((x, y) => y - x).slice(0, 5).filter(h => h > c).slice(-3);
      const lows = [...new Set(k.map(x => x.l))].sort((x, y) => x - y).slice(0, 5).filter(l => l < c).slice(-3);
      console.log(`Niveaux ${a[0]} (prix ${c.toFixed(2)}):\n  résistances: ${highs.reverse().map(h => h.toFixed(2)).join(" · ") || "aucune visible"}\n  supports: ${lows.reverse().map(l => l.toFixed(2)).join(" · ") || "aucun visible"}`);
    } else if (cmd === "correlation") {
      const [ka, kb] = await Promise.all([klines(a[0]), klines(a[1])]);
      const ra = closes(ka).map((c, i, arr) => i ? c / arr[i - 1] - 1 : 0).slice(-90);
      const rb = closes(kb).map((c, i, arr) => i ? c / arr[i - 1] - 1 : 0).slice(-90);
      const ma = ra.reduce((s, x) => s + x) / 90, mb = rb.reduce((s, x) => s + x) / 90;
      const cov = ra.reduce((s, x, i) => s + (x - ma) * (rb[i] - mb), 0);
      const sa = Math.sqrt(ra.reduce((s, x) => s + (x - ma) ** 2, 0)), sb = Math.sqrt(rb.reduce((s, x) => s + (x - mb) ** 2, 0));
      const r = cov / (sa * sb || 1);
      console.log(`Corrélation 90j ${a[0]}/${a[1]}: ${r.toFixed(2)} → ${r > .8 ? "très forte (peu de diversification)" : r > .5 ? "modérée" : r > 0 ? "faible ✅" : "négative (couverture naturelle ✅✅)"}`);
    } else if (cmd === "drawdown") {
      const cl = closes(await klines(a[0], 365)); let peak = cl[0], mdd = 0, curDD = 0;
      cl.forEach(c => { peak = Math.max(peak, c); mdd = Math.max(mdd, 1 - c / peak); });
      curDD = 1 - cl.at(-1) / Math.max(...cl);
      console.log(`Drawdown ${a[0]}: max 365j ${(100 * mdd).toFixed(1)}% · actuel depuis le plus haut: ${(100 * curDD).toFixed(1)}%`);
    } else if (cmd === "kelly") {
      const [wr, aw, al] = a.map(Number);
      if (!wr || !aw || !al) throw new Error("usage: kelly <winrate 0-1> <gain moyen> <perte moyenne>");
      const b = aw / al; const f = wr - (1 - wr) / b;
      console.log(`Kelly: ${(100 * f).toFixed(1)}% du capital · conseil prudent (½ Kelly): ${(50 * f).toFixed(1)}%${f <= 0 ? " → espérance NÉGATIVE, ne trade pas ce système" : ""}`);
    } else if (cmd === "seasonality") {
      const k = await klines(a[0], 730); const byMonth = {};
      k.forEach((x, i) => { if (!i) return; const m = new Date().getUTCMonth(); void m; });
      // regroupe par mois calendaire via index approximatif
      const months = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
      const sums = Array(12).fill(0), counts = Array(12).fill(0);
      for (let i = 30; i < k.length; i++) {
        const idx = (12 - Math.floor((k.length - i) / 30)) % 12;
        sums[idx] += k[i].c / k[i - 30].c - 1; counts[idx]++;
      }
      console.log(`Saisonnalité ~${a[0]} (rendement moyen/mois sur données dispo):`);
      months.forEach((m, i) => counts[i] && console.log(`  ${m}: ${(100 * sums[i] / counts[i]).toFixed(1)}%`));
    } else if (cmd === "regime") {
      const k = await klines(a[0]); const cl = closes(k);
      const adxLike = Math.abs(sma(cl, 20) - sma(cl, 50)) / sma(cl, 50) * 100;
      const atr = k.slice(-14).map(x => x.h - x.l).reduce((s, x) => s + x, 0) / 14 / cl.at(-1) * 100;
      console.log(`Régime ${a[0]}: séparation MA20/50 ${adxLike.toFixed(1)}% · ATR% ${atr.toFixed(2)} → ${adxLike > 5 ? (sma(cl, 20) > sma(cl, 50) ? "📈 TRENDING UP — stratégies trend OK" : "📉 TRENDING DOWN") : atr > 4 ? "🌀 RANGE HIGH-VOL — réduire le sizing" : "😴 RANGE LOW-VOL — carry/scalp fine, trend non"}`);
    } else {
      console.log(fs.readFileSync(__filename, "utf8").split("\n").filter(l => l.startsWith("//")).join("\n"));
    }
  } catch (e) { console.error("❌", e.message); process.exit(1); }
})();
