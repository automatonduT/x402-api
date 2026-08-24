// carry-system.js - TradeLab 4th system: LONG spot + SHORT perp funding carry [v1.85]
// Entree: taux >= 0.01%/8h · Sortie: taux < 0.002% · Paper-trading persiste [ORDRE CREATEUR item 1]
const express=require("express");
const fs=require("fs");
const path=require("path");
const rt=express.Router();
rt.use(express.json({limit:"1mb"}));
const STATE=path.join(__dirname,"carry-state.json");
const load=()=>{try{return JSON.parse(fs.readFileSync(STATE,"utf8"))}catch(e){return {positions:{},closed:[],created:new Date().toISOString()}}};
let st=load();
const save=()=>{try{fs.writeFileSync(STATE,JSON.stringify(st,null,1))}catch(e){}};
const ENTER=0.0001, EXIT=0.00002; // 0.01% et 0.002% par 8h

async function fundingRates(sym,n=90){
  const d=await(await fetch("https://fapi.binance.com/fapi/v1/fundingRate?symbol="+encodeURIComponent(sym)+"&limit="+n,{signal:AbortSignal.timeout(10000)})).json();
  if(!Array.isArray(d))throw new Error("pas de funding pour "+sym);
  return d.map(x=>parseFloat(x.fundingRate));
}
async function price(sym){
  const d=await(await fetch("https://api.binance.com/api/v3/ticker/price?symbol="+encodeURIComponent(sym),{signal:AbortSignal.timeout(8000)})).json();
  return parseFloat(d.price);
}

// tick paper position pour un symbole selon le dernier taux reel
async function tick(sym){
  const rates=await fundingRates(sym);
  const last=rates[rates.length-1];
  const px=await price(sym);
  let p=st.positions[sym];
  if(!p){
    if(last>=ENTER){ // entree: spot long + perp short -> encaisse le funding
      p=st.positions[sym]={entry:px,entryTs:new Date().toISOString(),equity:1,collected:0,periods:0};
    }
  } else {
    if(last<EXIT){ // sortie: funding tombe sous le plancher
      p.exit=px;p.exitTs=new Date().toISOString();
      p.totalReturn=Math.round((p.equity-1)*10000)/100;
      st.closed.push({sym,...p});st.positions[sym]=null;delete st.positions[sym];
      save();
      return {sym,action:"EXIT",lastRate:last,position:p};
    }
    p.collected+=last;p.periods++;p.lastRate=last;p.lastPx=px;
  }
  save();
  return {sym,action:p?"HOLD":"WAIT",lastRate:last};
}

// GET /tools/tradelab/carry?symbols=BTCUSDT,ETHUSDT - snapshot carry desk
rt.get("/tools/tradelab/carry",async(q,r)=>{try{
  const syms=String(q.query.symbols||"BTCUSDT,ETHUSDT").split(",").map(s=>s.trim().toUpperCase()).slice(0,6);
  const out={};const ticks=[];
  for(const sym of syms){
    try{ticks.push(await tick(sym));}catch(e){out[sym]={error:String(e.message||e)};continue;}
    const rates=await fundingRates(sym);
    const avg=rates.reduce((a,b)=>a+b,0)/rates.length;
    const ann=avg*3*365*100;
    out[sym]={lastRatePct8h:+(rates[rates.length-1]*100).toFixed(4),avgRatePct8h:+(avg*100).toFixed(4),
      annualizedIfAlwaysIn:+ann.toFixed(2),posPeriodsPositive:Math.round(rates.filter(x=>x>0).length/rates.length*100),
      paper:st.positions[sym]||null,closedTrades:st.closed.filter(c=>c.sym===sym).length};
  }
  // rendement cumule paper vs buy&hold sur les positions ouvertes
  const openEquity=Object.values(st.positions).filter(Boolean).reduce((a,p)=>a+p.equity,0)||0;
  r.json({carry:out,ticks,openPositions:Object.keys(st.positions).length,
    closedTotal:st.closed.length,
    note:"LONG spot + SHORT perp. Entree si funding>=0.01%/8h, sortie si <0.002%. Paper-trade: futur deploiement niveau 3.",
    disclaimer:"SIMULATION ONLY",asOf:new Date().toISOString()});
}catch(e){r.status(400).json({error:String(e.message||e)})}});

// POST /tools/tradelab/carry/tick - force un tick (appele par scheduler ou wave.sh)
rt.post("/tools/tradelab/carry/tick",async(q,r)=>{try{
  const syms=Object.keys(st.positions).length?Object.keys(st.positions):["BTCUSDT","ETHUSDT"];
  const results=[];for(const s of syms.slice(0,6)){try{results.push(await tick(s))}catch(e){}}
  r.json({ok:true,results,open:Object.keys(st.positions).length,closedTotal:st.closed.length});
}catch(e){r.status(400).json({error:String(e.message||e)})}});
module.exports=rt;
