// exits.js [v1] - Curriculum semaine 2 paire 1 (backtesting.py)
// Concept 1: SL/TP resolves INTRABAR - si une barre touche les deux, pire cas dabord (stop).
// Concept 2: gap au-dela du stop = remplissage a lOPEN reel, pas au prix theorique.
function simulateExit(bars,i0,en,o){o=o||{};const sl=o.sl,tp=o.tp,maxBars=o.maxBars||bars.length;
const lim=Math.min(bars.length,i0+maxBars);
for(let i=i0;i<lim;i++){const b=bars[i];
if(i>i0){
if(sl!==undefined&&b.o<=sl)return{exit:b.o,idx:i,reason:"SL-gap",pnlPct:+((b.o/en-1)*100).toFixed(2)};
if(tp!==undefined&&b.o>=tp)return{exit:b.o,idx:i,reason:"TP-gap",pnlPct:+((b.o/en-1)*100).toFixed(2)};
const hs=sl!==undefined&&b.l<=sl,ht=tp!==undefined&&b.h>=tp;
if(hs&&ht)return{exit:sl,idx:i,reason:"SL-worstcase",pnlPct:+((sl/en-1)*100).toFixed(2)};
if(hs)return{exit:sl,idx:i,reason:"SL",pnlPct:+((sl/en-1)*100).toFixed(2)};
if(ht)return{exit:tp,idx:i,reason:"TP",pnlPct:+((tp/en-1)*100).toFixed(2)};
}}
const last=bars[lim-1];return{exit:last.c,idx:lim-1,reason:"EOD",pnlPct:+((last.c/en-1)*100).toFixed(2)};}
module.exports={simulateExit};
if(require.main===module){
const bars=[{o:100,h:101,l:99,c:100},{o:101,h:104,l:100.5,c:103},{o:103,h:105,l:96,c:97},{o:97,h:102,l:96.5,c:101}];
console.log(JSON.stringify(simulateExit(bars,1,101,{sl:98,tp:104})));
console.log(JSON.stringify(simulateExit([{o:100,h:101,l:99,c:100},{o:95,h:96,l:94,c:95}],0,100,{sl:98})));
console.log(JSON.stringify(simulateExit([{o:100,h:101,l:99,c:100},{o:101,h:106,l:100,c:105}],0,100,{tp:104})));
}
