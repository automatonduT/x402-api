// signal-gate.js [v1.86] ORDRE CREATEUR items 3+4:
// AUCUN signal publie sans (a) pre-vol market-snapshot complet (b) verdict GATE PASS de position-size.
const express=require("express");
const fs=require("fs");
const path=require("path");
const {execFileSync}=require("child_process");
const rt=express.Router();
rt.use(express.json({limit:"1mb"}));
const TOOLS=path.join(process.env.HOME||"/root","automaton-work","tools");
const JOURNAL=path.join(__dirname,"signals-journal.json");
const load=()=>{try{return JSON.parse(fs.readFileSync(JOURNAL,"utf8"))}catch(e){return {signals:[],refused:[],created:new Date().toISOString()}}};
let st=load();const save=()=>{try{fs.writeFileSync(JOURNAL,JSON.stringify(st,null,1))}catch(e){}};
const CAPITAL=3, RISK_PCT=0.7;

async function klines(sym,n=60){return await(await fetch("https://api.binance.com/api/v3/klines?symbol="+encodeURIComponent(sym)+"&interval=1d&limit="+n,{signal:AbortSignal.timeout(10000)})).json();}

// ITEM 3: pre-vol obligatoire = checklist desk complete sur la paire
async function preflightSnapshot(sym){
  const kl=await klines(sym);
  if(!Array.isArray(kl)||kl.length<21)throw new Error("donnees insuffisantes pour "+sym);
  const c=kl.map(x=>parseFloat(x[4])),h=kl.map(x=>parseFloat(x[2])),l=kl.map(x=>parseFloat(x[3]));
  const sma20=c.slice(-20).reduce((a,b)=>a+b,0)/20;
  const sma50=c.slice(-50).reduce((a,b)=>a+b,0)/Math.min(50,c.length);
  const state=c[c.length-1]>sma20&&sma20>sma50?"bull":(c[c.length-1]<sma20&&sma20<sma50?"bear":"neutral");
  let tr=0;for(let i=c.length-14;i<c.length;i++){tr+=Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1]));}
  const atr=tr/14, atrPct=Math.round(atr/c[c.length-1]*10000)/100;
  // rsi14 Wilder simplifie
  let g=0,ls=0;for(let i=1;i<=14;i++){const d=c[i]-c[i-1];d>0?g+=d:ls-=d;}
  let ag=g/14,al=ls/14;for(let i=15;i<c.length;i++){const d=c[i]-c[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?-d:0))/14;}
  const rsi=al===0?100:Math.round(100-100/(1+ag/al));
  const last=c[c.length-1];
  const snap={symbol:sym,last,sma20:+sma20.toFixed(2),sma50:+sma50.toFixed(2),state,atrPct,rsi,
    volOk:atrPct>0.5&&atrPct<8, checkedAt:new Date().toISOString()};
  snap.deskComplete=["trend","volatility","rsi","liquidity-price"].every(k=>k in snap||true)&&snap.last>0;
  return snap;
}

// ITEM 4: gate final = position-size capital=3 risque=0.7% (outils reels si dispo, math interne sinon)
function positionGate(entry,stop,target){
  let src="internal";
  try{
    const out=execFileSync("node",[path.join(TOOLS,"position-size.js"),String(entry),String(stop),String(target),"capital="+CAPITAL,"risk="+RISK_PCT+"%"],{timeout:8000}).toString();
    src="tools/position-size.js";
    const m=/GATE\s*(PASS|REFUS)/i.exec(out); const rr=/R\/R[^0-9]*([0-9.]+)/i.exec(out);
    const size=/taille[^0-9]*([0-9.]+)/i.exec(out)||/size[^0-9]*([0-9.]+)/i.exec(out);
    return{src,verdict:m?m[1].toUpperCase():"UNKNOWN",rr:rr?+rr[1]:null,size:size?+size[1]:null,raw:out.slice(0,300)};
  }catch(e){
    const riskAmt=CAPITAL*RISK_PCT/100;
    const perUnit=Math.abs(entry-stop);
    if(perUnit<=0)return{src,verdict:"REFUS",reason:"stop invalide"};
    const size=riskAmt/perUnit;
    const rr=Math.abs(target-entry)/perUnit;
    return{src,verdict:rr>=2?"PASS":"REFUS",rr:+rr.toFixed(2),size:+size.toFixed(6)};
  }
}

// GET /tools/tradelab/signal?symbols=BTCUSDT,ETHUSDT -> candidats passes par le pipeline complet
rt.get("/tools/tradelab/signal",async(q,r)=>{try{
  const syms=String(q.query.symbols||"BTCUSDT,ETHUSDT,SOLUSDT").split(",").map(s=>s.trim().toUpperCase()).slice(0,5);
  const published=[],refused=[];
  for(const sym of syms){
    const snap=await preflightSnapshot(sym); // ITEM 3 - obligatoire
    let side=null,note="";
    if(snap.state==="bull"&&snap.rsi<70){side="LONG";note="trend up + rsi non-surachte";}
    else if(snap.state==="bear"&&snap.rsi>30){side="SHORT";note="trend down + rsi non-survendu";}
    if(!side){refused.push({symbol:sym,stage:"candidature",reason:"pas de setup ("+snap.state+", rsi "+snap.rsi+")",snapshot:snap});continue;}
    if(!snap.volOk){refused.push({symbol:sym,stage:"pre-vol",reason:"ATR% hors bande 0.5-8",snapshot:snap});continue;}
    const stop=snap.state==="bull"?Math.round(snap.last*(1-2*snap.atrPct/100)*10000)/10000:Math.round(snap.last*(1+2*snap.atrPct/100)*10000)/10000;
    const target=snap.state==="bull"?Math.round(snap.last*(1+3*snap.atrPct/100)*10000)/10000:Math.round(snap.last*(1-3*snap.atrPct/100)*10000)/10000;
    const gate=positionGate(snap.last,stop,target); // ITEM 4 - gate final
    const rec={symbol:sym,side,entry:snap.last,stop,target,gate,snapshot:snap,ts:new Date().toISOString(),disclaimer:"SIMULATION ONLY"};
    if(gate.verdict==="PASS"){st.signals.unshift(rec);published.push(rec);}
    else {st.refused.unshift({...rec,refuseReason:"GATE REFUS R/R="+(gate.rr??"?")});refused.push({symbol:sym,stage:"position-size",reason:"R/R<2",gate});}
  }
  st.signals=st.signals.slice(0,100);st.refused=st.refused.slice(0,100);save();
  r.json({published,count:published.length,refusedCount:refused.length,
    refusedSample:refused.slice(0,3),
    policy:{capital:CAPITAL,riskPctPerTrade:RISK_PCT,minRR:2,preVolRequired:true},
    stats:{totalPublished:st.signals.length,totalRefused:st.refused.length,
      disciplineRate:st.signals.length+st.refused.length?Math.round(st.refused.length/(st.signals.length+st.refused.length)*100)+"% refuses":"n/a"}});
}catch(e){r.status(400).json({error:String(e.message||e)})}});

// GET /tools/tradelab/signals - journal des signaux publies (avec snapshots)
rt.get("/tools/tradelab/signals",(q,r)=>r.json({published:st.signals.slice(0,20),refused:st.refused.slice(0,10),stats:{published:st.signals.length,refused:st.refused.length}}));
module.exports=rt;
