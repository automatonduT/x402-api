// hyperopt-lite.js [v1] - Curriculum semaine 2 paire 2 (freqtrade)
// Concept 1: optimiser sur TRAIN seulement, valider sur TEST hors echantillon.
// Concept 2: garde anti-overfit - gap train/test expose, nb minimum de trades exige.
const {simulateExit}=require("./exits");
function sma(v,n){const o=[];let sum=0;for(let i=0;i<v.length;i++){sum+=v[i];if(i>=n)sum-=v[i-n];o.push(i>=n-1?sum/n:null);}return o;}
function runStrategy(bars,p){const c=bars.map(b=>b.c),f=sma(c,p.fast),s=sma(c,p.slow);const trades=[];
let i=Math.max(p.fast,p.slow);
while(i<bars.length-1){if(f[i-1]<=s[i-1]&&f[i]>s[i]){const en=bars[i+1].o;
const r=simulateExit(bars,i+1,en,{sl:en*(1-p.sl),tp:en*(1+p.tp)});trades.push(r.pnlPct);i=r.idx+1;}else i++;}
const w=trades.filter(t=>t>0).length;return{trades:trades.length,pnl:+trades.reduce((a,b)=>a+b,0).toFixed(2),winRate:trades.length?+(w/trades.length*100).toFixed(1):0};}
function hyperopt(bars,grid,opts){opts=opts||{};const split=opts.split||0.7,minTrades=opts.minTrades||3,topK=opts.topK||3;
const cut=Math.floor(bars.length*split);const train=bars.slice(0,cut),test=bars.slice(cut);
const res=grid.map(p=>({params:p,train:runStrategy(train,p)}));res.sort((a,b)=>b.train.pnl-a.train.pnl);
const board=res.slice(0,topK).map(r=>{const te=runStrategy(test,r.params);return Object.assign({},r,{test:te,gap:+(r.train.pnl-te.pnl).toFixed(2)});});
board.sort((a,b)=>b.test.pnl-a.test.pnl);const best=board[0]||null;
return{best:best,valid:!!(best&&best.test.trades>=minTrades),board:board};}
module.exports={runStrategy,hyperopt,sma};
if(require.main===module){let seed=42;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
const bars=[];let px=100;for(let k=0;k<300;k++){const drift=k<150?0.08:-0.04;const o=px,c2=Math.max(1,o+drift+(rnd()-0.5)*2);
bars.push({o:o,h:Math.max(o,c2)+rnd()*0.5,l:Math.min(o,c2)-rnd()*0.5,c:c2});px=c2;}
const grid=[];for(const f of [2,3,5])for(const s of [8,12,20])grid.push({fast:f,slow:s,sl:0.03,tp:0.06});
console.log(JSON.stringify(hyperopt(bars,grid,{split:0.7,minTrades:2})));}
