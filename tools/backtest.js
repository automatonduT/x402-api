#!/usr/bin/env node
// backtest.js [v2] - Turtle S1/S2 + momentum, validation IS/OOS 70/30, next-open zero look-ahead
const fs=require('fs');
let IND={};try{IND=require('./indicators')}catch(e){}
const S_ATRSER=typeof IND.atrSeries==='function'?IND.atrSeries:null;
function atrSeriesLocal(h,l,c,n=14){const out=Array(c.length).fill(null);if(c.length<n+1)return out;
 const tr=h.map((v,i)=>i===0?v-l[0]:Math.max(v-l[i],Math.abs(v-c[i-1]),Math.abs(l[i]-c[i-1])));
 let s=0;for(let i=0;i<n;i++)s+=tr[i];let a=s/n;out[n-1]=a;
 for(let i=n;i<c.length;i++){a=(a*(n-1)+tr[i])/n;out[i]=a}return out}
function atrArr(h,l,c){if(S_ATRSER){try{const o=S_ATRSER(h,l,c,14);if(Array.isArray(o)&&o.length===c.length)return o}catch(e){}}return atrSeriesLocal(h,l,c)}
function load(f){return fs.readFileSync(f,'utf8').trim().split('\n').slice(1).map(x=>{const p=x.split(',');return{date:p[0],o:+p[1],h:+p[2],l:+p[3],c:+p[4]}})}
function dHi(r,i,n){let m=-Infinity;for(let k=Math.max(0,i-n);k<i;k++)m=Math.max(m,r[k].h);return m}
function dLo(r,i,n){let m=Infinity;for(let k=Math.max(0,i-n);k<i;k++)m=Math.min(m,r[k].l);return m}
function rsiSeries(c,n=14){let g=0,l=0;for(let i=1;i<=n;i++){const d=c[i]-c[i-1];d>0?g+=d:l-=d}
 let ag=g/n,al=l/n,out=c.map(()=>null);out[n]=al===0?100:100-100/(1+ag/al);
 for(let i=n+1;i<c.length;i++){const d=c[i]-c[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n;out[i]=al===0?100:100-100/(1+ag/al)}return out}
function smaArr(c,n){let s=0,out=c.map(()=>null);for(let i=0;i<c.length;i++){s+=c[i];if(i>=n)s-=c[i-n];if(i>=n-1)out[i]=s/n}return out}
function sim(r,enter,exitFn){
 let pos=null,trades=[];
 for(let i=1;i<r.length-1;i++){
  if(!pos){if(enter(r,i))pos={e:r[i+1].o}}
  else if(exitFn(r,i,pos)){trades.push((r[i+1].o-pos.e)/pos.e);pos=null}
 } if(pos)trades.push((r[r.length-1].c-pos.e)/pos.e);
 return trades}
const strat={
 turtle_s1:{enter:(r,i)=>r[i].c>dHi(r,i,20),exit:(r,i)=>r[i].l<dLo(r,i,10)},
 turtle_s2:{enter:(r,i)=>r[i].c>dHi(r,i,55),exit:(r,i)=>r[i].l<dLo(r,i,20)}};
strat.momentum={enter:(r,i)=>{if(i<55)return false;const s=smaArr(r.map(x=>x.c),50)[i],rs=rsiSeries(r.map(x=>x.c))[i];return !!(s&&rs!=null&&r[i].c>s&&rs>55)},
 exit:(r,i)=>{const s=smaArr(r.map(x=>x.c),50)[i],rs=rsiSeries(r.map(x=>x.c))[i];return(s&&r[i].c<s)||(rs!=null&&rs<45)}};
strat.turtle_s1_atr={enter:(r,i)=>r[i].c>dHi(r,i,20),
 exit:(r,i,p)=>{const a=atrArr(r.map(x=>x.h),r.map(x=>x.l),r.map(x=>x.c))[i];return a!=null&&r[i].l<p.e-2*a}};
function stats(t){if(!t.length)return{n:0,winRate:0,retPct:0,avg:0};
 const ret=t.reduce((a,b)=>a*(1+b),1)-1;
 return{n:t.length,winRate:+(t.filter(x=>x>0).length/t.length*100).toFixed(0),retPct:+(ret*100).toFixed(1),avg:+(t.reduce((a,b)=>a+b,0)/t.length*100).toFixed(2)}}
function runFile(f){
 const all=load(f),cut=Math.floor(all.length*0.7),IS=all.slice(0,cut),OOS=all.slice(Math.max(0,cut-60));
 const out={file:f.split('/').pop(),bars:{total:all.length,is:IS.length,oos:OOS.length},strategies:{}};
 for(const[name,s]of Object.entries(strat)){
  const tIS=sim(IS,s.enter,s.exit),tOOS=sim(OOS,s.enter,s.exit);
  out.strategies[name]={is:stats(tIS),oos:stats(tOOS),
   edge:(stats(tOOS).retPct>0&&stats(tOOS).winRate>=40)?'PASS':'FAIL'}}
 return out}
if(require.main===module){const f=process.argv[2];
 if(!f){console.error('usage: node backtest.js FILE.csv');process.exit(1)}
 console.log(JSON.stringify(runFile(f)))}
module.exports={runFile,load,sim,stats,strat};
