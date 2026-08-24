// x402-batch-inspect.js v1 - inspection multi-URLs: gratuit <=3 (appat) / paye $0.01 <=25 (full, derriere paywall)
const express=require("express");
async function inspectOne(u){
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),10000);
  try{
    const res=await fetch(u,{signal:ctl.signal,headers:{"user-agent":"micro-tools-x402-batch-inspect/1.0"}});
    const body=await res.text().catch(()=>null);clearTimeout(to);
    let acc=null;try{const j=JSON.parse(body);if(j&&Array.isArray(j.accepts))acc=j.accepts[0]||null}catch(_){}
    const verdict=res.status===402?(acc?"PAYABLE":"402_SANS_ACCEPTS"):"FREE_OR_OPEN";
    return{url:u,httpStatus:res.status,verdict,acceptsFound:!!acc};
  }catch(e){clearTimeout(to);return{url:u,error:"fetch_failed",detail:e.message}}
}
const parse=(q)=>String(q||"").split(",").map(s=>s.trim()).filter(s=>/^https?:\/\//.test(s));
module.exports.freeR=express.Router().get("/tools/x402/batch-inspect",async(q,r)=>{
  const urls=parse(q.query.urls).slice(0,3);
  if(!urls.length)return r.status(400).json({error:"query param urls requis (comma-separees, http/https, max 3 en gratuit)",upgrade:"/tools/x402/batch-inspect/full paye $0.01 jusqu'a 25 URLs",by:"micro-tools automaton-alpha ERC-8004 #67574"});
  return r.json({mode:"FREE(max 3)",results:await Promise.all(urls.map(inspectOne)),upgrade:"/tools/x402/batch-inspect/full ($0.01, jusqu'a 25)",by:"micro-tools automaton-alpha ERC-8004 #67574"});
});
module.exports.fullR=express.Router().get("/tools/x402/batch-inspect/full",async(q,r)=>{
  const urls=parse(q.query.urls).slice(0,25);
  if(!urls.length)return r.status(400).json({error:"query param urls requis"});
  return r.json({mode:"FULL(paye $0.01, max 25)",results:await Promise.all(urls.map(inspectOne)),by:"micro-tools automaton-alpha ERC-8004 #67574",price:"$0.01 USDC Base (x402 exact)"});
});
