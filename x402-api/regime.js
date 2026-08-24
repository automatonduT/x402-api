// micro-tools regime backend: playbook#2 decision matrix, computed live
'use strict';const https=require('https');const cache={t:0,d:null};
function gj(u){return new Promise((res,rej)=>{https.get(u,{headers:{accept:'application/json'}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{try{res(JSON.parse(b));}catch(e){rej(e);}});}).on('error',rej).setTimeout(8000,function(){this.destroy(new Error('timeout'));});});}
const sma=(a,n)=>a.length<n?null:a.slice(-n).reduce((x,y)=>x+y,0)/n;
function atr(cs,n){if(cs.length<n+1)return null;let s=0;for(let i=cs.length-n;i<cs.length;i++){s+=Math.max(cs[i].h-cs[i].l,Math.abs(cs[i].h-cs[i-1].c),Math.abs(cs[i].l-cs[i-1].c));}return s/n;}
function adx(cs,n){if(cs.length<n+1)return null;let trS=0,pS=0,mS=0;for(let i=cs.length-n;i<cs.length;i++){const up=cs[i].h-cs[i-1].h,dn=cs[i-1].l-cs[i].l,tr=Math.max(cs[i].h-cs[i].l,Math.abs(cs[i].h-cs[i-1].c),Math.abs(cs[i].l-cs[i-1].c));trS+=tr;if(up>dn&&up>0)pS+=up;if(dn>up&&dn>0)mS+=dn;}if(!trS)return 0;const p=100*pS/trS,m=100*mS/trS;return p+m===0?0:100*Math.abs(p-m)/(p+m);}
function bbw(cs,n){if(cs.length<n)return null;const m=sma(cs,n),sd=Math.sqrt(cs.slice(-n).reduce((a,v)=>a+(v-m)**2,0)/n);return m?(4*sd)/m:null;}
async function one(sym){
 const k=await gj(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=100`).then(d=>d.map(x=>({h:+x[2],l:+x[3],c:+x[4],v:+x[5]})));
 const closes=k.map(x=>x.c),px=closes[closes.length-1];
 const AX=adx(k,14),w=[];for(let i=6;i>=0;i--)w.push(bbw(closes.slice(0,closes.length-i),20));
 const squeeze=w.every(x=>x!=null)&&w[6]<w[0];
 const f=sma(closes.slice(0,-1),12),s48=sma(closes.slice(0,-1),48);
 const fund=await gj(`https://api.binance.com/api/v3/premiumIndex?symbol=${sym}`).then(j=>parseFloat(j.lastFundingRate||'0')).catch(()=>0);
 const regime=AX>=25?'trend':(AX<=20?'range':'mixed');
 const systemsOn=[];
 if(regime==='trend')systemsOn.push('momentum');
 if(squeeze)systemsOn.push('breakout-armed');
 if(regime==='range')systemsOn.push('pullback-watch');
 if(AX<=20)systemsOn.push('meanrev-ALLOWED(range-only)');
 const h4=await gj(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=4h&limit=60`).then(d=>d.map(x=>+x[4])).catch(()=>[]);
 const h4up=h4.length>21?px>h4[h4.length-21]:null;
 return {symbol:sym,price:px,adx14h:+AX.toFixed(1),regime,squeeze,funding8h:fund,fundingHot:fund>0.0005,
  sma12:f?+f.toFixed(2):null,sma48:s48?+s48.toFixed(2):null,trendUp4h:h4up,systemsOn,
  matrix:`${regime}->${systemsOn.join(',')||'FLAT (flat is a position)'}`};
}
function get(symbols,cb){
 if(cache.d&&Date.now()-cache.t<60000)return cb(null,cache.d);
 Promise.all(symbols.map(s=>one(s).catch(()=>({symbol:s,error:'fetch-failed'})))).then(d=>{cache.t=Date.now();cache.d={generated:new Date().toISOString(),disclaimer:'SIM - public Binance data - not financial advice',pairs:d};cb(null,cache.d);}).catch(e=>cb(e));
}
module.exports={get};
