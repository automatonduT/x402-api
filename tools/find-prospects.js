#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// find-prospects.js — GÉNÉRATEUR DE CLIENTS B2B pour deep-audit
// Usage: node find-prospects.js [output.json]
// Trouve les équipes qui déploient du x402 (ses futurs clients audit):
// 1. Parse la liste awesome-x402 (vendeurs réels)
const NON_PRODUCT=/mozilla|pypi|eips\.ethereum|w3\.org|ietf\.org|rfc-editor|wikipedia|reddit|medium\.com|arxiv/i;
// 2. Recherche GitHub de repos utilisant des libs x402
// 3. SONDE chaque domaine: leur paywall est-il conforme?
//    → Un défaut trouvé = un pitch prêt à envoyer avec PREUVE.
// ─────────────────────────────────────────────
const https = require("https");

function get(url, headers = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "prospect-research/1.0", Accept: "application/json", ...headers } }, res => {
      let d = ""; res.on("data", c => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    }).on("error", () => resolve({ status: 0, body: "" }));
  });
}

async function probeVendor(name, baseUrl) {
  const out = { name, url: baseUrl, manifestOk: false, issues: [] };
  try {
    // 1. Manifest x402 présent et valide ?
    const m = await get(baseUrl.replace(/\/$/, "") + "/.well-known/x402.json");
    if (m.status !== 200) { out.issues.push("manifest absent (" + m.status + ")"); }
    else {
      try {
        const j = JSON.parse(m.body);
        out.manifestOk = true;
        if (!j.resources || !j.resources.length) out.issues.push("manifest sans resources");
        if (!j.version) out.issues.push("version manquante");
      } catch (e) { out.issues.push("manifest JSON invalide"); }
    }
    // 2. Docs agents présents ?
    const l = await get(baseUrl.replace(/\/$/, "") + "/llms.txt");
    if (l.status !== 200) out.issues.push("pas de llms.txt (découverte agents faible)");
    // 3. OpenAPI ?
    const o = await get(baseUrl.replace(/\/$/, "") + "/openapi.json");
    if (o.status !== 200) out.issues.push("pas d'openapi.json");
  } catch (e) { out.issues.push("injoignable"); }
  out.score = 10 - out.issues.length; // moins de défauts = mieux établi; plus de défauts = meilleur PROSPECT audit
  return out;
}

(async () => {
  console.log("=== CHASSE AUX PROSPECTS X402 ===\n");
  const leads = [];

  // Source 1: awesome-x402 README — extraire les domaines vendeurs
  const aw = await get("https://raw.githubusercontent.com/xpaysh/awesome-x402/main/README.md");
  const urls = [...new Set((aw.body.match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .map(u => u.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(d => !/github\.com|raw\.githubusercontent|x402|coinbase|base\.org|npmjs|discord|twitter|x\.com/i.test(d))
    .filter(d => !NON_PRODUCT.test(d)))];
  console.log(`Domaines candidats extraits d'awesome-x402: ${urls.length}`);

  // Source 2: GitHub repo search (non-auth limité mais gratuit)
  const gh = await get("https://api.github.com/search/repositories?q=x402+in:name,description&sort=updated&per_page=15");
  let ghNames = [];
  try {
    const j = JSON.parse(gh.body);
    ghNames = (j.items || []).map(r => ({ name: r.full_name, desc: r.description || "", stars: r.stargazers_count, url: r.html_url }));
    console.log(`Repos GitHub x402 actifs: ${ghNames.length}`);
  } catch (e) {}

  // Sonder les domaines (max 12 pour rester léger)
  for (const d of urls.slice(0, 12)) {
    const v = await probeVendor(d, "https://" + d);
    v.issues.length && leads.push(v);
  }

  // Trier: plus de défauts = meilleur prospect (pitch factuel prêt)
  leads.sort((a, b) => b.issues.length - a.issues.length);

  console.log("\n=== PROSPECTS CLASSÉS (défauts découverts = pitch prêt) ===\n");
  leads.forEach(l => {
    console.log(`• ${l.name} (${l.url})`);
    console.log(`  Défauts détectés: ${l.issues.join("; ") || "conforme"}`);
  });

  console.log("\n=== REPOS GITHUB ACTIFS (communauté à rejoindre) ===");
  ghNames.slice(0, 8).forEach(r => console.log(`• ${r.name} ★${r.stars} — ${(r.desc || "").slice(0, 80)}`));

  const outPath = process.argv[2];
  if (outPath) {
    require("fs").writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), prospects: leads, github: ghNames }, null, 2));
    console.log(`\n💾 Sauvegardé: ${outPath}`);
  }
})();
