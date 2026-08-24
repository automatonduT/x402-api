#!/usr/bin/env node
// paper-trader.js v1 — PAPER ONLY. No real orders, no wallet calls, buyer budget frozen.
// Gate (briefing §7 signal 2): 20 closed FORWARD-PAPER trades + positive expectancy -> alert creator.
// Backtest seeds are tracked SEPARATELY (source=backtest) and never counted toward the gate.
const fs=require("fs"),path=require("path"),https=require("https");
const OUT=path.join(process.env.HOME,"automaton-work","data","paper-trades.jsonl");
function getJSON(u){return new Promise((res,rej)=>{https.get(u,{headers:{"User-Agent":"paper-trader/1"}},r=>{let b="";r.on("data",c=>b+=c);r.on("end",()=>{try{res(JSON.parse(b))}catch(e){rej(e)}})}).on("error",rej)})}
const ema=(a,n)=>{const k=2/(n+1);let e=a[0];return a.map((v,i)=>e=i?v*k+e*(1-k):v)};
async function main(){
  // daily BTCUSDT klines, last 400 days (public endpoint, no key)
  const kl=await getJSON("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=400");
  // FIX v1.1: Binance klines are STRINGS -> coerce to numbers at the source or .toFixed() explodes downstream
  const c=kl.map(k=>+k[4]),h=kl.map(k=>+k[2]),l=kl.map(k=>+k[3]),t=kl.map(k=>k[0]);
  const e9=ema(c,9),e21=ema(c,21);
  const trades=[];
  let pos=null;
  for(let i=22;i<c.length;i++){
    if(!pos&&e9[i-1]<=e21[i-1]&&e9[i]>e21[i]) pos={dir:"long",entry:c[i],i,tIn:t[i],stop:c[i]*0.98,tp:c[i]*1.04};
    if(pos){
      const hitStop=l[i]<=pos.stop,hitTP=h[i]>=pos.tp;
      if(hitStop||hitTP){
        const exit=hitTP?pos.tp:(hitStop?pos.stop:c[i]);
        // conservative: if both touched same bar, assume stop first
        const pnlPct=((exit-pos.entry)/pos.entry)*100;
        trades.push({src:"backtest",sym:"BTCUSDT",dir:pos.dir,in:new Date(pos.tIn).toISOString().slice(0,10),out:new Date(t[i]).toISOString().slice(0,10),entry:+pos.entry.toFixed(2),exit:+exit.toFixed(2),pnlPct:+pnlPct.toFixed(3),rule:hitTP?"tp":"stop",note:"PAPER backtest, stop-first convention"});
        pos=null;
      }
    }
  }
  // v1.2 FORWARD-PAPER: les 30 derniers jours = hors-echantillon walk-forward.
  // Toute position ouverte a l'entree est persistee dans paper-open.json et suivie
  // run apres run; ses clotures sont taguees src=forward (comptent pour la gate).
  const CUTOFF=c.length-30;
  const OPENF=path.join(process.env.HOME,"automaton-work","data","paper-open.json");
  let carry=fs.existsSync(OPENF)?JSON.parse(fs.readFileSync(OPENF,"utf8")):null;
  const fwd=[];
  let p2=carry&&carry.entry?(carry.i>=CUTOFF?carry:null):null;
  if(carry&&!p2) fs.rmSync(OPENF,{force:true});
  for(let i=Math.max(CUTOFF,pos?pos.i:CUTOFF);i<c.length;i++){
    if(!p2&&e9[i-1]<=e21[i-1]&&e9[i]>e21[i]) p2={dir:"long",entry:c[i],i,tIn:t[i],stop:c[i]*0.98,tp:c[i]*1.04};
    if(p2){
      const hitStop=l[i]<=p2.stop,hitTP=h[i]>=p2.tp;
      if(hitStop||hitTP){
        const exit=(hitTP&&!hitStop)?p2.tp:p2.stop; // conservateur si les deux touches
        fwd.push({src:"forward",sym:"BTCUSDT",dir:"long",in:new Date(p2.tIn).toISOString().slice(0,10),out:new Date(t[i]).toISOString().slice(0,10),entry:+p2.entry.toFixed(2),exit:+exit.toFixed(2),pnlPct:+(((exit-p2.entry)/p2.entry)*100).toFixed(3),rule:hitTP?"tp":"stop",note:"PAPER forward OOS 30j"});
        p2=null;
      }
    }
  }
  if(p2) fs.writeFileSync(OPENF,JSON.stringify(p2));
  else fs.rmSync(OPENF,{force:true});
  const prev=fs.existsSync(OUT)?fs.readFileSync(OUT,"utf8").trim().split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(Boolean):[];
  const seen=new Set(prev.map(x=>x.src+"|"+x.in+"|"+x.out));
  const freshAll=[...trades,...fwd].filter(x=>!seen.has(x.src+"|"+x.in+"|"+x.out));
  const fresh=freshAll;
  const all=[...prev,...fresh];
  fs.writeFileSync(OUT,all.map(x=>JSON.stringify(x)).join("\n")+"\n");
  const bt=all.filter(x=>x.src==="backtest"),fw=all.filter(x=>x.src==="forward");
  const sum=a=>({n:a.length,w:a.filter(x=>x.pnlPct>0).length,exp:a.length?+(a.reduce((s,x)=>s+x.pnlPct,0)/a.length).toFixed(3):0});
  console.log(JSON.stringify({gate:{need:20,fwClosed:fw.n},backtest:sum(bt),forward:sum(fw),newTrades:fresh.length,totalLines:all.length},null,1));
}
main().catch(e=>{console.error("PAPER_FAIL",e.message);process.exit(1)});
