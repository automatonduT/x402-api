#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// wallet-watch.js — DÉTECTION DE PAIEMENT EN TEMPS RÉEL 🚨
// Usage: node wallet-watch.js [--once]
// Surveille l'USDC du wallet agent sur Base. Nouveau solde > ancien
// = PAIEMENT REÇU → logge au ledger + prépare l'alerte créateur.
// C'est la boucle fermée: audit livré → paiement détecté → célébration.
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const https = require("https");

const WALLET = "0x466a47E5E38F8b4dd9423189509d8c595f38DEda";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const STATE = path.join(process.env.HOME, "automaton-work", "data", "wallet-state.json");
const LEDGER = path.join(process.env.HOME, "automaton-work", "experiments.md");
const API = "https://mainnet.base.org";

function rpc(method, params) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const u = new URL(API);
    const req = https.request({ hostname: u.hostname, path: "/", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d).result); } catch (e) { rej(e); } });
    });
    req.on("error", rej); req.write(body); req.end();
  });
}

(async () => {
  // Balance USDC via eth_call balanceOf(address)
  const data = "0x70a08231" + WALLET.slice(2).toLowerCase().padStart(64, "0");
  const hex = await rpc("eth_call", [{ to: USDC, data }, "latest"]);
  const rawUsdc = BigInt(hex || "0x0");
  const usdc = Number(rawUsdc) / 1e6;

  // ETH aussi (gaz)
  const ethHex = await rpc("eth_getBalance", [WALLET, "latest"]);
  const eth = Number(BigInt(ethHex || "0x0")) / 1e18;

  console.log(`💰 Wallet ${WALLET.slice(0, 8)}…`);
  console.log(`   USDC: ${usdc.toFixed(6)}`);
  console.log(`   ETH (gaz): ${eth.toFixed(8)}`);

  // Comparaison avec le dernier état connu
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(STATE)); } catch (e) {}
  if (!prev) {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify({ usdc, eth, at: new Date().toISOString() }, null, 2));
    return console.log("📌 Premier scan — référence enregistrée.");
  }
  const delta = +(usdc - prev.usdc).toFixed(6);
  if (delta > 0.000001) {
    const msg = `\n| ${new Date().toISOString()} | 💰 PAIEMENT REÇU: +${delta} USDC (solde ${usdc.toFixed(2)}) | REVENUE |`;
    fs.appendFileSync(LEDGER, msg);
    console.log(`\n🚨🚨🚨 PAIEMENT REÇU: +${delta} USDC — loggé au ledger !`);
    console.log("ACTION SUIVANTE: identifier la source (tx logs), remercier le client, demander un témoignage.");
  } else if (delta < 0) {
    console.log(`📉 Sortie détectée: ${delta} USDC (dépense gaz ou transfert sortant).`);
  } else {
    console.log("Aucun changement depuis le dernier scan.");
  }
  if (!process.argv.includes("--once")) {
    fs.writeFileSync(STATE, JSON.stringify({ usdc, eth, at: new Date().toISOString() }, null, 2));
  }
})().catch(e => { console.error("❌", e.message); process.exit(1); });