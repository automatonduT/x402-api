#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// email-sequence.js — SÉQUENCES DE RELANCE AUTOMATIQUES
// Usage: node email-sequence.js run          → envoie les relances dues aujourd'hui
//        node email-sequence.js schedule     → montre ce qui est planifié
// Séquence standard après 1er contact:
//   J+3 : relance douce avec valeur ajoutée
//   J+7 : dernier message poliment (puis on enterre)
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const CRM_FILE = path.join(process.env.HOME, "automaton-work", "data", "crm.json");
const SEQ_FILE = path.join(process.env.HOME, "automaton-work", "data", "sequences.json");

function load(p, dflt) { try { return JSON.parse(fs.readFileSync(p)); } catch (e) { return dflt; } }
function save(p, d) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

function daysBetween(a, b) { return Math.floor((b - a) / 864e5); }

(async () => {
  const cmd = process.argv[2] || "schedule";
  const crm = load(CRM_FILE, { leads: [] });
  const seqs = load(SEQ_FILE, {});
  const T = path.join(process.env.HOME, "automaton-work", "tools", "mail.js");
  const now = Date.now();

  if (cmd === "schedule") {
    console.log("=== SÉQUENCES PLANIFIÉES ===\n");
    let any = false;
    crm.leads.filter(l => ["contacted", "replied"].includes(l.status)).forEach(l => {
      if (!l.email) return;
      const s = seqs[l.id] || { step: 0, lastAt: l.lastTouch };
      const days = daysBetween(new Date(s.lastAt), now);
      if (s.step === 0 && days >= 3) { console.log(`🔔 #${l.id} ${l.name} <${l.email}> → relance J+${days} PRÊTE`); any = true; }
      else if (s.step === 1 && days >= 4) { console.log(`🔔 #${l.id} ${l.name} <${l.email}> → DERNIER MESSAGE J+7 PRÊT`); any = true; }
      else console.log(`⏳ #${l.id} ${l.name} — étape ${s.step}, prochaine action dans ${Math.max(0, (s.step === 0 ? 3 : 4) - days)}j`);
    });
    if (!any) console.log("(rien à envoyer aujourd'hui)");
  }

  if (cmd === "run") {
    for (const l of crm.leads.filter(x => x.status === "contacted" && x.email)) {
      const s = seqs[l.id] || { step: 0, lastAt: l.lastTouch };
      const days = daysBetween(new Date(s.lastAt), now);
      if (s.step === 0 && days >= 3) {
        const body = `Bonjour,\n\nJe me permets une relance courte concernant mon message de la semaine dernière sur les défauts x402 détectés sur votre endpoint.\n\nEntre-temps j'ai publié un validateur public gratuit qui vous permet de vérifier votre manifest en 10 secondes sans moi: https://skintight-snowcap-underarm.ngrok-free.dev/x402-inspect.html\n\nSi le sujet vous intéresse toujours, je reste dispo pour l'audit complet ($5).\n\n— automaton-alpha · ERC-8004 #67574`;
        execFileSync("node", [T, "send", l.email, `Re: audit x402 — validateur gratuit ajouté`, body], { stdio: "inherit" });
        s.step = 1; s.lastAt = new Date().toISOString(); seqs[l.id] = s;
      } else if (s.step === 1 && days >= 4) {
        const body = `Bonjour,\n\nDernier message de ma part — je ne veux pas polluer votre boîte.\n\nMon verdict gratuit reste disponible si jamais vous y revenez: https://skintight-snowcap-underarm.ngrok-free.dev/x402-inspect.html\n\nBonne continuation,\n— automaton-alpha`;
        execFileSync("node", [T, "send", l.email, `Re: audit x402 — dernière nouvelle`, body], { stdio: "inherit" });
        s.step = 2; s.lastAt = new Date().toISOString(); seqs[l.id] = s;
        // Enterre le lead dans le CRM
        const lead = crm.leads.find(x => x.id === l.id);
        if (lead) { lead.status = "lost"; lead.history.push({ from: "contacted", to: "lost", at: new Date().toISOString(), reason: "séquence terminée sans réponse" }); }
        save(CRM_FILE, crm);
      }
    }
    save(SEQ_FILE, seqs);
    console.log("✅ Séquences exécutées.");
  }
})();