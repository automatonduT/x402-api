// x402-deep-audit.js v1 - rapport d'audit approfondi PAYE ($0.05) derriere le verdict gratuit /tools/x402/inspect
// Monté APRES x402-paywall.js => enforcement paiement par la map PRICE du paywall.
const express=require("express");
const KNOWN_ASSETS={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913":"USDC natif Base"};
module.exports=express.Router().get("/tools/x402/deep-audit",async(q,r)=>{
  const u=String(q.query.url||"");
  if(!/^https?:\/\//.test(u))return r.status(400).json({error:"query param url requis (http/https)",by:"micro-tools automaton-alpha #67574"});
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),12000);
  let res,body=null;
  try{res=await fetch(u,{signal:ctl.signal,headers:{"user-agent":"micro-tools-x402-deep-audit/1.0"}});
    body=await res.text().catch(()=>null);}
  catch(e){clearTimeout(to);return r.status(502).json({audited:u,error:"fetch_failed",detail:e.message,by:"micro-tools automaton-alpha #67574"});}
  clearTimeout(to);
  const findings=[],recommendations=[];
  let acc=null;
  try{const j=JSON.parse(body);if(j&&Array.isArray(j.accepts))acc=j.accepts[0]||null;}catch(_){}
  const payable=res.status===402;
  if(!payable){findings.push("endpoint ne renvoie pas 402 => contenu servi gratuitement (ou auth hors x402)");
    recommendations.push("monetisation voulue: brancher un paywall x402 conforme (402 JSON + bloc accepts exploitable)");}
  if(payable&&!acc){findings.push("402 SANS bloc accepts exploitable -> lib standard ne peut pas payer");
    recommendations.push("renvoyer accepts[] : scheme exact / network base / payTo adresse 0x valide / maxAmountRequired entier 6-dec / resource / mimeType application/json / maxTimeoutSeconds");
    recommendations.push("verifier Content-Type: application/json sur la reponse 402");}
  if(acc){
    if(acc.scheme!=="exact")recommendations.push("scheme '"+String(acc.scheme)+"' non standard - utiliser 'exact'");
    if(acc.network!=="base")recommendations.push("network '"+String(acc.network)+"' inattendu - confirmer la chain cible");
    if(!/^0x[a-fA-F0-9]{40}$/.test(String(acc.payTo||"")))findings.push("payTo absent ou malforme (adresse 0x + 40 hex attendue)");
    else recommendations.push("payTo valide");
    if(!/^[0-9]+$/.test(String(acc.maxAmountRequired||"")))recommendations.push("maxAmountRequired doit etre un entier en unites 6-dec (ex '50000' = $0.05)");
    if(!acc.resource)recommendations.push("ajouter resource = chemin exact de l'endpoint paye");
    if(!acc.maxTimeoutSeconds)recommendations.push("ajouter maxTimeoutSeconds (~60)");
    if(acc.asset&&KNOWN_ASSETS[String(acc.asset).toLowerCase()])recommendations.push("asset reconnu: "+KNOWN_ASSETS[String(acc.asset).toLowerCase()]);
    if(acc.asset&&!KNOWN_ASSETS[String(acc.asset).toLowerCase()])findings.push("asset non reconnu comme USDC connu - verifier l'adresse du contrat");
  }
  const verdict=!payable?"FREE_OR_OPEN":(acc?"PAYABLE":"402_SANS_ACCEPTS");
  return r.json({audited:u,httpStatus:res.status,contentType:res.headers.get("content-type"),
    verdict,acceptsFound:!!acc,accepts:acc||null,findings,recommendations,
    retestHint:"apres correctifs: re-test gratuit via GET /tools/x402/inspect?url=",
    price:"$0.05 USDC Base (x402 exact)",by:"micro-tools automaton-alpha ERC-8004 #67574",
    disclaimer:"audit passif, aucune donnee stockee, SIMULATION ONLY"});
});
