#!/usr/bin/env node
// indicators.js - sma ema rsi14 atr14 adx14(Wilder) bollinger macd zscore maxDrawdown sharpe
const last=a=>a[a.length-1];
const sma=(a,n)=>{let s=0,out=[];for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];if(i>=n-1)out.push(s/n)}return out};
const ema=(a,n)=>{const k=2/(n+1);let e=[a[0]];for(let i=1;i<a.length;i++)e.push(a[i]*k+e[i-1]*(1-k));return e};
function rsi(c,n=14){let g=0,l=0;for(let i=1;i<=n;i++){const d=c[i]-c[i-1];d>0?g+=d:l-=d}
  let ag=g/n,al=l/n;for(let i=n+1;i<c.length;i++){const d=c[i]-c[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n}
  return al===0?100:100-100/(1+ag/al)}
function trueRanges(h,l,c){return h.map((_,i)=>i===0?h[0]-l[0]:Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])))}
function wilder(a,n){let s=0;for(let i=0;i<n;i++)s+=a[i];let v=s/n,out=[v];for(let i=n;i<a.length;i++){v=(v*(n-1)+a[i])/n;out.push(v)}return out}
function atr(h,l,c,n=14){return last(wilder(trueRanges(h,l,c),n))}
function adx(h,l,c,n=14){const p=[];m=[];
  for(let i=1;i<h.length;i++){const up=h[i]-h[i-1],dn=l[i-1]-l[i];
    p.push(up>dn&&up>0?up:0); m.push(dn>up&&dn>0?dn:0)}
  const tr=wilder(trueRanges(h,l,c),n),pdi=wilder(p,n),mdi=wilder(m,n);
  const dx=[];const L=Math.min(tr.length,pdi.length,mdi.length);for(let i=0;i<L;i++){const pd=100*pdi[i]/tr[i],md=100*mdi[i]/tr[i];dx.push(pd+md===0?0:100*Math.abs(pd-md)/(pd+md))}
  return last(wilder(dx.slice(n),n))||last(wilder(dx,n))}
function bollinger(c,n=20,k=2){const w=c.slice(-n),mid=w.reduce((x,y)=>x+y)/n;
  const sd=Math.sqrt(w.reduce((s,x)=>s+(x-mid)**2,0)/n);
  return{mid,sd,upper:mid+k*sd,lower:mid-k*sd,width:k*2*sd/mid}}
function macd(c,f=12,s=26,g=9){const ef=ema(c,f),es=ema(c,s);
  const line=c.map((_,i)=>ef[i]-es[i]);const sig=ema(line.slice(s-1),g);
  return{line:last(line),signal:last(sig),hist:last(line)-last(sig)}}
function zscore(c,n=20){const w=c.slice(-n),mu=w.reduce((a,b)=>a+b)/n;
  const sd=Math.sqrt(w.reduce((s,x)=>s+(x-mu)**2,0)/n);return sd?(last(c)-mu)/sd:0}
function maxDrawdown(c){let peak=c[0],mdd=0;for(const v of c){peak=Math.max(peak,v);mdd=Math.min(mdd,(v-peak)/peak)}return mdd*100}
function sharpe(c){const r=[];for(let i=1;i<c.length;i++)r.push((c[i]-c[i-1])/c[i-1]);
  const mu=r.reduce((a,b)=>a+b)/r.length,sd=Math.sqrt(r.reduce((s,x)=>s+(x-mu)**2,0)/r.length);
  return sd?mu/sd*Math.sqrt(365):0}
const fs=require('fs');
if(require.main===module&&process.argv[2]){
  const L=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').slice(1);
  const o=L.map(x=>+x.split(',')[1]),h=L.map(x=>+x.split(',')[2]),lo=L.map(x=>+x.split(',')[3]),c=L.map(x=>+x.split(',')[4]);
  const bb=bollinger(c),md=macd(c);
  console.log(JSON.stringify({close:last(c),rsi14:+rsi(c).toFixed(1),atrPct:+(atr(h,lo,c)/last(c)*100).toFixed(2),adx14:+adx(h,lo,c).toFixed(1),bbWidth:+(bb.width*100).toFixed(2),zscore:+zscore(c).toFixed(2),macdHist:+md.hist.toFixed(2),maxDDpct:+maxDrawdown(c).toFixed(1),sharpeAnn:+sharpe(c).toFixed(2)}));
}
module.exports={smaSeries,rsiSeriesWilder,atrSeries,sma,ema,rsi,atr,adx,bollinger,macd,zscore,maxDrawdown,sharpe};

// --- series extensions (v2.81, pour delegation backtest) ---
function smaSeries(c,n){const out=Array(c.length).fill(null);let s=0;for(let i=0;i<c.length;i++){s+=c[i];if(i>=n)s-=c[i-n];if(i>=n-1)out[i]=s/n}return out}
function rsiSeriesWilder(c,n=14){const out=Array(c.length).fill(null);if(c.length<n+1)return out;let g=0,l=0;
for(let i=1;i<=n;i++){const d=c[i]-c[i-1];d>0?g+=d:l-=d}
let ag=g/n,al=l/n;out[n]=100-100/(1+(al===0?1e9:ag/al));
for(let i=n+1;i<c.length;i++){const d=c[i]-c[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n;out[i]=100-100/(1+(al===0?1e9:ag/al))}
return out}

function atrSeries(h,l,c,n=14){const out=Array(c.length).fill(null);if(c.length<n+1)return out;
const tr=h.map((v,i)=>i===0?v-l[0]:Math.max(v-l[i],Math.abs(v-c[i-1]),Math.abs(l[i]-c[i-1])));
let s=0;for(let i=0;i<n;i++)s+=tr[i];let a=s/n;out[n-1]=a;
for(let i=n;i<c.length;i++){a=(a*(n-1)+tr[i])/n;out[i]=a}return out}
