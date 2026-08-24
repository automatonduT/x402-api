#!/usr/bin/env node
// desk-pipeline.js - FULL quantitative desk chain (creator wave-2 workflow)
// fetch-history -> backtest-v3 (70/30) -> monte-carlo sizing -> snapshot -> position-size GATE -> journal
const {execSync}=require('child_process'),fs=require('fs'),path=require('path');
const T=p=>path.join(process.env.HOME,'automaton-work/tools',p);
const X=path.join(process.env.HOME,'automaton-work/x402-api');
const SYMS=(process.argv[2]||'BTCUSDT,SOLUSDT,XRPUSDT').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
const CAPITAL=+(process.argv[3]||1000);
const DATA='/tmp/desk';fs.mkdirSync(DATA,{recursive:true});
const JOURNAL=path.join(X,'data','desk-journal.jsonl');
const sh=c=>{try{return execSync(c,{encoding:'utf8'})}catch(e){return ''}};
const jlog=o=>{fs.appendFileSync(JOURNAL,JSON.stringify({ts:new Date().toISOString(),capital:CAPITAL,...o})+'\n')};

// 1) data + 2) backtest stats (OOS honest figures only)
function bt(sym){const f=`${DATA}/${sym}.csv`;
 if(!fs.existsSync(f))sh(`node ${T('fetch-history.js')} ${sym} 1d 1095 ${f}`);
 const out=sh(`node ${X}/backtest-v3.js ${f} ${sym}`);const r={};
 out.split('\n').forEach(l=>{const m=l.match(/^(turtleS1|turtleS2|momentum|breakout)\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%/);if(m)r[m[1]]=+m[3];});
 return r;}

// 3) risk sizing via monte-carlo: pick largest risk whose p90 drawdown <= 10% capital
function safeRisk(win,rr){
 for(const rk of [1,0.7,0.5,0.25]){
  const o=sh(`node ${T('monte-carlo.js')} ${win} ${rr} 60 800 ${rk}`);
  const m=o.match(/p90\):\s*([\d.]+)%/);
  if(!m||+m[1]<=10)return{risk:rk,p90:m?+m[1]:null};
 }return{risk:0.25,p90:null};}

// 4) snapshot (text FR) -> loose parse
function snap(sym){const o=sh(`node ${T('market-snapshot.js')} ${sym}`);
 const px=(o.match(/Prix:\s*([\d\s.,]+)/)||[])[1],adx=(o.match(/ADX[^:]*:\s*([\d.]+)/)||[])[1];
 return{price:px?+(px.replace(/[^\d.,]/g,'').replace(/\s/g,'').replace(',','.')).valueOf():null,
  regime:/TREND/.test(o)?'trend':(/RANGE/.test(o)?'range':'?'),raw:o};}

console.log(`=== DESK PIPELINE ${new Date().toISOString()} cap=$${CAPITAL} ===`);
for(const sym of SYMS){
 const stats=bt(sym);
 const viable=Object.entries(stats).filter(([k,v])=>v>0); // OOS-honest filter
 console.log(`\n-- ${sym}: OOS+ strategies: ${viable.map(([k,v])=>k+' '+v+'%').join(', ')||'NONE (skip)'}`);
 if(!viable.length)continue;
 const {risk,p90}=safeRisk(45,2);
 console.log(`   sizing: monte-carlo 45%/2R -> risk/trade ${risk}% (p90 DD ${p90}%)`);
 const s=snap(sym);
 if(!s.price){console.log('   snapshot: prix illisible, skip');continue;}
 const entry=s.price,stop=entry*0.97,target=entry*1.09;
 const g=sh(`node ${T('position-size.js')} ${CAPITAL} ${risk} ${entry.toFixed(2)} ${stop.toFixed(2)} ${target.toFixed(2)}`);
 const pass=/PASS/.test(g);
 const size=(g.match(/notionnel ([\d.]+)\$/)||[])[1]||'?';
 console.log(`   signal: ${s.regime} | entry ${entry.toFixed(2)} stop ${stop.toFixed(2)} target ${target.toFixed(2)} -> GATE ${pass?'PASS':'REFUSED'}`);
 jlog({sym,strategies:viable.map(v=>v[0]),riskPerTrade:risk,p90DD:p90,regime:s.regime,entry:+entry.toFixed(2),stop:+stop.toFixed(2),target:+target.toFixed(2),gate:pass?'ACCEPTED':'REFUSED',notional:size});
}
console.log(`\njournal: ${JOURNAL}`);
