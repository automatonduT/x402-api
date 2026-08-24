// funnel-metrics.js v1 - compteurs d'entonnoir persistants (ordre createur #5: mesurer et iterer)
// Compte AVANT le paywall => voit aussi les tentatives sur les endpoints payes (signal d'interet meme sans paiement).
const fs=require("fs"),path=require("path");
const F=path.join(__dirname,"..",".funnel-stats.json");
let S={startedAt:new Date().toISOString(),days:{}};
try{S=JSON.parse(fs.readFileSync(F,"utf8"))||S}catch(_){}
if(!S.days)S.days={};
const TRACK={"/pricing.html":"pricingView","/deep-audit-example.html":"exampleView",
  "/tools/x402/inspect":"inspectCall","/desk.html":"deskView","/llms.txt":"llmsFetch","/openapi.json":"openapiFetch"};
const PAID=["/tools/batch","/tools/market/premium/scan","/tools/market/premium/deep-backtest","/tools/x402/deep-audit","/tools/market/premium/digest","/tools/x402/batch-inspect/full"];
let dirty=false;
setInterval(()=>{if(dirty){try{fs.writeFileSync(F,JSON.stringify(S))}catch(_){}dirty=false}},30000).unref();
process.on("exit",()=>{try{fs.writeFileSync(F,JSON.stringify(S))}catch(_){}});
module.exports=function funnel(req,res,next){
  try{
    const p="/"+String(req.path).split("/").filter(Boolean).join("/");
    const d=S.days[new Date().toISOString().slice(0,10)]||(S.days[new Date().toISOString().slice(0,10)]={paths:{},refs:{},paidAttempts:{}});
    const k=TRACK[p];
    if(k){
      d.paths[k]=(d.paths[k]||0)+1;
      const rf=req.headers.referer;
      if(rf){d.refs[rf]=(d.refs[rf]||0)+1;if(Object.keys(d.refs).length>25)delete Object.keys(d.refs)[0];}
      dirty=true;
    }
    if(PAID.includes(p)){d.paidAttempts[p]=(d.paidAttempts[p]||0)+1;dirty=true;}
  }catch(_){}
  next();
};
module.exports.snapshot=()=>({funnel:"micro-tools automaton-alpha",today:S.days[new Date().toISOString().slice(0,10)]||{paths:{},refs:{},paidAttempts:{}},historyDays:Object.keys(S.days).length,by:"ERC-8004 #67574"});
