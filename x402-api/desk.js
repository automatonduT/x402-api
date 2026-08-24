// micro-tools desk backend: one-call machine snapshot of the whole desk
'use strict';const fs=require('fs'),path=require('path');
const regime=require('./regime.js'),journal=require('./journal.js');
const SYMS=['BTCUSDT','ETHUSDT','SOLUSDT'];
function book(){
 let txt='';try{txt=fs.readFileSync(path.join(__dirname,'..','experiments.md'),'utf8');}catch(e){return{open:0,closed:0,wins:0};}
 let open=0,closed=0,wins=0;
 txt.split('\n').forEach(l=>{if(!l.includes('| PAPER |'))return;
  if(l.includes('verdict=PENDING'))open++;
  else{const v=l.match(/verdict=(WIN|LOSS)/);if(v){closed++;if(v[1]==='WIN')wins++;}}});
 return{open,closed,wins};}
function get(cb){
 const b=book();
 journal.get(je=>journal.get(()=>{})); // noop guard
 journal.get(jErr=>{
  const jr=jErr?{error:String(jErr.message||jErr)}:null;
  // re-fetch clean result (journal caches internally)
  journal.get(jErr2=>{
   regime.get(SYMS,rErr2=>{
    cb(null,{generated:new Date().toISOString(),
     disclaimer:'SIM - public Binance data - paper trading - not financial advice',
     book:b,
     journal:jErr2?{error:String(jErr2.message||jErr2)}:jrClean(jErr2),
     regime:rErr2?{error:String(rErr2.message||rErr2)}:lastRegime});
   });});
 });
}
let lastRegime=null,lastJournal=null;
function jrClean(e){return e?lastJournal:lastJournal;}
// simpler wrapper preserving originals:
function get2(cb){
 const b=book();
 journal.get((je,jd)=>{lastJournal=jd||null;
  regime.get(SYMS,(re,rd)=>{lastRegime=rd||null;
   cb(null,{generated:new Date().toISOString(),
    disclaimer:'SIM - public Binance data - paper trading - not financial advice',
    book:b,
    journal:jd?jd:{error:String(je.message||je)},
    regime:rd?rd:{error:String(re.message||re)}});});});
}
module.exports={get:get2};
