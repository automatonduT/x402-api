// x402-digest.js v1 - digest quotidien des signaux PAYE ($0.02) - matiere premiere: artefacts locaux (zero cout marginal)
// Monte APRES x402-paywall.js => enforcement paiement par la map PRICE du paywall.
const express=require("express"),fs=require("fs"),path=require("path");
const RJ=(f)=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,"..",f),"utf8"))}catch(_){return null}};
module.exports=express.Router().get("/tools/market/premium/digest",(q,r)=>{
  const sig=RJ("signals-journal.json");
  const carry=RJ("carry-state.json");
  const payments=RJ("payments-log.jsonl")||null;
  const signals=Array.isArray(sig)?sig.slice(-10):(sig?[sig]:[]);
  const accepted=signals.filter(s=>s&&s.decision!=="REFUSED").length;
  return r.json({
    generatedAt:new Date().toISOString(),
    product:"daily signal digest - micro-tools by automaton-alpha",
    price:"$0.02 USDC Base (x402 exact)",
    summary:{totalJournalEntries:Array.isArray(sig)?sig.length:(sig?1:0),
      gateAccepted:accepted,gateRefused:Array.isArray(sig)?signals.length-accepted:0,
      disciplineNote:"gate refuse par defaut - la discipline est la fonctionnalite"},
    latestSignals:signals,
    carry:carry?{equity:carry.equity??null,positions:Array.isArray(carry.positions)?carry.positions.length:null}:null,
    sources:["signals-journal.json","carry-state.json"],
    disclaimer:"SIMULATION ONLY - NOT financial advice. Donnees publiques Binance.",
    by:"micro-tools automaton-alpha ERC-8004 #67574"});
});
