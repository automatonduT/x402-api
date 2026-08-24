#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// toolbox.js — INDEX MAÎTRE de tous les outils d'automaton-alpha
// Usage:
//   node toolbox.js                 → liste complète par catégorie
//   node toolbox.js find <motcle>   → cherche une capacité
//   node toolbox.js health          → vérifie que chaque outil passe node --check
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const T = path.join(process.env.HOME, "automaton-work", "tools");

const CATALOG = {
  "💰 ARGENT": {
    "wallet-watch.js": "détection paiements USDC en direct + ledger auto",
    "money-suite.js": "balances, tx-history, reconcile, forecast, mrr, runway, break-even, expenses, tax-export, price-experiments",
    "invoice-gen.js": "factures HTML pro signées AA-DATE-NNN",
    "x402-receipt.js": "reçus vérifiables on-chain (basescan)",
    "price-quote.js": "devis instantané <1h, plancher $5",
    "revenue-dash.js": "tableau de bord revenus global",
    "sales-report.js": "rapport hebdo auto-envoyé au créateur",
  },
  "📈 TRADING": {
    "trade-suite.js": "rsi macd bollinger stochastic atr adx obv vwap ema-cross levels correlation drawdown kelly seasonality regime",
    "screener-suite.js": "movers vol-regime funding-all spread-watch volume-spike distance-from-ath",
    "fetch-history.js": "klines Binance → CSV",
    "indicators.js": "indicateurs de base",
    "market-snapshot.js": "checklist desk complète",
    "position-size.js": "sizing avec verdict PASS/FAIL",
    "monte-carlo.js": "simulation 1000 chemins",
    "journal-stats.js": "stats du ledger trading",
    "funding-carry.js": "stratégie carry market-neutral",
    "strategy-check.js": "CSV → verdict honnête DEPLOY/REFUSE",
    "oos-backtest.js": "moteur IS/OOS sans look-ahead",
    "gas-tracker.js": "transmettre à moindre coût sur Base",
  },
  "🏹 PROSPECTION & VENTES": {
    "lead-crm.js": "CRM pipeline: add/list/update/followups",
    "mail.js": "email send/check/read (IMAP+SMTP)",
    "mail-verify.js": "vérification SMTP + découverte d'emails + patterns",
    "email-sequence.js": "relances automatiques J+3 / J+7",
    "lead-score.js": "scoring HOT/WARM/COLD des leads",
    "weekly-hunt.js": "chasse automatique hebdo multi-sources",
    "find-prospects.js": "générateur de leads GitHub",
    "sales-suite.js": "pitchs A/B, forecast pipeline, win-prob, upsell, referrals, pricing-psych, objections",
    "testimonials.js": "preuve sociale: collecte + widget HTML",
    "case-study-gen.js": "chaque audit → page portfolio permanente",
    "competitor-watch.js": "radar concurrentiel étoiles/activité",
  },
  "📣 MARKETING & CONTENU": {
    "content-suite.js": "idées, headline-score, outline, repurpose, CTA/hook libraries, calendar, readability",
    "seo-suite.js": "meta-audit, schema, og-preview, robots, density, internal-links, speed-hints, alt-texts, serp-preview",
    "keyword-tracker.js": "positions Bing sur requêtes clés",
    "content-planner.js": "calendrier éditorial (1/semaine max)",
    "research-suite.js": "market-size, trend-watch, niche-gaps, demand-signals, personas, validation",
    "link-checker.js": "zéro lien mort sur la vitrine",
    "visitor-analytics.js": "trafic réel depuis logs serveur",
  },
  "🏛️ VITRINE & COMMERCE AGENT": {
    "agent-commerce.js": "catalogue machine-à-machine, contrats, SLA, quotes, partner-kit, trust-page",
    "api-docs-sync.js": "détecteur de fausses promesses docs↔API",
    "status-page.sh": "page uptime publique",
    "rate-card (via agent-commerce)": "grille tarifaire cohérente partout",
  },
  "🎯 BOUNTIES & ÉCOSYSTÈME": {
    "bounty-suite.js": "scan bounties, match capacités, PR templates, spec-watcher, claims pro",
    "partnership-strategy (skill)": "carte des écosystèmes en 3 niveaux",
  },
  "🛡️ INFRA & SÉCURITÉ": {
    "infra-suite.js": "errors, latency, disk, proc-watch, ports, deps, secret-scan, ssl, dns, log-rotate, health-report, backup-verify",
    "backup-snapshot.sh": "rotation GFS: 30 quotidiens + 12 mensuels",
    "ritual-runner.sh": "TOUT le rituel quotidien/hebdo en 1 commande",
    "security-hardening (skill)": "règles absolues secrets/phishing/incidents",
    "ensure-server.sh": "démarrage serveur macOS-safe",
  },
};

function allTools() {
  const set = new Set();
  Object.values(CATALOG).forEach(cat => Object.keys(cat).forEach(k => set.add(k.split(" ")[0])));
  return [...set];
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === "list") {
    let n = 0;
    for (const [cat, tools] of Object.entries(CATALOG)) {
      console.log(`\n${cat}`);
      for (const [t, desc] of Object.entries(tools)) { console.log(`  ${t.padEnd(24)} ${desc}`); n++; }
    }
    // Suites multi-commandes comptées réellement
    const suites = ["trade-suite.js","screener-suite.js","sales-suite.js","content-suite.js","money-suite.js","bounty-suite.js","infra-suite.js","agent-commerce.js","seo-suite.js","research-suite.js"];
    let subcmds = 0;
    for (const s of suites) {
      try {
        const src = fs.readFileSync(path.join(T, s), "utf8");
        subcmds += Math.max(0, (src.match(/^\s{2,}-\s"?[a-z][a-z0-9-]*"?\s*[→|]|case "[a-z-]+"/gm) || []).length);
      } catch (e) {}
    }
    console.log(`\n═══ ${n} outils fichiers · ~${subcmds || "(en cours de comptage)"} sous-commandes · 23 skills · 20 heartbeats ═══`);
  }

  if (cmd === "find") {
    const q = (args[0] || "").toLowerCase();
    if (!q) return console.log("Usage: toolbox.js find <motclé>");
    for (const [cat, tools] of Object.entries(CATALOG))
      for (const [t, d] of Object.entries(tools))
        if ((t + " " + d).toLowerCase().includes(q)) console.log(`${cat} → ${t}: ${d}`);
  }

  if (cmd === "health") {
    let ok = 0, bad = [];
    for (const f of fs.readdirSync(T).filter(f => f.endsWith(".js"))) {
      try { execFileSync("node", ["--check", path.join(T, f)], { stdio: "pipe" }); ok++; }
      catch (e) { bad.push(f); }
    }
    for (const f of fs.readdirSync(T).filter(f => f.endsWith(".sh"))) {
      try { execFileSync("bash", ["-n", path.join(T, f)], { stdio: "pipe" }); ok++; }
      catch (e) { bad.push(f); }
    }
    console.log(`✅ ${ok} outils syntaxiquement valides${bad.length ? ` · 🚨 cassés: ${bad.join(", ")}` : " · zéro cassé"}`);
    process.exit(bad.length ? 1 : 0);
  }
})();