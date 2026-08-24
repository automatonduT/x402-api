#!/usr/bin/env node
// backtest-turtle.js [v1] - Turtle S1/S2 + momentum sur CSV daily, eval IS 70% / OOS 30%
// Params CANONIQUES fixes a priori (pas de fitting) => eval OOS legitime.
const fs=require("fs"),path=require("path");
const X=require("./indicators.js");
function loadCsv(f){const L=fs.readFileSync(f,"utf8").trim().split("\n").slice(1);
  return L.map(l=>{const p=l.split(",");return{date:p[0],o:+p[1],h:+p[2],l:+p[3],c:+p[4]}})}
function donchian(rows,i,n,mode){ // plus haut/bas des n bougies PRECEDENTES (exclut i)
  let e=mode==="high"?-Infinity:Infinity;
  for(let j=i-n;j<i;j++){if(j<0)return null;e=mode==="high"?Math.max(e,rows[j].h):Math.min(e,rows[j].l)}
  return e}
function stratPositions(rows,strat){
  // pos cible en fraction d'equity (cap 1, sans levier), decide sur donnees <= i
  const pos=new Array(rows.length).fill(0);let cur=0;
  const C=rows.map(r=>r.c),H=rows.map(r=>r.h),L=rows.map(r=>r.l);
  for(let i=1;i<rows.length;i++){
    if(strat.type==="turtle"){
      const ent=strat.entry==="S1"?20:55, exi=strat.entry==="S1"?10:20;
      const dh=donchian(rows,i,ent,"high"), dl=donchian(rows,i,exi,"low");
      const a=X.atr(H.slice(0,i+1),L.slice(0,i+1),C.slice(0,i+1),14);
      if(dh!=null&&dl!=null&&a){
        if(cur<=0&&C[i]>dh)cur=Math.min(1,0.01/(a/C[i]));   // entree breakout, taille risque 1%/ATR
        else if(cur>0&&C[i]<dl)cur=0;                        // sortie canal opposé
      }
    }else{ // momentum: trend filter 90j
      if(i>=90)cur=C[i]>C[i-90]?Math.min(1,1):0;
    }
    pos[i]=cur}
  return pos}
function metrics(rows,pos,a,b){ // fenetre [a,b)
  const rets=[];let eq=1;const curve=[1];
  for(let i=a+1;i<b;i++){const r=pos[i]*(rows[i].c/rows[i-1].c-1);rets.push(r);eq*=1+r;curve.push(eq)}
  const days=b-a-1;if(days<5)return{ann:null};
  const ann=Math.pow(eq,365/days)-1;
  return{ann:+(ann*100).toFixed(1),maxDD:+(X.maxDrawdown(curve)*100).toFixed(1),
    sharpe:+X.sharpe(rets).toFixed(2),days}}
function run(file){
  const rows=loadCsv(file);const name=path.basename(file).replace("-daily.csv","");
  const out={symbol:name,n:rows.length};
  for(const st of [{type:"turtle",entry:"S1"},{type:"turtle",entry:"S2"},{type:"mom"}]){
    const pos=stratPositions(rows,st);
    const cut=Math.floor(rows.length*0.7);
    out[st.entry||st.type]={IS:metrics(rows,pos,0,cut),OOS:metrics(rows,pos,cut,rows.length)}}
  return out}
const dir=process.argv[2]||"../data";
const res=fs.readdirSync(dir).filter(f=>f.endsWith("-daily.csv")).map(f=>run(path.join(dir,f)));
console.log(JSON.stringify(res,null,1));
fs.writeFileSync(path.join(dir,"backtest-results.json"),JSON.stringify(res,null,1));
