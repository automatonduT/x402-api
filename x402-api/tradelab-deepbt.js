// tradelab-deepbt.js [v1] - GET /tools/market/premium/deep-backtest (x402)
// Moteur REEL v1.96: klines fraiches Binance -> Turtle S1/S2 ou momentum -> IS/OOS canoniques.
const express=require("express"),path=require("path");
const X=require(path.join(process.env.HOME,"automaton-work","tools","indicators.js"));
const rt=express.Router();
const MS={"1d":864e5};
const cache=new Map(); // key -> {t,res}
const TTL=6*3600e3;
function donchian(rows,i,n,mode){let e=mode==="high"?-Infinity:Infinity;
  for(let j=i-n;j<i;j++){if(j<0)return null;e=mode==="high"?Math.max(e,rows[j].h):Math.min(e,rows[j].l)}return e}
function positions(rows,strat){
  const pos=new Array(rows.length).fill(0);let cur=0;
  const C=rows.map(r=>r.c),H=rows.map(r=>r.h),L=rows.map(r=>r.l);
  for(let i=1;i<rows.length;i++){
    if(strat==="S1"||strat==="S2"){
      const ent=strat==="S1"?20:55, exi=strat==="S1"?10:20;
      const dh=donchian(rows,i,ent,"high"), dl=donchian(rows,i,exi,"low");
      const a=X.atr(H.slice(0,i+1),L.slice(0,i+1),C.slice(0,i+1),14);
      if(dh!=null&&dl!=null&&a){
        if(cur<=0&&C[i]>dh)cur=Math.min(1,0.01/(a/C[i]));
        else if(cur>0&&C[i]<dl)cur=0}}
    else{cur=i>=90?(C[i]>C[i-90]?1:0):0}
    pos[i]=cur}
  return pos}
function metrics(rows,pos,a,b){const rets=[];let eq=1;const curve=[1];
  for(let i=a+1;i<b;i++){const r=pos[i]*(rows[i].c/rows[i-1].c-1);rets.push(r);eq*=1+r;curve.push(eq)}
  const days=b-a-1;if(days<5)return{ann:null};
  return{ann:+(Math.pow(eq,365/days)-1).toFixed(4),maxDD:+(X.maxDrawdown(curve)*100).toFixed(2),
    sharpe:+X.sharpe(rets).toFixed(3),equity:+eq.toFixed(4),days}}
async function klines(sym,days){
  const step=MS["1d"],end=Date.now(),start=end-days*864e5,rows=[];let cur=start,pages=0;
  while(cur<end&&pages<12){
    const u=`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&startTime=${cur}&endTime=${end}&limit=1000`;
    const r=await fetch(u,{signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error("binance HTTP "+r.status);
    const k=await r.json();if(!k.length)break;
    for(const c of k)rows.push({date:new Date(c[0]).toISOString().slice(0,10),o:+c[1],h:+c[2],l:+c[3],c:+c[4]});
    cur=k[k.length-1][0]+step;pages++;await new Promise(s=>setTimeout(s,200))}
  return rows}
rt.get("/tools/market/premium/deep-backtest",async(q,r)=>{
  try{
    const sym=String(q.query.symbols||q.query.symbol||"BTCUSDT").split(",")[0].toUpperCase().replace(/[^A-Z0-9]/g,"");
    const strat=["S1","S2","mom"].includes(q.query.strat)?q.query.strat:"S1";
    let days=parseInt(q.query.days)||1095; days=Math.max(120,Math.min(days,1100));
    const key=sym+"|"+strat+"|"+days, hit=cache.get(key);
    if(hit&&Date.now()-hit.t<TTL)return r.json({...hit.res,cached:true});
    const rows=await klines(sym,days);
    if(rows.length<100)return r.status(422).json({error:"pas assez de donnees",n:rows.length});
    const pos=positions(rows,strat),cut=Math.floor(rows.length*0.7);
    const res={symbol:sym,strat:strat==="mom"?"momentum90":("turtle "+strat),
      n:rows.length,range:rows[0].date+".."+rows[rows.length-1].date,
      IS:metrics(rows,pos,0,cut),OOS:metrics(rows,pos,cut,rows.length),
      method:"params canoniques sans fitting · IS 70%/OOS 30% · calcule a la demande sur klines fraiches · sans levier",
      disclaimer:"SIMULATION ONLY - resultats historiques paper, pas un conseil financier",
      docs:"/pricing.html",asOf:new Date().toISOString()};
    cache.set(key,{t:Date.now(),res});r.json(res);
  }catch(e){r.status(500).json({error:String(e.message||e)})}
});
module.exports=rt;
