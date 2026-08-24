// validate-pricing.js - reference implementation: usable-value checks for x402 discovery declarations
// Checks presence AND usability (issue class documented in accensa/x402-facilitator-stellar#225).
const NETWORKS = new Set(["base","base-sepolia","ethereum","polygon","solana","stellar","avalanche","arbitrum","optimism"]);
function isUsableAmount(a){
  if (typeof a === "number") return Number.isFinite(a) && a > 0;
  if (typeof a === "string" && a.trim() !== ""){
    const n = Number(a);
    return Number.isFinite(n) && n > 0 && /^\d*\.?\d+$/.test(a.trim());
  }
  return false;
}
function isPlausiblePayTo(p){
  if (typeof p !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(p) || /^G[A-Z2-7]{55}$/.test(p); // EVM or Stellar ed25519
}
function validate(decl){
  const errors = {};
  if (!decl || typeof decl !== "object") return { valid:false, errors:{ declaration:"not an object" } };
  if (!decl.pricing || typeof decl.pricing !== "object") errors.pricing = "missing";
  else {
    if (!isUsableAmount(decl.pricing.amount))
      errors["pricing.amount"] = "present but unusable (must be finite > 0, number or plain decimal string)";
    if (decl.pricing.amount !== undefined && Number(decl.pricing.amount) > 10000)
      errors["pricing.amount"] = "usability warning: amount > 10000 looks like unit confusion";
  }
  if (!isPlausiblePayTo(decl.payTo)) errors.payTo = "missing or malformed (expect 0x…40hex or G…56)";
  if (decl.network && !NETWORKS.has(String(decl.network).toLowerCase()))
    errors.network = "unknown network: " + decl.network;
  return { valid: Object.keys(errors).length === 0, errors };
}
module.exports = { validate, isUsableAmount, isPlausiblePayTo };
if (require.main === module){ // CLI: echo a declaration | node validate-pricing.js
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{ try{ console.log(JSON.stringify(validate(JSON.parse(raw)),null,1)); }
    catch(e){ console.log(JSON.stringify({valid:false,errors:{parse:String(e)}})); } });
}
