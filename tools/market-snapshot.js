#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// market-snapshot.js — CHECKLIST PRÉ-TRADE en un appel (desk checklist)
// Usage: node market-snapshot.js SYMBOL   (ex: BTCUSDT)
// Sortie: prix, variation 24h, funding perp, open interest, spread,
//         session active, régime ADX rapide. Tout ce que le playbook
//         exige de vérifier AVANT d'entrer.
// ─────────────────────────────────────────────
const https = require("https");
const ind = require("./indicators.js");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "tradelab/1.0" } }, res => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

function session() {
  const h = new Date().getUTCHours();
  if (h >= 13 && h < 21) return { name: "US (dominante)", weight: "forte" };
  if (h >= 7 && h < 15) return { name: "Londres", weight: "moyenne-forte" };
  if (h >= 0 && h < 8) return { name: "Asie", weight: "faible-moyenne" };
  return { name: "Fin US / nuit", weight: "faible" };
}

(async () => {
  const sym = process.argv[2] || "BTCUSDT";
  const [ticker, funding] = await Promise.all([
    get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`),
    get(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`).catch(() => null),
  ]);
  const kl = await get(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=4h&limit=100`);
  const candles = kl.map(k => ({ t: k[0], o: k[1], h: k[2], l: k[3], c: k[4], v: k[5] }));
  const closes = ind.closes(candles);
  const adxV = ind.adx(candles).at(-1) ?? 0;
  const rsiV = ind.rsi(closes).at(-1) ?? 50;
  const bb = ind.bollinger(closes);

  const regime = adxV > 25 ? "TREND (momentum autorisé)" : adxV < 20 ? "RANGE (meanrev autorisé)" : "MIXED (prudence)";
  const fr = funding ? parseFloat(funding.lastFundingRate) * 100 : null;
  const fundingSignal = fr === null ? "?" : fr > 0.05 ? "EXTRÊME+ (longs bondés, prudence contrarienne)" :
    fr < -0.05 ? "EXTRÊME- (shorts bondés, squeeze possible)" : "neutre";

  console.log(`=== SNAPSHOT ${sym} ===`);
  console.log(`Prix: ${(+ticker.lastPrice).toLocaleString()} | 24h: ${(+ticker.priceChangePercent).toFixed(2)}%`);
  console.log(`Volume 24h: ${(parseFloat(ticker.quoteVolume) / 1e6).toFixed(0)}M$ | Spread implicite OK si volume >100M`);
  console.log(`Funding perp: ${fr !== null ? fr.toFixed(4) + "%" : "?"} → ${fundingSignal}`);
  console.log(`ADX(4h): ${adxV.toFixed(1)} → régime ${regime}`);
  console.log(`RSI(4h): ${rsiV.toFixed(1)} | BB width: ${bb.width.at(-1)?.toFixed(3)}${bb.width.at(-1) && bb.width.slice(-30).filter(w => w !== null).every(w => w >= bb.width.at(-1)) ? " ← SQUEEZE! breakout se prépare" : ""}`);
  const s = session();
  console.log(`Session: ${s.name} (liquidité ${s.weight})`);
  console.log(`\n⚠️ Checklist playbook: régime cohérent avec le système? funding extrême? session favorable? R/R>=2?`);
})().catch(e => { console.error("ERREUR:", e.message); process.exit(1); });
