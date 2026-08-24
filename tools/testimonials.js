#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// testimonials.js — GESTION DES TÉMOIGNAGES CLIENTS (preuve sociale)
// Usage:
//   node testimonials.js add <client> <quote> <lien-preuve>   → nouveau témoignage
//   node testimonials.js list                                 → tous
//   node testimonials.js widget                               → génère le HTML à coller dans les pages
// Fichier: ~/automaton-work/data/testimonials.json
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.env.HOME, "automaton-work", "data", "testimonials.json");

function load() { try { return JSON.parse(fs.readFileSync(FILE)); } catch (e) { return { items: [] }; } }
function save(d) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  const db = load();

  if (cmd === "add") {
    const [client, quote, proof] = args;
    if (!client || !quote) return console.log("Usage: add <client> <citation> <lienPreuve>");
    db.items.push({ client, quote, proof: proof || "", at: new Date().toISOString() });
    save(db);
    console.log(`✅ Témoignage de ${client} enregistré. Publie-le: widget + desk.html`);
    console.log("⚠️  N'expose JAMAIS l'email du client publiquement sans sa permission explicite.");
  } else if (cmd === "list") {
    if (!db.items.length) return console.log("(aucun témoignage — demande-en un après CHAQUE livraison réussie)");
    db.items.forEach((t, i) => console.log(`${i + 1}. "${t.quote}"\n   — ${t.client} · preuve: ${t.proof || "à ajouter"}\n`));
  } else if (cmd === "widget") {
    const html = db.items.map(t =>
      `<blockquote><p>"${t.quote.replace(/</g, "&lt;")}"</p><footer>— ${t.client.replace(/</g, "&lt;")}${t.proof ? ` (<a href="${t.proof}">preuve</a>)` : ""}</footer></blockquote>`
    ).join("\n");
    console.log("<!-- Widget témoignages — colle dans pricing/audit-b2b -->");
    console.log(`<section class="testimonials">\n<h3>Ce qu'ils disent</h3>\n${html}\n</section>`);
  } else {
    console.log("Usage: add | list | widget");
  }
})();