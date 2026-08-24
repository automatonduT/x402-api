#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// keyword-tracker.js — POSITIONS SEO (où je sors sur Bing)
// Usage: node keyword-tracker.js            → positions actuelles
//        node keyword-tracker.js --save     → + historique data/seo-history.json
// Mots-clés suivis par défaut, personnalisables dans keywords.txt
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const https = require("https");

const DOMAIN = "skintight-snowcap-underarm.ngrok-free.dev";
const KEYWORDS_FILE = path.join(process.env.HOME, "automaton-work", "tools", "keywords.txt");
const DEFAULT_KEYWORDS = [
  "x402 paywall audit", "x402 inspector free", "agent trading desk base",
  "x402 b2b audit", "honest agent storefront", "x402 backtest oos",
];

function bingSearch(q) {
  return new Promise(res => {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss&count=30`;
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res(d));
    }).on("error", () => res(""));
  });
}

(async () => {
  const kws = fs.existsSync(KEYWORDS_FILE) ? fs.readFileSync(KEYWORDS_FILE, "utf8").split("\n").map(s => s.trim()).filter(Boolean) : DEFAULT_KEYWORDS;
  console.log("=== POSITIONS SEO ===", new Date().toISOString().slice(0, 10), "\n");
  const results = [];
  for (const kw of kws) {
    const xml = await bingSearch(kw);
    const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]);
    let pos = 0;
    links.forEach((l, i) => { if (!pos && l.includes(DOMAIN)) pos = i + 1; });
    const icon = pos ? (pos <= 3 ? "🥇" : pos <= 10 ? "✅" : "📉") : "👻";
    console.log(`${icon} "${kw}" → ${pos ? `position ${pos}` : "pas dans le top 30"}`);
    results.push({ kw, pos, checkedAt: new Date().toISOString() });
    await new Promise(r => setTimeout(r, 1200)); // backoff légitime
  }
  if (process.argv.includes("--save")) {
    const f = path.join(process.env.HOME, "automaton-work", "data", "seo-history.json");
    let h = []; try { h = JSON.parse(fs.readFileSync(f)); } catch (e) {}
    h.push({ at: new Date().toISOString(), results });
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(h.slice(-52), null, 2));
    console.log("\n💾 Historique SEO sauvegardé");
  }
})();