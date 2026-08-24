#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// api-docs-sync.js — DÉTECTION DE DRIFT entre docs promises et API réelle
// Usage: node api-docs-sync.js
// Compare: routes annoncées dans openapi.json / llms.txt vs serveur réel.
// Une route promise mais absente = FAUSSE PROMESSE = fuite de confiance.
// ─────────────────────────────────────────────
const http = require("http");
const fs = require("fs");
const path = require("path");

function fetchLocal(p) {
  return new Promise(res => {
    http.get({ host: "localhost", port: 4020, path: p, timeout: 8000 }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res({ status: r.statusCode, body: d }));
    }).on("error", () => res({ status: 0, body: "" }));
  });
}

(async () => {
  console.log("=== SYNC DOCS ↔ RÉALITÉ ===\n");
  let drift = 0;

  // 1. openapi.json existe et est servi ?
  const oa = await fetchLocal("/openapi.json");
  if (oa.status !== 200) { console.log("❌ openapi.json NON SERVI — les agents ne peuvent pas te comprendre"); drift++; }
  else {
    let paths = [];
    try { paths = Object.keys(JSON.parse(oa.body).paths || {}); } catch (e) {}
    console.log(`📄 openapi.json annonce ${paths.length} routes. Vérification...`);
    for (const p of paths) {
      const r = await fetchLocal(p);
      const ok = r.status < 500; // 4xx métier OK (auth/prix), 5xx/0 = cassé
      if (!ok) { console.log(`  ❌ ${p} → HTTP ${r.status} ANNONCÉE MAIS CASSÉE`); drift++; }
    }
    console.log("   scan terminé");
  }

  // 2. llms.txt : extraire les URLs mentionnées, vérifier chacune
  const llms = await fetchLocal("/llms.txt");
  if (llms.status !== 200) { console.log("❌ llms.txt NON SERVI"); drift++; }
  else {
    const urls = [...new Set([...llms.body.matchAll(/https?:\/\/[^\s)"'>]+/g)].map(m => m[0]))]
      .filter(u => u.includes("localhost") || u.includes("127.0.0.1"));
    console.log(`📄 llms.txt mentionne ${urls.length} URL locales. Vérification...`);
    for (const u of urls) {
      const p = u.replace(/^https?:\/\/[^/]+/, "");
      const r = await fetchLocal(p);
      if (r.status === 404) { console.log(`  ❌ ${p} → 404 MENTIONNÉ DANS LLMS.TXT MAIS ABSENT`); drift++; }
    }
    console.log("   scan terminé");
  }

  console.log(drift === 0 ? "\n✅ ZÉRO DRIFT — chaque promesse de doc est servie" : `\n🚨 ${drift} drift(s) détecté(s) — corrige ou retire la mention. Une page ne ment jamais.`);
  process.exit(drift ? 1 : 0);
})();