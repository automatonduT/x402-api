#!/bin/bash
# live-cycle.sh - FULL desk workflow LIVE (playbook #2 regime matrix)
# usage: ./live-cycle.sh [CAPITAL] [PAIRS...]   default: 3 BTCUSDT ETHUSDT SOLUSDT
T=$HOME/automaton-work/tools; X=$HOME/automaton-work/x402-api
CAP=${1:-3}; shift 2>/dev/null; PAIRS="$@"
[ -z "$PAIRS" ] && PAIRS="BTCUSDT ETHUSDT SOLUSDT"
echo "=== CYCLE LIVE $(date -u '+%FT%TZ') capital=\$$CAP risque=1% ==="
for P in $PAIRS; do
  L=$(echo "$P" | tr 'A-Z' 'a-z'); C="/tmp/desk/$P.csv"
  mkdir -p /tmp/desk
  [ -s "$C" ] || node "$T/fetch-history.js" "$P" 1d 1095 "$C" >/dev/null 2>&1
  node "$T/market-snapshot.js" "$P" > "/tmp/cyc-$P.txt" 2>&1
done
node - "$CAP" $PAIRS <<'JS'
const {execSync}=require('child_process'),fs=require('fs');
const T=process.env.HOME+'/automaton-work/tools',X=process.env.HOME+'/automaton-work/x402-api';
const ind=require(T+'/indicators.js');
const CAP=+process.argv[2];let pairs=process.argv.slice(3);if(!pairs.length)pairs=['BTCUSDT','ETHUSDT','SOLUSDT'];
const sh=c=>{try{return execSync(c,{encoding:'utf8'})}catch(e){return ''}};
let oos={};try{oos=JSON.parse(fs.readFileSync(X+'/data/oos-summary.json','utf8')).results||{}}catch(e){}
const lines=[];
for(const P of pairs){
 const s=fs.readFileSync('/tmp/cyc-'+P+'.txt','utf8');
 const num=r=>{const m=s.match(r);return m?+(m[1].replace(/[^\d.,]/g,'').replace(/\u202f|\s/g,'').replace(',','.')):null};
 const px=num(/Prix:\s*([\d\s.,]+)/),adx=num(/ADX[^:]*:\s*([\d.,]+)/),rsi=num(/RSI[^:]*:\s*([\d.,]+)/);
 const fund=num(/Funding[^:]*:\s*(-?[\d.,]+)%/),bb=num(/BB width:\s*([\d.,]+)/);
 const regime=/TREND/.test(s)?'TREND':(/RANGE/.test(s)?'RANGE':'?');
 const sess=(s.match(/Session:\s*([^\n(]+)/)||[])[1]||'?';
 // ATR14 dernier du CSV
 let atr=null;try{const rows=fs.readFileSync('/tmp/desk/'+P+'.csv','utf8').trim().split('\n').map(l=>l.split(',')).filter(c=>c.length>=5&&!isNaN(+c[4]));
  const cands=rows.map(c=>({h:+c[2],l:+c[3],c:+c[4]}));atr=ind.atr(cands);if(Array.isArray(atr))atr=atr[atr.length-1];}catch(e){}
 console.log(`\n-- ${P} prix=${px} ADX=${adx}(${regime}) RSI=${rsi} funding=${fund}% bbW=${bb} session=${sess.trim()} ATR14=${atr&&(+atr).toFixed(2)}`);
 const reasons=[];
 if(px==null||atr==null){reasons.push('donnees illisibles');}
 else{
  if(regime!=='TREND')reasons.push(`regime ${regime}: momentum NON autorise (matrice playbook#2)`);
  if(fund!=null&&Math.abs(fund)>0.05)reasons.push(`funding extreme ${fund}%: flux contrarien, pas de nouveau momentum-long`);
  if(rsi!=null&&rsi>75)reasons.push(`surachat extreme RSI ${rsi}: chasse interdite`);
  if(bb!=null&&bb<0.05)reasons.push(`squeeze actif (bbW ${bb}): breakout non resolu, attendre expansion`);
 }
 if(reasons.length===0){
  const e=px,st=e-2*atr,tg=e+2*(e-st)*1.01; // R/R 2.02 par construction ATR
  const g=sh(`node ${T}/position-size.js ${CAP} 1 ${e.toFixed(4)} ${st.toFixed(4)} ${tg.toFixed(4)}`);
  const pass=/PASS/.test(g),notional=(g.match(/notionnel ([\d.]+)/)||[])[1];
  const hist=oos[P],bestOOS=hist?Math.max(...Object.values(hist)):null;
  const oosNote=bestOOS==null?'pas de donnee OOS':(bestOOS>0?`meilleure strategie OOS +${bestOOS}%`:`AUCUNE strategie positive OOS (${bestOOS}%) -> conviction minimale`);
  console.log(`   CHECKLIST OK -> SIGNAL PAPER LONG: entree=${e.toFixed(2)} stop=${st.toFixed(2)} (-2ATR) target=${tg.toFixed(2)} (+4.04ATR) R/R=2.02`);
  console.log(`   SIZING cap=$${CAP} risk 1% ($${(CAP*0.01).toFixed(2)}) -> notionnel $${notional} | GATE ${pass?'PASS':'REFUSED'} | honnetete OOS: ${oosNote}`);
  fs.appendFileSync(X+'/data/desk-journal.jsonl',JSON.stringify({ts:new Date().toISOString(),pair:P,system:'breakout-momentum',regime,funding:fund,rsi,bw:bb,session:sess.trim(),entry:+e.toFixed(4),stop:+st.toFixed(4),target:+tg.toFixed(4),rr:2.02,capital:CAP,riskPct:1,gate:pass?'ACCEPTED':'REFUSED',notional:+notional,bestOOS,mode:'PAPER'})+'\n');
 }else{
  console.log('   FLAT (position valide): '+reasons.join(' | '));
 }
}
console.log('');
JS
echo "--- journal tail ---"; tail -3 "$X/data/desk-journal.jsonl" 2>/dev/null
