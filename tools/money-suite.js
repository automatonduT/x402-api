#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────
// money-suite.js — Suite financière d’automaton-alpha (Base mainnet)
// Zéro dépendance externe : https + fs natifs uniquement.
// Usage : node money-suite.js <commande> [arguments]   (help pour tout lister)
// ────────────────────────────────────────────────────────────────
"use strict";

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

// ── Configuration ────────────────────────────────────────────────
const WALLET = "0x466a47E5E38F8b4dd9423189509d8c595f38DEda";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const RPC_HOST = "mainnet.base.org";
const TOPIC_TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DATA_DIR = path.join(os.homedir(), "automaton-work", "data");
const REGISTRY = path.join(DATA_DIR, "invoices", "registry.json");
const CRM_FILE = path.join(DATA_DIR, "crm.json");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");

// ── Réseau ───────────────────────────────────────────────────────
function httpJson(hostname, p, method, body) {
  return new Promise((resolve, reject) => {
    const headers = body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {};
    const req = https.request({ hostname, path: p, method, headers }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error("réponse illisible (HTTP " + res.statusCode + ")")); }
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error("timeout réseau")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}
async function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  const out = await httpJson(RPC_HOST, "/", "POST", body);
  if (out.error) throw new Error("RPC " + method + " : " + (out.error.message || "erreur"));
  return out.result;
}
const basescan = (query) => httpJson("api.basescan.org", "/api?" + query, "GET", null);

// ── Utilitaires ──────────────────────────────────────────────────
function padAddr(addr) { return "0x" + "0".repeat(24) + addr.toLowerCase().replace(/^0x/, ""); }
function callData(selector, addr) { return selector + padAddr(addr).slice(2); }
function fmtUnits(hexVal, decimals) {
  const v = BigInt(hexVal);
  const base = 10n ** BigInt(decimals);
  const frac = (v % base).toString().padStart(decimals, "0").slice(0, 2);
  return (v / base).toString() + "." + frac;
}
const usd = (n) => "$" + Number(n).toFixed(2);
const cut = (h) => String(h).slice(0, 10) + "…" + String(h).slice(-6);
const validMonth = (s) => /^\d{4}-\d{2}$/.test(s || "");
function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  return { start: Math.floor(Date.UTC(y, m - 1, 1) / 1000), end: Math.floor(Date.UTC(y, m, 1) / 1000) };
}
function readJson(f, fb) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return fb; } }
function writeJson(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); }

// ── Factures / CRM ───────────────────────────────────────────────
function loadInvoices() {
  const raw = readJson(REGISTRY, []);
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.invoices)) return raw.invoices;
  return [];
}
function pick(o, keys) { for (const k of keys) if (o && o[k] !== undefined) return o[k]; return undefined; }
const invAmount = (i) => Number(pick(i, ["amountUsd", "amount_usd", "amount", "montant"]) || 0);
const invDate = (i) => String(pick(i, ["date", "issuedAt", "month", "createdAt"]) || "");
const invStatus = (i) => String(pick(i, ["status", "etat", "state"]) || "").toLowerCase();
const invClient = (i) => String(pick(i, ["client", "clientName", "customer"]) || pick(i, ["id", "ref", "number"]) || "?");
const PAID = ["paid", "payé", "payee", "settled", "réglée", "reglee"];
const isPaid = (s) => PAID.includes(s);

// ── Commandes ────────────────────────────────────────────────────
async function cmdBalances() {
  const [usdcRaw, ethRaw] = await Promise.all([
    rpc("eth_call", [{ to: USDC, data: callData("0x70a08231", WALLET) }, "latest"]),
    rpc("eth_getBalance", [WALLET, "latest"]),
  ]);
  console.log("═══ Portefeuille automaton-alpha ═══");
  console.log("Adresse : " + WALLET + " (Base mainnet)");
  console.log("");
  console.log("  USDC : " + fmtUnits(usdcRaw, 6));
  console.log("  ETH  : " + fmtUnits(ethRaw, 18) + " (réserve de gaz)");
  console.log("");
  console.log("Astuce : runway <dépense/mois> pour la durée de survie.");
}

async function cmdTxHistory(nArg) {
  const n = Math.max(1, parseInt(nArg, 10) || 10);
  console.log("Dernières transactions entrantes (" + n + " max), via l’API publique Basescan…");
  const res = await basescan("module=account&action=txlist&address=" + WALLET +
    "&startblock=0&endblock=99999999&page=1&offset=" + n + "&sort=desc&apikey=");
  if (String(res.status) !== "1" || !Array.isArray(res.result)) {
    const detail = typeof res.result === "string" ? " (" + res.result + ")" : "";
    console.log("⚠ Basescan indisponible : " + (res.message || "?") + detail + " — sans clé API le mode est limité en débit, réessaie plus tard.");
    console.log("  Vérif manuelle : https://api.basescan.org/api?module=account&action=txlist&address=" + WALLET + "&page=1&offset=" + n);
    return;
  }
  const inc = res.result.filter((t) => (t.to || "").toLowerCase() === WALLET.toLowerCase());
  if (!inc.length) { console.log("Aucune transaction entrante dans cette fenêtre."); return; }
  for (const t of inc) {
    const when = new Date(Number(t.timeStamp) * 1000).toISOString().slice(0, 16).replace("T", " ");
    console.log("  " + when + " UTC  " + fmtUnits(t.value, 18).padStart(14) + " ETH   de " +
      (t.from || "").slice(0, 12) + "…  " + cut(t.hash));
  }
}

async function cmdReceivedTotal() {
  console.log("Somme des fonds reçus par " + WALLET + " …");
  let eth = 0n, usdcSum = 0n, nb = 0, usdcOk = false;
  const tx = await basescan("module=account&action=txlist&address=" + WALLET +
    "&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=");
  if (String(tx.status) === "1" && Array.isArray(tx.result)) {
    for (const t of tx.result) {
      if ((t.to || "").toLowerCase() === WALLET.toLowerCase() && String(t.isError) === "0") { eth += BigInt(t.value); nb += 1; }
    }
  } else {
    console.log("⚠ txlist inaccessible (limitation sans clé API) — totaux partiels.");
  }
  try {
    const logs = await basescan("module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=" + USDC +
      "&topic0=" + TOPIC_TRANSFER + "&topic0_2_opr=and&topic2=" + padAddr(WALLET) + "&apikey=");
    if (String(logs.status) === "1" && Array.isArray(logs.result)) {
      usdcOk = true;
      for (const lg of logs.result) usdcSum += BigInt(lg.data); // data = valeur du Transfer
    }
  } catch (e) { /* signalé ci-dessous */ }
  console.log("");
  console.log("  Transactions entrantes comptées : " + nb + " (fenêtre : 1000 dernières)");
  console.log("  Total reçu ETH  : " + fmtUnits("0x" + eth.toString(16), 18));
  console.log("  Total reçu USDC : " + (usdcOk ? fmtUnits("0x" + usdcSum.toString(16), 6)
    : "⚠ estimation impossible — logs USDC indisponibles (rate-limit sans clé)"));
}

async function cmdReconcile(ym) {
  if (!validMonth(ym)) { console.log("Usage : reconcile <YYYY-MM>   (ex : reconcile 2026-08)"); return; }
  const invoices = loadInvoices().filter((i) => invDate(i).startsWith(ym));
  if (!invoices.length) { console.log("Aucune facture pour " + ym + " dans " + REGISTRY); return; }
  const { start, end } = monthRange(ym);
  const payments = [];
  try {
    const tx = await basescan("module=account&action=txlist&address=" + WALLET +
      "&startblock=0&endblock=99999999&starttimestamp=" + start + "&endtimestamp=" + end +
      "&page=1&offset=200&sort=asc&apikey=");
    if (String(tx.status) === "1" && Array.isArray(tx.result)) {
      for (const t of tx.result) {
        if ((t.to || "").toLowerCase() === WALLET.toLowerCase() && String(t.isError) === "0" && BigInt(t.value) > 0n)
          payments.push({ dev: "ETH", montant: Number(BigInt(t.value)) / 1e18 });
      }
    }
    const logs = await basescan("module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=" + USDC +
      "&topic0=" + TOPIC_TRANSFER + "&topic0_2_opr=and&topic2=" + padAddr(WALLET) + "&apikey=");
    if (String(logs.status) === "1" && Array.isArray(logs.result)) {
      for (const lg of logs.result) {
        const ts = Number(lg.timeStamp);
        if (ts >= start && ts < end) payments.push({ dev: "USDC", montant: Number(BigInt(lg.data)) / 1e6 });
      }
    }
  } catch (e) { console.log("⚠ Détection on-chain partielle : " + e.message); }
  console.log("═══ Rapprochement factures ↔ paiements — " + ym + " ═══");
  const impayees = [];
  for (const inv of invoices) {
    const montant = invAmount(inv);
    const dejaPayee = isPaid(invStatus(inv));
    const hit = payments.find((p) => Math.abs(p.montant - montant) <= Math.max(0.01, montant * 0.02));
    const statut = dejaPayee ? "payée (registre)" : hit ? "payée (paiement détecté : " + usd(hit.montant) + ")" : "IMPAYÉE";
    if (!dejaPayee && !hit) impayees.push(inv);
    console.log("  [" + invClient(inv) + "] " + usd(montant).padStart(9) + "  — " + statut);
  }
  const ethPays = payments.filter((p) => p.dev === "ETH");
  if (ethPays.length) console.log("\n  Note : " + ethPays.length + " paiement(s) ETH reçu(s) ce mois, non rapprochés automatiquement (pas de conversion prix).");
  console.log("");
  if (!impayees.length) { console.log("✔ Tout est réglé pour " + ym + "."); return; }
  console.log("Relances proposées (" + impayees.length + ") :");
  for (const inv of impayees) {
    console.log("  ✉ « Bonjour " + invClient(inv) + ", petit rappel : la facture " + ym +
      " d’un montant de " + usd(invAmount(inv)) + " reste en attente de règlement. Merci ! »");
  }
}

function cmdForecast(hArg) {
  const horizon = Math.max(1, parseInt(hArg, 10) || 3);
  const byMonth = {};
  for (const inv of loadInvoices()) {
    if (!isPaid(invStatus(inv))) continue;
    const key = invDate(inv).slice(0, 7);
    if (validMonth(key)) byMonth[key] = (byMonth[key] || 0) + invAmount(inv);
  }
  const vals = Object.values(byMonth);
  const base = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  console.log("═══ Prévision de revenu (" + horizon + " mois) ═══");
  console.log("Hypothèses : baseline = moyenne des mois avec factures payées (" +
    (vals.length ? vals.length + " mois connus" : "aucune donnée → baseline 0") + ") ; aucun nouveau client supposé.");
  if (!base) { console.log("Ajoute des factures payées dans registry.json pour affiner la projection."); return; }
  for (const [nom, coef] of [["pessimiste", 0.7], ["réaliste ", 1], ["optimiste", 1.35]]) {
    console.log("  " + nom + " ×" + coef.toFixed(2) + " : " + usd(base * coef) + "/mois → " +
      usd(base * coef * horizon) + " sur " + horizon + " mois");
  }
  console.log("Coefficients explicites : churn −30 % (pessimiste), statu quo, bouche-à-bouche +35 %.");
}

function cmdMrr() {
  const raw = readJson(CRM_FILE, []);
  const clients = Array.isArray(raw) ? raw : (raw && (raw.leads || raw.clients || raw.invoices)) || [];
  let abos = 0, suivis = 0;
  for (const c of clients) {
    if (String(c.status || "").toLowerCase() !== "won") continue;
    const note = String(c.note || c.notes || "").toLowerCase();
    if (note.includes("mensuel")) abos += 1;
    if (/suivi|audit/.test(note)) suivis += 1;
  }
  const mrr = abos * 3 + suivis * 25;
  console.log("═══ Revenu récurrent mensuel estimé (MRR) ═══");
  console.log("  Abonnements $3/mois     : " + abos + " × $3  = " + usd(abos * 3));
  console.log("  Audits + suivi $25/mois : " + suivis + " × $25 = " + usd(suivis * 25));
  console.log("  ─────────────────────────────────");
  console.log("  MRR total               = " + usd(mrr) + "/mois  (≈ " + usd(mrr * 12) + "/an)");
  if (!clients.length) console.log("  (crm.json vide ou absent : " + CRM_FILE + ")");
}

async function cmdRunway(arg) {
  const depense = Number(arg === undefined ? 30 : arg);
  if (!(depense > 0)) { console.log("Usage : runway <dépenseMensuelleUsd>  (défaut 30)"); return; }
  const raw = await rpc("eth_call", [{ to: USDC, data: callData("0x70a08231", WALLET) }, "latest"]);
  const solde = Number(BigInt(raw)) / 1e6;
  const mois = solde / depense;
  const fin = new Date(Date.now() + mois * 30.44 * 86400000).toISOString().slice(0, 10);
  console.log("═══ Runway ═══");
  console.log("  Solde USDC        : " + usd(solde));
  console.log("  Dépense mensuelle : " + usd(depense));
  console.log("  Autonomie         : " + mois.toFixed(1) + " mois (épuisement estimé vers le " + fin + ")");
  if (mois < 3) console.log("  ⚠ Moins de 3 mois de survie : priorité aux bounties et aux relances de factures.");
}

function cmdBreakEven(coutArg, prixArg) {
  const coutFixe = Number(coutArg), prix = Number(prixArg === undefined ? 5 : prixArg);
  if (!(coutFixe > 0) || !(prix > 0)) { console.log("Usage : break-even <coûtFixeUsd> [prixAudit=5]"); return; }
  const audits = Math.ceil(coutFixe / prix);
  console.log("═══ Point mort ═══");
  console.log("  Coûts fixes : " + usd(coutFixe) + "/mois — prix de l’audit : " + usd(prix));
  console.log("  → " + audits + " audit(s)/mois nécessaire(s), soit " + (audits / 4.33).toFixed(1) + "/semaine.");
  console.log("  Coût d’inférence ≈ 0 : chaque audit vendu au-delà du point mort est à ~100 % de marge brute.");
}

function cmdExpense(args) {
  const sub = args[0];
  if (sub === "add") {
    const reste = args.slice(1);
    const montant = Number(reste[reste.length - 1]);
    const label = reste.slice(0, -1).join(" ");
    if (!label || !(montant >= 0)) { console.log("Usage : expense add <libellé> <montantUsd>"); return; }
    const liste = readJson(EXPENSES_FILE, []);
    if (!Array.isArray(liste)) { console.log("✖ " + EXPENSES_FILE + " illisible (attendu : tableau JSON)."); return; }
    liste.push({ date: new Date().toISOString().slice(0, 10), label, montantUsd: montant });
    writeJson(EXPENSES_FILE, liste);
    console.log("✔ Dépense enregistrée : " + label + " — " + usd(montant) + " (" + EXPENSES_FILE + ")");
  } else if (sub === "list") {
    const liste = readJson(EXPENSES_FILE, []);
    if (!Array.isArray(liste) || !liste.length) { console.log("Aucune dépense enregistrée (" + EXPENSES_FILE + ")."); return; }
    let total = 0;
    console.log("═══ Registre des dépenses ═══");
    for (const e of liste) {
      total += Number(e.montantUsd || 0);
      console.log("  " + String(e.date || "?").padEnd(11) + " " + String(e.label || "?").padEnd(28) + " " + usd(Number(e.montantUsd || 0)).padStart(9));
    }
    console.log("  ────────────────────────────────────────────");
    console.log("  Total : " + usd(total) + " (" + liste.length + " écritures)");
  } else {
    console.log("Usage : expense add <libellé> <montantUsd> | expense list");
  }
}

function cmdTaxExport(yearArg) {
  const annee = String(parseInt(yearArg, 10) || 2026);
  const esc = (v) => "\"" + String(v).replace(/"/g, "\"\"") + "\"";
  const lignes = [["type", "date", "description", "montant_usd"].map(esc).join(",")];
  let rev = 0, dep = 0;
  for (const i of loadInvoices()) {
    if (isPaid(invStatus(i)) && invDate(i).startsWith(annee)) {
      rev += invAmount(i);
      lignes.push([esc("revenu"), esc(invDate(i).slice(0, 10)), esc(invClient(i)), esc(invAmount(i).toFixed(2))].join(","));
    }
  }
  const deps = readJson(EXPENSES_FILE, []);
  for (const e of Array.isArray(deps) ? deps : []) {
    if (String(e.date || "").startsWith(annee)) {
      dep += Number(e.montantUsd || 0);
      lignes.push([esc("dépense"), esc(String(e.date).slice(0, 10)), esc(String(e.label || "")), esc(Number(e.montantUsd || 0).toFixed(2))].join(","));
    }
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const fichier = path.join(DATA_DIR, "tax-export-" + annee + ".csv");
  fs.writeFileSync(fichier, lignes.join("\n") + "\n");
  console.log("═══ Export fiscal " + annee + " ═══");
  console.log("  Revenus déclarables : " + usd(rev));
  console.log("  Dépenses            : " + usd(dep));
  console.log("  Net                 : " + (rev - dep >= 0 ? "" : "-") + usd(Math.abs(rev - dep)));
  console.log("  Fichier             : " + fichier);
}

function cmdPriceExperiment(prixArg) {
  const nouveau = Number(prixArg), ancien = 5;
  if (!(nouveau > 0)) { console.log("Usage : price-experiment <nouveauPrixUsd>  (prix actuel : 5)"); return; }
  const parMois = {};
  for (const i of loadInvoices()) {
    if (!isPaid(invStatus(i))) continue;
    const k = invDate(i).slice(0, 7);
    if (validMonth(k)) parMois[k] = (parMois[k] || 0) + 1;
  }
  const vals = Object.values(parMois);
  const volume = vals.length ? Math.max(1, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)) : 10;
  const delta = (nouveau - ancien) / ancien;
  console.log("═══ Expérience prix : " + usd(ancien) + " → " + usd(nouveau) + " (" + (delta * 100).toFixed(0) + " %) ═══");
  console.log("Volume actuel : " + volume + " ventes/mois" + (vals.length ? "" : " (hypothèse par défaut, registre vide)"));
  for (const [nom, elas] of [["rigide (-0,5)", -0.5], ["unitaire (-1)", -1], ["élastique (-2)", -2]]) {
    const nvVol = Math.max(0, volume * (1 + elas * delta));
    const revAv = ancien * volume, revAp = nouveau * nvVol, ecart = revAp - revAv;
    console.log("  " + nom.padEnd(15) + " : volume " + nvVol.toFixed(1) + "/mois → revenu " + usd(revAp) +
      "/mois (" + (ecart >= 0 ? "+" : "-") + usd(Math.abs(ecart)) + ")");
  }
  console.log("Lecture : demande rigide ⇒ baisser le prix détruit du revenu ; demande élastique ⇒ l’augmenter aussi.");
}

function cmdProfitMargin(service) {
  const cat = {
    "audit-x402": { prix: 5, heures: 2 }, "script-node": { prix: 10, heures: 1 },
    "landing-page": { prix: 15, heures: 3 }, "backtesting": { prix: 20, heures: 3 },
    "mcp-server": { prix: 25, heures: 4 },
  };
  const cle = String(service || "").toLowerCase().trim();
  if (!cle) { console.log("Services connus : " + Object.keys(cat).join(", ")); return; }
  const trouve = Object.keys(cat).find((k) => k.includes(cle) || cle.includes(k.split("-")[0]));
  if (!trouve) { console.log("Service inconnu « " + cle + " ». Services : " + Object.keys(cat).join(", ")); return; }
  const s = cat[trouve];
  const taux = s.prix / s.heures;
  console.log("═══ Marge — " + trouve + " ═══");
  console.log("  Prix vendu        : " + usd(s.prix));
  console.log("  Temps estimé      : " + s.heures + " h");
  console.log("  Coût d’inférence  : " + usd(0) + " (gratuit) → marge brute 100 %");
  console.log("  Taux horaire réel : " + usd(taux) + "/h");
  console.log(taux >= 15
    ? "  ✔ Au-dessus du taux cible ($15/h) : bon usage du temps."
    : "  ⚠ Sous le taux cible ($15/h) : monter le prix ou productiser (templates, scripts réutilisables).");
  console.log("  Coût d’opportunité : chaque heure ici n’est pas consacrée aux bounties GitHub.");
}

// ── Aide & aiguillage ────────────────────────────────────────────
function cmdHelp() {
  console.log("money-suite.js — finances d’automaton-alpha (Base mainnet)\n");
  console.log("  balances                          soldes USDC + ETH");
  console.log("  tx-history [n=10]                 dernières transactions entrantes");
  console.log("  received-total                    total reçu (ETH + USDC via logs)");
  console.log("  reconcile <YYYY-MM>               factures vs paiements + relances");
  console.log("  forecast [mois=3]                 projection pessimiste/réaliste/optimiste");
  console.log("  mrr                               revenu récurrent estimé");
  console.log("  runway [dépenseMensuelleUsd=30]   mois de survie avec le solde USDC");
  console.log("  break-even <coûtFixeUsd> [prix=5] audits/mois pour couvrir les coûts");
  console.log("  expense add <libellé> <montantUsd>| expense list — registre des dépenses");
  console.log("  tax-export [année=2026]           CSV revenus + dépenses");
  console.log("  price-experiment <nouveauPrix>    simulateur d’élasticité prix");
  console.log("  profit-margin <service>           marge réelle par service");
  console.log("  help                              cette aide");
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd || "help") {
    case "balances": return cmdBalances();
    case "tx-history": return cmdTxHistory(rest[0]);
    case "received-total": return cmdReceivedTotal();
    case "reconcile": return cmdReconcile(rest[0]);
    case "forecast": return cmdForecast(rest[0]);
    case "mrr": return cmdMrr();
    case "runway": return cmdRunway(rest[0]);
    case "break-even": return cmdBreakEven(rest[0], rest[1]);
    case "expense": return cmdExpense(rest);
    case "tax-export": return cmdTaxExport(rest[0]);
    case "price-experiment": return cmdPriceExperiment(rest[0]);
    case "profit-margin": return cmdProfitMargin(rest[0]);
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
