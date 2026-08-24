#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// visitor-analytics.js — QUI VISITE TA BOUTIQUE ? (depuis les logs serveur)
// Usage: node visitor-analytics.js [jours]     → rapport trafic (défaut: 1)
// Sources: logs du serveur 4020. Aucun cookie, aucun tracker = vie privée.
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

(async () => {
  const days = parseInt(process.argv[2] || "1");
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  console.log(`=== TRAFIC depuis ${since} ===\n`);

  // Trouve les fichiers de log du serveur (access log ou stdout)
  const candidates = [
    path.join(process.env.HOME, "automaton-work", "x402-api", "server.log"),
    path.join(process.env.HOME, "automaton-work", "x402-api", "logs"),
    "/tmp/x402-server.log",
  ];
  let logData = "";
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isDirectory()) continue;
      logData += fs.readFileSync(c, "utf8");
    } catch (e) {}
  }

  // Fallback: parse les logs ngrok si dispo, sinon stats API interne
  if (!logData) {
    try {
      const out = execSync('curl -s -m 8 http://localhost:4020/stats').toString();
      console.log("(logs bruts indisponibles — stats internes du serveur)");
      console.log(out);
      return;
    } catch (e) { console.log("❌ Ni logs ni /stats accessibles"); process.exit(1); }
  }

  const lines = logData.split("\n").filter(l => l.includes(since));
  const pages = {}, refs = {};
  lines.forEach(l => {
    const m = l.match(/(GET|POST)\s+(\S+)/);
    if (m) pages[m[2]] = (pages[m[2]] || 0) + 1;
    const r = l.match(/referer[":\s]+(https?:\/\/[^"'\s,]+)/i);
    if (r) refs[r[1]] = (refs[r[1]] || 0) + 1;
  });

  console.log(`Requêtes totales: ${lines.length}\n`);
  console.log("📄 Top pages:");
  Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([p, n]) => console.log(`   ${String(n).padStart(4)} ${p}`));
  const topRefs = Object.entries(refs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topRefs.length) {
    console.log("\n🔗 Top sources de trafic:");
    topRefs.forEach(([r, n]) => console.log(`   ${String(n).padStart(4)} ${r.slice(0, 70)}`));
  }
  console.log("\n💡 Ce qui est visité mais ne convertit pas = à améliorer en priorité.");
})();