#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// x402-receipt.js — REÇU DE PAIEMENT x402 VÉRIFIABLE ON-CHAIN
// Usage: node x402-receipt.js <txHash> <client> <service>
// Récupère la tx sur Base, confirme le montant, génère un reçu HTML
// avec lien basescan = preuve publique incontestable.
// ─────────────────────────────────────────────
const https = require("https");
const fs = require("fs");
const path = require("path");

function rpc(method, params) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const req = https.request({ hostname: "mainnet.base.org", path: "/", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    });
    req.on("error", rej); req.write(body); req.end();
  });
}

(async () => {
  const [txHash, client, service] = process.argv.slice(2);
  if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
    console.log("Usage: x402-receipt.js <txHash> <client> <service>"); process.exit(1);
  }
  const r = await rpc("eth_getTransactionByHash", [txHash]);
  if (!r.result) { console.log("❌ Transaction introuvable sur Base"); process.exit(1); }
  const tx = r.result;
  const receipt = await rpc("eth_getTransactionReceipt", [txHash]);
  const status = receipt.result?.status === "0x1" ? "✅ confirmée" : "❌ échouée";
  const eth = Number(BigInt(tx.value)) / 1e18;
  const scanUrl = `https://basescan.org/tx/${txHash}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu ${txHash.slice(0, 10)}…</title>
<style>body{font-family:Georgia,serif;max-width:620px;margin:40px auto;padding:0 16px}
.box{border:2px solid #1a7f37;border-radius:10px;padding:20px;margin:16px 0}
code{word-break:break-all;background:#f6f8fa;padding:2px 5px;font-size:.75rem}</style></head><body>
<h1>🧾 Reçu de paiement vérifiable</h1>
<div class="box"><p><strong>Service:</strong> ${(service || "audit x402").replace(/</g,"&lt;")}</p>
<p><strong>Client:</strong> ${(client || "—").replace(/</g,"&lt;")}</p>
<p><strong>Montant:</strong> ${eth} ETH (ou équivalent USDC selon canal)</p>
<p><strong>Status:</strong> ${status} sur Base mainnet</p>
<p><strong>Prouve-le toi-même:</strong><br><a href="${scanUrl}">${scanUrl}</a></p></div>
<p style="color:#666;font-size:.85rem">Émis par automaton-alpha (ERC-8004 #67574). Ce reçu n'est pas une promesse: c'est un lien vers la blockchain. Honest numbers only.</p></body></html>`;

  const out = path.join(process.env.HOME, "automaton-work", "x402-api", "public", `receipt-${txHash.slice(2, 10)}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${status}`);
  console.log(`De: ${tx.from}\nÀ: ${tx.to}\nValeur: ${eth} ETH`);
  console.log(`\n✅ Reçu public généré: /receipt-${txHash.slice(2, 10)}.html`);
})();