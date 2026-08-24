#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// journal-stats.js — ANALYSE DU PROPRE JOURNAL de trades papier
// Usage: node journal-stats.js [chemin-vers-experiments.md]
// Parse les lignes | PAPER | du ledger et sort l'espérance PAR
// SYSTÈME et PAR PAIRE → base de décision tuer/amplifier.
// ─────────────────────────────────────────────
const fs = require("fs");
const path = process.argv[2] || require("os").homedir() + "/automaton-work/experiments.md";
const text = fs.readFileSync(path, "utf8");
const rows = [];
for (const line of text.split("\n")) {
  const m = line.match(/\| PAPER \| (\S+) \| (\w+USDT)?\s*(\w[\w-]*): (LONG|SHORT|FLAT).*?verdict=([A-Z-]+)/);
  if (!m) continue;
  const [, ts, pair, , side, verdict] = m;
  if (!pair) continue;
  rows.push({ pair, system: /meanrev/i.test(line) ? "MEANREV" : "MOMENTUM", verdict });
}
if (!rows.length) { console.log("(aucune ligne PAPER trouvée)"); process.exit(0); }

function group(key) {
  const g = {};
  for (const r of rows) {
    g[r[key]] = g[r[key]] || { total: 0 };
    g[r[key]].total++;
  }
  return g;
}
console.log(`=== JOURNAL STATS (${rows.length} trades papier) ===`);
console.log("\nPar système:");
for (const [k, v] of Object.entries(group("system"))) console.log(`  ${k}: ${v.total} signaux`);
console.log("\nPar paire:");
for (const [k, v] of Object.entries(group("pair"))) console.log(`  ${k}: ${v.total} signaux`);
const pend = rows.filter(r => r.verdict === "PENDING").length;
const noTrade = rows.filter(r => r.verdict.startsWith("CLOSED-NO")).length;
console.log(`\nVerdicts: ${pend} en attente | ${noTrade} refusés par discipline (${(noTrade / rows.length * 100).toFixed(0)}%)`);
console.log(`⚠️ Rappel playbook: pas de jugement d'espérance avant 20+ trades FERMÉS avec résultat WIN/LOSS.`);
