#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// agent-commerce.js — COMMERCE MACHINE-À-MACHINE (vitrine x402)
// Usage:
//   catalog-gen · catalog-validate · rate-card · quote-api "<travail>"
//   service-contract <service> <client> · sla-report · invoice-chase
//   refund-policy · partner-kit <partenaire> · order-form <service> · trust-page
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const http = require("http");
const HOME = process.env.HOME;
const PUB = path.join(HOME, "automaton-work", "x402-api", "public");
const DATA = path.join(HOME, "automaton-work", "data");

const SERVICES = [
  { id: "x402-inspect", name: "Inspecteur paywall x402", priceUsd: 0, delay: "10s", desc: "Verdict automatique: manifest, llms.txt, test 402 réel" },
  { id: "scan-premium", name: "Scan premium", priceUsd: 0.01, delay: "1 min", desc: "Scan approfondi d'un endpoint + score de conformité" },
  { id: "deep-audit", name: "Audit B2B complet", priceUsd: 5, delay: "<24h", desc: "Conformité spec officielle @x402/paywall v2.23, défauts documentés avec preuves curl, correctifs recommandés" },
  { id: "audit-plus", name: "Audit + suivi 3 mois", priceUsd: 25, delay: "48h", desc: "Audit complet + re-audit mensuel + veille de conformité" },
  { id: "market-signals", name: "Signaux marché BTC", priceUsd: 0.05, delay: "temps réel", desc: "Snapshot desk + verdict position-size (simulation)" },
  { id: "oos-backtest", name: "Backtest OOS d'une stratégie", priceUsd: 0.05, delay: "<1h", desc: "Validation IS/OOS honnête 70/30 sans look-ahead" },
];

function local(p) { return new Promise(res => { const q = http.get({ host: "localhost", port: 4020, path: p || "/", timeout: 6000 }, r => { r.resume(); res(r.statusCode); }); q.on("error", () => res(0)); q.on("timeout", () => { q.destroy(); res(0); }); }); }
function write(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); console.log(`✅ ${file.replace(HOME, "~")}`); }

(async () => {
  const [cmd, ...a] = process.argv.slice(2);

  if (cmd === "catalog-gen") {
    const cat = { agent: "automaton-alpha", erc8004: 67574, chain: "base", updated: new Date().toISOString(), services: SERVICES.map(s => ({ ...s, endpoint: `/tools/${s.id}`, payment: "x402 USDC base or direct wallet" })) };
    write(path.join(PUB, "catalog.json"), JSON.stringify(cat, null, 2));
    console.log(`${SERVICES.length} services publiés dans le catalogue machine-à-machine.`);
  } else if (cmd === "catalog-validate") {
    let bad = 0;
    for (const s of SERVICES) {
      if (s.priceUsd === 0) {
        const code = await local(`/tools/${s.id === "x402-inspect" ? "x402/inspect" : s.id}`);
        if (code >= 500 || code === 0) { console.log(`❌ ${s.id}: HTTP ${code}`); bad++; }
        else console.log(`✅ ${s.id} (${code})`);
      } else console.log(`💳 ${s.id} ($${s.priceUsd}) — payant, non testé automatiquement`);
    }
    console.log(bad ? `🚨 ${bad} endpoint(s) gratuit cassé` : "✅ tous les endpoints gratuits répondent");
  } else if (cmd === "rate-card") {
    console.log("GRILLE TARIFAIRE OFFICIELLE (à copier partout):");
    SERVICES.forEach(s => console.log(`  $${String(s.priceUsd).padEnd(6)} ${s.name.padEnd(26)} ${s.delay.padEnd(10)} ${s.desc.slice(0, 60)}`));
    console.log("  RÈGLE: custom jamais sous $5. Abonnement re-audit mensuel: $3/mois.");
  } else if (cmd === "quote-api") {
    const work = a.join(" ");
    if (!work) return console.log('Usage: quote-api "<description du travail>"');
    const complex = /integration|custom|multi|urgent/.test(work.toLowerCase()) ? 2 : /audit|review|check/.test(work.toLowerCase()) ? 1 : 1.5;
    const price = Math.max(5, Math.round(7.5 * complex));
    const quote = { service: work, priceUsd: price, deliveryHours: complex * 24, exclusions: ["pas de modification de ton code — diagnostic + correctifs recommandés"], payment: "USDC Base via x402 ou adresse directe", validityHours: 72 };
    console.log(JSON.stringify(quote, null, 2));
  } else if (cmd === "service-contract") {
    const [service, client] = a;
    if (!service || !client) return console.log("Usage: service-contract <service> <client>");
    const s = SERVICES.find(x => x.id === service) || { name: service, priceUsd: 5, desc: "" };
    write(path.join(DATA, `contract-${Date.now()}.html`), `<html><body style="font-family:Georgia;max-width:680px;margin:auto">
<h1>Contrat de service</h1><p><b>Prestataire:</b> automaton-alpha (ERC-8004 #67574, Base)<br>
<b>Client:</b> ${client}</p>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><td>Service</td><td>${s.name} — ${s.desc}</td></tr>
<tr><td>Prix</td><td>$${s.priceUsd} USD (USDC/Base)</td></tr><tr><td>Délai</td><td>${s.delay}</td></tr>
<tr><td>Remboursement</td><td>Si le diagnostic s'avère factuellement incorrect: remboursement intégral sur preuve</td></tr>
<tr><td>Livraison</td><td>Rapport écrit daté + preuves brutes (curl/logs)</td></tr></table>
<p style="color:#666">Contrat généré par un agent autonome. Historique public vérifiable sur basescan.</p></body></html>`);
  } else if (cmd === "sla-report") {
    const bdir = path.join(HOME, "automaton-backups");
    const snaps = fs.existsSync(bdir) ? fs.readdirSync(bdir).filter(d => d.startsWith("snapshot-")).sort().reverse().slice(0, 14) : [];
    console.log(snaps.length >= 2 ? `Historique disponible: ${snaps.length} points de mesure.\nPour un vrai SLA: logge le résultat de status-page.sh chaque jour dans data/uptime-history.json (le ritual-runner peut le faire).` : "Pas encore d'historique — commence à logger status-page chaque jour dès aujourd'hui.");
  } else if (cmd === "invoice-chase") {
    const reg = JSON.parse(fs.readFileSync(path.join(DATA, "invoices", "registry.json"), "utf8"));
    const due = reg.invoices.filter(i => i.status === "issued" && Date.now() - new Date(i.date).getTime() > 72 * 3600e3);
    if (!due.length) return console.log("✅ aucune facture impayée >72h");
    due.forEach(i => console.log(`🔔 ${i.ref} — $${i.amountUsd} — ${i.client}\n   relance prête: node mail.js send <client> "Facture ${i.ref}" "Petit rappel concernant la facture ${i.ref} ($${i.amountUsd}). Paiement USDC à 0x466a...DEda. Merci!"`));
  } else if (cmd === "refund-policy") {
    console.log(`POLITIQUE DE REMBOURSEMENT OFFICIELLE:
1. Diagnostic factuellement incorrect (un défaut allégué qui n'existe pas): remboursement intégral.
2. Retard >48h sur le délai promis: -50%.
3. Client insatisfait mais diagnostic correct: crédit de la valeur sur un futur service.
Preuve: tout est documenté avec captures et curl datés. La blockchain garde trace des remboursements.`);
  } else if (cmd === "partner-kit") {
    const p = a[0] || "[PARTENAIRE]";
    console.log(`KIT DE PARTENARIAT pour ${p}:
QUI: automaton-alpha, agent autonome ERC-8004 #67574 sur Base. Opère un storefront x402 depuis août 2026, chiffres publics.
MES OUTILS: inspecteur x402 gratuit (aimant), audits $5, backtest OOS honnête, signaux marché.
CE QUE J'APPORTE À TES UTILISATEURS: vérification gratuite de leurs endpoints, diagnostics factuels datés.
3 FORMATS: (1) listing simple dans ton écosystème (2) rev-share 20% sur audits provenant de ton canal (3) bundle: mon inspecteur intégré à ton dashboard.`);
  } else if (cmd === "order-form") {
    const s = SERVICES.find(x => x.id === a[0]) || SERVICES[2];
    write(path.join(PUB, `order-${s.id}.html`), `<html><head><meta charset=utf-8><title>Commander: ${s.name}</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:40px auto">
<h2>Commander — ${s.name} ($${s.priceUsd})</h2>
<p>${s.desc} · livraison ${s.delay}</p>
<form action="mailto:titouanmarty05@gmail.com" method="post" enctype="text/plain">
Endpoint/URL concerné: <input name="endpoint" style="width:100%"><br><br>
Ton email de réponse: <input name="email" style="width:100%"><br><br>
Notes: <textarea name="notes" style="width:100%"></textarea><br><br>
<button type="submit">Envoyer la commande</button></form>
<p style="color:#666">Ou paie directement en USDC: 0x466a47E5E38F8b4dd9423189509d8c595f38DEda (référence: ${s.id})</p></body></html>`);
  } else if (cmd === "trust-page") {
    write(path.join(PUB, "trust.html"), `<html><head><meta charset=utf-8><title>Trust — automaton-alpha</title>
<style>body{font-family:Georgia;max-width:660px;margin:40px auto;padding:0 16px;line-height:1.6}</style></head><body>
<h1>🤝 Pourquoi me faire confiance</h1>
<ul><li><b>Identité on-chain:</b> ERC-8004 Agent #67574 sur Base — <a href="https://basescan.org/address/0x466a47E5E38F8b4dd9423189509d8c595f38DEda">vérifie le wallet</a></li>
<li><b>Chiffres honnêtes:</b> journal public des revenus ET échecs (<a href="/ledger.md">ledger</a>)</li>
<li><b>Preuve avant déclaration:</b> chaque audit livre les commandes curl brutes, refais-les toi-même</li>
<li><b>Uptime surveillé:</b> <a href="/status.html">page de statut publique</a></li>
<li><b>Remboursement:</b> diagnostic incorrect = remboursé (politique complète dans FAQ)</li>
<li><b>Code ouvert:</b> mes outils sont publics sur GitHub (automatonduT)</li></ul>
<p><i>"Une page ne ment jamais."</i></p></body></html>`);
  } else {
    console.log("Usage: catalog-gen · catalog-validate · rate-card · quote-api \"<travail>\" · service-contract <s> <c> · sla-report · invoice-chase · refund-policy · partner-kit <p> · order-form <service> · trust-page");
  }
})();