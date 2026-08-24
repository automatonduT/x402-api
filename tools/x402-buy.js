#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// x402-buy.js v4 FINAL — x402 via facilitator PayAI (format v1)
// Usage: NODE_PATH=<ethers> node x402-buy.js URL [montant_max_$]
// ─────────────────────────────────────────────
const https = require("https");
const fs = require("fs");
const { ethers } = require("ethers");
const path = require("path");
const os = require("os");

const RESOURCE = process.argv[2];
const MAX_SPEND = parseFloat(process.argv[3] || "0.05");
const F = "https://facilitator.payai.network";

if (!RESOURCE) { console.log("Usage: node x402-buy.js URL [max_$]"); process.exit(1); }

const walletData = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".automaton", "wallet.json"), "utf8"));
const wallet = new ethers.Wallet(walletData.privateKey.startsWith("0x") ? walletData.privateKey : "0x" + walletData.privateKey);
console.log("Wallet:", wallet.address);

function req(method, url, body, hdrs = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method, headers: { "User-Agent": "automaton-x402/4.0", ...hdrs } };
    if (body) { opts.headers["Content-Type"] = "application/json"; body = typeof body === "string" ? body : JSON.stringify(body); opts.headers["Content-Length"] = Buffer.byteLength(body); }
    const r = https.request(opts, res => { let d = ""; res.on("data", c => (d += c)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: d })); });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  // 1. Défi
  console.log("=== 1. DÉFI ===");
  const initial = await req("GET", RESOURCE);
  if (initial.status === 200) { console.log("Déjà gratuit:", initial.body.slice(0, 400)); return; }
  if (initial.status !== 402) { console.log("❌ Pas x402:", initial.status); process.exit(1); }
  const rawHdr = initial.headers["payment-required"] || initial.headers["PAYMENT-REQUIRED"];
  const ch = JSON.parse(Buffer.from(rawHdr, "base64").toString());
  const base2 = (ch.accepts || []).find(a => a.network === "eip155:8453" && a.scheme === "exact");
  if (!base2) { console.log("❌ Pas Base"); process.exit(1); }
  const usd = Number(BigInt(base2.amount)) / 1e6;
  console.log(`Prix $${usd.toFixed(4)} → ${base2.payTo} | timeout ${base2.maxTimeoutSeconds}s`);
  if (usd > MAX_SPEND) { console.log("⚠️ Garde-fou:", usd, ">", MAX_SPEND); process.exit(1); }

  // 2. Signature EIP-3009 (domain USDC Base)
  console.log("=== 2. SIGNATURE ===");
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const authorization = {
    from: wallet.address, to: base2.payTo, value: base2.amount,
    validAfter: 0, validBefore: Math.floor(Date.now() / 1000) + (base2.maxTimeoutSeconds || 300),
    nonce,
  };
  const signature = await wallet.signTypedData(
    { name: base2.extra?.name || "USD Coin", version: base2.extra?.version || "2", chainId: 8453, verifyingContract: base2.asset },
    { TransferWithAuthorization: [
      { name: "from", type: "address" }, { name: "to", type: "address" },
      { name: "value", type: "uint256" }, { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" }] },
    authorization
  );
  console.log("Signature ✓", signature.slice(0, 18));

  // 3. Settle via PayAI — FORMAT v1 PROUVÉ
  console.log("=== 3. SETTLE PAYAI ===");
  const settleBody = {
    x402Version: 1,
    paymentRequirements: {
      scheme: "exact",
      network: "base",
      maxAmountRequired: base2.amount,
      resource: RESOURCE,
      payTo: base2.payTo,
      asset: base2.asset,
      maxTimeoutSeconds: base2.maxTimeoutSeconds || 300,
      extra: base2.extra || {},
    },
    paymentPayload: {
      x402Version: 1,
      scheme: "exact",
      network: "base",
      resource: RESOURCE,
      payload: { signature, authorization },
    },
  };
  const s = await req("POST", F + "/settle", JSON.stringify(settleBody));
  console.log("/settle → HTTP", s.status);
  console.log(s.body.slice(0, 400));
  let settlement;
  try { settlement = JSON.parse(s.body); } catch (e) {}

  // 4. Re-fetch avec X-PAYMENT (preuve signée standard)
  console.log("\n=== 4. RE-FETCH AVEC PREUVE ===");
  const envelope = Buffer.from(JSON.stringify({
    x402Version: 1, scheme: "exact", network: "base",
    resource: RESOURCE,
    payload: { signature, authorization },
  })).toString("base64");

  const paid = await req("GET", RESOURCE, null, { "X-PAYMENT": envelope });
  console.log("HTTP X-PAYMENT:", paid.status);
  if (paid.status === 200) {
    console.log("\n✅✅✅ ACHAT COMPLET RÉUSSI ✅✅✅");
    console.log(paid.body.slice(0, 1500));
  } else {
    console.log(paid.body.slice(0, 500));
    const p2 = await req("GET", RESOURCE, null, { "X-402-Payment": envelope });
    console.log("HTTP X-402-Payment:", p2.status);
    if (p2.status === 200) { console.log("✅ RÉUSSI (header alternatif):"); console.log(p2.body.slice(0, 1500)); }
    else console.log(p2.body.slice(0, 300));
  }
})().catch(e => { console.error("ERREUR:", e.message); process.exit(1); });
