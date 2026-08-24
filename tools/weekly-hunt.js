#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// weekly-hunt.js — CHASSE AUTOMATISÉE DE LEADS x402
// Usage: node weekly-hunt.js  (cron/hebdo recommandé)
// Sources: awesome-x402, GitHub issues douleur, nouveaux repos,
//          repos utilisant libs officielles.
// Sortie: data/leads-classified.json (hot/warm/cold) — fusionne avec l'existant.
// ─────────────────────────────────────────────
const https = require("https");
const fs = require("fs");
const path = require("path");

function get(url) {
  return new Promise(res => {
    try {
      const u = new URL(url);
      https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "lead-hunter/1.0", Accept: "application/json" } }, r => {
        let d = ""; r.on("data", c => d += c); r.on("end", () => res({ status: r.statusCode, body: d, h: r.headers }));
      }).on("error", () => res({ status: 0, body: "" }));
    } catch (e) { res({ status: 0, body: "" }); }
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function classify(lead) {
  // HOT = douleur active documentée ou défaut critique bloquant
  if (lead.painEvidence || lead.defects.some(d => /injoignable|503|522|DEPLOYMENT|sans resources/.test(d))) lead.temp = "hot";
  else if (lead.defects.length >= 2) lead.temp = "warm";
  else lead.temp = "cold";
  return lead;
}

(async () => {
  const outDir = path.join(process.env.HOME, "automaton-work", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const leads = [];

  console.log("=== CHASSE HEBDO", new Date().toISOString().slice(0, 10), "===\n");

  // ── Source 1: issues douleur (mots-clés rotation) ──
  const painQueries = ["x402+verify+failed", "x402+payment+error", "x402+settle+issue", "x402+facilitator+problem"];
  for (const q of painQueries) {
    const r = await get(`https://api.github.com/search/issues?q=${q}+state:open&sort=updated&per_page=5`);
    try {
      for (const i of JSON.parse(r.body).items || []) {
        leads.push(classify({
          source: "github-issue-pain", type: "hot-prospect",
          title: i.title.slice(0, 90), repo: i.repository_url?.split("/").slice(-2).join("/"),
          url: i.html_url, updated: i.updated_at?.slice(0, 10), comments: i.comments,
          contactChannel: "répondre utilement sur l'issue (pas de pitch nu)",
          painEvidence: true, defects: []
        }));
      }
    } catch (e) {}
    await sleep(2500);
  }

  // ── Source 2: nouveaux repos x402 (7 jours) ──
  let r = await get("https://api.github.com/search/repositories?q=x402+created:>=" + new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10) + "&sort=created&per_page=10");
  try {
    for (const i of JSON.parse(r.body).items || []) {
      leads.push(classify({
        source: "github-new-repo", type: "preventive-pitch",
        repo: i.full_name, stars: i.stargazers_count, created: i.created_at?.slice(0, 10),
        desc: (i.description || "").slice(0, 80),
        pitchAngle: "avant ton lancement public, fais valider ton paywall ($5)",
        defects: []
      }));
    }
  } catch (e) {}

  // ── Source 3: sondage manifestes awesome-x402 (rotation 25/cycle) ──
  const stateFile = path.join(outDir, "hunt-state.json");
  let offset = 0;
  try { offset = JSON.parse(fs.readFileSync(stateFile)).offset || 0; } catch (e) {}
  r = await get("https://raw.githubusercontent.com/xpaysh/awesome-x402/main/README.md");
  const all = (r.body.match(/\((https?:\/\/[^)]+)\)/g) || []).map(s => s.slice(1, -1));
  const domains = [...new Set(all.map(u => { try { return new URL(u).hostname; } catch (e) { return null; } }).filter(Boolean))]
    .filter(d => !/github|x402\.io|x402scan|coinbase|base\.org|npmjs|discord|twitter|x\.com|reddit|medium|youtube|shields|mozilla|pypi|eips\.ethereum|wikipedia|pkg\.go/i.test(d));
  const batch = domains.slice(offset % Math.max(domains.length, 1), (offset % Math.max(domains.length, 1)) + 25);
  for (const d of batch) {
    const m = await get(`https://${d}/.well-known/x402.json`);
    if (m.status === 0) continue;
    const defects = [];
    if (m.status !== 200) defects.push(`manifest ${m.status}`);
    else {
      try { const j = JSON.parse(m.body); if (!j.resources?.length) defects.push("manifest sans resources"); if (!j.version) defects.push("version absente"); }
      catch (e) { defects.push("manifest invalide"); }
    }
    if (defects.length) leads.push(classify({ source: "awesome-x402-scan", type: "audit-pitch", domain: d, defects, contactChannel: "email/issue/PR selon dispo" }));
    await sleep(300);
  }
  fs.writeFileSync(stateFile, JSON.stringify({ offset: offset + 25 }));

  // ── Fusion + tri ──
  const outFile = path.join(outDir, "leads-classified.json");
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(outFile)); } catch (e) {}
  const seen = new Set(existing.map(l => l.repo || l.domain));
  const merged = [...existing, ...leads.filter(l => !seen.has(l.repo || l.domain))];
  merged.sort((a, b) => (a.temp === "hot" ? -1 : b.temp === "hot" ? 1 : 0));
  fs.writeFileSync(outFile, JSON.stringify(merged, null, 2));

  const hot = merged.filter(l => l.temp === "hot").length;
  console.log(`\n📊 Total leads: ${merged.length} (dont ${hot} HOT)`);
  console.log(`💾 ${outFile}`);
  console.log("\nProchaine exécution recommandée: dans 7 jours (rotation auto des sources)");
})();
