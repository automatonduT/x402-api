// x402-paywall.js v1 - paywall conforme protocole x402: 402 + bloc accepts exploitable par lib standard.
// Settle best-effort aupres du facilitateur de reference si X-PAYMENT present; echec => 402 honnete (jamais de faux succes).
const fs=require("fs"),path=require("path");
const PRICE={"/tools/batch":"10000","/tools/market/premium/scan":"30000","/tools/market/premium/deep-backtest":"50000","/tools/x402/deep-audit":"50000","/tools/market/premium/digest":"20000","/tools/x402/batch-inspect/full":"10000"};
const PAY_TO="0x466a47E5E38F8b4dd9423189509d8c595f38DEda";
const ASSET="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC natif Base
function respond402(res,reqPath){
  res.status(402);
  res.set("accept","application/json");
  return res.json({x402Version:1,error:"X-PAYMENT header required",
    accepts:[{scheme:"exact",network:"base",maxAmountRequired:PRICE[pathKey(reqPath)],
      resource:reqPath,description:"micro-tools paid endpoint (automaton-alpha)",mimeType:"application/json",
      payTo:PAY_TO,asset:ASSET,maxTimeoutSeconds:60,extra:{name:"USD Coin",version:"2"}}]});
}
function pathKey(p){p="/"+String(p).split("?")[0].split("/").filter(Boolean).join("/");return PRICE[p]?p:p}
async function settle(paymentHeader,reqPath){
  const t0=Date.now();
  try{
    const r=await fetch("https://x402.org/facilitator/settle",{method:"POST",
      headers:{"content-type":"application/json"},body:JSON.stringify({x402Payment:paymentHeader})});
    const j=await r.json().catch(()=>null);
    const ok=r.ok&&j&&(j.success!==false&&j.error==null);
    fs.appendFileSync(path.join(__dirname,"..","payments-log.jsonl"),
      JSON.stringify({ts:new Date().toISOString(),path:pathKey(reqPath),ok,http:r.status,resp:j})+"\n");
    return ok;
  }catch(e){
    try{fs.appendFileSync(path.join(__dirname,"..","payments-log.jsonl"),
      JSON.stringify({ts:new Date().toISOString(),path:pathKey(reqPath),ok:false,err:e.message})+"\n")}catch(_){}
    return false;
  }
}
module.exports=function paywall(req,res,next){
  const key=pathKey(req.path);
  if(!PRICE[key])return next();
  const pays=req.headers["x-payment"];
  if(!pays)return respond402(res,req.originalUrl||req.url);
  settle(pays,key).then(ok=>{ok?next():respond402(res,req.originalUrl||req.url)}).catch(()=>respond402(res,req.originalUrl||req.url));
};
