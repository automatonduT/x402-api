#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// competitor-watch.js — VEILLE CONCURRENTIELLE (prix, actifs, mouvements)
// Usage: node competitor-watch.js          → rapport complet
//        node competitor-watch.js --save   → + historique data/competitors.json
// Surveille: repos GitHub des pairs (stars, maj, releases), prix affichés.
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const https = require("https");

const TOKEN = (fs.readFileSync(path.join(process.env.HOME, ".automaton", ".env"), "utf8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim();
function get(url) {
  return new Promise(res => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "watch/1.0", Accept: "application/vnd.github+json" } };
    if (TOKEN) opts.headers.Authorization = "token " + TOKEN;
    https.get(opts, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { res({}); } }); }).on("error", () => res({}));
  });
}

const WATCHLIST = [
  { repo: "MikeyPetrillo/Agent402", why: "marketplace 500+ outils — concurrent direct" },
  { repo: "Merit-Systems/x402scan", why: "annuaire officiel — être listé" },
  { repo: "internet-court/internet-court-skill", why: "trust layer commerce A2A" },
  { repo: "BlockRunAI/Franklin", why: "agent acheteur USDC — client potentiel" },
  { repo: "daydreamsai/lucid-agents", why: "SDK commerce bootstrap" },
  { repo: "alsk1992/CloddsBot", why: "trading agent pair" },
];

(async () => {
  console.log("=== VEILLE CONCURRENTIELLE ===", new Date().toISOString().slice(0, 16), "\n");
  const snapshot = [];
  for (const w of WATCHLIST) {
    const r = await get(`https://api.github.com/repos/${w.repo}`);
    if (!r.full_name) { console.log(`⚠️  ${w.repo} inaccessible`); continue; }
    const ageDays = Math.floor((Date.now() - new Date(r.updated_at)) / 864e5);
    console.log(`📦 ${r.full_name} ★${r.stargazers_count} | dernière activité: ${ageDays}j | ${w.why}`);
    snapshot.push({ repo: w.repo, stars: r.stargazers_count, ageDays, checkedAt: new Date().toISOString() });
  }
  if (process.argv.includes("--save")) {
    const f = path.join(process.env.HOME, "automaton-work", "data", "competitors-history.json");
    let h = []; try { h = JSON.parse(fs.readFileSync(f)); } catch (e) {}
    h.push({ at: new Date().toISOString(), repos: snapshot });
    fs.mkdirSync(path.dirname(f), { recursive: true });
    // garde 52 semaines max
    fs.writeFileSync(f, JSON.stringify(h.slice(-52), null, 2));
    console.log("\n💾 Historique sauvegardé (" + h.length + " snapshots)");
  }
  console.log("\n💡 Signal à surveiller: une star qui EXPLODE = écosystème qui grandit = ton marché grossit.");
})();