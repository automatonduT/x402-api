#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────
// bounty-suite.js — Chasse aux bounties GitHub d’automaton-alpha
// API GitHub authentifiée (token lu dans ~/.automaton/.env, ligne GITHUB_TOKEN=).
// Zéro dépendance externe : https + fs natifs uniquement.
// Usage : node bounty-suite.js <commande> [arguments]   (help pour tout lister)
// ────────────────────────────────────────────────────────────────
"use strict";

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

// ── Configuration ────────────────────────────────────────────────
const TARGETS = ["x402-foundation", "MikeyPetrillo/Agent402", "internet-court", "daydreamsai", "BlockRunAI"];
const SPEC_REPOS = ["x402-foundation/x402", "google-agentic-commerce/a2a-x402"];
const DEFAULT_LABELS = "bounty,reward";
const SKILLS = {
  "audit x402": ["x402", "audit", "sécurité", "security", "evm", "solidity"],
  "backtesting js": ["backtest", "trading", "stratégie", "strategy", "ohlcv"],
  "serveur mcp": ["mcp", "model context protocol", "tool server"],
  "landing page": ["landing", "vitrine", "frontend", "html"],
  "script node": ["node", "javascript", "typescript", "cli", "script"],
};
const DATA_DIR = path.join(os.homedir(), "automaton-work", "data");
const CACHE = path.join(DATA_DIR, "bounties-cache.json");
const WON_FILE = path.join(DATA_DIR, "bounties-won.json");

// ── Réseau & fichiers ────────────────────────────────────────────
function loadToken() {
  try {
    const env = fs.readFileSync(path.join(os.homedir(), ".automaton", ".env"), "utf8");
    const ligne = env.split(/\r?\n/).find((l) => l.startsWith("GITHUB_TOKEN="));
    return ligne ? ligne.slice("GITHUB_TOKEN=".length).trim().replace(/^["']|["']$/g, "") : null;
  } catch (e) { return null; }
}
function gh(p) {
  return new Promise((resolve, reject) => {
    const headers = { "User-Agent": "automaton-alpha-agent", "Accept": "application/vnd.github+json" };
    const tok = loadToken();
    if (tok) headers.Authorization = "token " + tok;
    https.get({ hostname: "api.github.com", path: p, headers }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (e) { /* corps non JSON */ }
        resolve({ status: res.statusCode, json, reste: res.headers["x-ratelimit-remaining"] });
      });
    }).on("error", reject);
  });
}
function readJson(f, fb) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return fb; } }
function writeJson(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); }
const usd = (n) => "$" + Number(n).toFixed(2);

// ── Collecte ─────────────────────────────────────────────────────
function parseRepo(input) {
  const s = String(input || "");
  const m = s.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (m) return m[1] + "/" + m[2].replace(/\.git$/, "");
  return /^[\w.-]+\/[\w.-]+$/.test(s.trim()) ? s.trim() : null;
}
function montantDans(texte) {
  const m = String(texte || "").match(/\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}
async function reposDe(org) {
  let r = await gh("/orgs/" + org + "/repos?per_page=100&sort=pushed");
  if (r.status !== 200) r = await gh("/users/" + org + "/repos?per_page=100&sort=pushed");
  if (r.status !== 200 || !Array.isArray(r.json)) return null;
  return r.json.slice(0, 8).map((x) => x.full_name); // les plus actifs seulement
}
async function issuesLabellees(repo, labels) {
  const r = await gh("/repos/" + repo + "/issues?state=open&labels=" +
    encodeURIComponent(labels).replace(/%2C/g, ",") + "&per_page=30");
  if (r.status !== 200 || !Array.isArray(r.json)) return [];
  return r.json.filter((i) => !i.pull_request);
}
async function collecter(labels, cibleUnique) {
  const cibles = cibleUnique ? [cibleUnique] : TARGETS;
  const sorties = [];
  for (const cible of cibles) {
    const repos = cible.includes("/") ? [cible] : await reposDe(cible);
    if (!repos) { console.log("⚠ Cible introuvable ou privée : " + cible); continue; }
    for (const repo of repos) {
      for (const it of await issuesLabellees(repo, labels)) {
        sorties.push({
          repo, titre: it.title, url: it.html_url,
          montant: montantDans(it.title) !== null ? montantDans(it.title) : montantDans(it.body),
          labels: (it.labels || []).map((l) => l.name).join(", "),
        });
      }
    }
  }
  return sorties;
}

// ── Commandes ────────────────────────────────────────────────────
async function cmdScan(labelsArg) {
  const labels = labelsArg || DEFAULT_LABELS;
  console.log("Scan des bounties ouvertes (labels : " + labels + ")…\n");
  const trouves = await collecter(labels, null);
  if (!trouves.length) { console.log("Aucune issue de bounty trouvée aujourd’hui."); return; }
  writeJson(CACHE, { fetchedAt: new Date().toISOString(), bounties: trouves });
  for (const b of trouves.sort((a, b) => (b.montant || 0) - (a.montant || 0))) {
    console.log("  [" + b.repo + "] " + b.titre);
    console.log("     " + (b.montant ? usd(b.montant) + " — " : "") + b.url +
      "  (labels : " + (b.labels || "—") + ")");
  }
  console.log("\n" + trouves.length + " bounty(ies) mises en cache → " + CACHE);
}

async function cmdMatchSkills(repoArg) {
  const repo = parseRepo(repoArg);
  if (!repo) { console.log("Usage : match-skills <propriétaire/repo | url>"); return; }
  const r = await gh("/repos/" + repo + "/readme");
  if (r.status !== 200) { console.log("✖ README inaccessible (" + r.status + ") pour " + repo); return; }
  const texte = Buffer.from(String(r.json.content || "").replace(/\s/g, ""), "base64").toString("utf8").toLowerCase();
  console.log("Analyse de " + repo + " face aux capacités d’automaton-alpha :\n");
  let meilleur = { nom: null, hits: 0 };
  for (const [nom, mots] of Object.entries(SKILLS)) {
    const trouves = mots.filter((m) => texte.includes(m));
    if (trouves.length) console.log("  " + nom.padEnd(15) + " → indices : " + trouves.join(", "));
    if (trouves.length > meilleur.hits) meilleur = { nom, hits: trouves.length };
  }
  console.log("");
  if (meilleur.hits >= 2) console.log("Verdict : PEUT-POSTULER — forte adéquation (« " + meilleur.nom + " »).");
  else if (meilleur.hits === 1) console.log("Verdict : PARTIELLEMENT — adéquation faible (« " + meilleur.nom + " »), lis CONTRIBUTING.md avant.");
  else console.log("Verdict : NON — aucun indice des capacités de l’agent dans ce README.");
}

function cmdPrTemplate(typeArg) {
  const type = String(typeArg || "feature").toLowerCase();
  const titres = { fix: "Corriger <problème>", feature: "Ajouter <fonctionnalité>", docs: "Améliorer la documentation", refactor: "Refactorer <module>" };
  if (!titres[type]) { console.log("Types disponibles : fix | feature | docs | refactor"); return; }
  console.log("Titre suggéré : [" + type + "] " + titres[type] + "\n");
  console.log("## Description");
  if (type === "fix") console.log("Ce PR corrige <description du bug et de sa cause racine>, signalé dans #<issue>.\n");
  else if (type === "docs") console.log("Ce PR clarifie <section documentaire obsolète ou manquante>.\n");
  else if (type === "refactor") console.log("Ce PR restructure <module> sans changer le comportement observable.\n");
  else console.log("Ce PR ajoute <fonctionnalité>, demandée dans #<issue>.\n");
  console.log("## Changements\n- <point 1>\n- <point 2>\n- <point 3>\n");
  console.log("## Tests effectués\n- `npm test` : passe localement\n- Scénario vérifié à la main : <étapes repro>\n");
  console.log("## Checklist\n- [x] CONTRIBUTING.md lu et respecté\n- [ ] Tests ajoutés/mis à jour\n- [ ] Documentation à jour\n- [ ] Commits conventionnels (feat:/fix:/docs:)\n- [ ] Issue liée : `Closes #<n>`");
}

async function cmdGoodFirstIssues(orgArg) {
  console.log("Issues « good first issue » ouvertes" + (orgArg ? " sur " + orgArg : " sur les cibles") + "…\n");
  const cibles = orgArg ? [orgArg] : TARGETS;
  let total = 0;
  for (const cible of cibles) {
    const repos = cible.includes("/") ? [cible] : await reposDe(cible);
    if (!repos) { console.log("⚠ Cible introuvable : " + cible); continue; }
    for (const repo of repos.slice(0, 5)) {
      for (const it of await issuesLabellees(repo, "good first issue")) {
        total += 1;
        console.log("  [" + repo + "] " + it.title + "\n     " + it.html_url);
      }
    }
  }
  console.log(total ? "\n" + total + " piste(s) de contribution facile → crédibilité à construire." : "\nRien trouvé pour le moment — réessaie demain.");
}

async function cmdSpecWatcher() {
  for (const repo of SPEC_REPOS) {
    const existant = await gh("/repos/" + repo);
    console.log("── " + repo + " ──");
    if (existant.status !== 200) { console.log("  Repo inaccessible (" + existant.status + ").\n"); continue; }
    const r = await gh("/repos/" + repo + "/releases/latest");
    if (r.status !== 200 || !r.json) { console.log("  Repo vivant, mais aucune release publiée — surveille les commits directs.\n"); continue; }
    console.log("  Dernière release : " + (r.json.name || r.json.tag_name) + " (" + r.json.tag_name + ")");
    console.log("  Publiée le       : " + String(r.json.published_at || "?").slice(0, 10));
    const puces = String(r.json.body || "").split("\n").filter((l) => /^[-*]/.test(l.trim())).slice(0, 4);
    console.log(puces.length ? "  Nouveautés :\n" + puces.map((p) => "   " + p.trim()).join("\n") : "  Notes de version indisponibles.");
    console.log("");
  }
}

async function cmdContributionCalendar(userArg) {
  const user = userArg || "automatonduT";
  const r = await gh("/users/" + user + "/events/public?per_page=100");
  if (r.status !== 200 || !Array.isArray(r.json)) { console.log("✖ Activité publique inaccessible pour " + user + " (" + r.status + ")."); return; }
  const seuil = Date.now() - 7 * 86400000;
  let commits = 0, prs = 0, issues = 0, autres = 0;
  for (const ev of r.json) {
    if (new Date(ev.created_at).getTime() < seuil) continue;
    if (ev.type === "PushEvent") commits += (ev.payload.commits || []).length;
    else if (ev.type === "PullRequestEvent" && ev.payload.action === "opened") prs += 1;
    else if (ev.type === "IssuesEvent" && ev.payload.action === "opened") issues += 1;
    else autres += 1;
  }
  console.log("═══ Visibilité publique de " + user + " (7 derniers jours) ═══");
  console.log("  Commits poussés   : " + commits);
  console.log("  PR ouvertes       : " + prs);
  console.log("  Issues ouvertes   : " + issues);
  console.log("  Autres événements : " + autres);
  console.log(commits + prs + issues > 0 ? "  ✔ Présence visible cette semaine." : "  ⚠ Silencieux : un « good first issue » ferait l’affaire.");
}

async function cmdPipeline(refreshArg) {
  const frais = refreshArg === "--refresh";
  const cache = readJson(CACHE, null);
  const ageH = cache && cache.fetchedAt ? (Date.now() - new Date(cache.fetchedAt).getTime()) / 3600000 : Infinity;
  let bounties = cache && Array.isArray(cache.bounties) ? cache.bounties : [];
  if (frais || ageH > 6) {
    console.log(frais ? "Rescan forcé (--refresh)…" : "Cache > 6 h — rescan léger…");
    bounties = await collecter(DEFAULT_LABELS, null);
    writeJson(CACHE, { fetchedAt: new Date().toISOString(), bounties });
  } else {
    console.log("Cache utilisé (" + String(cache.fetchedAt).slice(0, 16) + " UTC, " + bounties.length + " entrées) — --refresh pour forcer.");
  }
  if (!bounties.length) { console.log("Pipeline vide : lance `scan` d’abord."); return; }
  console.log("\n═══ Pipeline bounty (priorisé montant × adéquation) ═══");
  const tries = bounties.slice().sort((a, b) => (b.montant || 0) - (a.montant || 0)).slice(0, 5);
  for (let i = 0; i < tries.length; i++) {
    const b = tries[i];
    let bonus = "";
    try {
      const rd = await gh("/repos/" + b.repo + "/readme");
      if (rd.status === 200) {
        const txt = Buffer.from(String(rd.json.content || "").replace(/\s/g, ""), "base64").toString("utf8").toLowerCase();
        const best = Object.entries(SKILLS)
          .map(([nom, mots]) => [nom, mots.filter((w) => txt.includes(w)).length])
          .sort((p, q) => q[1] - p[1])[0];
        if (best && best[1] > 0) bonus = " — match : " + best[0] + " (" + best[1] + " indice(s))";
      }
    } catch (e) { /* README indisponible : on ignore */ }
    console.log("  " + (i + 1) + ". " + (b.montant ? usd(b.montant) : "montant ?") + " — [" + b.repo + "] " + b.titre + bonus);
    console.log("     " + b.url);
  }
  console.log("\nRègle : un seul claim par bounty, CONTRIBUTING.md lu avant (voir `etiquette`).");
}

async function cmdClaimDraft(urlArg) {
  const m = String(urlArg || "").match(/github\.com\/([\w.-]+)\/([\w.-]+)\/(?:issues|pull)\/(\d+)/);
  if (!m) { console.log("Usage : claim-draft <https://github.com/owner/repo/issues/N>"); return; }
  const r = await gh("/repos/" + m[1] + "/" + m[2] + "/issues/" + m[3]);
  if (r.status !== 200) { console.log("✖ Issue inaccessible (" + r.status + ")."); return; }
  const resume = (String(r.json.body || "").split(/[.!?](\s|$)/)[0] || "(voir issue)").trim().slice(0, 180);
  console.log("Commentaire de claim prêt à publier :\n──────────────────────────────");
  console.log("Bonjour, je prends cette tâche (automaton-alpha).\n");
  console.log("**Approche proposée :**");
  console.log("1. Périmètre : " + resume);
  console.log("2. Implémentation livrée en petit PR isolé référençant cette issue (#" + m[3] + ").");
  console.log("3. Livraison vérifiée : tests locaux passants + documentation mise à jour si nécessaire.\n");
  console.log("**ETA :** 48 h — je posterai ici en cas de retard.");
  console.log("──────────────────────────────");
  console.log("Rappels : un seul claim, pas de spam, CONTRIBUTING.md lu avant de coder (`etiquette`).");
}

function cmdRewardTracker(args) {
  const sub = args[0];
  const gagnes = () => { const v = readJson(WON_FILE, []); return Array.isArray(v) ? v : []; };
  if (sub === "add") {
    const url = args[1], montant = Number(args[2]);
    if (!url || !(montant >= 0)) { console.log("Usage : reward-tracker add <url> <montantUsd>"); return; }
    const liste = gagnes();
    liste.push({ date: new Date().toISOString().slice(0, 10), url, montantUsd: montant });
    writeJson(WON_FILE, liste);
    console.log("✔ Récompense déclarée : " + usd(montant) + " — " + url);
  } else if (sub === "list") {
    const liste = gagnes();
    if (!liste.length) { console.log("Aucune récompense déclarée (" + WON_FILE + ")."); return; }
    let total = 0;
    for (const w of liste) {
      total += Number(w.montantUsd || 0);
      console.log("  " + w.date + "  " + usd(Number(w.montantUsd || 0)).padStart(9) + "  " + w.url);
    }
    console.log("  Total gagné : " + usd(total));
  } else {
    console.log("Usage : reward-tracker add <url> <montantUsd> | reward-tracker list");
  }
}

function cmdEtiquette() {
  console.log("═══ Éthique bounty d’automaton-alpha ═══");
  console.log("  1. Jamais de claim multiple : une seule déclaration par issue, puis on livre.");
  console.log("  2. Jamais de spam : pas de « +1 », pas de relance agressive, pas de commentaire vide.");
  console.log("  3. Toujours lire CONTRIBUTING.md et les règles de récompense AVANT de coder.");
  console.log("  4. Qualité > vitesse : un PR propre et testé vaut mieux que trois PR bâclés.");
  console.log("  5. Transparence : annoncer son ETA, prévenir en cas de retard, rendre la tâche si bloqué.");
}

// ── Aide & aiguillage ────────────────────────────────────────────
function cmdHelp() {
  console.log("bounty-suite.js — chasse aux bounties GitHub d’automaton-alpha\n");
  console.log("  scan [labels=bounty,reward]       issues de récompense sur les cibles");
  console.log("  match-skills <repo|url>           adéquation README ↔ capacités agent");
  console.log("  pr-template <fix|feature|docs|refactor>  squelette de PR upstream");
  console.log("  good-first-issues [org]           contributions faciles (crédibilité)");
  console.log("  spec-watcher                      dernières releases des specs x402/a2a");
  console.log("  contribution-calendar [user]      activité publique des 7 derniers jours");
  console.log("  bounty-pipeline [--refresh]       vue priorisée (cache 6 h)");
  console.log("  claim-draft <issueUrl>            commentaire de claim professionnel");
  console.log("  reward-tracker add <url> <montant>| reward-tracker list");
  console.log("  etiquette                         règles d’éthique bounty");
  console.log("  help                              cette aide");
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd || "help") {
    case "scan": return cmdScan(rest[0]);
    case "match-skills": return cmdMatchSkills(rest[0]);
    case "pr-template": return cmdPrTemplate(rest[0]);
    case "good-first-issues": return cmdGoodFirstIssues(rest[0]);
    case "spec-watcher": return cmdSpecWatcher();
    case "contribution-calendar": return cmdContributionCalendar(rest[0]);
    case "bounty-pipeline": return cmdPipeline(rest[0]);
    case "claim-draft": return cmdClaimDraft(rest[0]);
    case "reward-tracker": return cmdRewardTracker(rest);
    case "etiquette": return cmdEtiquette();
    case "help": case "--help": case "-h": return cmdHelp();
    default:
      console.log("Commande inconnue : " + cmd + "\n");
      return cmdHelp();
  }
}

main(process.argv.slice(2)).catch((e) => {
  console.error("✖ Erreur : " + (e && e.message ? e.message : e));
  process.exitCode = 1;
});
