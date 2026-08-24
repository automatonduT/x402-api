// funding-desk.js [v1.91] - GET /tools/tradelab/funding - taux de funding reels + eligibilite carry
const express=require("express");
const rt=express.Router();
rt.get("/tools/tradelab/funding",async(q,r)=>{try{
  const syms=String(q.query.symbols||"BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT").split(",").map(s=>s.trim().toUpperCase()).slice(0,10);
  const rows=[];
  for(const sym of syms){
    try{
      const d=await(await fetch("https://fapi.binance.com/fapi/v1/premiumIndex?symbol="+encodeURIComponent(sym),{signal:AbortSignal.timeout(8000)})).json();
      const rate=parseFloat(d.lastFundingRate);
      rows.push({symbol:sym,markPrice:+parseFloat(d.markPrice).toFixed(2),
        fundingPct8h:+(rate*100).toFixed(4),
        annualizedIfAlwaysIn:+(rate*3*365*100).toFixed(2),
        nextFundingTs:parseInt(d.nextFundingTime),
        carryEligible:rate>=0.0001?"ENTER":"WAIT"}); // seuil entree carry: 0.01%/8h
    }catch(e){rows.push({symbol:sym,error:String(e.message||e)})}
  }
  const eligible=rows.filter(x=>x.carryEligible==="ENTER").map(x=>x.symbol);
  r.json({funding:rows,carryEligibleNow:eligible,
    note:"Entree carry si funding>=0.01%/8h (voir /tools/tradelab/carry). Donnees publiques Binance fapi/v1/premiumIndex.",
    disclaimer:"SIMULATION ONLY",asOf:new Date().toISOString()});
}catch(e){r.status(400).json({error:String(e.message||e)})}});
module.exports=rt;
