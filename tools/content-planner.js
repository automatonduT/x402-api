#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// content-planner.js — CALendrier éditorial (1 billet/semaine max)
// Usage:
//   node content-planner.js add <titre> [angle]      → idée en backlog
//   node content-planner.js list                     → backlog + publiés
//   node content-planner.js publish <id>             → marque publié (aujourd'hui)
//   node content-planner.js next                     → quelle est la PROCHAINE histoire à raconter?
// Fichier: ~/automaton-work/data/content-plan.json
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.env.HOME, "automaton-work", "data", "content-plan.json");

function load() { try { return JSON.parse(fs.readFileSync(FILE)); } catch (e) { return { items: [], seq: 1 }; } }
function save(d) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  const db = load();
  const now = new Date().toISOString();

  if (cmd === "add") {
    const [title, angle] = args;
    if (!title) return console.log("Usage: add <titre> [angle]");
    db.items.push({ id: db.seq++, title, angle: angle || "", status: "backlog", createdAt: now, publishedAt: null });
    save(db); console.log(`✅ Idée #${db.seq - 1} ajoutée: ${title}`);
  } else if (cmd === "list") {
    if (!db.items.length) return console.log("(calendrier vide — ajoute des idées)");
    db.items.forEach(i => {
      const icon = i.status === "published" ? "✅" : i.status === "drafting" ? "✍️ " : "💭";
      console.log(`${icon} #${i.id} [${i.status}] ${i.title}${i.angle ? " — " + i.angle : ""}`);
    });
  } else if (cmd === "publish") {
    const i = db.items.find(x => x.id == args[0]);
    if (!i) return console.log("Idée introuvable");
    // Règle: max 1/semaine
    const last = db.items.filter(x => x.publishedAt).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    if (last) {
      const days = Math.floor((Date.now() - new Date(last.publishedAt)) / 864e5);
      if (days < 7) return console.log(`⏳ Dernier billet il y a ${days}j. Cadence: 1/semaine MAX. Prochain autorisé dans ${7 - days}j.`);
    }
    i.status = "published"; i.publishedAt = now; save(db);
    console.log(`🚀 #${i.id} publié (${now.slice(0, 10)}): ${i.title}`);
    console.log("   N'oublie pas: IndexNow ping + lien depuis desk.html + mention llms-full si outil.");
  } else if (cmd === "next") {
    const next = db.items.find(x => x.status === "backlog" || x.status === "drafting");
    console.log(next ? `📝 Prochaine histoire: #${next.id} "${next.title}"` : "(backlog vide — chaque panne fixée ou mesure intéressante = une idée)");
  } else {
    console.log("Usage: add | list | publish | next");
  }
})();