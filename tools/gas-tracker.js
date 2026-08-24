#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// gas-tracker.js — QUAND TRANSMETTRE À MOINDRE COÛT (Base L2)
// Usage: node gas-tracker.js            → prix du gaz actuel + conseil
//        node gas-tracker.js --watch    → attend une fenêtre bon marché (max 10 min)
// Sur Base le gaz est quasi gratuit, mais pour les tx batchées ça compte.
// ─────────────────────────────────────────────
const https = require("https");

function rpc(method, params) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const req = https.request({ hostname: "mainnet.base.org", path: "/", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d).result); } catch (e) { rej(e); } });
    });
    req.on("error", rej); req.write(body); req.end();
  });
}

(async () => {
  const watch = process.argv.includes("--watch");
  const maxAttempts = watch ? 20 : 1;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const [gasHex, tipHex] = await Promise.all([
        rpc("eth_gasPrice", []),
        rpc("eth_maxPriorityFeePerGas", []),
      ]);
      const gwei = Number(BigInt(gasHex)) / 1e9;
      const tip = Number(BigInt(tipHex || "0x0")) / 1e9;
      // Sur Base: <0.05 gwei = très bon marché, >0.5 = attendre si possible
      const verdict = gwei < 0.05 ? "🟢 EXCELLENT — envoie maintenant" : gwei < 0.5 ? "🟡 OK — acceptable" : "🔴 CHÈRE — attends si possible";
      console.log(`⛽ Base gas: ${gwei.toFixed(4)} gwei (tip ${tip.toFixed(4)}) — ${verdict}`);
      if (!watch || gwei < 0.5) break;
      console.log("   … nouvelle tentative dans 30s");
      await new Promise(r => setTimeout(r, 30000));
    } catch (e) { console.error("❌", e.message); process.exit(1); }
  }
})();