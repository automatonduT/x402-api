#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// lead-crm.js — CRM des prospects (le pipeline de vente centralisé)
// Usage:
//   node lead-crm.js add <nom> <canal> <temp> <note>     → nouveau lead
//   node lead-crm.js list [hot|warm|cold|all]            → voir le pipeline
//   node lead-crm.js update <id> <statut>                → new|contacted|replied|won|lost
//   node lead-crm.js followups                           → qui doit être relancé aujourd'hui
// Fichier: ~/automaton-work/data/crm.json
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.env.HOME, "automaton-work", "data", "crm.json");

function load() { try { return JSON.parse(fs.readFileSync(FILE)); } catch (e) { return { leads: [], nextId: 1 }; } }
function save(d) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  const db = load();
  const now = new Date().toISOString();

  if (cmd === "add") {
    const [name, channel, temp, note] = args;
    if (!name || !channel) { console.log("Usage: add <nom> <canal> <hot|warm|cold> <note>"); process.exit(1); }
    const lead = { id: db.nextId++, name, channel, temp: temp || "warm", status: "new", note: note || "", createdAt: now, lastTouch: now, history: [] };
    db.leads.push(lead); save(db);
    console.log(`✅ Lead #${lead.id} ajouté: ${name} (${lead.temp})`);

  } else if (cmd === "list") {
    const f = args[0] || "all";
    const rows = db.leads.filter(l => f === "all" || l.temp === f);
    if (!rows.length) return console.log("(pipeline vide)");
    console.log(`ID  TEMP  STATUT     NOM                    DERNIER TOUCHER   JOURS`);
    rows.sort((a, b) => (a.temp === "hot" ? -1 : b.temp === "hot" ? 1 : 0)).forEach(l => {
      const days = Math.floor((Date.now() - new Date(l.lastTouch)) / 864e5);
      console.log(`#${String(l.id).padEnd(3)} ${l.temp.padEnd(5)} ${l.status.padEnd(10)} ${l.name.slice(0, 22).padEnd(22)} ${l.lastTouch.slice(0, 10)}  ${days}`);
      if (l.note) console.log(`     ↳ ${l.note.slice(0, 90)}`);
    });

  } else if (cmd === "update") {
    const [id, status] = args;
    const l = db.leads.find(x => x.id == id);
    if (!l) return console.log("Lead introuvable");
    l.history.push({ from: l.status, to: status, at: now });
    l.status = status; l.lastTouch = now; save(db);
    console.log(`✅ Lead #${id} → ${status}`);

  } else if (cmd === "followups") {
    // Relance recommandée: contacted sans réponse depuis 3+ jours, replied depuis 1+ jour
    const due = db.leads.filter(l => ["contacted", "replied"].includes(l.status));
    let any = false;
    due.forEach(l => {
      const days = Math.floor((Date.now() - new Date(l.lastTouch)) / 864e5);
      const need = (l.status === "contacted" && days >= 3) || (l.status === "replied" && days >= 1);
      if (need) { console.log(`🔔 #${l.id} ${l.name} (${l.status}, ${days}j silences)`); any = true; }
    });
    if (!any) console.log("✅ Aucune relance en retard");
  } else {
    console.log("Usage: add | list | update | followups");
  }
})();
