#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// position-size.js — CALCULATEUR DE POSITION + GATE R/R (playbook #1)
// Usage: node position-size.js CAPITAL RISQUE% ENTREE STOP [TARGET]
//   ex: node position-size.js 3 1 60000 58800 63000
// Refuse l'entrée si R/R < 2 (gate obligatoire de la constitution).
// ─────────────────────────────────────────────
const [capital, riskPct, entryS, stopS, targetS] = process.argv.slice(2).map(Number);
if (!capital || !riskPct || !entryS || !stopS) {
  console.log("Usage: node position-size.js CAPITAL RISQUE% ENTREE STOP [TARGET]");
  process.exit(1);
}
const riskUsd = capital * riskPct / 100;
const dist = Math.abs(entryS - stopS);
if (dist === 0) { console.log("ERREUR: stop = entrée"); process.exit(1); }
const size = riskUsd / dist;              // taille en unités
const notional = size * entryS;
console.log(`=== POSITION SIZING (playbook #1) ===`);
console.log(`Capital: ${capital} | Risque autorisé: ${riskPct}% = ${riskUsd.toFixed(2)}$`);
console.log(`Distance entrée-stop: ${dist.toFixed(2)} (${(dist / entryS * 100).toFixed(2)}%)`);
console.log(`Taille position: ${size.toFixed(6)} unités (notionnel ${notional.toFixed(2)}$)`);
if (notional > capital) console.log(`⚠️ Notionnel > capital (${(notional / capital).toFixed(2)}x): PAS DE LEVIER — réduire la taille au capital disponible ou renoncer.`);
if (targetS) {
  const rr = Math.abs(targetS - entryS) / dist;
  console.log(`\nTarget: ${targetS} | Ratio R/R: ${rr.toFixed(2)}`);
  if (rr >= 2) console.log(`✅ GATE PASSÉ: R/R >= 2 — trade autorisé par la constitution`);
  else console.log(`🚫 GATE REFUSÉ: R/R < 2 — NE PAS ENTRER (cible trop proche du risque). Cherche un meilleur setup.`);
}
