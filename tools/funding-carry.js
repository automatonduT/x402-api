#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// funding-carry.js — STRATÉGIE CASH-AND-CARRY (market-neutral)
// Usage: node funding-carry.js [SYMBOL] [JOURS]
//   ex: node funding-carry.js BTCUSDT 90
// Principe institutionnel: LONG spot + SHORT perp = neutre au prix,
// on encaisse le funding toutes les 8h. Le seul P&L vient du taux.
// C'est la stratégie des desks qui gagne SANS deviner la direction.
// ─────────────────────────────────────────────
const https = require("https");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "tradelab/1.0" } }, res => {
      let d = ""; res.on("data", c => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

(async () => {
  const sym = process.argv[2] || "BTCUSDT";
  const days = parseInt(process.argv[3] || "90");
  const limit = Math.min(days * 3, 1000); // funding = 3/jour

  // Historique du funding (perpétuel Binance)
  const hist = await get(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${sym}&limit=${limit}`);
  if (!hist.length) { console.log("Pas de données funding pour", sym); process.exit(1); }

  console.log(`=== FUNDING-RATE CARRY ${sym} (${hist.length} périodes de 8h ≈ ${(hist.length/3).toFixed(0)} jours) ===\n`);

  // Statistiques
  const rates = hist.map(h => parseFloat(h.fundingRate));
  const sum = rates.reduce((a, b) => a + b, 0);
  const avg8h = sum / rates.length;
  const avgDay = avg8h * 3;
  const annualized = avgDay * 365;
  const positiveCount = rates.filter(r => r > 0).length;
  const posShare = (positiveCount / rates.length) * 100;

  console.log(`Taux moyen par 8h:   ${(avg8h * 100).toFixed(4)}%`);
  console.log(`Rendement journalier moyen: ${(avgDay * 100).toFixed(4)}%`);
  console.log(`Rendement ANNUALISÉ si toujours en position: ${annualized > 0 ? "+" : ""}${(annualized * 100).toFixed(2)}%`);
  console.log(`Périodes positives: ${posShare.toFixed(0)}% du temps`);
  console.log(`Taux min/max: ${(Math.min(...rates) * 100).toFixed(4)}% / ${(Math.max(...rates) * 100).toFixed(4)}%`);

  // Simulation: n'entrer QUE quand le financement prévu est élevé (filtre qualité)
  const THRESHOLD = 0.01; // 0.01% par 8h = ~11%/an
  let inPos = false, earned = 0, trades = 0, lastEntry = 0;
  for (const h of hist) {
    const r = parseFloat(h.fundingRate);
    if (!inPos && r >= THRESHOLD / 100) { inPos = true; trades++; }
    else if (inPos) {
      earned += r;
      if (r < 0.002 / 100) inPos = false; // sortie si funding retombe sous 0.002%
    }
  }
  const filteredAnnual = (earned / (hist.length / 3)) * 365;
  console.log(`\n--- Variante FILTRÉE (entrer seulement si funding >= ${THRESHOLD}%) ---`);
  console.log(`Position tenue ${trades} fois | Rendement annualisé filtré: ${(filteredAnnual * 100).toFixed(2)}%`);

  console.log(`\n--- Lecture desk ---`);
  if (annualized > 0.05) console.log(`✅ Carry positif structurel sur ${sym}: LONG spot + SHORT perp encaisse ~${(annualized*100).toFixed(1)}%/an SANS risque de direction (risques résiduels: frais double jambe, liquidation jambe perp, variation funding).`);
  else if (annualized < -0.02) console.log(`⚠️ Funding négatif structurel: c'est les shorts qui paient. Inverser la logique (SHORT spot impossible à ton échelle → rester flat ou LONG perp seul = directionnel, interdit sans edge).`);
  else console.log(`≈ Carry marginal sur la période — stratégie peu rentable actuellement sur ${sym}.`);

  console.log(`\n⚠️ À ton échelle ($3): le double-leg nécessite trop de capital par jambe. PAPER-TRADE ce module pour apprendre; il devient puissant quand le capital grandit (c'est LA stratégie des gros wallets).`);
})();
