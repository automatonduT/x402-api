// warmup-plan.js [v1] - Curriculum paire 4 (warmbly, delivrabilite email)
// Concept 1: envois croissants - rampe progressive, jamais de volume brutal sur boite neuve.
// Concept 2: engagement gate - si reponses insuffisantes, on tient le palier au lieu de monter.
function rampSchedule(opts){opts=opts||{};const start=opts.startPerDay||3,cap=opts.capPerDay||15,growth=opts.growth||0.4,weeks=opts.weeks||4,out=[];
for(let w=0;w<weeks;w++){let n=Math.round(start*Math.pow(1+growth,w));if(n>cap)n=cap;out.push({week:w+1,perDay:n});}return out;}
function engagementGate(s){s=s||{};const sent=s.sent||0,replies=s.replies||0,bounces=s.bounces||0;
const rr=sent?replies/sent:0,br=sent?bounces/sent:1;const ok=rr>=0.05&&br<=0.03;
return{ok,ratio:+rr.toFixed(3),bounce:+br.toFixed(3),action:ok?"ramp-up":(br>0.03?"pause-cleanup":"hold-tier")};}
module.exports={rampSchedule,engagementGate};
if(require.main===module){console.log(JSON.stringify(rampSchedule({})));console.log(JSON.stringify(engagementGate({sent:9,replies:1,bounces:0})));console.log(JSON.stringify(engagementGate({sent:20,replies:0,bounces:2})));}
