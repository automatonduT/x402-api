// micro-tools journal backend: execution quality per system (playbook#1 section6)
'use strict';const fs=require('fs'),path=require('path');const cache={t:0,d:null};
function get(cb){
 if(cache.d&&Date.now()-cache.t<60000)return cb(null,cache.d);
 let txt;try{txt=fs.readFileSync(path.join(__dirname,'..','experiments.md'),'utf8');}catch(e){return cb(new Error('no ledger'));}
 const agg={};
 txt.split('\n').forEach(l=>{
  if(!l.includes('| PAPER |')||!l.includes('mfe='))return;
  const sym=(l.match(/\| (\w+) (\w+):/)||[])[1],kind=(l.match(/\| (\w+) (\w+):/)||[])[2];
  const v=l.match(/verdict=(WIN|LOSS)/);if(!v)return;
  const mfe=parseFloat((l.match(/mfe=(-?[\d.]+)%/)||[])[1]),mae=parseFloat((l.match(/mae=(-?[\d.]+)%/)||[])[1]);
  const sys=(l.match(/sys:(\w+)/)||[])[1]||'legacy';
  const ctx=((l.match(/ctx:([^\s}]+)/)||[])[1]||'-');
  const k=sys+'/'+kind;if(!agg[k])agg[k]={system:sys,strategy:kind,n:0,wins:0,mfeSum:0,maeSum:0,contexts:{}};
  const a=agg[k];a.n++;if(v[1]==='WIN')a.wins++;a.mfeSum+=isFinite(mfe)?mfe:0;a.maeSum+=isFinite(mae)?mae:0;
  const reg=ctx.split('/adx')[0];a.contexts[reg]=(a.contexts[reg]||0)+1;});
 const systems=Object.values(agg).map(a=>({system:a.system,strategy:a.strategy,closed:a.n,winRate:+(a.wins/a.n*100).toFixed(1),
  avgMfePct:+(a.mfeSum/a.n).toFixed(3),avgMaePct:+(a.maeSum/a.n).toFixed(3),
  captureRatio:a.maeSum!==0?+(Math.abs(a.mfeSum)/Math.abs(a.maeSum)).toFixed(2):null,
  note:'capture>1: winners ran farther than losers hurt (perfect-trade hindsight, playbook#1 s6)',
  contextsByRegime:a.contexts}));
 cb(null,{generated:new Date().toISOString(),disclaimer:'SIM - paper trades - not financial advice',systems,
  total:systems.reduce((s,x)=>s+x.closed,0)});
}
module.exports={get};
