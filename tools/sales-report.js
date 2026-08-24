#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// sales-report.js — RAPPORT HEBDO au créateur (envoyé par email)
// Usage: node sales-report.js            → affiche le rapport
//        node sales-report.js --email    → + envoi au créateur par email
// Agrège CRM, factures, revenus, SEO, discipline → 1 email lisible.
// À lancer chaque dimanche (heartbeat hebdo).
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const H = process.env.HOME;
function readJSON(p) { try { return JSON.parse(fs.readFileSync(path.join(H, "automaton-work", "data", p))); } catch (e) { return null; } }

(async () => {
  const crm = readJSON("crm.json");
  const inv = readJSON(path.join("invoices", "registry.json"));
  const rev = readJSON("revenue-dashboard.json");
  const seo = readJSON("seo-history.json");
  let ledger = "";
  try { ledger = fs.readFileSync(path.join(H, "automaton-work", "experiments.md"), "utf8"); } catch (e) {}

  const weekAgo = Date.now() - 7 * 864e5;
  const newLeads = crm ? crm.leads.filter(l => new Date(l.createdAt).getTime() > weekAgo) : [];
  const won = crm ? crm.leads.filter(l => l.status === "won") : [];
  const paid$ = inv ? inv.invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.amountUsd, 0) : 0;
  const noTrade = (ledger.match(/CLOSED-NO-TRADE/g) || []).length;

  const lines = [
    "=== RAPPORT HEBDOMADAIRE — automaton-alpha ===",
    `Semaine du ${new Date(weekAgo).toISOString().slice(0, 10)} au ${new Date().toISOString().slice(0, 10)}\n`,
    "📊 PIPELINE",
    `• Nouveaux leads cette semaine: ${newLeads.length}`,
    ...newLeads.slice(0, 5).map(l => `   - ${l.name} (${l.temp})`),
    `• Clients gagnés: ${won.length}`,
    "",
    "💰 REVENUS",
    `• Factures payées: $${paid$} USD`,
    `• Milestones REVENUE au ledger: ${(ledger.match(/REVENUE/g) || []).length}`,
    "",
    "📈 DISTRIBUTION",
    seo && seo.length ? `• Dernier scan SEO: ${seo[seo.length - 1].results.map(r => `"${r.kw}"→${r.pos || "top30?"}`).join(", ")}` : "• SEO: pas encore scanné (lance keyword-tracker.js)",
    "",
    "🛡️ DISCIPLINE TRADING",
    `• Refus NO-TRADE cumulés: ${noTrade} (la discipline se mesure aux NON)`,
    "",
    "🎯 PRIORITÉS SEMAINE PROCHAINE",
    "1. Relances en retard (lead-crm.js followups)",
    "2. Réponse Agent402 si reply",
    "3. Listing x402scan si canal trouvé",
  ];
  const report = lines.join("\n");
  console.log(report);

  if (process.argv.includes("--email")) {
    console.log("\n📧 Envoi au créateur...");
    execFileSync("node", [path.join(H, "automaton-work", "tools", "mail.js"), "send",
      "titouanmarty05@gmail.com",
      `[automaton-alpha] Rapport hebdo ${new Date().toISOString().slice(0, 10)}`,
      report], { stdio: "inherit" });
  }
})();