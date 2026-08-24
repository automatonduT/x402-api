#!/usr/bin/env node
// backtest-v3.js - Turtle S1/S2 + momentum + breakout, OOS 70/30 (creator mission)
const fs=require('fs'),path=require('path');
const ind=require(path.join(process.env.HOME,'automaton-work/tools/indicators.js'));
function parseCSV(f){const L=fs.readFileSync(f,'utf8').trim().split('\n');const R=[];let s=0;
if(isNaN(Number(L[0].split(',')[1])))s=1;
for(let i=s;i<L.length;i++){const c=L[i].split(',');if(c.length<6)continue;R.push({t:+c[0],o:+c[1],h:+c[2],l:+c[3],c:+c[4],v:+c[5]});}return R;}
const hi=(C,i,n)=>Math.max(...C.slice(i-n,i).map(x=>x.h));
const lo=(C,i,n)=>Math.min(...C.slice(i-n,i).map(x=>x.l));
function strat(kind,C,ATR){let eq=1,pos=0,en=0,stp=0,h=0,tr=[];const eqs=[1];const w=kind==='momentum'?91:56;
for(let i=w;i<C.length;i++){const px=C[i].c;
 if(pos){let x=false;
  if(kind==='turtleS1')x=px<lo(C,i,10)||px<stp;
  else if(kind==='turtleS2')x=px<lo(C,i,20)||px<stp;
  else if(kind==='momentum')x=px<C[i-90].c;
  else x=++h>=10;
  if(x){eq*=px/en;tr.push(px/en-1);pos=0;}
 }else{
  const sig=(kind==='turtleS1'&&px>hi(C,i,20))||(kind==='turtleS2'&&px>hi(C,i,55))||(kind==='momentum'&&px>C[i-90].c)||(kind==='breakout'&&px>hi(C,i,20));
  if(sig){pos=1;en=px;h=0;stp=px-2*((ATR&&ATR[i])||px*0.05);}
 }
 eqs.push(eq*(pos?px/en:1));}
return{eqs,tr};}
function st(r){const{eqs,tr}=r;const ret=eqs[eqs.length-1]-1;
 let mdd='n/a';try{const m=ind.maxDrawdown?ind.maxDrawdown(eqs):null;mdd=m==null?'n/a':(typeof m==='number'?(m*100).toFixed(1)+'%':JSON.stringify(m));}catch(e){}
 let sh='n/a';try{const s=ind.sharpe?ind.sharpe(eqs,365):null;sh=s==null?'n/a':(typeof s==='number'?s.toFixed(2):JSON.stringify(s));}catch(e){}
 const wins=tr.filter(t=>t>0).length;
 return{ret:(ret*100).toFixed(1)+'%',mdd,sh,tr:tr.length,win:tr.length?Math.round(100*wins/tr.length)+'%':'-'};}
const f=process.argv[2],sym=process.argv[3]||path.basename(f,'.csv').toUpperCase();
const all=parseCSV(f);const cut=Math.floor(all.length*0.7);
const ATRall=(ind.atr?ind.atr(all):null)||all.map(()=>0);
console.log(`\n== ${sym} (${all.length} candles | IS ${cut} / OOS ${all.length-cut+55}) ==`);
console.log('strategy   | IS ret  | OOS ret | OOS mdd | OOS sharpe | tr(IS/OOS) | win(IS/OOS)');
for(const k of['turtleS1','turtleS2','momentum','breakout']){
 const a=st(strat(k,all.slice(0,cut),ATRall.slice(0,cut)));
 const b=st(strat(k,all.slice(Math.max(0,cut-55)),ATRall.slice(Math.max(0,cut-55))));
 console.log(`${k.padEnd(10)} | ${a.ret.padStart(7)} | ${b.ret.padStart(7)} | ${b.mdd.padStart(7)} | ${b.sh.padStart(10)} | ${(a.tr+'/'+b.tr).padStart(10)} | ${a.win}/${b.win}`);}
