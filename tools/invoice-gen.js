#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// invoice-gen.js — FACTURES PROFESSIONNELLES pour les audits $5/$25
// Usage: node invoice-gen.js <id-client> <description> <montant-usd>
// Sortie: ~/automaton-work/data/invoices/<ref>.html (à envoyer en pièce/lien)
// Référence facture: AA-YYYYMMDD-XXX
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.env.HOME, "automaton-work", "data", "invoices", "registry.json");

(async () => {
  const [client, desc, amount] = process.argv.slice(2);
  if (!client || !desc || !amount) { console.log("Usage: invoice-gen.js <client> <description> <montantUSD>"); process.exit(1); }

  let reg = { invoices: [], seq: 0 };
  try { reg = JSON.parse(fs.readFileSync(FILE)); } catch (e) {}
  const date = new Date();
  const ref = `AA-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(++reg.seq).padStart(3, "0")}`;
  const inv = { ref, client, desc, amountUsd: parseFloat(amount), date: date.toISOString(), status: "issued" };
  reg.invoices.push(inv);
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(reg, null, 2));

  const eur = (inv.amountUsd * 0.92).toFixed(2);
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${ref}</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#222}
.hd{display:flex;justify-content:space-between;border-bottom:3px solid #58a6ff;padding-bottom:16px}
.amt{font-size:2.4rem;color:#1a7f37;font-weight:bold}table{width:100%;border-collapse:collapse;margin:24px 0}
td,th{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f6f8fa}
.ft{color:#666;font-size:.85rem;margin-top:32px;border-top:1px solid #eee;padding-top:12px}</style></head><body>
<div class="hd"><div><h1>🤖 automaton-alpha</h1><p>ERC-8004 Agent #67574 · Base mainnet<br>titouanmarty05@gmail.com</p></div>
<div style="text-align:right"><strong>FACTURE</strong><br>${ref}<br>${date.toLocaleDateString("fr-FR")}</div></div>
<table><tr><th>Description</th><th style="text-align:right">Montant</th></tr>
<tr><td>${desc}</td><td style="text-align:right">$${amount} USD</td></tr>
<tr><td colspan="2" style="text-align:right" class="amt">$${amount} USD ≈ ${eur} €</td></tr></table>
<p><strong>Paiement:</strong> USDC sur Base — payez via x402 ou transfert direct à:<br>
<code>0x466a47E5E38F8b4dd9423189509d8c595f38DEda</code><br>
<span style="color:#666">Référencez "${ref}" dans le mémo.</span></p>
<div class="ft">Émis par un agent autonome enregistré ERC-8004 (#67574) sur la registry Base.<br>
Historique public vérifiable. Merci de votre confiance — honest numbers only.</div></body></html>`;

  const out = path.join(path.dirname(FILE), `${ref}.html`);
  fs.writeFileSync(out, html);
  console.log(`✅ Facture ${ref} générée: ${out}`);
  console.log(`   Envoyable telle quelle au client (self-contained HTML).`);
})();
