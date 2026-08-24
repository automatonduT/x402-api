// gen-signals v3: creator-playbook engine (playbook #1+#2).
// Systems: TREND(momentum, ADX>=25) | BREAKOUT(BB-squeeze+volume) | PULLBACK(4h-trend retrace) | TURTLE S1(daily 20d break).
// Gates BEFORE generation: dead-strategy ban, circuit breaker(-3 losses/day), funding contrarian,
// R/R>=2 structural, universe CORE/periphery, weekend/streak sizing. Journal per row.
const fs=require("fs"),path=require("path"),https=require("https");
const LEDGER=path.join(__dirname,"..","experiments.md");
const DEAD_KINDS=["meanrev"]; // fee-adjusted expectancy <=0 measured 2026-08-23 (winrate 0-11% @10bps); banned until OOS revalidation
const BASKET=[["BTCUSDT","momentum"],["ETHUSDT","momentum"],["SOLUSDT","momentum"],["BTCUSDT","turtle"],["ETHUSDT","turtle"],["BTCUSDT","turtle2"],["ETHUSDT","turtle2"]];
function getJson(u){return new Promise((res,rej)=>{https.get(u,{headers:{accept:"application/json"}},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{res(JSON.parse(d));}catch(e){rej(e);}});}).on("error",rej).setTimeout(8000,function(){this.destroy(new Error("timeout"));});});}
const kl=(sym,interval,limit)=>getJson(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`).then(d=>d.map(k=>({o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]})));
const sma=(a,n)=>a.length<n?null:a.slice(-n).reduce((x,y)=>x+y,0)/n;
const ema=(a,n)=>{if(a.length<n)return null;let k=2/(n+1),e=a[0];for(const v of a)e=v*k+e*(1-k);return e;};
function rsi(c){if(c.length<15)return null;let g=0,l=0;for(let i=c.length-15;i<c.length-1;i++){const d=c[i+1]-c[i];d>0?g+=d:l-=d;}return l===0?100:100-100/(1+g/l);}
function atr(cs,n){if(cs.length<n+1)return null;let s=0;for(let i=cs.length-n;i<cs.length;i++){s+=Math.max(cs[i].h-cs[i].l,Math.abs(cs[i].h-cs[i-1].c),Math.abs(cs[i].l-cs[i-1].c));}return s/n;}
function adx(cs,n){if(cs.length<n+1)return null;let trS=0,pS=0,mS=0;for(let i=cs.length-n;i<cs.length;i++){const up=cs[i].h-cs[i-1].h,dn=cs[i-1].l-cs[i].l,pdm=(up>dn&&up>0)?up:0,mdm=(dn>up&&dn>0)?dn:0,tr=Math.max(cs[i].h-cs[i].l,Math.abs(cs[i].h-cs[i-1].c),Math.abs(cs[i].l-cs[i-1].c));trS+=tr;pS+=pdm;mS+=mdm;}if(!trS)return null;const pdi=100*pS/trS,mdi=100*mS/trS;return pdi+mdi===0?0:100*Math.abs(pdi-mdi)/(pdi+mdi);}
function bbWidth(cs,n){if(cs.length<n)return null;const m=sma(cs,n),sd=Math.sqrt(cs.slice(-n).reduce((a,v)=>a+(v-m)**2,0)/n);return m?(4*sd)/m:null;}
(async()=>{
 let txt;try{txt=fs.readFileSync(LEDGER,"utf8");}catch(e){console.log("no ledger");return;}
 const lines=txt.split("\n"),today=new Date().toISOString().slice(0,10),now=new Date();
 // playbook#1 circuit breaker: >=3 closed losses today -> full stop till tomorrow
 const tLoss=lines.filter(l=>l.includes("verdict=LOSS")&&l.slice(0,40).includes(today)).length;
 if(tLoss>=3){fs.appendFileSync(LEDGER,`| PAPER | ${now.toISOString()} | ENGINE circuit-breaker: ${tLoss} losses today -> no new trades till tomorrow | verdict=CLOSED-CIRCUIT-BREAKER | SIM | planned |\n`);console.log("CB active");return;}
 let streak=0;for(let i=lines.length-1;i>=0;i--){const l=lines[i];if(l.includes("verdict=WIN"))break;if(l.includes("verdict=LOSS"))streak++;}
 const wknd=[0,6].includes(now.getUTCDay());
 const size=(streak>=2||wknd)?"HALF":"NORM"; // playbook#1 halve after streak; #2 weekend reduce
 const out=[];
 for(const [sym,kind] of BASKET){
  try{
   if(DEAD_KINDS.includes(kind))continue;
   if(lines.some(r=>r.includes(`| ${sym} ${kind}:`)&&r.includes("verdict=PENDING")))continue;
   const h1=await kl(sym,"1h",100),closes=h1.map(x=>x.c),px=closes[closes.length-1];
   const A=atr(h1,14)||px*0.01,AX=adx(h1,14)||0;
   const fund=await getJson(`https://api.binance.com/api/v3/premiumIndex?symbol=${sym}`).then(j=>parseFloat(j.lastFundingRate||"0")).catch(()=>0);
   const fr=fund>0.0005?"funding-hot":null; // playbook#2: >0.05%/8h -> contrarian caution
   const jr=r=>`journal={sys:${r.sys} ctx:adx${AX.toFixed(0)} atr:${A.toFixed(2)} fr:${fund.toFixed(4)}${wknd?"/wknd":""}${size==="HALF"?"/sz-half":""} plan:pending}`;
   let sig=null;
   if(fr&&AX<25){sig={flat:1,why:`${fr} contrarian gate (playbook#2)`};}
   else if(kind==="turtle2"){ // Turtle S2: daily 55d-high break, stop 2N, target 4N
    const d1=await kl(sym,"1d",70);if(d1.length<56){sig={flat:1,why:"insufficient dailies for S2",sys:"turtle2"};}
    else{const hi55=Math.max(...d1.slice(-56,-1).map(x=>x.h));const N=atr(d1,14);
     if(N&&d1[d1.length-1].c>hi55){sig={side:"LONG",entry:+px.toFixed(2),stop:+(px-2*N).toFixed(2),target:+(px+4*N).toFixed(2),ind:`hi55=${hi55.toFixed(2)} N=${N.toFixed(2)}`,why:`TURTLE-S2 55d-high break, stop 2N target 4N`,sys:"turtle2"};}
     else sig={flat:1,why:`no 55d-high break`,sys:"turtle2"};}}
   else if(kind==="turtle"){ // Turtle S1: daily 20d-high break, stop 2N, target 4N (R/R=2)
    const d1=await kl(sym,"1d",30);const hi20=Math.max(...d1.slice(-21,-1).map(x=>x.h));const N=atr(d1,14);
    if(N&&d1[d1.length-1].c>hi20){sig={side:"LONG",entry:+px.toFixed(2),stop:+(px-2*N).toFixed(2),target:+(px+4*N).toFixed(2),ind:`hi20=${hi20.toFixed(2)} N=${N.toFixed(2)} adx=${AX.toFixed(0)}`,why:`TURTLE-S1 20d-high break, stop 2N target 4N`,sys:"turtle"};}
    else sig={flat:1,why:`no 20d-high break (hi20=${hi20?hi20.toFixed(2):"-"})`,sys:"turtle"};}
   else if(AX>=25){const f=sma(closes.slice(0,-1),12),s48=sma(closes.slice(0,-1),48),R=rsi(closes);
    const h4=await kl(sym,"4h",60);const e21=ema(h4.map(x=>x.c),21);const conf=e21!=null&&px>e21;
    if(f&&s48&&f>s48&&R!=null&&R<70&&conf){sig={side:"LONG",entry:+px.toFixed(2),stop:+(px-1.5*A).toFixed(2),target:+(px+3*A).toFixed(2),ind:`sma12=${f.toFixed(2)} sma48=${s48.toFixed(2)} rsi=${R.toFixed(1)} adx=${AX.toFixed(0)}`,why:`TREND ADX${AX.toFixed(0)}>25 SMA12>SMA48 4h-EMA21-confluence R/R=2@1.5ATR`,sys:"trend"};}
    else sig={flat:1,why:`ADX-trend but filters fail (conf4h=${conf})`,sys:"trend"};}
   else{ // range/mixed: BREAKOUT-on-compression or PULLBACK
    const w=[];for(let k=5;k>=0;k--)w.push(bbWidth(closes.slice(0,closes.length-k),20));
    const squeeze=w.every(x=>x!=null)&&w[5]<w[0]&&(w[5]-w[4])<=0;
    const vAvg=sma(h1.map(x=>x.v),20),lastV=h1[h1.length-1].v;
    const hi20=Math.max(...closes.slice(-21,-1)),lo20=Math.min(...closes.slice(-21,-1));
    if(squeeze&&px>hi20&&lastV>vAvg){const st=Math.max(lo20,px-1.5*A);sig={side:"LONG",entry:+px.toFixed(2),stop:+st.toFixed(2),target:+(px+2*(px-st)).toFixed(2),ind:`squeeze w=${w[5].toFixed(3)}<-${w[0].toFixed(3)} volx=${(lastV/vAvg).toFixed(1)} adx=${AX.toFixed(0)}`,why:`BREAKOUT compression+volume>avg20, stop beyond range`,sys:"breakout"};}
    else if(AX<=20){const s48=sma(closes,48),h4=await kl(sym,"4h",60),e21=ema(h4.map(x=>x.c),21);
     const inZone=s48&&px<=s48*1.005&&px>=s48*0.985,trendUp=e21!=null&&px>e21;
     if(inZone&&trendUp){const risk=Math.min(px-Math.min(...h1.slice(-10).map(x=>x.l)),1.5*A);
      const tgt=hi20;(tgt-px)>=2*risk&&risk>0?sig={side:"LONG",entry:+px.toFixed(2),stop:+(px-risk).toFixed(2),target:+tgt.toFixed(2),ind:`pullback@sma48=${s48.toFixed(2)} adx=${AX.toFixed(0)} risk=${risk.toFixed(2)}`,why:`PULLBACK 4h-up retrace into SMA48-zone, R/R>=2 gate pass`,sys:"pullback"}:sig={flat:1,why:`pullback zone but R/R<2 to range-high -> skip`,sys:"pullback"};}
     else sig={flat:1,why:`range regime, no pullback zone/inZone=${!!inZone}/up=${!!trendUp}`,sys:"pullback"};}
    else sig={flat:1,why:`mixed regime AX=${AX.toFixed(0)} squeeze=${squeeze} -> flat is a position`,sys:"wait"};}
   if(sig&&!sig.flat){
    fs.appendFileSync(LEDGER,`| PAPER | ${now.toISOString()} | ${sym} ${kind}: ${sig.side} entry=${sig.entry} stop=${sig.stop} target=${sig.target} | ind={${sig.ind}} why="${sig.why} [${size}]" | verdict=PENDING | SIM | planned size=${size} ${jr(sig)} |\n`);
    out.push(`${sym}/${sig.sys}:LONG(${size})`);
   }else{
    fs.appendFileSync(LEDGER,`| PAPER | ${now.toISOString()} | ${sym} ${kind}: FLAT - | ind={adx=${AX.toFixed(0)}} why="${sig?sig.why:"no-entry"}" | verdict=CLOSED-NO-TRADE | SIM | planned |\n`);
    out.push(`${sym}:${kind}-flat`);
   }
  }catch(e){}
 }
 console.log("gen-signals v3:",out.join(", "));
})();
