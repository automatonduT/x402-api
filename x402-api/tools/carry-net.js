// carry-net.js [v1] - Curriculum paire 2 (funding-rate-arbitrage x2)
// Concept 1: spread net APRES frais des deux jambes (4 remplissages taker).
// Concept 2: flip guard - ne jamais entrer en carry si le funding bascule negatif.
const TAKER_FEE=0.0004;
function roundTrips(notional,fees){return{feeCost:notional*(fees||TAKER_FEE)*4};}
function netSpreadAfterFees(o){o=o||{};const n=o.notional||10000,f=o.fundingRate8h!==undefined?o.fundingRate8h:0.0001,d=o.holdDays||30,fe=o.fees;
const rc=roundTrips(n,fe),grossDay=n*f*3,gross=grossDay*d,net=gross-rc.feeCost;
return{notional:n,fundingRate8h:f,holdDays:d,grossAPR:+(grossDay*365/n).toFixed(4),feeCost:+rc.feeCost.toFixed(2),netPnL:+net.toFixed(2),netAPR:+(net/d*365/n).toFixed(4),breakevenHoldDays:+(rc.feeCost/(grossDay||1e-9)).toFixed(2)};}
function flipGuard(rates,lookback,minAvg){lookback=lookback||7;minAvg=minAvg===undefined?0.00005:minAvg;
const w=(rates||[]).slice(-lookback);const avg=w.reduce((a,b)=>a+b,0)/(w.length||1);
const lastTwoNeg=w.length>=2&&w[w.length-1]<0&&w[w.length-2]<=0;
return{enter:avg>=minAvg&&!lastTwoNeg,avg8h:+avg.toFixed(6),reason:lastTwoNeg?"flip:negative":(avg<minAvg?"thin":"ok")};}
module.exports={netSpreadAfterFees,flipGuard};
if(require.main===module){console.log(JSON.stringify(netSpreadAfterFees({})));console.log(JSON.stringify(flipGuard([0.0001,0.0001,-0.0001,-0.0002])));}
