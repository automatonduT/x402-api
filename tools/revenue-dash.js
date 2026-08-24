#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// revenue-dash.js — LE tableau de bord revenus en une commande
// Usage: node revenue-dash.js
// Agrège: stats API, crm, factures, ledger milestones → un seul rapport.
// Sortie stdout + ~/automaton-work/data/revenue-dashboard.json
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const https = require("https");

function get(url) { return new Promise(res => { const u = new URL(url); https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "dashboard/1.0" } }, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", () => res({ status: 0, body: "" })); }); }

(async () => {
  const out = { generatedAt: new Date().toISOString() };
  const H = process.env.HOME;

  // 1. Stats boutique
  try {
    const r = await get("http://localhost:4020/stats");
    if (r.status === 200) out.store = JSON.parse(r.body);
  } catch (e) {}

  // 2. CRM
  try { const c = JSON.parse(fs.readFileSync(path.join(H, "automaton-work", "data", "crm.json")));
    out.crm = { total: c.leads.length, byTemp: c.leads.reduce((a, l) => (a[l.temp] = (a[l.temp] || 0) + 1, a), {}), won: c.leads.filter(l => l.status === "won").length };
  } catch (e) {}

  // 3. Factures
  try { const i = JSON.parse(fs.readFileSync(path.join(H, "automaton-work", "data", "invoices", "registry.json")));
    const sum = i.invoices.reduce((a, x) => a + (x.status === "paid" ? x.amountUsd : 0), 0);
    out.invoices = { total: i.invoices.length, paid$: sum, byStatus: i.invoices.reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {}) };
  } catch (e) {}

  // 4. Ledger milestones/paid
  try {
    const lg = fs.readFileSync(path.join(H, "automaton-work", "experiments.md"), "utf8");
    out.ledger = { paidMilestones: (lg.match(/REVENUE/g) || []).length, paperTrades: (lg.match(/PAPER/g) || []).length, disciplineRefusals: (lg.match(/CLOSED-NO-TRADE/g) || []).length };
  } catch (e) {}

  const totalRevenue = (out.invoices?.paid$ || 0) + (out.ledger?.paidMilestones || 0) * 0.01;
  out.summary = { totalUsd: +totalRevenue.toFixed(3), firstPaidOk: totalRevenue > 0 };

  fs.mkdirSync(path.join(H, "automaton-work", "data"), { recursive: true });
  fs.writeFileSync(path.join(H, "automaton-work", "data", "revenue-dashboard.json"), JSON.stringify(out, null, 2));

  console.log("=== REVENUE DASHBOARD ===\n");
  console.log("Boutique:", JSON.stringify(out.store || "indisponible"));
  console.log("CRM:", JSON.stringify(out.crm || {}));
  console.log("Factures:", JSON.stringify(out.invoices || {}));
  console.log("Ledger:", JSON.stringify(out.ledger || {}));
  console.log(`\n💰 REVENU TOTAL ESTIMÉ: $${out.summary.totalRevenue}`);
})();